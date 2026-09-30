from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import models, schemas
from database import get_db
from services import auth_service
from api import deps
from core import security
from datetime import timedelta
from core.config import settings

router = APIRouter()

@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    return auth_service.register_user(db, user)

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    access_token = auth_service.authenticate_user(db, form_data.username, form_data.password)
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.UserProfileResponse)
def read_users_me(current_user: models.User = Depends(deps.get_current_active_user)):
    return current_user

class GoogleUser(schemas.BaseModel):
    email: schemas.EmailStr
    name: str

@router.post("/google", response_model=schemas.Token)
def google_auth(google_user: GoogleUser, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == google_user.email).first()
    
    if not user:
        h = sum(ord(c) for c in google_user.email)
        animals = ['animal:panda', 'animal:fox', 'animal:koala', 'animal:cat', 'animal:dog', 'animal:rabbit', 'animal:bear', 'animal:tiger', 'animal:frog', 'animal:otter']
        default_avatar = animals[h % len(animals)]

        user = models.User(
            name=google_user.name,
            email=google_user.email,
            password_hash="", 
            avatar=default_avatar
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        profile = models.StudentProfile(user_id=user.id, avatar=default_avatar)
        db.add(profile)
        db.commit()
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}
