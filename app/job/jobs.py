from log import logger

def run_job_func(job_name, job_func):
    logger.info(f"Running job '{job_name}'")
    try:
        job_func()
    except Exception as e:
        logger.exception(f"Job failed with exception: {e}")
    logger.info(f"Job '{job_name}' completed")
