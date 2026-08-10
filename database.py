import os
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from dotenv import load_dotenv
from models import ClaimStatus

# Load the .env file
load_dotenv()

# Fallback to local SQLite if the env var isn't set
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./scavenger_hunt.db")

# SQLAlchemy 1.4+ requires "postgresql://" instead of "postgres://"
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Only apply SQLite-specific arguments if we are actually using SQLite
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class DBTeam(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)

    # Relationships
    submissions = relationship("DBSubmission", back_populates="team")

    @property
    def score(self) -> int:
        return sum(
            claim.item.points
            for sub in self.submissions
            for claim in sub.claims
            if claim.status == ClaimStatus.APPROVED
        )

    @property
    def photo_count(self) -> int:
        return len(self.submissions)

class DBHuntItem(Base):
    __tablename__ = "hunt_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    points = Column(Integer)
    description = Column(String, nullable=True)

class DBSubmission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"))
    image_url = Column(String)
    
    # Simple timestamp for the frontend
    created_at = Column(String) 

    # Relationships
    team = relationship("DBTeam", back_populates="submissions")
    claims = relationship("DBSubmissionClaim", back_populates="submission")

class DBSubmissionClaim(Base):
    __tablename__ = "submission_claims"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("submissions.id"))
    item_id = Column(Integer, ForeignKey("hunt_items.id"))
    status = Column(SQLEnum(ClaimStatus), default=ClaimStatus.PENDING)

    # Relationships
    submission = relationship("DBSubmission", back_populates="claims")
    item = relationship("DBHuntItem")

# Dependency to use in your FastAPI routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()