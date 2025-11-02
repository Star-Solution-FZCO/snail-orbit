from dynaconf import Dynaconf, Validator

from ocr.constants import CONFIG_PATHS

__all__ = ('CONFIG',)

CONFIG = Dynaconf(
    settings_files=CONFIG_PATHS,
    environments=True,
    envvar_prefix='OCR',
    load_dotenv=True,
    validators=[
        Validator('USE_GPU', is_type_of=bool, default=False),
        Validator('MODELS_DIR', is_type_of=str, default='/var/easyocr'),
        Validator('LANGUAGES', is_type_of=list, default=['en']),
        Validator('NATS.SERVERS', is_type_of=list, default=['nats://nats:4222']),
        Validator('NATS.RESULTS_BUCKET', is_type_of=str, default='ocr'),
        Validator('NATS.QUEUE', is_type_of=str, default='ocr'),
        Validator('S3.ENDPOINT_URL', is_type_of=str, default='http://minio:9000'),
        Validator('S3.ACCESS_KEY_ID', is_type_of=str, required=True),
        Validator('S3.SECRET_ACCESS_KEY', is_type_of=str, required=True),
        Validator('S3.BUCKET', is_type_of=str, default='snail-orbit'),
        Validator('S3.REGION', is_type_of=str, default='us-east-1'),
        Validator('S3.VERIFY', is_type_of=bool, default=True),
    ],
)

CONFIG.configure()
