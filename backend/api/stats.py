from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from database import get_db
import models

router = APIRouter()

@router.get("/summary")
def get_platform_summary(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    cutoff = now - timedelta(days=3)
    
    total_students = db.query(models.User).filter(models.User.role == models.RoleEnum.STUDENT).count()
    if total_students == 0:
        total_students = db.query(models.User).count()
        
    active_hackathons = db.query(models.Hackathon).filter(
        (models.Hackathon.registration_deadline == None) |
        (models.Hackathon.registration_deadline >= cutoff)
    ).count()
    
    total_teams = db.query(models.Team).count()
    open_teams = db.query(models.Team).filter(models.Team.recruitment_status == "Open").count()
    total_participants = db.query(models.TeamMember).count()

    return {
        "total_students": total_students,
        "active_hackathons": active_hackathons,
        "total_teams": total_teams,
        "open_teams": open_teams,
        "total_participants": total_participants
    }
