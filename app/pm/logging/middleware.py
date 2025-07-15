import logging
import time
from collections.abc import Awaitable, Callable
from typing import Any

from fastapi import Request, Response

from pm.api.context import current_user
from pm.config import CONFIG
from pm.logging.context import generate_correlation_id, log_context

HTTP_BAD_REQUEST_THRESHOLD = 400

__all__ = (
    'LoggingMiddleware',
    'create_logging_middleware',
)


class LoggingMiddleware:
    def __init__(self, log_requests: bool = True, log_errors: bool = True) -> None:
        self.log_requests = log_requests
        self.log_errors = log_errors
        self.logger = logging.getLogger(__name__)

    async def __call__(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        correlation_id = self._get_correlation_id(request)
        request_info = self._extract_request_info(request)
        context_kwargs = {
            'correlation_id': correlation_id,
            **request_info,
        }
        start_time = time.time()

        with log_context(**context_kwargs):
            try:
                try:
                    user_ctx = getattr(current_user, 'get', lambda: None)()
                    if user_ctx:
                        from pm.logging.context import (  # pylint: disable=import-outside-toplevel
                            set_user_context,
                        )

                        set_user_context(user_ctx.id, user_ctx.email)
                except (AttributeError, ImportError, TypeError):  # nosec B110  # noqa: S110
                    pass

                response = await call_next(request)
                processing_time = time.time() - start_time

                if self.log_requests:
                    processing_time_ms = round(processing_time * 1000, 2)
                    client_ip = self._get_client_ip(request)
                    message = f'{request.method} {request.url.path} {response.status_code} ({processing_time_ms}ms) [{client_ip}]'

                    if response.status_code >= HTTP_BAD_REQUEST_THRESHOLD:
                        self.logger.warning(message)
                    else:
                        self.logger.info(message)

                response.headers['X-Correlation-ID'] = correlation_id
                return response

            except Exception as exc:
                processing_time = time.time() - start_time

                if self.log_errors:
                    processing_time_ms = round(processing_time * 1000, 2)
                    client_ip = self._get_client_ip(request)
                    message = f'{request.method} {request.url.path} failed with {type(exc).__name__} ({processing_time_ms}ms) [{client_ip}]'
                    self.logger.exception(message, exc_info=exc)

                raise

    def _get_correlation_id(self, request: Request) -> str:
        return (
            request.headers.get('X-Correlation-ID')
            or request.headers.get('X-Trace-ID')
            or generate_correlation_id()
        )

    def _extract_request_info(self, request: Request) -> dict[str, Any]:
        return {
            'request_method': request.method,
            'request_path': str(request.url.path),
            'client_ip': self._get_client_ip(request),
        }

    def _get_client_ip(self, request: Request) -> str:
        for header in ['X-Forwarded-For', 'X-Real-IP', 'CF-Connecting-IP']:
            ip = request.headers.get(header)
            if ip:
                return ip.split(',')[0].strip()
        return request.client.host if request.client else 'unknown'


def create_logging_middleware() -> LoggingMiddleware:
    log_requests = CONFIG.DEV_MODE or getattr(CONFIG, 'LOG_REQUESTS', True)
    log_errors = getattr(CONFIG, 'LOG_ERRORS', True)

    return LoggingMiddleware(
        log_requests=log_requests,
        log_errors=log_errors,
    )
