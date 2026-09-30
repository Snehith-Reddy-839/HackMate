from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import get_db
from api import deps

router = APIRouter()

@router.get("/", response_model=List[schemas.NotificationResponse])
def get_user_notifications(
    current_user: models.User = Depends(deps.get_current_active_user),
    db: Session = Depends(get_db)
):
    return db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id
    ).order_by(models.Notification.created_at.desc()).limit(50).all()

@router.get("/unread-count")
def get_unread_count(
    current_user: models.User = Depends(deps.get_current_active_user),
    db: Session = Depends(get_db)
):
    count = db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.is_read == False
    ).count()
    return {"unread_count": count}

@router.put("/{notification_id}/read", response_model=schemas.NotificationResponse)
def mark_notification_read(
    notification_id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
    db: Session = Depends(get_db)
):
    notif = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.user_id == current_user.id
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif

@router.put("/read-all")
def mark_all_read(
    current_user: models.User = Depends(deps.get_current_active_user),
    db: Session = Depends(get_db)
):
    db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"detail": "All notifications marked as read"}
