"""Task Integration Tests."""

import logging
from unittest.mock import MagicMock, patch

import pytest


@pytest.mark.asyncio
async def test_email_task_configuration_validation():
    """Test email task with missing SMTP configuration."""
    from pm.tasks.actions.send_email import task_send_email

    with patch('pm.tasks.actions.send_email.CONFIG') as mock_config:
        # Test with missing SMTP_HOST - should return early without error
        mock_config.SMTP_HOST = None

        # Task should complete without error (early return)
        task_send_email(
            recipients=['test@example.com'],
            subject='Test',
            body='Test body',
        )


@pytest.mark.asyncio
async def test_pararam_task_configuration_validation():
    """Test Pararam task with missing bot token."""
    from pm.tasks.actions.send_pararam_message import task_send_pararam_message

    with patch('pm.tasks.actions.send_pararam_message.CONFIG') as mock_config:
        # Test with missing bot token - should return early without error
        mock_config.PARARAM_NOTIFICATION_BOT_TOKEN = None

        # Task should complete without error (early return)
        task_send_pararam_message(user_email='test@example.com', message='Test message')


@pytest.mark.asyncio
async def test_email_task_smtp_authentication_error():
    """Test SMTP authentication error handling."""
    import smtplib

    from pm.tasks.actions.send_email import task_send_email

    with (
        patch('pm.tasks.actions.send_email.CONFIG') as mock_config,
        patch('pm.tasks.actions.send_email.smtplib.SMTP') as mock_smtp_class,
    ):
        # Configure valid SMTP settings
        mock_config.SMTP_HOST = 'smtp.example.com'
        mock_config.SMTP_PORT = 587
        mock_config.SMTP_LOGIN = 'user@example.com'
        mock_config.SMTP_PASSWORD = 'wrong-password'  # nosec: S105  # noqa: S105
        mock_config.SMTP_SENDER = 'sender@example.com'
        mock_config.SMTP_SSL_MODE = None

        # Mock SMTP to raise authentication error
        mock_smtp = MagicMock()
        mock_smtp_class.return_value = mock_smtp
        mock_smtp.login.side_effect = smtplib.SMTPAuthenticationError(
            535,
            'Authentication failed',
        )

        # Task should raise the authentication error (no retry for auth failures)
        with pytest.raises(smtplib.SMTPAuthenticationError):
            task_send_email(
                recipients=['test@example.com'],
                subject='Auth Test',
                body='Test body',
            )

        # Verify SMTP was attempted
        mock_smtp_class.assert_called_once()
        mock_smtp.login.assert_called_once()


@pytest.mark.asyncio
async def test_email_task_smtp_server_disconnected():
    """Test SMTP server disconnection error handling."""
    import smtplib

    from pm.tasks.actions.send_email import task_send_email

    with (
        patch('pm.tasks.actions.send_email.CONFIG') as mock_config,
        patch('pm.tasks.actions.send_email.smtplib.SMTP') as mock_smtp_class,
    ):
        # Configure valid SMTP settings
        mock_config.SMTP_HOST = 'smtp.example.com'
        mock_config.SMTP_PORT = 587
        mock_config.SMTP_LOGIN = 'user@example.com'
        mock_config.SMTP_PASSWORD = 'password'  # nosec: S105  # noqa: S105
        mock_config.SMTP_SENDER = 'sender@example.com'
        mock_config.SMTP_SSL_MODE = None

        # Mock SMTP to raise server disconnected error
        mock_smtp = MagicMock()
        mock_smtp_class.return_value = mock_smtp
        mock_smtp.sendmail.side_effect = smtplib.SMTPServerDisconnected(
            'Connection lost',
        )

        # Task should raise the disconnection error (will be retried by taskiq)
        with pytest.raises(smtplib.SMTPServerDisconnected):
            task_send_email(
                recipients=['test@example.com'],
                subject='Disconnect Test',
                body='Test body',
            )


@pytest.mark.asyncio
async def test_pararam_task_with_valid_token():
    """Test Pararam task with valid configuration."""
    from pm.tasks.actions.send_pararam_message import task_send_pararam_message

    with (
        patch('pm.tasks.actions.send_pararam_message.CONFIG') as mock_config,
        patch('pm.tasks.actions.send_pararam_message.PararamioBot') as mock_bot_class,
    ):
        # Configure valid token
        mock_config.PARARAM_NOTIFICATION_BOT_TOKEN = 'valid-test-token'  # nosec: S105  # noqa: S105
        mock_bot = MagicMock()
        mock_bot_class.return_value = mock_bot

        # Execute task
        task_send_pararam_message(
            user_email='test@example.com',
            message='Test notification',
        )

        # Verify bot was created and method was called
        mock_bot_class.assert_called_once_with('valid-test-token')
        mock_bot.post_private_message_by_user_email.assert_called_once_with(
            'test@example.com',
            'Test notification',
        )


