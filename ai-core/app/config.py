from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    service_name: str = "AURA AI Core"
    model_version: str = "mock-retinal-v1"

    model_config = SettingsConfigDict(env_prefix="AI_CORE_")


@lru_cache
def get_settings() -> Settings:
    return Settings()
