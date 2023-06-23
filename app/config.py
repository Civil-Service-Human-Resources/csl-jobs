from dotenv import load_dotenv
from app.log import logger
import os

load_dotenv()

APPLICATIONINSIGHTS_CONNECTION_STRING = os.getenv("APPLICATIONINSIGHTS_CONNECTION_STRING")

__DATABASE_SERVER = os.getenv("DATABASE_SERVER")
__DATABASE_USER = os.getenv("DATABASE_USER")
__DATABASE_PASSWORD = os.getenv("DATABASE_PASSWORD")

LOG_DB_TRANSACTIONS = bool(os.getenv("LOG_DB_TRANSACTIONS", False))
DELETE_TOKEN_BATCH_SIZE = int(os.getenv("DELETE_TOKEN_BATCH_SIZE", 1000))


def get_database_connection(database):
    if __DATABASE_SERVER and __DATABASE_USER and __DATABASE_PASSWORD:
        logger.info("Getting database credentials")
        user_pass = f"{__DATABASE_USER}:{__DATABASE_PASSWORD}"
        return f"mysql://{user_pass}@{__DATABASE_SERVER}/{database}?ssl=true"
    else:
        logger.info("Getting database credentials for in-memory database")
        return "mysql:///:memory:"
