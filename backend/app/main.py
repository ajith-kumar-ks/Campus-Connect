
from fastapi import FastAPI

from backend.app.db.session import engine, Base

from backend.app.models.user import User
from backend.app.models.club import Club
from backend.app.models.club_membership import ClubMembership
from backend.app.models.event import Event
from backend.app.models.registration import Registration

from backend.app.routers.auth import router as auth_router
from backend.app.routers.users import router as users_router
from backend.app.routers.clubs import router as clubs_router
from backend.app.routers.events import router as event_router
from backend.app.routers.registration import router as registration_router



app = FastAPI(
    title="CampusConnect API",
    description="College Event and Club Management Platform",
    version="1.0.0"
)

# Temporary table creation during initial development
Base.metadata.create_all(bind=engine)

# Register routers
app.include_router(
    auth_router,
    prefix="/api/v1"
)
app.include_router(
    users_router,
    prefix="/api/v1"
)

app.include_router(
    clubs_router,
    prefix='/api/v1'
)

app.include_router(
    event_router,
    prefix='/api/v1'
)

app.include_router(
    registration_router,
    prefix='/api/v1'
)



@app.get("/api/v1/health", tags=["Health"])
def health_check():

    return {
        "status": "healthy",
        "message": "CampusConnect API is running!"
    }
