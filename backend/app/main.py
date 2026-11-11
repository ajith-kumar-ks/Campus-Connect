from fastapi import FastAPI

from backend.app.db.session import engine
from backend.app.models.user import User, Base

app = FastAPI(
    title='Campus-Connect API',
    description="College Event and Club Management Platform",
    version="1.0.0"
)

Base.metadata.create_all(engine)

@app.get('/api/v1/health')
def health_check():
    return {
        "status": "healthy",
        "message": "CampusConnect API is running!"
    }
