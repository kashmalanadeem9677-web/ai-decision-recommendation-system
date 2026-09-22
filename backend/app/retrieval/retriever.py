import math

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import engine
from app.embeddings import create_embedding
from app.models.knowledge_models import KnowledgeChunk
from app.models.retrieval_models import RetrievalConfig


def cosine_similarity(
    vector_a: list[float],
    vector_b: list[float]
) -> float:
    dot_product = sum(
        a * b
        for a, b in zip(vector_a, vector_b)
    )

    magnitude_a = math.sqrt(
        sum(a * a for a in vector_a)
    )

    magnitude_b = math.sqrt(
        sum(b * b for b in vector_b)
    )

    if magnitude_a == 0 or magnitude_b == 0:
        return 0.0

    return dot_product / (
        magnitude_a * magnitude_b
    )


def retrieve(
    query: str,
    config: RetrievalConfig,
    domain: str | None = None,
    category: str | None = None,
    flag: str | None = None
) -> list[dict]:
    query_embedding = create_embedding(query)

    with Session(engine) as session:
        distance = KnowledgeChunk.embedding.cosine_distance(
            query_embedding
        ).label("distance")

        statement = (
            select(KnowledgeChunk, distance)
        )

        if domain is not None:
            statement = statement.where(
                KnowledgeChunk.domain == domain
            )

        if category is not None:
            statement = statement.where(
                KnowledgeChunk.category == category
            )

        if flag is not None:
            statement = statement.where(
                KnowledgeChunk.flag == flag
            )

        statement = statement.order_by(distance)

        if config.max_distance is not None:
            statement = statement.where(
                distance <= config.max_distance
            )

        if config.search_type == "similarity":
            statement = statement.limit(
                config.n_results
            )

            rows = session.execute(
                statement
            ).all()

            results = []

            for chunk, distance_value in rows:
                results.append(
                    {
                        "content": chunk.content,
                        "source": chunk.source,
                        "page": chunk.page,
                        "domain": chunk.domain,
                        "category": chunk.category,
                        "flag": chunk.flag,
                        "distance": float(distance_value)
                    }
                )

            return results

        candidates_statement = statement.limit(
            config.fetch_k
        )

        rows = session.execute(
            candidates_statement
        ).all()

        candidates = []

        for chunk, distance_value in rows:
            candidates.append(
                {
                    "content": chunk.content,
                    "source": chunk.source,
                    "page": chunk.page,
                    "domain": chunk.domain,
                    "category": chunk.category,
                    "flag": chunk.flag,
                    "distance": float(distance_value),
                    "embedding": chunk.embedding
                }
            )

        selected = []

        while candidates and len(selected) < config.n_results:
            best_candidate = None
            best_score = float("-inf")

            for candidate in candidates:
                relevance = cosine_similarity(
                    query_embedding,
                    candidate["embedding"]
                )

                diversity = 0.0

                if selected:
                    diversity = max(
                        cosine_similarity(
                            candidate["embedding"],
                            selected_item["embedding"]
                        )
                        for selected_item in selected
                    )

                mmr_score = (
                    config.lambda_mult * relevance
                    - (1 - config.lambda_mult) * diversity
                )

                if mmr_score > best_score:
                    best_score = mmr_score
                    best_candidate = candidate

            selected.append(best_candidate)
            candidates.remove(best_candidate)

        results = []

        for candidate in selected:
            results.append(
                {
                    "content": candidate["content"],
                    "source": candidate["source"],
                    "page": candidate["page"],
                    "domain": candidate["domain"],
                    "category": candidate["category"],
                    "flag": candidate["flag"],
                    "distance": candidate["distance"]
                }
            )

        return results