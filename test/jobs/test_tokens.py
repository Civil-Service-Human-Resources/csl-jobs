from app.job import tokens
from unittest.mock import patch
import unittest


@patch("app.job.tokens.identity")
class TestTokenJobs(unittest.TestCase):
    def test_clear_duplicate_tokens_empty(self, identity_mock):
        identity_mock.get_duplicate_tokens.return_value = []
        tokens.run_clear_duplicate_tokens()
        self.assertFalse(identity_mock.deactivate_token.called)

    def test_clear_duplicate_tokens(self, identity_mock):
        identity_mock.get_duplicate_tokens.return_value = [("auth_id")]
        tokens.run_clear_duplicate_tokens()
        self.assertTrue(identity_mock.deactivate_token.called)

    def test_clear_redundant_invalid_tokens(self, identity_mock):
        identity_mock.count_all_invalid_non_user_tokens.return_value = 10
        identity_mock.count_all_invalid_user_tokens.return_value = 10
        tokens.run_clear_redundant_tokens()
        self.assertTrue(identity_mock.delete_invalid_tokens.called)

    def test_clear_redundant_valid_tokens(self, identity_mock):
        identity_mock.count_all_valid_user_tokens.return_value = 10
        tokens.run_clear_redundant_tokens()
        self.assertTrue(identity_mock.delete_valid_tokens.called)

    def test_clear_redundant_tokens_no_tokens(self, identity_mock):
        identity_mock.count_all_valid_user_tokens.return_value = 0
        identity_mock.count_all_invalid_non_user_tokens.return_value = 0
        identity_mock.count_all_invalid_user_tokens.return_value = 0
        tokens.run_clear_redundant_tokens()
        self.assertFalse(identity_mock.delete_valid_tokens.called)
        self.assertFalse(identity_mock.delete_invalid_tokens.called)