@pytest.mark.asyncio
async def test_pararam_task_api_error():
    """Test Pararam task when API call fails."""
    from pm.tasks.actions.send_pararam_message import task_send_pararam_message

    with (
        patch('pm.tasks.actions.send_pararam_message.CONFIG') as mock_config,
        patch('pm.tasks.actions.send_pararam_message.PararamioBot') as mock_bot_class,
    ):
        # Configure valid token
        mock_config.PARARAM_NOTIFICATION_BOT_TOKEN = 'valid-test-token'  # nosec: S105  # noqa: S105
        mock_bot = MagicMock()
        mock_bot_class.return_value = mock_bot

        # Make API call raise exception
        mock_bot.post_private_message_by_user_email.side_effect = Exception('API Error')

        # Task should raise the API error (will be retried by taskiq)
        with pytest.raises(Exception, match='API Error'):
            task_send_pararam_message(
                user_email='test@example.com',
                message='Test message',
            )

        # Verify bot was created and method was called despite error
        mock_bot_class.assert_called_once_with('valid-test-token')
        mock_bot.post_private_message_by_user_email.assert_called_once()


@pytest.mark.asyncio
async def test_task_broker_configuration_validation():
    """Test broker configuration validation."""
    with patch('pm.tasks.app.CONFIG') as mock_config:
        # Test with invalid broker URL
        mock_config.TASKS_BROKER_URL = 'invalid://invalid:1234'

        # Should raise ValueError for invalid URL
        def _create_broker():
            from pm.tasks.app import create_broker

            create_broker()

        with pytest.raises(ValueError, match='Only AMQP URLs are supported'):
            _create_broker()


@pytest.mark.asyncio
async def test_broker_missing_url():
    """Test broker behavior with missing URL."""
    with patch('pm.tasks.app.CONFIG') as mock_config:
        # Set empty broker URL
        mock_config.TASKS_BROKER_URL = ''

        # Should raise ValueError for missing URL
        def _create_broker():
            from pm.tasks.app import create_broker

            create_broker()

        with pytest.raises(ValueError, match='TASKS_BROKER_URL must be configured'):
            _create_broker()


@pytest.mark.asyncio
async def test_task_logging_behavior():
    """Test that tasks properly log their operations."""
    from pm.tasks.actions.send_pararam_message import task_send_pararam_message

    with (
        patch('pm.tasks.actions.send_pararam_message.CONFIG') as mock_config,
        patch('pm.tasks.actions.send_pararam_message.PararamioBot') as _mock_bot_class,
        patch.object(
            logging.getLogger('pm.tasks.actions.send_pararam_message'),
            'warning',
        ) as mock_log,
    ):
        # Test with missing token (should log warning)
        mock_config.PARARAM_NOTIFICATION_BOT_TOKEN = ''  # nosec: S105

        task_send_pararam_message(user_email='test@example.com', message='Logging test')

        # Verify warning was logged
        mock_log.assert_called_once_with(
            'Pararam notification bot token not configured, skipping message',
        )


@pytest.mark.asyncio
async def test_email_task_with_attachments():
    """Test email task with attachments."""
    from base64 import b64encode

    from pm.tasks.actions.send_email import task_send_email

    with (
        patch('pm.tasks.actions.send_email.CONFIG') as mock_config,
        patch('pm.tasks.actions.send_email.smtplib.SMTP') as mock_smtp_class,
    ):
        # Configure valid SMTP settings
        mock_config.SMTP_HOST = 'smtp.example.com'
        mock_config.SMTP_PORT = 587
        mock_config.SMTP_LOGIN = 'user@example.com'
        mock_config.SMTP_PASSWORD = 'password'  # nosec: S105  # noqa: S105
        mock_config.SMTP_SENDER = 'sender@example.com'
        mock_config.SMTP_SSL_MODE = None

        # Mock successful SMTP
        mock_smtp = MagicMock()
        mock_smtp_class.return_value = mock_smtp

        # Test with attachments
        attachments = {'test.txt': b64encode(b'test content').decode('utf-8')}

        task_send_email(
            recipients=['test@example.com'],
            subject='Attachment Test',
            body='Test with attachment',
            attachments=attachments,
        )

        # Verify SMTP operations were called
        mock_smtp.sendmail.assert_called_once()
        call_args = mock_smtp.sendmail.call_args
        message_content = call_args[0][2]  # Third argument is the message

        # Verify attachment is in the message
        assert 'test.txt' in message_content
        assert 'Content-Disposition: attachment' in message_content
