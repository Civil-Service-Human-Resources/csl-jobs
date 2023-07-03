import azure.functions as func
import os
from app.job import tokens

app = func.FunctionApp()
DUPLICATE_TOKEN_CRON = os.environ['DUPLICATE_TOKEN_CRON']
REDUNDANT_TOKEN_CRON = os.environ['REDUNDANT_TOKEN_CRON']


@app.timer_trigger(schedule=DUPLICATE_TOKEN_CRON, arg_name="myTimer", run_on_startup=False)
def DuplicateTokens(myTimer: func.TimerRequest) -> None:
    tokens.run_clear_duplicate_tokens()


@app.timer_trigger(schedule=REDUNDANT_TOKEN_CRON, arg_name="myTimer", run_on_startup=False)
def RedundantTokens(myTimer: func.TimerRequest) -> None:
    tokens.run_clear_redundant_tokens()
