from sqlalchemy.orm import Session
from database import engine, SessionLocal
import models
from core import security
from datetime import datetime, timedelta

def seed_db():
    # Create tables (already handled by alembic, but harmless if exists)
    models.Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # Check if we already have data
    if db.query(models.User).count() > 0:
        print("Database already seeded.")
        return
        
    print("Seeding database...")
    
    # 1. Create Users
    admin_pw = security.get_password_hash("admin123")
    student_pw = security.get_password_hash("student123")
    
    admin = models.User(
        name="Admin User", email="admin@vce.ac.in", password_hash=admin_pw, role=models.RoleEnum.ADMIN
    )
    db.add(admin)
    
    s1 = models.User(
        name="Snehith Reddy", email="snehith@vce.ac.in", password_hash=student_pw, roll_number="1602-21-733-101", branch="CSE", year=2, section="B"
    )
    s2 = models.User(
        name="Priya Sharma", email="priya@vce.ac.in", password_hash=student_pw, roll_number="1602-21-733-102", branch="IT", year=2, section="A"
    )
    s3 = models.User(
        name="Rahul Verma", email="rahul@vce.ac.in", password_hash=student_pw, roll_number="1602-21-733-103", branch="ECE", year=3, section="C"
    )
    db.add_all([s1, s2, s3])
    db.commit()
    
    # Profiles
    p1 = models.StudentProfile(user_id=s1.id, skills="Python, React, FastAPI, ML", projects="HemoScan AI, HackMate")
    p2 = models.StudentProfile(user_id=s2.id, skills="Figma, UI/UX, HTML, CSS", projects="Portfolio")
    p3 = models.StudentProfile(user_id=s3.id, skills="Node.js, Express, MongoDB", projects="E-commerce backend")
    db.add_all([p1, p2, p3])
    db.commit()

    # 2. Create Hackathons
    now = datetime.utcnow()
    h1 = models.Hackathon(
        name="Smart India Hackathon 2026",
        organizer="MoE",
        description="National level hackathon for students.",
        registration_deadline=now + timedelta(days=10),
        event_date=now + timedelta(days=20),
        location="Hyderabad",
        mode="Offline",
        team_size_min=4,
        team_size_max=6,
        status="Registration Open"
    )
    h2 = models.Hackathon(
        name="Vasavi TechFest Hackathon",
        organizer="VCE CSE Dept",
        description="Internal college hackathon.",
        registration_deadline=now + timedelta(days=2),
        event_date=now + timedelta(days=5),
        location="VCE Campus",
        mode="Offline",
        team_size_min=2,
        team_size_max=4,
        status="Registration Open"
    )
    db.add_all([h1, h2])
    db.commit()

    # 3. Create Teams
    t1 = models.Team(
        hackathon_name=h1.name,
        leader_id=s1.id,
        name="Team Phoenix",
        description="Building AI solutions for healthcare.",
        max_members=6,
        requirements="Python, React, Basic ML",
        recruitment_status="Open"
    )
    db.add(t1)
    db.commit()
    
    tm1 = models.TeamMember(team_id=t1.id, student_id=s1.id, role="Team Leader")
    db.add(tm1)
    db.commit()
    
    # 4. Create Join Requests
    req1 = models.JoinRequest(
        team_id=t1.id,
        student_id=s2.id,
        message="I can do UI/UX for the team.",
        skills="Figma, UI/UX",
        preferred_role="Designer",
        status=models.JoinRequestStatus.PENDING
    )
    db.add(req1)
    db.commit()
    
    print("Database seeding completed.")

if __name__ == "__main__":
    seed_db()
