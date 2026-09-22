from typing import Any

from pydantic import BaseModel


class ConditionResult(BaseModel):
    field: str
    actual_value: Any
    operator: str
    expected_value: Any
    matched: bool


class RuleResult(BaseModel):
    flag: str
    description: str
    logic: str
    matched: bool
    conditions: list[ConditionResult]


class RetrievedKnowledge(BaseModel):
    content: str
    source: str
    page: int | None
    domain: str
    category: str
    distance: float
    flag: str
    query: str


class AnalysisResponse(BaseModel):
    specification_name: str
    received_data: dict[str, Any]
    flags: list[str]
    rule_results: list[RuleResult]
    queries: list[str]
    retrieved_knowledge: list[RetrievedKnowledge]
    answer: str