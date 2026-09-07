import os
from dotenv import load_dotenv

load_dotenv()


def _required_setting(name: str) -> str:
	value = os.getenv(name)
	if not value:
		raise RuntimeError(f"The {name} environment variable is not set")
	return value


DATABASE_URL = _required_setting("database_url")
SECRET_KEY = _required_setting("secret_key")
ALGORITHM = _required_setting("algorithm")
ACCESS_TOKEN_EXPIRE_MINUTES = int(_required_setting("access_token_expire_minutes"))