from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "ClipX Movie API"
    API_V1_STR: str = "/api"
    CORS_ORIGINS: List[str] = ["*"]
    
    # Moviebox API config
    MOVIEBOX_HOST: str = "h5.aoneroom.com"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

settings = Settings()
