"""
API logging middleware - request/response logging with context.

Simple middleware that uses pm.logging toolkit for contextual logging.
"""

import logging
import time
from collections.abc import Awaitable, Callable

from fastapi import Request, Response

from pm.api.request_ctx import get_request_context

HTTP_BAD_REQUEST_THRESHOLD = 404


__all__ = ('APILoggingMiddleware', 'create_api_logging_middleware')


class APILoggingMiddleware:
    """Simple API logging middleware using contextual logging."""

    def __init__(self, logger: logging.Logger) -> None:
        """Initialize with a contextual logger."""
        self.logger = logger

    async def __call__(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        client_ip = self._get_client_ip(request)

        start_time = time.time()
        try:
            response = await call_next(request)
            processing_time_ms = round((time.time() - start_time) * 1000, 2)
            request_context = get_request_context(request)
            user_id = request_context.get('user_id')
            url_path = self._get_url_path(request)
            log_message = f'{request.method} {url_path} {response.status_code} ({processing_time_ms}ms) ip={client_ip} user={user_id}'

            if response.status_code >= HTTP_BAD_REQUEST_THRESHOLD:
                self.logger.warning(log_message)
            else:
                self.logger.info(log_message)
            return response

        except Exception:
            processing_time_ms = round((time.time() - start_time) * 1000, 2)
            request_context = get_request_context(request)
            user_id = request_context.get('user_id')
            url_path = self._get_url_path(request)
            error_message = f'{request.method} {url_path} failed ({processing_time_ms}ms) ip={client_ip} user={user_id}'
            self.logger.exception(error_message)
            raise

    @staticmethod
    def _get_client_ip(request: Request) -> str:
        """Extract client IP from request headers."""
        for header in ['X-Forwarded-For', 'X-Real-IP', 'CF-Connecting-IP']:
            ip = request.headers.get(header)
            if ip:
                return ip.split(',')[0].strip()
        return request.client.host if request.client else 'unknown'

    @staticmethod
    def _get_url_path(request: Request) -> str:
        """Get URL path with query parameters, excluding schema and hostname."""
        return request.url.path + (f'?{request.url.query}' if request.url.query else '')


def create_api_logging_middleware(logger_name: str) -> APILoggingMiddleware:
    """Create API logging middleware using existing logger."""
    return APILoggingMiddleware(logging.getLogger(logger_name))
