import azure.functions as func
import os
from app.job import tokens

app = func.FunctionApp()
DUPLICATE_TOKEN_CRON = os.environ['DUPLICATE_TOKEN_CRON']
REDUNDANT_TOKEN_CRON = os.environ['REDUNDANT_TOKEN_CRON']


@app.timer_trigger(schedule=DUPLICATE_TOKEN_CRON, arg_name="myTimer", run_on_startup=True)
def DuplicateTokens(myTimer: func.TimerRequest) -> None:
    tokens.run_clear_duplicate_tokens()


@app.timer_trigger(schedule=REDUNDANT_TOKEN_CRON, arg_name="myTimer", run_on_startup=False)
def RedundantTokens(myTimer: func.TimerRequest) -> None:
    tokens.run_clear_redundant_tokens()


@app.route(route="HttpTrigger", auth_level=func.AuthLevel.ANONYMOUS)
def HttpTrigger(req: func.HttpRequest) -> func.HttpResponse:

    name = req.params.get('name')
    if not name:
        try:
            req_body = req.get_json()
        except ValueError:
            pass
        else:
            name = req_body.get('name')

    if name:
        return func.HttpResponse(f"Hello, {name}. This HTTP triggered function executed successfully.")
    else:
        return func.HttpResponse(
             "This HTTP triggered function executed successfully. Pass a name in the query string or in the request body for a personalized response.",
             status_code=200
        )