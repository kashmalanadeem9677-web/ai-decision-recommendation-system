from pydantic import BaseModel

from app.models.rule_models import Specification


class SpecificationCreate(BaseModel):
    specification_id: str
    specification: Specification


class SpecificationResponse(BaseModel):
    specification_id: str
    specification: Specification