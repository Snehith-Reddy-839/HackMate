from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import models
import schemas
from core import security
from datetime import timedelta
from core.config import settings

def register_user(db: Session, user_data: schemas.UserCreate) -> models.User:
    db_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = security.get_password_hash(user_data.password)
    # Determine deterministic default avatar
    h = sum(ord(c) for c in user_data.email)
    animals = ['animal:panda', 'animal:fox', 'animal:koala', 'animal:cat', 'animal:dog', 'animal:rabbit', 'animal:bear', 'animal:tiger', 'animal:frog', 'animal:otter']
    default_avatar = animals[h % len(animals)]

    new_user = models.User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hashed_password,
        avatar=default_avatar,
        roll_number=user_data.roll_number,
        branch=user_data.branch,
        year=user_data.year,
        section=user_data.section,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create empty profile
    profile = models.StudentProfile(user_id=new_user.id, avatar=default_avatar)
    db.add(profile)
    db.commit()

    return new_user

def authenticate_user(db: Session, email: str, password: str) -> str:
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not security.verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return access_token
