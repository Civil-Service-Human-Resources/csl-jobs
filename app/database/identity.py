from sqlalchemy import create_engine, text
from config import (
    get_database_connection,
    LOG_DB_TRANSACTIONS,
    DELETE_TOKEN_BATCH_SIZE,
)
from log import logger

__db = create_engine(get_database_connection("identity"), echo=LOG_DB_TRANSACTIONS)

all_tokens = text("select count(*) from token")
all_valid_non_user_tokens = text(
    "select count(*) from token where status = 0 and user_name is null;"
)
all_invalid_non_user_tokens = text(
    "select count(*) from token where status = 1 and user_name is null;"
)
all_valid_user_tokens = text(
    "select count(*) from token where status = 0 and user_name is not null;"
)
all_invalid_user_tokens = text(
    "select count(*) from token where status = 1 and user_name is not null;"
)

DELETE_INVALID_TOKEN_SQL = text(
    f"delete from token where status = 1 limit {DELETE_TOKEN_BATCH_SIZE};"
)
DELETE_VALID_USER_TOKEN_SQL = text(
    f"delete from token where status = 0 and user_name is not null limit {DELETE_TOKEN_BATCH_SIZE};"
)

def get_duplicate_tokens():
    stmt = text(
        """
        SELECT authentication_id, client_id
        FROM token
        WHERE status COLLATE utf8_unicode_ci = 0
        GROUP BY authentication_id
        HAVING COUNT(*) > 1;
    """
    )
    with __db.connect() as conn:
        result = conn.execute(stmt)
        return result.fetchall()


def deactivate_token(authentication_id):
    stmt = text(
        f"""
        UPDATE token
        SET status = 1
        WHERE authentication_id COLLATE utf8_unicode_ci = '{authentication_id}' AND status COLLATE utf8_unicode_ci = 0;
    """
    )
    with __db.connect() as conn:
        conn.execute(stmt)
        conn.commit()


def run_count_query(sql):
    try:
        logger.info(f"Executing SQL: {sql}")
        with __db.connect() as conn:
            res = conn.execute(sql)
            count_res = res.fetchone()[0]
            logger.info(f"Count: {count_res}")
            return count_res
    except Exception as e:
        logger.error(f"Error counting tokens: {e}")


def delete_tokens(sql, token_count):
    try:
        with __db.connect() as conn:
            while token_count > 0:
                logger.info(
                    f"{token_count} tokens remaining. Deleting {DELETE_TOKEN_BATCH_SIZE}"
                )
                conn.execute(sql)
                conn.commit()
                token_count = token_count - DELETE_TOKEN_BATCH_SIZE

            logger.info("Tokens deleted")

    except Exception as e:
        logger.error(
            f"Failed to delete tokens. Tokens remaining: {token_count}. Exception: {e}"
        )


def count_all_tokens():
    return run_count_query(all_tokens)


def count_all_valid_non_user_tokens():
    return run_count_query(all_valid_non_user_tokens)


def count_all_invalid_non_user_tokens():
    return run_count_query(all_invalid_non_user_tokens)


def count_all_valid_user_tokens():
    return run_count_query(all_valid_user_tokens)


def count_all_invalid_user_tokens():
    return run_count_query(all_invalid_user_tokens)


def delete_invalid_tokens(count):
    delete_tokens(DELETE_INVALID_TOKEN_SQL, count)


def delete_valid_tokens(count):
    delete_tokens(DELETE_VALID_USER_TOKEN_SQL, count)
