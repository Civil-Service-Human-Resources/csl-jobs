import Notifier
import requests


class SlackNotifier(Notifier):

    def __init__(self, webhook_url) -> None:
        self.webhook_url = webhook_url

    def notify(self, message):
        requests.post(self.webhook_url, json={
            "text": message
        })
