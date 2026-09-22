from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import engine
from app.models.knowledge_models import SpecificationRecord
from app.models.rule_models import Specification


def save_specification(
    specification_id: str,
    specification: Specification
) -> Specification:
    specification_data = specification.model_dump()

    with Session(engine) as session:
        record = session.execute(
            select(SpecificationRecord).where(
                SpecificationRecord.specification_id
                == specification_id
            )
        ).scalar_one_or_none()

        if record is None:
            record = SpecificationRecord(
                specification_id=specification_id,
                name=specification.name,
                rules=specification_data["rules"]
            )

            session.add(record)

        else:
            record.name = specification.name
            record.rules = specification_data["rules"]

        session.commit()

    return specification


def get_specification(
    specification_id: str
) -> Specification | None:
    with Session(engine) as session:
        record = session.execute(
            select(SpecificationRecord).where(
                SpecificationRecord.specification_id
                == specification_id
            )
        ).scalar_one_or_none()

        if record is None:
            return None

        return Specification(
            name=record.name,
            rules=record.rules
        )