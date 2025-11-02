# Snail Orbit OCR Service

OCR (Optical Character Recognition) microservice for the Snail Orbit project. Extracts text from images using EasyOCR and integrates with the main application through NATS message queue.

## Features

- Text extraction from JPEG, PNG, and BMP images
- S3-compatible storage integration (MinIO/AWS S3)
- NATS JetStream message queue with result backend
- Async task processing with Taskiq
- GPU acceleration support (optional)
- Multi-language OCR support
- Docker containerized deployment

## Quick Start

### Development Setup

1. Install dependencies:
```bash
uv sync
```

2. Configure the service by creating `settings.toml` (only ACCESS_KEY_ID and SECRET_ACCESS_KEY are required):
```toml
[S3]
ACCESS_KEY_ID = "your-access-key"    # Required
SECRET_ACCESS_KEY = "your-secret-key" # Required
# Optional - defaults shown below
# BUCKET = "snail-orbit"
# ENDPOINT_URL = "http://minio:9000"
# REGION = "us-east-1"
# VERIFY = true
```

3. Run the OCR worker:
```bash
taskiq worker -w 1 --use-process-pool --max-process-pool-processes=1 ocr.worker:broker
```

### Docker Deployment

Build and run the service:
```bash
docker build -f Dockerfile --target ocr -t snail-orbit-ocr .
docker run -v /path/to/config:/app/etc -v /path/to/models:/var/easyocr snail-orbit-ocr
```

## Usage Examples

### Sending OCR Tasks

```python
import asyncio
from taskiq_nats import NATSObjectStoreResultBackend, PullBasedJetStreamBroker

# Configure broker (should match worker configuration)
result_backend = NATSObjectStoreResultBackend(
    servers=['nats://nats:4222'],
    bucket_name='ocr',
)
broker = PullBasedJetStreamBroker(
    servers=['nats://nats:4222'],
    queue='ocr',
).with_result_backend(result_backend)

# Define task stub
@broker.task(task_name='ocr::recognize')
async def ocr_recognize(filepath: str) -> str | None: ...

async def process_image(image_path: str) -> str | None:
    """Send OCR task and wait for result."""
    await broker.startup()
    try:
        task = await ocr_recognize.kiq(image_path)
        result = await task.wait_result()

        if not result.is_err:
            return result.return_value
        else:
            print(f"OCR task failed: {result}")
            return None
    finally:
        await broker.shutdown()

# Usage
extracted_text = await process_image('path/to/image.jpg')
if extracted_text:
    print(f"Extracted text: {extracted_text}")
```

## Configuration

### Environment Variables

All configuration can be set via environment variables with `OCR_` prefix:

- `OCR_USE_GPU=true` - Enable GPU acceleration
- `OCR_MODELS_DIR=/var/easyocr` - Model storage directory
- `OCR_LANGUAGES=["en","fr"]` - Recognition languages
- `OCR_S3__ACCESS_KEY_ID=xxx` - S3 access key
- `OCR_S3__SECRET_ACCESS_KEY=xxx` - S3 secret key
- `OCR_S3__ENDPOINT_URL=http://minio:9000` - S3 endpoint
- `OCR_NATS__SERVERS=["nats://nats:4222"]` - NATS servers

### Supported Languages

EasyOCR supports many languages. Common ones include:
- `en` - English
- `fr` - French
- `de` - German
- `es` - Spanish
- `ru` - Russian
- `zh` - Chinese

## Architecture

The service consists of:

- **Worker** (`ocr/worker.py`): Main Taskiq worker that processes OCR tasks
- **Config** (`ocr/config.py`): Configuration management with validation
- **Constants** (`ocr/constants.py`): Service constants and supported image types

### Task Flow

1. Image is uploaded to S3 storage
2. OCR task is sent via NATS with S3 file path
3. Worker downloads image from S3
4. EasyOCR processes the image
5. Extracted text is returned via NATS result backend

## Development

### Code Quality

```bash
# Linting and formatting
ruff check --fix .
ruff format .

# Type checking
mypy ocr

# Run pylint
pylint ocr
```

### Resource Requirements

- **Memory**: 2GB+ recommended for EasyOCR models
- **Storage**: ~500MB for English models
- **CPU**: Single core sufficient
- **GPU**: Optional CUDA support for faster processing

## Troubleshooting

### Common Issues

1. **S3 Connection**: Verify credentials and endpoint URL
2. **Model Downloads**: Ensure internet access and disk space
3. **Memory**: Increase limits for large images
4. **NATS**: Check server availability

### Debug Commands

```bash
# Check container logs
docker logs <ocr-container>
```

## License

MIT License.
