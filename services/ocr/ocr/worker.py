from typing import Annotated

import aioboto3
import easyocr
from aiofiles.tempfile import NamedTemporaryFile
from taskiq import Context, TaskiqDepends, TaskiqEvents, TaskiqState
from taskiq_nats import NATSObjectStoreResultBackend, PullBasedJetStreamBroker

from ocr.config import CONFIG
from ocr.constants import IMAGE_TYPES

result_backend: 'NATSObjectStoreResultBackend[str | None]' = (
    NATSObjectStoreResultBackend(
        servers=CONFIG.NATS.SERVERS,
        bucket_name=CONFIG.NATS.RESULTS_BUCKET,
    )
)
broker = PullBasedJetStreamBroker(
    servers=CONFIG.NATS.SERVERS,
    queue=CONFIG.NATS.QUEUE,
).with_result_backend(result_backend)


@broker.on_event(TaskiqEvents.WORKER_STARTUP)
async def startup(state: TaskiqState) -> None:
    state.ocr_reader = easyocr.Reader(
        CONFIG.LANGUAGES,
        gpu=CONFIG.USE_GPU,
        model_storage_directory=CONFIG.MODELS_DIR,
        user_network_directory=CONFIG.MODELS_DIR,
    )
    state.s3_session = aioboto3.Session(
        aws_access_key_id=CONFIG.S3.ACCESS_KEY_ID,
        aws_secret_access_key=CONFIG.S3.SECRET_ACCESS_KEY,
        region_name=CONFIG.S3.REGION,
    )


@broker.task(task_name='ocr::recognize')
async def ocr_recognize(
    filepath: str,
    context: Annotated[Context, TaskiqDepends()],
) -> str | None:
    async with NamedTemporaryFile(mode='wb', delete_on_close=False) as temp_file:
        async with context.state.s3_session.client(
            's3',
            endpoint_url=CONFIG.S3.ENDPOINT_URL,
            verify=CONFIG.S3.VERIFY,
        ) as s3_client:
            head = await s3_client.head_object(Bucket=CONFIG.S3.BUCKET, Key=filepath)
            if head.get('ContentType') not in IMAGE_TYPES:
                return None
            await s3_client.download_fileobj(
                Bucket=CONFIG.S3.BUCKET, Key=filepath, Fileobj=temp_file
            )
        await temp_file.close()
        results = context.state.ocr_reader.readtext(temp_file.name)
        return ' '.join([text for _, text, __ in results])
