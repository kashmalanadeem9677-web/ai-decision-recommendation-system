from pydantic import BaseModel, Field

from app.models.input_models import DecisionInput
from app.models.retrieval_models import RetrievalConfig


class AnalysisRequest(BaseModel):
    input_data: DecisionInput

    specification_id: str = Field(
        ...,
        min_length=1,
        description="ID of the saved specification to use"
    )

    retrieval_config: RetrievalConfig = Field(
        default_factory=RetrievalConfig
    )