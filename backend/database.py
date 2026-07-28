from sqlalchemy import create_engine, Column, String, JSON
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = "sqlite:///./games.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class GameRecord(Base):
    __tablename__ = "games"

    url = Column(String, primary_key=True, index=True)
    depth = Column(String, primary_key=True, index=True) # Store depth as part of the key
    data = Column(JSON)

Base.metadata.create_all(bind=engine)
