from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from api import auth, profiles, hackathons, teams, requests, stats, notifications, admin


from core.config import settings

app = FastAPI(title="HackMate API", description="API for Vasavi College Hackathon Team Finder")

# Parse CORS origins
if settings.CORS_ORIGINS == "*":
    origins = ["*"]
else:
    origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(profiles.router, prefix="/api/profiles", tags=["Profiles"])
app.include_router(hackathons.router, prefix="/api/hackathons", tags=["Hackathons"])
app.include_router(teams.router, prefix="/api/teams", tags=["Teams"])
app.include_router(requests.router, prefix="/api/requests", tags=["Join Requests"])
app.include_router(stats.router, prefix="/api/stats", tags=["Stats"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])

@app.get("/")
def read_root():
    return {"message": "Welcome to HackMate API"}
