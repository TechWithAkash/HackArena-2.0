from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://postgres:postgres@localhost:5432/darpanai_db"
    anthropic_api_key: str = ""
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    redis_url: str = "redis://localhost:6379"
    model_path: str = "ml/risk_model.pkl"
    telegram_bot_token: str = ""
    hf_token: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
