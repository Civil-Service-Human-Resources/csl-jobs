from app.database import identity
from app.log import logger


def clear_duplicate_tokens():
    logger.info("Checking for duplicate tokens")
    tokens = identity.get_duplicate_tokens()
    logger.info(f"Found {len(tokens)} duplicate tokens")
    print(tokens)
    for token in tokens:
        auth_id = token[0]
        logger.info(f"Deactivating token with auth ID {auth_id}")
        identity.deactivate_token(auth_id)
        logger.info("Token deactivated")


def clear_redundant_tokens():
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
    if invalid_token_total_count:
        logger.info(f"Deleting invalid tokens ({invalid_token_total_count})")
        identity.delete_invalid_tokens(invalid_token_total_count)

    if valid_user_token_count:
        logger.info(f"Deleting valid user tokens ({valid_user_token_count})")
        identity.delete_valid_tokens(valid_user_token_count)
