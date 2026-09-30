from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from api import deps
from database import get_db

router = APIRouter()

@router.get("/", response_model=List[schemas.TeamResponse])
def get_all_teams(db: Session = Depends(get_db)):
    return db.query(models.Team).order_by(models.Team.created_at.desc()).all()

@router.get("/hackathon/{hackathon_name}", response_model=List[schemas.TeamResponse])
def get_teams_by_hackathon(hackathon_name: str, db: Session = Depends(get_db)):
    return db.query(models.Team).filter(models.Team.hackathon_name == hackathon_name).all()

@router.get("/{team_id}", response_model=schemas.TeamDetailResponse)
def get_team(team_id: int, db: Session = Depends(get_db)):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team

@router.post("/", response_model=schemas.TeamResponse)
def create_team(
    team: schemas.TeamCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
    db: Session = Depends(get_db)
):
    # Check if student is already a member or leader of an active team for this hackathon
    existing_membership = db.query(models.TeamMember).join(models.Team).filter(
        models.TeamMember.student_id == current_user.id,
        models.Team.hackathon_name == team.hackathon_name
    ).first()
    if existing_membership:
        raise HTTPException(
            status_code=400,
            detail=f"You are already an active member of team '{existing_membership.team.name}' for {team.hackathon_name}."
        )

    # Create the team
    db_team = models.Team(
        **team.dict(),
        leader_id=current_user.id
    )
    db.add(db_team)
    db.commit()
    db.refresh(db_team)
    
    # Add leader as a member
    db_member = models.TeamMember(
        team_id=db_team.id,
        student_id=current_user.id,
        role="Team Leader"
    )
    db.add(db_member)
    db.commit()
    
    return db_team

@router.put("/{team_id}/close", response_model=schemas.TeamResponse)
def close_recruitment(
    team_id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
    db: Session = Depends(get_db)
):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if team.leader_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the team leader can close recruitment")
    
    team.recruitment_status = "Closed"
    db.commit()
    db.refresh(team)
    return team

@router.put("/{team_id}/reopen", response_model=schemas.TeamResponse)
def reopen_recruitment(
    team_id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
    db: Session = Depends(get_db)
):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if team.leader_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the team leader can reopen recruitment")
    
    member_count = db.query(models.TeamMember).filter(models.TeamMember.team_id == team_id).count()
    if member_count >= team.max_members:
        raise HTTPException(status_code=400, detail="Cannot reopen recruitment: Team has reached its maximum size.")
    
    team.recruitment_status = "Open"
    db.commit()
    db.refresh(team)
    return team

@router.get("/{team_id}/messages", response_model=List[schemas.TeamMessageResponse])
def get_team_messages(
    team_id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
    db: Session = Depends(get_db)
):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    is_member = db.query(models.TeamMember).filter(models.TeamMember.team_id == team_id, models.TeamMember.student_id == current_user.id).first()
    if not is_member and team.leader_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return db.query(models.TeamMessage).filter(models.TeamMessage.team_id == team_id).order_by(models.TeamMessage.created_at.asc()).all()

@router.post("/{team_id}/messages", response_model=schemas.TeamMessageResponse)
def send_team_message(
    team_id: int,
    message: schemas.TeamMessageCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
    db: Session = Depends(get_db)
):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    is_member = db.query(models.TeamMember).filter(models.TeamMember.team_id == team_id, models.TeamMember.student_id == current_user.id).first()
    if not is_member and team.leader_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db_msg = models.TeamMessage(team_id=team_id, user_id=current_user.id, message=message.message)
    db.add(db_msg)
    db.commit()
    db.refresh(db_msg)
    return db_msg

@router.get("/me/list", response_model=List[schemas.TeamResponse])
def get_my_teams(
    current_user: models.User = Depends(deps.get_current_active_user),
    db: Session = Depends(get_db)
):
    member_records = db.query(models.TeamMember).filter(models.TeamMember.student_id == current_user.id).all()
    team_ids = [m.team_id for m in member_records]
    return db.query(models.Team).filter(models.Team.id.in_(team_ids)).all()

@router.delete("/{team_id}/members/{student_id}")
def remove_team_member(
    team_id: int,
    student_id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
    db: Session = Depends(get_db)
):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if team.leader_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only leader can remove members")
    if student_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot remove yourself")
    member = db.query(models.TeamMember).filter(models.TeamMember.team_id == team_id, models.TeamMember.student_id == student_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found in team")
    
    db.delete(member)
    
    # Notify student
    notification = models.Notification(
        user_id=student_id,
        type="member_removed",
        title="Team Membership Update",
        message=f"You were removed from team {team.name}."
    )
    db.add(notification)
    
    # If team was closed because it was full, and now has space, keep recruitment status or allow reopen
    db.commit()
    return {"detail": "Member removed successfully"}
