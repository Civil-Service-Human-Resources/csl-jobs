from typing import List
from Notifier import Notifier
from SlackNotifier import SlackNotifier
from log import logger
from config import SLACK_WEBHOOK

notifiers: List[Notifier] = []


def get_notifiers():
    if not notifiers:
        if SLACK_WEBHOOK:
            logger.debug("Initialising slack notifier client")
            notifiers.append(SlackNotifier(SLACK_WEBHOOK))
    return notifiers


def notify(message):
    [notifier.notify(message) for notifier in get_notifiers()]
