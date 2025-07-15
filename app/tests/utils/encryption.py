import base64
import secrets

from cryptography.hazmat.primitives import hashes, padding, serialization
from cryptography.hazmat.primitives.asymmetric import x25519
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

__all__ = (
    'decrypt_aes_key_with_x25519',
    'decrypt_with_aes',
    'encrypt_aes_key_with_x25519',
    'encrypt_with_aes',
)


def encrypt_with_aes(text: str) -> tuple[bytes, str]:
    aes_key = secrets.token_bytes(32)

    padder = padding.PKCS7(algorithms.AES.block_size).padder()
    padded_data = padder.update(text.encode()) + padder.finalize()
    # ECB mode is used since the AES key is unique for each encryption and is not reused.
    cipher = Cipher(algorithms.AES(aes_key), modes.ECB())  # nosec: B305  # noqa: S305
    encryptor = cipher.encryptor()
    ciphertext = encryptor.update(padded_data) + encryptor.finalize()
    return aes_key, base64.b64encode(ciphertext).decode('utf-8')


def decrypt_with_aes(aes_key: bytes, ciphertext: str) -> str:
    cipher = Cipher(algorithms.AES(aes_key), modes.ECB())  # nosec: B305  # noqa: S305
    decryptor = cipher.decryptor()
    padded_text = decryptor.update(base64.b64decode(ciphertext)) + decryptor.finalize()
    unpadder = padding.PKCS7(algorithms.AES.block_size).unpadder()
    decrypted_text = unpadder.update(padded_text) + unpadder.finalize()
    return decrypted_text.decode('utf-8')


def encrypt_aes_key_with_x25519(
    aes_key: bytes,
    recipient_public_key_bytes: bytes,
) -> dict[str, str]:
    recipient_public_key = x25519.X25519PublicKey.from_public_bytes(
        recipient_public_key_bytes,
    )

    ephemeral_private_key = x25519.X25519PrivateKey.generate()
    ephemeral_public_key = ephemeral_private_key.public_key()

    ephemeral_public_key_bytes = ephemeral_public_key.public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw,
    )

    shared_key = ephemeral_private_key.exchange(recipient_public_key)

    derived_key = HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        salt=ephemeral_public_key_bytes,
        info=b'AES key encryption',
    ).derive(shared_key)

    nonce = secrets.token_bytes(12)
    cipher = Cipher(
        algorithms.AES(derived_key),
        modes.GCM(nonce),
    )

    encryptor = cipher.encryptor()
    encrypted_key = encryptor.update(aes_key) + encryptor.finalize()
    tag = encryptor.tag

    encrypted_package = nonce + encrypted_key + tag

    return {
        'ephemeral_public_key': base64.b64encode(ephemeral_public_key_bytes).decode(
            'utf-8',
        ),
        'encrypted_key': base64.b64encode(encrypted_package).decode('utf-8'),
    }


def decrypt_aes_key_with_x25519(
    encrypted_key_b64: str,
    ephemeral_public_key_b64: str,
    recipient_private_key_bytes: bytes,
) -> bytes:
    recipient_private_key = x25519.X25519PrivateKey.from_private_bytes(
        recipient_private_key_bytes,
    )

    encrypted_package = base64.b64decode(encrypted_key_b64)
    ephemeral_public_key_bytes = base64.b64decode(ephemeral_public_key_b64)

    ephemeral_public_key = x25519.X25519PublicKey.from_public_bytes(
        ephemeral_public_key_bytes,
    )

    shared_key = recipient_private_key.exchange(ephemeral_public_key)

    derived_key = HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        salt=ephemeral_public_key_bytes,
        info=b'AES key encryption',
    ).derive(shared_key)

    nonce = encrypted_package[:12]
    tag = encrypted_package[-16:]
    encrypted_key = encrypted_package[12:-16]

    cipher = Cipher(
        algorithms.AES(derived_key),
        modes.GCM(nonce, tag),
    )

    decryptor = cipher.decryptor()
    return decryptor.update(encrypted_key) + decryptor.finalize()
