import azure.functions as func
import os
from app.job import tokens

bp = func.Blueprint()
DUPLICATE_TOKEN_CRON = os.environ['DUPLICATE_TOKEN_CRON']
REDUNDANT_TOKEN_CRON = os.environ['REDUNDANT_TOKEN_CRON']


@bp.timer_trigger(schedule=DUPLICATE_TOKEN_CRON, arg_name="myTimer", run_on_startup=True)
def DuplicateTokens(myTimer: func.TimerRequest) -> None:
    tokens.run_clear_duplicate_tokens()


@bp.timer_trigger(schedule=REDUNDANT_TOKEN_CRON, arg_name="myTimer", run_on_startup=False)
def RedundantTokens(myTimer: func.TimerRequest) -> None:
    tokens.run_clear_redundant_tokens()
