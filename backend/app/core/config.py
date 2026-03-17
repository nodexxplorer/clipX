from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "ClipX Movie API"
    API_V1_STR: str = "/api"
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
    ]
    
    # Moviebox API config
    MOVIEBOX_HOST: str = "movieboxapp.in"
    BASE_URL: str = "http://localhost:8000"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

settings = Settings()
