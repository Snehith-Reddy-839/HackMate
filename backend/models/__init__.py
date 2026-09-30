from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, Text, Enum
from sqlalchemy.orm import relationship
import enum
from datetime import datetime
from database import Base

class RoleEnum(str, enum.Enum):
    STUDENT = "student"
    ADMIN = "admin"

class JoinRequestStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String, default=RoleEnum.STUDENT)
    avatar = Column(String, nullable=True) # animal:panda, animal:fox, or data:/url
    roll_number = Column(String, unique=True, index=True, nullable=True)
    branch = Column(String, nullable=True)
    year = Column(Integer, nullable=True)
    section = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    profile = relationship("StudentProfile", back_populates="user", uselist=False)
    teams_created = relationship("Team", back_populates="leader")
    team_memberships = relationship("TeamMember", back_populates="student")
    join_requests = relationship("JoinRequest", back_populates="student")
    notifications = relationship("Notification", back_populates="user")


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    avatar = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    
    # Technical Profile
    skills = Column(String, nullable=True) # Stored as comma-separated
    technologies = Column(String, nullable=True) # Stored as comma-separated
    languages = Column(String, nullable=True)
    frameworks = Column(String, nullable=True)
    tools = Column(String, nullable=True)
    skills_proficiency = Column(Text, nullable=True) # JSON: {"Python": "Advanced", "React": "Intermediate"}
    
    github = Column(String, nullable=True)
    linkedin = Column(String, nullable=True)
    portfolio = Column(String, nullable=True)
    leetcode_link = Column(String, nullable=True)
    certifications = Column(Text, nullable=True)
    courses = Column(Text, nullable=True)
    
    # Hackathon & Project Experience
    experience = Column(Text, nullable=True)
    hackathon_experience = Column(Integer, default=0)
    hackathons_history = Column(Text, nullable=True) # JSON: [{name, year, role, result, project_link}]
    projects = Column(Text, nullable=True)
    projects_list = Column(Text, nullable=True) # JSON: [{title, description, tech, github, demo, contribution}]
    achievements = Column(Text, nullable=True)
    
    # Availability & Team Preferences
    availability = Column(String, nullable=True) # Full-time, Most of the day, Evenings only, Weekends, Custom
    preferred_roles = Column(String, nullable=True) # Frontend, Backend, AI/ML, UI/UX, etc.
    working_style = Column(String, nullable=True)
    communication_pref = Column(String, nullable=True)
    
    # Privacy
    phone = Column(String, nullable=True)
    show_phone = Column(Boolean, default=False)

    user = relationship("User", back_populates="profile")


class Hackathon(Base):
    __tablename__ = "hackathons"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    organizer = Column(String)
    description = Column(Text)
    registration_deadline = Column(DateTime)
    event_date = Column(DateTime)
    location = Column(String)
    mode = Column(String) # Online / Offline / Hybrid
    team_size_min = Column(Integer, default=1)
    team_size_max = Column(Integer, default=6)
    prize = Column(String, nullable=True)
    official_url = Column(String, nullable=True)
    status = Column(String, default="Upcoming") # Upcoming, Registration Open, Completed


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    hackathon_name = Column(String)
    leader_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, index=True)
    description = Column(Text)
    max_members = Column(Integer)
    requirements = Column(Text)
    
    # Enhanced recruitment criteria
    looking_for_roles = Column(String, nullable=True) # Comma-separated roles
    required_skills = Column(String, nullable=True) # Comma-separated skills
    availability_requirements = Column(String, nullable=True)
    
    recruitment_status = Column(String, default="Open") # Open, Closed
    created_at = Column(DateTime, default=datetime.utcnow)

    leader = relationship("User", back_populates="teams_created")
    members = relationship("TeamMember", back_populates="team")
    join_requests = relationship("JoinRequest", back_populates="team")


class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"))
    student_id = Column(Integer, ForeignKey("users.id"))
    role = Column(String, nullable=True)
    joined_at = Column(DateTime, default=datetime.utcnow)

    team = relationship("Team", back_populates="members")
    student = relationship("User", back_populates="team_memberships")


class JoinRequest(Base):
    __tablename__ = "join_requests"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"))
    student_id = Column(Integer, ForeignKey("users.id"))
    
    # Enhanced application payload
    preferred_role = Column(String, nullable=True)
    role = Column(String, nullable=True) # alias/specific applied role
    skills = Column(String, nullable=True)
    technologies = Column(String, nullable=True)
    experience_summary = Column(Text, nullable=True)
    relevant_projects = Column(Text, nullable=True)
    github = Column(String, nullable=True)
    portfolio = Column(String, nullable=True)
    availability = Column(String, nullable=True)
    why_join = Column(Text, nullable=True)
    contribution = Column(Text, nullable=True)
    message = Column(Text, nullable=True)
    
    status = Column(String, default=JoinRequestStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    team = relationship("Team", back_populates="join_requests")
    student = relationship("User", back_populates="join_requests")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    type = Column(String) # e.g., "join_request", "accepted", "rejected", "team_full", "recruitment_closed"
    title = Column(String)
    message = Column(Text)
    link = Column(String, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")


class TeamMessage(Base):
    __tablename__ = "team_messages"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    team = relationship("Team", backref="messages")
    user = relationship("User", backref="messages")
