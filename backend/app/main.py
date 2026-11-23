
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
from backend.app.routers.participant import router as participant_router
from backend.app.routers.my_registrations import router as my_registrations_router
from backend.app.routers.my_clubs import router as my_clubs_router
from backend.app.routers.student_dashboard import router as student_dashboard_router
from backend.app.routers.organizer_dashboard import router as organizer_dashboard_router
from fastapi.middleware.cors import CORSMiddleware



app = FastAPI(
    title="CampusConnect API",
    description="College Event and Club Management Platform",
    version="1.0.0"
)



app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=False,
    allow_methods=[
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS"
    ],
    allow_headers=[
        "Authorization",
        "Content-Type"
    ]
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


app.include_router(
    participant_router,
    prefix='/api/v1'
)


app.include_router(
    my_registrations_router,
    prefix='/api/v1'
)

app.include_router(
    my_clubs_router,
    prefix='/api/v1'
)

app.include_router(
    student_dashboard_router,
    prefix='/api/v1'
)

app.include_router(
    organizer_dashboard_router,
    prefix='/api/v1'
)

@app.get("/api/v1/health", tags=["Health"])
def health_check():

    return {
        "status": "healthy",
        "message": "CampusConnect API is running!"
    }
