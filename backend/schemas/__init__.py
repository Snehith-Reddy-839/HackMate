from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

# --- User Schemas ---
class UserBase(BaseModel):
    name: str
    email: EmailStr
    avatar: Optional[str] = None
    roll_number: Optional[str] = None
    branch: Optional[str] = None
    year: Optional[int] = None
    section: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    roll_number: Optional[str] = None
    branch: Optional[str] = None
    year: Optional[int] = None
    section: Optional[str] = None
    avatar: Optional[str] = None

class UserResponse(UserBase):
    id: int
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# --- Profile Schemas ---
class StudentProfileBase(BaseModel):
    avatar: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[str] = None
    technologies: Optional[str] = None
    languages: Optional[str] = None
    frameworks: Optional[str] = None
    tools: Optional[str] = None
    skills_proficiency: Optional[str] = None
    github: Optional[str] = None
    linkedin: Optional[str] = None
    portfolio: Optional[str] = None
    leetcode_link: Optional[str] = None
    certifications: Optional[str] = None
    courses: Optional[str] = None
    experience: Optional[str] = None
    hackathon_experience: Optional[int] = 0
    hackathons_history: Optional[str] = None
    projects: Optional[str] = None
    projects_list: Optional[str] = None
    achievements: Optional[str] = None
    availability: Optional[str] = None
    preferred_roles: Optional[str] = None
    working_style: Optional[str] = None
    communication_pref: Optional[str] = None
    phone: Optional[str] = None
    show_phone: Optional[bool] = False

class StudentProfileCreate(StudentProfileBase):
    pass

class StudentProfileResponse(StudentProfileBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

class UserProfileResponse(UserResponse):
    profile: Optional[StudentProfileResponse] = None

# --- Hackathon Schemas ---
class HackathonBase(BaseModel):
    name: str
    organizer: str
    description: str
    registration_deadline: datetime
    event_date: datetime
    location: str
    mode: str
    team_size_min: int = 1
    team_size_max: int = 6
    prize: Optional[str] = None
    official_url: Optional[str] = None
    status: str = "Upcoming"

class HackathonCreate(HackathonBase):
    pass

class HackathonResponse(HackathonBase):
    id: int
    teams_count: Optional[int] = 0
    participants_count: Optional[int] = 0

    class Config:
        from_attributes = True

# --- Team Schemas ---
class TeamBase(BaseModel):
    name: str
    description: str
    max_members: int
    requirements: str
    looking_for_roles: Optional[str] = None
    required_skills: Optional[str] = None
    availability_requirements: Optional[str] = None
    recruitment_status: str = "Open"

class TeamCreate(TeamBase):
    hackathon_name: str

class TeamResponse(TeamBase):
    id: int
    hackathon_name: str
    leader_id: int
    created_at: datetime
    leader: UserResponse

    class Config:
        from_attributes = True

class TeamMemberResponse(BaseModel):
    id: int
    team_id: int
    student_id: int
    role: Optional[str] = None
    joined_at: datetime
    student: UserProfileResponse

    class Config:
        from_attributes = True

class TeamDetailResponse(TeamResponse):
    members: List[TeamMemberResponse] = []

class HackathonDetailResponse(HackathonResponse):
    teams: List[TeamDetailResponse] = []

# --- Join Request Schemas ---
class JoinRequestBase(BaseModel):
    preferred_role: Optional[str] = None
    role: Optional[str] = None
    skills: Optional[str] = None
    technologies: Optional[str] = None
    experience_summary: Optional[str] = None
    relevant_projects: Optional[str] = None
    github: Optional[str] = None
    portfolio: Optional[str] = None
    availability: Optional[str] = None
    why_join: Optional[str] = None
    contribution: Optional[str] = None
    message: Optional[str] = None

class JoinRequestCreate(JoinRequestBase):
    team_id: int

class JoinRequestResponse(JoinRequestBase):
    id: int
    team_id: int
    student_id: int
    status: str
    created_at: datetime
    updated_at: datetime
    student: UserProfileResponse

    class Config:
        from_attributes = True

# --- Notification Schemas ---
class NotificationResponse(BaseModel):
    id: int
    user_id: int
    type: str
    title: str
    message: str
    link: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- Team Message Schemas ---
class TeamMessageBase(BaseModel):
    message: str

class TeamMessageCreate(TeamMessageBase):
    pass

class TeamMessageResponse(TeamMessageBase):
    id: int
    team_id: int
    user_id: int
    created_at: datetime
    user: UserResponse

    class Config:
        from_attributes = True
