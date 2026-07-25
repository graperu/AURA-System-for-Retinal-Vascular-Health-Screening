from pydantic_settings import BaseSettings, SettingsConfigDict
class Settings(BaseSettings):
    app_name: str = "AURA AI Core"
    model_version: str = "mock-v1"
    internal_api_key: str = ""
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
settings = Settings()
