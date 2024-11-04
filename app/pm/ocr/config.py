from dynaconf import Dynaconf, Validator

from pm.constants import CONFIG_PATHS

__all__ = ('OCR_CONFIG',)

OCR_CONFIG = Dynaconf(
    settings_files=CONFIG_PATHS,
    environments=True,
    load_dotenv=True,
    validators=[
        Validator('OCR_USE_GPU', is_type_of=bool, default=False),
        Validator('OCR_MODELS_DIR', is_type_of=str, default='/var/easyocr'),
    ],
)

OCR_CONFIG.configure()
