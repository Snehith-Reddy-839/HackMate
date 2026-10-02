from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from database import get_db
import models
import schemas
from api.deps import get_current_admin_user

router = APIRouter()

@router.get("/overview")
def get_admin_overview(
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin_user)
):
    now = datetime.utcnow()
    total_students = db.query(models.User).filter(models.User.role != "admin").count()
    total_hackathons = db.query(models.Hackathon).count()
    active_hackathons = db.query(models.Hackathon).filter(models.Hackathon.registration_deadline >= now).count()
    total_teams = db.query(models.Team).count()
    open_teams = db.query(models.Team).filter(models.Team.recruitment_status == "Open").count()
    total_requests = db.query(models.JoinRequest).count()
    pending_requests = db.query(models.JoinRequest).filter(models.JoinRequest.status == "PENDING").count()

    return {
        "total_students": total_students,
        "total_hackathons": total_hackathons,
        "active_hackathons": active_hackathons,
        "total_teams": total_teams,
        "open_teams": open_teams,
        "total_requests": total_requests,
        "pending_requests": pending_requests,
    }

@router.get("/students", response_model=List[schemas.UserProfileResponse])
def get_all_students(
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin_user)
):
    students = db.query(models.User).filter(models.User.role != "admin").order_by(models.User.created_at.desc()).all()
    return students

@router.get("/teams")
def get_all_teams(
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin_user)
):
    teams = db.query(models.Team).order_by(models.Team.created_at.desc()).all()
    result = []
    for team in teams:
        members_count = db.query(models.TeamMember).filter(models.TeamMember.team_id == team.id).count()
        result.append({
            "id": team.id,
            "name": team.name,
            "hackathon_name": team.hackathon_name,
            "description": team.description,
            "max_members": team.max_members,
            "current_members": members_count,
            "recruitment_status": team.recruitment_status,
            "created_at": team.created_at.isoformat() if team.created_at else None,
            "leader": {
                "id": team.leader.id if team.leader else None,
                "name": team.leader.name if team.leader else "Unknown",
                "email": team.leader.email if team.leader else "",
                "avatar": team.leader.avatar if team.leader else None,
                "roll_number": team.leader.roll_number if team.leader else None,
            },
            "members": [
                {
                    "id": m.student.id,
                    "name": m.student.name,
                    "email": m.student.email,
                    "role": m.role,
                    "avatar": m.student.avatar,
                }
                for m in team.members if m.student
            ]
        })
    return result

@router.delete("/teams/{team_id}")
def delete_team_by_admin(
    team_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin_user)
):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Delete associated join requests, team members, and messages
    db.query(models.JoinRequest).filter(models.JoinRequest.team_id == team_id).delete()
    db.query(models.TeamMember).filter(models.TeamMember.team_id == team_id).delete()
    db.query(models.TeamMessage).filter(models.TeamMessage.team_id == team_id).delete()
    db.delete(team)
    db.commit()
    return {"message": f"Team '{team.name}' successfully deleted by admin"}

@router.delete("/hackathons/{hackathon_id}")
def delete_hackathon_by_admin(
    hackathon_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin_user)
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
    return {"message": f"Hackathon '{hackathon.name}' and its teams successfully deleted"}
