from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Locate the .env file in the project root
BASE_DIR = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):

    APP_NAME: str = "CampusConnect"

    DATABASE_URL: str 

    SECRET_KEY: str

    ALGORITHM: str = "HS256"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


settings = Settings()
