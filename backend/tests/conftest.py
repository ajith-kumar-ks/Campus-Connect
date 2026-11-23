import pytest

from fastapi.testclient import TestClient

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.main import app
from backend.app.db.session import Base
from backend.app.db.dependencies import get_db

# Import models so SQLAlchemy registers their tables with Base.metadata
from backend.app.models.user import User
from backend.app.models.club import Club
from backend.app.models.club_membership import ClubMembership
from backend.app.models.event import Event
from backend.app.models.registration import Registration


@pytest.fixture
def test_engine():

    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )

    Base.metadata.create_all(bind=engine)

    yield engine

    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture
def db_session(test_engine):

    TestingSessionLocal = sessionmaker(
        bind=test_engine,
        autocommit=False,
        autoflush=False
    )

    db = TestingSessionLocal()

    yield db

    db.close()


@pytest.fixture
def client(db_session):

    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.pop(get_db, None)