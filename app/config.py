from dotenv import load_dotenv
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
        return f"mysql://{__DATABASE_USER}:{__DATABASE_PASSWORD}@{__DATABASE_SERVER}/{database}?ssl=true"
    else:
        return "mysql:///:memory:"
