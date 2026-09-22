from typing import Literal

from pydantic import BaseModel, Field


class RetrievalConfig(BaseModel):
    n_results: int = Field(default=5, ge=1)
    max_distance: float | None = Field(default=0.75, ge=0)
    search_type: Literal["similarity", "mmr"] = "similarity"
    fetch_k: int = Field(default=20, ge=1)
    lambda_mult: float = Field(default=0.5, ge=0, le=1)