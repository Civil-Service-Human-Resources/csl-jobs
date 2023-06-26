from dotenv import load_dotenv
import os

load_dotenv()

APPLICATIONINSIGHTS_CONNECTION_STRING = os.getenv("APPLICATIONINSIGHTS_CONNECTION_STRING")
WEBSITE_CLOUD_ROLENAME = os.getenv("WEBSITE_CLOUD_ROLENAME")

__DATABASE_SERVER = os.getenv("DATABASE_SERVER")
__DATABASE_USER = os.getenv("DATABASE_USER")
__DATABASE_PASSWORD = os.getenv("DATABASE_PASSWORD")

LOG_DB_TRANSACTIONS = bool(os.getenv("LOG_DB_TRANSACTIONS", False))
DELETE_TOKEN_BATCH_SIZE = int(os.getenv("DELETE_TOKEN_BATCH_SIZE", 1000))


def get_database_connection(database):
    return f"mysql://{__DATABASE_USER}:{__DATABASE_PASSWORD}@{__DATABASE_SERVER}/{database}?ssl=true"
