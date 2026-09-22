from sqlalchemy import Integer, Text, JSON
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from pgvector.sqlalchemy import Vector
from pydantic import BaseModel, Field


class Base(DeclarativeBase):
    pass


class KnowledgeChunk(Base):
    __tablename__ = "knowledge_chunks"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )

    content: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    source: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    page: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )

    domain: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    category: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    flag: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    embedding: Mapped[list[float]] = mapped_column(
        Vector(1536),
        nullable=False
    )


class SpecificationRecord(Base):
    __tablename__ = "specifications"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )

    specification_id: Mapped[str] = mapped_column(
        Text,
        unique=True,
        nullable=False
    )

    name: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    rules: Mapped[list] = mapped_column(
        JSON,
        nullable=False
    )


class KnowledgeCreate(BaseModel):
    content: str
    source: str
    domain: str
    category: str
    flag: str | None = Field(
        default=None,
        description="Optional analysis flag associated with this knowledge"
    )