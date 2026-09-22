from typing import Any

from app.models.rule_models import Specification


def build_queries(
    flags: list[str],
    specification: Specification,
    rule_results: list[dict[str, Any]] | None = None
) -> list[dict]:
    matched_queries = []

    for rule in specification.rules:
        if rule.flag not in flags:
            continue

        actual_values = []

        if rule_results:
            for result in rule_results:
                if result["flag"] != rule.flag:
                    continue

                for condition in result["conditions"]:
                    if condition["matched"]:
                        actual_values.append(
                            {
                                "field": condition["field"],
                                "actual_value": condition["actual_value"]
                            }
                        )

        query_parts = [
            rule.retrieval.query,
            rule.description
        ]

        for value in actual_values:
            query_parts.append(
                f"{value['field']}: {value['actual_value']}"
            )

        query = " | ".join(query_parts)

        matched_queries.append(
            {
                "flag": rule.flag,
                "query": query,
                "domain": rule.retrieval.domain,
                "category": rule.retrieval.category
            }
        )

    if not matched_queries:
        return []

    unique_queries = []
    seen = set()

    for item in matched_queries:
        key = (
            item["flag"],
            item["query"],
            item["domain"],
            item["category"]
        )

        if key not in seen:
            seen.add(key)
            unique_queries.append(item)

    return unique_queries