import os
import tempfile

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.models.request_models import AnalysisRequest
from app.models.response_models import AnalysisResponse
from app.models.knowledge_models import KnowledgeCreate, KnowledgeChunk
from app.models.specification_models import (
    SpecificationCreate,
    SpecificationResponse
)
from app.analysis.engine import analyze_data
from app.retrieval.query_builder import build_queries
from app.retrieval.retriever import retrieve
from app.llm.answer_generator import generate_answer
from app.embeddings import create_embedding
from app.database import engine
from app.ingestion.pdf_ingester import extract_pdf_text
from app.ingestion.chunker import chunk_text
from app.specifications.registry import (
    save_specification,
    get_specification
)


app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.get("/")
def root():
    return {
        "message": "AI Decision and Recommendation System is running"
    }


@app.post(
    "/specifications",
    response_model=SpecificationResponse
)
def create_specification(
    item: SpecificationCreate
):
    specification = save_specification(
        specification_id=item.specification_id,
        specification=item.specification
    )

    return SpecificationResponse(
        specification_id=item.specification_id,
        specification=specification
    )


@app.get(
    "/specifications/{specification_id}",
    response_model=SpecificationResponse
)
def read_specification(
    specification_id: str
):
    specification = get_specification(
        specification_id
    )

    if specification is None:
        raise HTTPException(
            status_code=404,
            detail="Specification not found"
        )

    return SpecificationResponse(
        specification_id=specification_id,
        specification=specification
    )


@app.post("/knowledge")
def create_knowledge(item: KnowledgeCreate):
    embedding = create_embedding(item.content)

    with engine.begin() as connection:
        result = connection.execute(
            KnowledgeChunk.__table__.insert().returning(
                KnowledgeChunk.id
            ),
            {
                "content": item.content,
                "source": item.source,
                "page": None,
                "domain": item.domain,
                "category": item.category,
                "flag": item.flag,
                "embedding": embedding
            }
        )

        knowledge_id = result.scalar_one()

    return {
        "message": "Knowledge added successfully",
        "id": knowledge_id,
        "source": item.source,
        "domain": item.domain,
        "category": item.category,
        "flag": item.flag
    }


@app.post("/knowledge/upload")
async def upload_knowledge_pdf(
    file: UploadFile = File(...),
    domain: str = Form(...),
    category: str = Form(...),
    flag: str | None = Form(None)
):
    if not file.filename:
        return {
            "message": "A file is required",
            "chunks_inserted": 0
        }

    if not file.filename.lower().endswith(".pdf"):
        return {
            "message": "Only PDF files are supported",
            "chunks_inserted": 0
        }

    file_bytes = await file.read()

    temporary_path = None

    try:
        with tempfile.NamedTemporaryFile(
            suffix=".pdf",
            delete=False
        ) as temporary_file:
            temporary_file.write(file_bytes)
            temporary_path = temporary_file.name

        pages = extract_pdf_text(temporary_path)

    finally:
        if temporary_path and os.path.exists(temporary_path):
            os.remove(temporary_path)

    chunks_to_insert = []

    for page_data in pages:
        chunks = chunk_text(
            page_data["content"]
        )

        for chunk in chunks:
            chunks_to_insert.append(
                {
                    "content": chunk,
                    "source": file.filename,
                    "page": page_data["page"],
                    "domain": domain,
                    "category": category,
                    "flag": flag
                }
            )

    inserted_count = 0

    with engine.begin() as connection:
        for item in chunks_to_insert:
            embedding = create_embedding(
                item["content"]
            )

            connection.execute(
                KnowledgeChunk.__table__.insert(),
                {
                    "content": item["content"],
                    "source": item["source"],
                    "page": item["page"],
                    "domain": item["domain"],
                    "category": item["category"],
                    "flag": item["flag"],
                    "embedding": embedding
                }
            )

            inserted_count += 1

    return {
        "message": "PDF knowledge added successfully",
        "filename": file.filename,
        "domain": domain,
        "category": category,
        "flag": flag,
        "pages_processed": len(pages),
        "chunks_inserted": inserted_count
    }


@app.post(
    "/analyze",
    response_model=AnalysisResponse
)
def analyze(
    request: AnalysisRequest
):
    specification = get_specification(
        request.specification_id
    )

    if specification is None:
        raise HTTPException(
            status_code=404,
            detail=(
                "Specification not found: "
                f"{request.specification_id}"
            )
        )

    flags, rule_results = analyze_data(
        data=request.input_data.data,
        specification=specification
    )

    query_items = build_queries(
        flags=flags,
        specification=specification,
        rule_results=rule_results
    )

    queries = [
        item["query"]
        for item in query_items
    ]

    retrieved_knowledge = []

    for item in query_items:
        results = retrieve(
            query=item["query"],
            config=request.retrieval_config,
            domain=item["domain"],
            category=item["category"],
            flag=item["flag"]
        )

        seen_for_flag = set()

        for result in results:
            knowledge_key = (
                result["content"],
                result["source"],
                result["page"],
                result["domain"],
                result["category"],
                result["flag"]
            )

            if knowledge_key in seen_for_flag:
                continue

            seen_for_flag.add(knowledge_key)

            retrieved_knowledge.append(
                {
                    **result,
                    "flag": item["flag"],
                    "query": item["query"]
                }
            )

    if not flags:
        answer = (
            "No analysis rules matched the supplied data. "
            "Therefore, no flags were detected and no "
            "evidence-based recommendation was generated."
        )

    elif not retrieved_knowledge:
        answer = (
            "The analysis rules detected one or more flags, "
            "but no sufficiently relevant knowledge was retrieved. "
            "Therefore, no recommendation can be generated from "
            "the available evidence."
        )

    else:
        answer = generate_answer(
            input_data=request.input_data.data,
            flags=flags,
            rule_results=rule_results,
            retrieved_knowledge=retrieved_knowledge
        )

    return AnalysisResponse(
        specification_name=specification.name,
        received_data=request.input_data.data,
        flags=flags,
        rule_results=rule_results,
        queries=queries,
        retrieved_knowledge=retrieved_knowledge,
        answer=answer
    )