from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import models, schemas
from database import get_db
from api import deps

router = APIRouter()

@router.get("/", response_model=List[schemas.HackathonResponse])
def get_hackathons(
    status_filter: Optional[str] = None, # 'all', 'open', 'completed'
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    now = datetime.utcnow()
    query = db.query(models.Hackathon).order_by(models.Hackathon.event_date.desc())
    
    hackathons = query.offset(skip).limit(limit).all()
    result = []
    for h in hackathons:
        teams = db.query(models.Team).filter(models.Team.hackathon_name == h.name).all()
        team_ids = [t.id for t in teams]
        p_count = db.query(models.TeamMember).filter(models.TeamMember.team_id.in_(team_ids)).count() if team_ids else 0
        
        # Calculate dynamic status based on dates
        current_status = h.status
        if h.event_date and now > h.event_date:
            current_status = "Completed"
        elif h.registration_deadline and now > h.registration_deadline:
            current_status = "Registration Closed"
        elif h.registration_deadline and now <= h.registration_deadline:
            current_status = "Registration Open"

        if status_filter == "open" and current_status != "Registration Open":
            continue
        if status_filter == "completed" and current_status != "Completed":
            continue

        h_data = schemas.HackathonResponse.from_orm(h)
        h_data.status = current_status
        h_data.teams_count = len(teams)
        h_data.participants_count = p_count
        result.append(h_data)
    return result

@router.get("/{hackathon_id}", response_model=schemas.HackathonDetailResponse)
def get_hackathon(hackathon_id: int, db: Session = Depends(get_db)):
    hackathon = db.query(models.Hackathon).filter(models.Hackathon.id == hackathon_id).first()
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    
    now = datetime.utcnow()
    teams = db.query(models.Team).filter(models.Team.hackathon_name == hackathon.name).all()
    team_ids = [t.id for t in teams]
    p_count = db.query(models.TeamMember).filter(models.TeamMember.team_id.in_(team_ids)).count() if team_ids else 0
    
    current_status = hackathon.status
    if hackathon.registration_deadline:
        if now > hackathon.registration_deadline:
            current_status = "Registration Closed"
        else:
            current_status = "Registration Open"

    h_data = schemas.HackathonDetailResponse.from_orm(hackathon)
    h_data.status = current_status
    h_data.teams_count = len(teams)
    h_data.participants_count = p_count
    h_data.teams = teams
    return h_data

@router.post("/", response_model=schemas.HackathonResponse)
def create_hackathon(
    hackathon: schemas.HackathonCreate,
    current_user: models.User = Depends(deps.get_current_admin_user),
    db: Session = Depends(get_db)
):
    
    db_hackathon = models.Hackathon(**hackathon.dict())
    db.add(db_hackathon)
    db.commit()
    db.refresh(db_hackathon)
    
    res = schemas.HackathonResponse.from_orm(db_hackathon)
    res.teams_count = 0
    res.participants_count = 0
    return res

@router.delete("/{hackathon_id}")
def delete_hackathon(
    hackathon_id: int,
    current_user: models.User = Depends(deps.get_current_admin_user),
    db: Session = Depends(get_db)
):
    hackathon = db.query(models.Hackathon).filter(models.Hackathon.id == hackathon_id).first()
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    
    # Cascade delete associated teams and their data
    teams = db.query(models.Team).filter(models.Team.hackathon_name == hackathon.name).all()
    for t in teams:
        db.query(models.JoinRequest).filter(models.JoinRequest.team_id == t.id).delete()
        db.query(models.TeamMember).filter(models.TeamMember.team_id == t.id).delete()
        db.query(models.TeamMessage).filter(models.TeamMessage.team_id == t.id).delete()
        db.delete(t)
        
    db.delete(hackathon)
    db.commit()
    return {"message": f"Hackathon '{hackathon.name}' and all associated teams successfully deleted"}
