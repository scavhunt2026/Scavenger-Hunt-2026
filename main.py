from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

import models
import database

# Initialize database tables
database.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Scavenger Hunt API")

# Configure CORS for local development with Vite
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for vibe coding; tighten for prod if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Public / General Endpoints ---

@app.get("/api/items", response_model=List[models.HuntItem])
def get_items(db: Session = Depends(database.get_db)):
    return db.query(database.DBHuntItem).all()

@app.get("/api/leaderboard", response_model=List[models.LeaderboardTeam])
def get_leaderboard(db: Session = Depends(database.get_db)):
    teams = db.query(database.DBTeam).all()
    
    # Sort teams by dynamic score descending
    sorted_teams = sorted(teams, key=lambda t: t.score, reverse=True)
    
    leaderboard = []
    current_rank = 1
    
    for index, team in enumerate(sorted_teams):
        # Update rank only if the score is strictly less than the previous team's score
        if index > 0 and team.score < sorted_teams[index - 1].score:
            current_rank = index + 1
            
        leaderboard.append({
            "rank": current_rank,
            "id": team.id,
            "name": team.name,
            "score": team.score,
            "photos_submitted": team.photo_count
        })
    return leaderboard

# --- Team Endpoints ---

@app.get("/api/teams/{team_id}", response_model=models.Team)
def get_team(team_id: int, db: Session = Depends(database.get_db)):
    team = db.query(database.DBTeam).filter(database.DBTeam.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team

@app.get("/api/teams/{team_id}/submissions", response_model=List[models.SubmissionResponse])
def get_team_submissions(team_id: int, db: Session = Depends(database.get_db)):
    # Verify team exists
    team = db.query(database.DBTeam).filter(database.DBTeam.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team.submissions

@app.post("/api/teams/{team_id}/submissions", response_model=models.SubmissionResponse)
def create_submission(team_id: int, submission: models.SubmissionCreate, db: Session = Depends(database.get_db)):
    team = db.query(database.DBTeam).filter(database.DBTeam.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
        
    if team.photo_count >= 10:
        raise HTTPException(status_code=400, detail="Team has reached the maximum of 10 submissions")

    # Create the submission
    db_submission = database.DBSubmission(
        team_id=team_id,
        image_url=submission.image_url,
        created_at=datetime.utcnow().isoformat()
    )
    db.add(db_submission)
    db.commit()
    db.refresh(db_submission)

    # Create the associated claims
    for item_id in submission.claimed_item_ids:
        db_claim = database.DBSubmissionClaim(
            submission_id=db_submission.id,
            item_id=item_id,
            status=models.ClaimStatus.PENDING
        )
        db.add(db_claim)
    
    db.commit()
    db.refresh(db_submission)
    return db_submission

# --- Admin Endpoints ---

@app.get("/api/admin/submissions/pending", response_model=List[models.SubmissionResponse])
def get_pending_submissions(db: Session = Depends(database.get_db)):
    # Returns any submission that has at least one pending claim
    submissions = db.query(database.DBSubmission).join(database.DBSubmissionClaim).filter(
        database.DBSubmissionClaim.status == models.ClaimStatus.PENDING
    ).distinct().all()
    return submissions

@app.patch("/api/admin/claims/{claim_id}")
def update_claim_status(claim_id: int, status: models.ClaimStatus, db: Session = Depends(database.get_db)):
    claim = db.query(database.DBSubmissionClaim).filter(database.DBSubmissionClaim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    claim.status = status
    db.commit()
    return {"message": "Claim updated successfully", "new_status": status}

@app.post("/api/teams", response_model=models.Team)
def create_team(team: models.TeamCreate, db: Session = Depends(database.get_db)):
    # Check if a team with this name already exists
    existing_team = db.query(database.DBTeam).filter(database.DBTeam.name == team.name).first()
    if existing_team:
        raise HTTPException(status_code=400, detail="A team with this name already exists")
    
    # Create the new team. Score and photo_count will default to 0 dynamically.
    new_team = database.DBTeam(name=team.name)
    db.add(new_team)
    db.commit()
    db.refresh(new_team)
    
    return new_team

@app.post("/api/items", response_model=models.HuntItem)
def create_item(item: models.HuntItemCreate, db: Session = Depends(database.get_db)):
    new_item = database.DBHuntItem(
        name=item.name,
        points=item.points,
        description=item.description
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item