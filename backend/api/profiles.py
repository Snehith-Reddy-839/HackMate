from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas
from database import get_db
from api import deps

router = APIRouter()

DEFAULT_ANIMALS = [
    'animal:panda',
    'animal:fox',
    'animal:koala',
    'animal:cat',
    'animal:dog',
    'animal:rabbit',
    'animal:bear',
    'animal:tiger',
    'animal:frog',
    'animal:otter'
]

def get_default_animal_avatar(identifier: str) -> str:
    h = sum(ord(c) for c in identifier)
    return DEFAULT_ANIMALS[h % len(DEFAULT_ANIMALS)]

def validate_avatar_string(avatar: str) -> str:
    if not avatar:
        return avatar
    avatar = avatar.strip()
    if avatar.startswith("animal:"):
        if avatar in DEFAULT_ANIMALS:
            return avatar
        raise HTTPException(status_code=400, detail="Invalid animal avatar specified")
    if avatar.startswith("data:image/"):
        allowed_mimes = ("data:image/png;base64,", "data:image/jpeg;base64,", "data:image/jpg;base64,", "data:image/webp;base64,", "data:image/gif;base64,")
        if not any(avatar.lower().startswith(m) for m in allowed_mimes):
            raise HTTPException(status_code=400, detail="Only PNG, JPEG, WEBP, and GIF images are supported")
        if len(avatar) > 3_500_000:
            raise HTTPException(status_code=400, detail="Image size exceeds the maximum limit of 2MB")
        return avatar
    if avatar.startswith("http://") or avatar.startswith("https://"):
        if len(avatar) > 2048:
            raise HTTPException(status_code=400, detail="Image URL is too long")
        return avatar
    raise HTTPException(status_code=400, detail="Invalid avatar format")

@router.get("/me", response_model=schemas.UserProfileResponse)
def get_my_full_profile(
    current_user: models.User = Depends(deps.get_current_active_user),
    db: Session = Depends(get_db)
):
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == current_user.id).first()
    
    # Ensure deterministic avatar if not set
    if not current_user.avatar:
        default_avatar = get_default_animal_avatar(current_user.email or str(current_user.id))
        current_user.avatar = default_avatar
        db.commit()
        db.refresh(current_user)

    if not profile:
        profile = models.StudentProfile(user_id=current_user.id, avatar=current_user.avatar)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    elif not profile.avatar:
        profile.avatar = current_user.avatar
        db.commit()
        db.refresh(profile)

    return current_user

@router.put("/me/profile", response_model=schemas.StudentProfileResponse)
def update_profile(
    profile_data: schemas.StudentProfileCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
    db: Session = Depends(get_db)
):
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == current_user.id).first()
    
    # Sync avatar to user table if provided with validation
    if profile_data.avatar:
        validated_avatar = validate_avatar_string(profile_data.avatar)
        profile_data.avatar = validated_avatar
        current_user.avatar = validated_avatar

    if not profile:
        profile = models.StudentProfile(user_id=current_user.id, **profile_data.dict())
        if not profile.avatar:
            profile.avatar = current_user.avatar or get_default_animal_avatar(current_user.email or str(current_user.id))
        db.add(profile)
    else:
        for key, value in profile_data.dict(exclude_unset=True).items():
            setattr(profile, key, value)
        if not profile.avatar:
            profile.avatar = current_user.avatar or get_default_animal_avatar(current_user.email or str(current_user.id))
    
    db.commit()
    db.refresh(profile)
    db.refresh(current_user)
    return profile

@router.put("/me/user", response_model=schemas.UserResponse)
def update_user(
    user_data: schemas.UserUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
    db: Session = Depends(get_db)
):
    if user_data.roll_number is not None:
        current_user.roll_number = user_data.roll_number
    if user_data.branch is not None:
        current_user.branch = user_data.branch
    if user_data.year is not None:
        current_user.year = user_data.year
    if user_data.section is not None:
        current_user.section = user_data.section
    if user_data.avatar is not None:
        validated_avatar = validate_avatar_string(user_data.avatar)
        current_user.avatar = validated_avatar
        # Also sync profile avatar
        profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == current_user.id).first()
        if profile:
            profile.avatar = validated_avatar
    
    db.commit()
    db.refresh(current_user)
    return current_user
