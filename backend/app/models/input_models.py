from typing import Any

from pydantic import BaseModel, Field


class DecisionInput(BaseModel):
    data: dict[str, Any] = Field(
        ...,
        description="Structured input data to be analyzed"
    )