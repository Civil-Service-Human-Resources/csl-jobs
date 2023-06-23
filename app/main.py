import argparse
from app.jobs.tokens import clear_duplicate_tokens, clear_redundant_tokens


def run():
    args = format_args()
    run_commands(args)


def format_args():
    parser = argparse.ArgumentParser()

    sub_parsers = parser.add_subparsers(dest="job")

    sub_parsers.add_parser(
        "clear_duplicate_tokens", help="Clear duplicate auth tokens in the database"
    )
    sub_parsers.add_parser(
        "delete_redundant_tokens", help="Clear redundant auth tokens in the database"
    )

    return parser.parse_args()


def run_commands(args):
    if args.job == "clear_duplicate_tokens":
        clear_duplicate_tokens()
    elif args.job == "delete_redundant_tokens":
        clear_redundant_tokens()


if __name__ == "__main__":
    run()
