from typing import Any, Literal

from pydantic import BaseModel, field_validator


class Condition(BaseModel):
    field: str
    operator: Literal[
        ">",
        "<",
        ">=",
        "<=",
        "==",
        "!=",
        "contains",
        "in",
        "between",
        "length_gte",
        "length_lte"
    ]
    value: Any

    @field_validator("field")
    @classmethod
    def validate_field(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Field name cannot be empty")

        return value


class RetrievalTarget(BaseModel):
    query: str
    domain: str | None = None
    category: str | None = None

    @field_validator("query")
    @classmethod
    def validate_query(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Query cannot be empty")

        return value

    @field_validator("domain", "category")
    @classmethod
    def validate_optional_text(
        cls,
        value: str | None
    ) -> str | None:
        if value is not None and not value.strip():
            raise ValueError("Value cannot be empty")

        return value


class Rule(BaseModel):
    conditions: list[Condition]
    logic: Literal["AND", "OR"]
    flag: str
    description: str
    retrieval: RetrievalTarget

    @field_validator("conditions")
    @classmethod
    def validate_conditions(
        cls,
        value: list[Condition]
    ) -> list[Condition]:
        if not value:
            raise ValueError(
                "A rule must contain at least one condition"
            )

        return value

    @field_validator("flag", "description")
    @classmethod
    def validate_text(cls, value: str) -> str:
        if not value.strip():
            raise ValueError(
                "Value cannot be empty"
            )

        return value


class Specification(BaseModel):
    name: str
    rules: list[Rule]

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        if not value.strip():
            raise ValueError(
                "Specification name cannot be empty"
            )

        return value

    @field_validator("rules")
    @classmethod
    def validate_rules(
        cls,
        value: list[Rule]
    ) -> list[Rule]:
        if not value:
            raise ValueError(
                "Specification must contain at least one rule"
            )

        return value