from sqlalchemy import create_engine


DATABASE_URL = (
    "postgresql+psycopg2://generaluser:generalpass"
    "@localhost:5433/generalai"
)


engine = create_engine(DATABASE_URL)