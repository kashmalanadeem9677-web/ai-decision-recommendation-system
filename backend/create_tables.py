from app.database import engine
from app.models.knowledge_models import Base


Base.metadata.create_all(engine)

print("Knowledge table created successfully")