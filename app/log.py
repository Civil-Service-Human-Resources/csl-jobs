from config import APPLICATIONINSIGHTS_CONNECTION_STRING, WEBSITE_CLOUD_ROLENAME
import logging

logging.basicConfig(format='{"timestamp":"%(asctime)s", "level":"%(levelname)s", "message":"%(message)s"}', level="INFO")
logger = logging.getLogger()

if APPLICATIONINSIGHTS_CONNECTION_STRING and WEBSITE_CLOUD_ROLENAME:
    from opencensus.ext.azure.log_exporter import AzureLogHandler

    def envelope_callback(envelope):
        envelope.tags['ai.cloud.role'] = WEBSITE_CLOUD_ROLENAME
    azure_log_handler = AzureLogHandler()
    azure_log_handler.add_telemetry_processor(envelope_callback)
    logger.addHandler(azure_log_handler)
