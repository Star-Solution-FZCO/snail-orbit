from typing import TYPE_CHECKING, Any, Self

from taskiq_nats import NATSObjectStoreResultBackend, PullBasedJetStreamBroker

if TYPE_CHECKING:
    from taskiq import TaskiqResult

__all__ = ('OCRClient',)

OCR_TIMEOUT = 2 * 60


class OCRClient:
    _broker: PullBasedJetStreamBroker

    def __init__(self, servers: list[str], queue: str, results_bucket: str):
        result_backend: NATSObjectStoreResultBackend[str | None] = (
            NATSObjectStoreResultBackend(
                servers=servers,
                bucket_name=results_bucket,
            )
        )
        self._broker = PullBasedJetStreamBroker(
            servers=servers,
            queue=queue,
        ).with_result_backend(result_backend)

        # pylint:disable=unused-argument
        async def ocr_recognize(filepath: str) -> str | None: ...

        self.ocr_recognize = self._broker.register_task(
            ocr_recognize,
            task_name='ocr::recognize',
        )

    async def startup(self) -> None:
        await self._broker.startup()

    async def shutdown(self) -> None:
        await self._broker.shutdown()

    async def process_image(self, file_path: str) -> str | None:
        task = await self.ocr_recognize.kiq(file_path)
        result: TaskiqResult[str | None] = await task.wait_result(timeout=OCR_TIMEOUT)
        if not result.is_err:
            return result.return_value
        return None

    async def __aenter__(self) -> Self:
        await self.startup()
        return self

    async def __aexit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        await self.shutdown()
