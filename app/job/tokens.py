from database import identity
from log import logger
from job.jobs import run_job_func


def __clear_duplicate_tokens():
    logger.info("Checking for duplicate tokens")
    tokens = identity.get_duplicate_tokens()
    logger.info(f"Found {len(tokens)} duplicate tokens")
    for token in tokens:
        auth_id = token[0]
        logger.info(f"Deactivating token with auth ID {auth_id}")
        identity.deactivate_token(auth_id)
        logger.info("Token deactivated")
    else:
        logger.info("Not duplicate tokens found")


def __clear_redundant_tokens():
    logger.info("Checking for redundant tokens")
    logger.info("Counting all tokens in token table")
    identity.count_all_tokens()

    logger.info("Counting all valid non-user tokens")
    identity.count_all_valid_non_user_tokens()

    logger.info("Counting all invalid non-user tokens")
    invalid_non_user_token_count = identity.count_all_invalid_non_user_tokens()

    logger.info("Counting all invalid user tokens")
    valid_user_token_count = identity.count_all_valid_user_tokens()

    logger.info("Counting all valid user tokens")
    invalid_user_token_count = identity.count_all_invalid_user_tokens()

    invalid_token_total_count = invalid_non_user_token_count + invalid_user_token_count
    logger.info(f"Total invalid token count: {invalid_token_total_count}")
    if invalid_token_total_count:
        logger.info(f"Deleting invalid tokens ({invalid_token_total_count})")
        identity.delete_invalid_tokens(invalid_token_total_count)

    if valid_user_token_count:
        logger.info(f"Deleting valid user tokens ({valid_user_token_count})")
        identity.delete_valid_tokens(valid_user_token_count)


def run_clear_duplicate_tokens():
    run_job_func("clear duplicate tokens", __clear_duplicate_tokens)


def run_clear_redundant_tokens():
    run_job_func("clear redundant tokens", __clear_redundant_tokens)
