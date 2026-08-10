from pydantic import BaseModel, HttpUrl
from typing import List, Optional
from datetime import datetime
from enum import Enum

class ClaimStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

# --- Master Hunt Items ---
class HuntItem(BaseModel):
    id: int
    name: str
    points: int
    description: Optional[str] = None

    class Config:
        from_attributes = True

# --- Submission Claims (The items team claims are in the photo) ---
class SubmissionClaim(BaseModel):
    id: int
    item_id: int
    status: ClaimStatus

    class Config:
        from_attributes = True

# --- Photo Submissions ---
class SubmissionCreate(BaseModel):
    image_url: str
    claimed_item_ids: List[int]

class SubmissionResponse(BaseModel):
    id: int
    team_id: int
    image_url: str
    created_at: datetime
    claims: List[SubmissionClaim]

    class Config:
        from_attributes = True

# --- Teams ---
class Team(BaseModel):
    id: int
    name: str
    score: int
    photo_count: int  # Max 10

    class Config:
        from_attributes = True

# --- Leaderboard View ---
class LeaderboardTeam(BaseModel):
    id: int
    rank: int
    name: str
    score: int
    photos_submitted: int

class TeamCreate(BaseModel):
    name: str

class HuntItemCreate(BaseModel):
    name: str
    points: int
    description: Optional[str] = None