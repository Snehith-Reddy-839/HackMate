from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import models, schemas
from api import deps
from database import get_db

router = APIRouter()

@router.get("/my-pending")
def get_my_pending_requests(
    current_user: models.User = Depends(deps.get_current_active_user),
    db: Session = Depends(get_db)
):
    led_team_ids = [t.id for t in db.query(models.Team).filter(models.Team.leader_id == current_user.id).all()]
    incoming = db.query(models.JoinRequest).filter(
        models.JoinRequest.team_id.in_(led_team_ids),
        models.JoinRequest.status == models.JoinRequestStatus.PENDING
    ).count() if led_team_ids else 0

    outgoing = db.query(models.JoinRequest).filter(
        models.JoinRequest.student_id == current_user.id,
        models.JoinRequest.status == models.JoinRequestStatus.PENDING
    ).count()

    return {
        "incoming_count": incoming,
        "outgoing_count": outgoing,
        "total_pending": incoming + outgoing
    }

@router.post("/", response_model=schemas.JoinRequestResponse)
def create_join_request(
    request: schemas.JoinRequestCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
    db: Session = Depends(get_db)
):
    team = db.query(models.Team).filter(models.Team.id == request.team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    if team.recruitment_status != "Open":
        raise HTTPException(status_code=400, detail="Team is not currently recruiting")

    # Check if user is already a member of this team
    member = db.query(models.TeamMember).filter(
        models.TeamMember.team_id == team.id,
        models.TeamMember.student_id == current_user.id
    ).first()
    if member or team.leader_id == current_user.id:
        raise HTTPException(status_code=400, detail="You are already a member of this team")

    # Check if student is already in an active team for this hackathon
    active_membership = db.query(models.TeamMember).join(models.Team).filter(
        models.TeamMember.student_id == current_user.id,
        models.Team.hackathon_name == team.hackathon_name
    ).first()
    if active_membership:
        raise HTTPException(
            status_code=400,
            detail=f"You already belong to team '{active_membership.team.name}' for {team.hackathon_name}."
        )

    # Check if a pending request already exists
    existing_req = db.query(models.JoinRequest).filter(
        models.JoinRequest.team_id == team.id,
        models.JoinRequest.student_id == current_user.id,
        models.JoinRequest.status == models.JoinRequestStatus.PENDING
    ).first()
    if existing_req:
        raise HTTPException(status_code=400, detail="You already have a pending application for this team.")

    req_dict = request.dict()
    # Normalize role
    if not req_dict.get("preferred_role") and req_dict.get("role"):
        req_dict["preferred_role"] = req_dict["role"]
    if not req_dict.get("role") and req_dict.get("preferred_role"):
        req_dict["role"] = req_dict["preferred_role"]

    db_request = models.JoinRequest(
        **req_dict,
        student_id=current_user.id
    )
    db.add(db_request)
    
    # Notify team leader
    notification = models.Notification(
        user_id=team.leader_id,
        type="new_join_request",
        title="New Team Application",
        message=f"{current_user.name} applied to join {team.name} as {req_dict.get('role') or 'Member'}.",
        link=f"/teams/{team.id}/manage"
    )
    db.add(notification)
    
    db.commit()
    db.refresh(db_request)
    return db_request

@router.get("/team/{team_id}", response_model=List[schemas.JoinRequestResponse])
def get_team_requests(
    team_id: int,
    status_filter: Optional[str] = None,
    current_user: models.User = Depends(deps.get_current_active_user),
    db: Session = Depends(get_db)
):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if team.leader_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to manage this team")
    
    query = db.query(models.JoinRequest).filter(models.JoinRequest.team_id == team_id)
    if status_filter and status_filter.upper() != "ALL":
        query = query.filter(models.JoinRequest.status == status_filter.upper())
    
    return query.order_by(models.JoinRequest.created_at.desc()).all()

@router.post("/{request_id}/accept", response_model=schemas.JoinRequestResponse)
def accept_request(
    request_id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
    db: Session = Depends(get_db)
):
    join_request = db.query(models.JoinRequest).filter(models.JoinRequest.id == request_id).first()
    if not join_request:
        raise HTTPException(status_code=404, detail="Request not found")
        
    team = db.query(models.Team).filter(models.Team.id == join_request.team_id).first()
    if team.leader_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the team leader can accept applications.")
        
    if join_request.status != models.JoinRequestStatus.PENDING:
        raise HTTPException(status_code=400, detail="Request is already processed")
        
    # Check max members
    current_members = db.query(models.TeamMember).filter(models.TeamMember.team_id == team.id).count()
    if current_members >= team.max_members:
        raise HTTPException(status_code=400, detail="Team is already at maximum capacity.")

    # Check if applicant joined another team in the meantime
    already_in_team = db.query(models.TeamMember).join(models.Team).filter(
        models.TeamMember.student_id == join_request.student_id,
        models.Team.hackathon_name == team.hackathon_name
    ).first()
    if already_in_team:
        join_request.status = models.JoinRequestStatus.CANCELLED
        db.commit()
        raise HTTPException(
            status_code=400,
            detail=f"Applicant is already an active member of team '{already_in_team.team.name}' for this hackathon."
        )

    # Accept request
    join_request.status = models.JoinRequestStatus.ACCEPTED
    
    # Add member
    new_member = models.TeamMember(
        team_id=team.id,
        student_id=join_request.student_id,
        role=join_request.role or join_request.preferred_role or "Member"
    )
    db.add(new_member)
    
    # Cancel any other pending requests for this student in the same hackathon
    other_requests = db.query(models.JoinRequest).join(models.Team).filter(
        models.JoinRequest.student_id == join_request.student_id,
        models.JoinRequest.id != join_request.id,
        models.JoinRequest.status == models.JoinRequestStatus.PENDING,
        models.Team.hackathon_name == team.hackathon_name
    ).all()
    for o_req in other_requests:
        o_req.status = models.JoinRequestStatus.CANCELLED

    # Check if team is now full
    if current_members + 1 >= team.max_members:
        team.recruitment_status = "Closed"
        full_notif = models.Notification(
            user_id=team.leader_id,
            type="team_full",
            title="Team Full 🎉",
            message=f"{team.name} has reached its maximum size of {team.max_members} members. Recruitment is now closed.",
            link=f"/teams/{team.id}/manage"
        )
        db.add(full_notif)

    # Notify student
    notification = models.Notification(
        user_id=join_request.student_id,
        type="request_accepted",
        title="Application Accepted 🎉",
        message=f"You have been accepted into {team.name} for {team.hackathon_name}!",
        link=f"/teams/{team.id}/chat"
    )
    db.add(notification)
    
    db.commit()
    db.refresh(join_request)
    return join_request

@router.post("/{request_id}/reject", response_model=schemas.JoinRequestResponse)
def reject_request(
    request_id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
    db: Session = Depends(get_db)
):
    join_request = db.query(models.JoinRequest).filter(models.JoinRequest.id == request_id).first()
    if not join_request:
        raise HTTPException(status_code=404, detail="Request not found")
        
    team = db.query(models.Team).filter(models.Team.id == join_request.team_id).first()
    if team.leader_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the team leader can reject applications.")
        
    join_request.status = models.JoinRequestStatus.REJECTED
    
    notification = models.Notification(
        user_id=join_request.student_id,
        type="request_rejected",
        title="Application Status Update",
        message=f"Your application to join {team.name} was not accepted.",
        link="/teams"
    )
    db.add(notification)
    
    db.commit()
    db.refresh(join_request)
    return join_request
