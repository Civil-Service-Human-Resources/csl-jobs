from config import APPLICATIONINSIGHTS_CONNECTION_STRING
import logging

logging.basicConfig(format='{"timestamp":"%(asctime)s", "level":"%(levelname)s", "message":"%(message)s"}', level="INFO")
logger = logging.getLogger()

if APPLICATIONINSIGHTS_CONNECTION_STRING:
    from opencensus.ext.azure.log_exporter import AzureLogHandler
    logger.addHandler(AzureLogHandler())
