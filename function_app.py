import azure.functions as func
from timer_blueprints import bp

app = func.FunctionApp()

app.register_functions(bp)
