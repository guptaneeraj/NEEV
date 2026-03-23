from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pathlib import Path

# Use the local neev.db file in this directory
DB_PATH = Path(__file__).parent / "neev.db"
DATABASE_URL = f"sqlite:///{DB_PATH}"

# For SQLite, we need 'check_same_thread: False' to allow multithreading
engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
