import logging

logging.basicConfig(format='{"timestamp":"%(asctime)s", "level":"%(levelname)s", "message":"%(message)s"}', level="INFO")
logger = logging.getLogger()
