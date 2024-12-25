import io
import random

from PIL import Image, ImageDraw, ImageFont

FONT_NAME = 'MontserratAlt1-Regular.ttf'

__all__ = (
    'resize_image',
    'generate_initials_image',
    'image_to_bytes',
    'bytes_to_image',
)


def resize_image(img: Image.Image, size: int) -> Image.Image:
    result = img.copy()
    result = result.resize((size, size), Image.Resampling.LANCZOS)
    return result


def generate_initials_image(
    name: str,
    size: int,
    background_color_bytes: bytes | None = None,
    mode: str = 'RGBA',
) -> Image.Image:
    if not background_color_bytes or len(background_color_bytes) < 3:
        background_color_bytes = random.randbytes(3)  # nosec: blacklist
    initials = ''.join(
        word[0].upper() for word in name.split() if word and word[0].isalpha()
    )
    img = Image.new(mode, (size, size), color=tuple(background_color_bytes[:3]))
    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype(FONT_NAME, size // 2)
    _, _, width, height = draw.textbbox((0, 0), initials, font=font)
    draw.text(
        ((size - width) / 2, (size - height) / 2),
        initials,
        font=font,
        fill=(255, 255, 255),
    )
    return img


def image_to_bytes(img: Image.Image, format_: str = 'PNG') -> io.BytesIO:
    output = io.BytesIO()
    img.save(output, format_)
    output.seek(0)
    return output


def bytes_to_image(data: bytes) -> Image.Image:
    return Image.open(io.BytesIO(data))
