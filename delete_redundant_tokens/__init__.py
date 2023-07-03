from app.job import tokens


def main(req):
    tokens.run_clear_redundant_tokens()
