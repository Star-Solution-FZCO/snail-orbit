import base64
import secrets

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa, x25519
from cryptography.hazmat.primitives.asymmetric.rsa import RSAPrivateKey, RSAPublicKey
from cryptography.hazmat.primitives.asymmetric.x25519 import (
    X25519PrivateKey,
    X25519PublicKey,
)
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

from pm.enums import EncryptionKeyAlgorithmT

__all__ = (
    'EncryptionError',
    'array_buffer_to_base64_string',
    'base64_string_to_array_buffer',
    'calculate_fingerprint',
    'decrypt_text_with_aes',
    'encrypt_text_with_aes',
    'export_private_key_to_pem',
    'export_public_key_to_pem',
    'generate_aes_key',
    'generate_rsa_key_pair',
    'generate_x25519_key_pair',
    'import_private_key_from_pem',
    'import_public_key_from_pem',
    'unwrap_aes_key',
    'wrap_aes_key',
)


# Constants for AES-GCM
AES_KEY_SIZE = 32  # 256-bit AES key
GCM_IV_SIZE = 12  # 96-bit IV for GCM
GCM_TAG_SIZE = 16  # 128-bit authentication tag

# Constants for RSA key generation
GENERATED_RSA_KEY_SIZE = 4096  # 4096-bit RSA key
GENERATED_RSA_PUBLIC_EXPONENT = 65537  # Common public exponent

# Constants for X25519 key wrapping
X25519_WRAPPED_KEY_PARTS = 2  # Expected parts in wrapped key format
X25519_WRAPPED_KEY_SEPARATOR = '|#|'  # Separator for wrapped key format

# Type aliases for better readability
AnyPrivateKey = RSAPrivateKey | X25519PrivateKey
AnyPublicKey = RSAPublicKey | X25519PublicKey


class EncryptionError(Exception):
    pass


def _extract_pem_base64_content(pem_content: str) -> str:
    """Extract base64 content from PEM format (both standard and custom labels)"""
    lines = pem_content.split('\n')
    encoded = ''
    for raw_line in lines:
        line = raw_line.strip()
        if (
            line
            and 'PRIVATE KEY' not in line
            and 'PUBLIC KEY' not in line
            and not line.startswith('-----')
        ):
            encoded += line
    return encoded


def _create_custom_pem(key_bytes: bytes, label: str) -> str:
    """Create PEM with custom label in frontend format"""
    b64_content = base64.b64encode(key_bytes).decode('utf-8')
    pem_lines = [f'-----BEGIN {label}-----']
    pem_lines.extend([b64_content[i : i + 64] for i in range(0, len(b64_content), 64)])
    pem_lines.append(f'-----END {label}-----')
    return '\r\n'.join(pem_lines) + '\r\n'


def _create_x25519_public_key_pem(public_key_bytes: bytes) -> str:
    """Create X25519 public key PEM with label in frontend format"""
    return _create_custom_pem(public_key_bytes, 'X25519 PUBLIC KEY')


def generate_aes_key() -> bytes:
    """Generate 256-bit AES key matching frontend generateAES()"""
    return secrets.token_bytes(AES_KEY_SIZE)


def generate_rsa_key_pair() -> tuple[RSAPrivateKey, RSAPublicKey]:
    """
    Generate RSA-4096 key pair matching frontend generateRSA()

    Returns:
        tuple[RSAPrivateKey, RSAPublicKey]: Private and public key pair
    """
    private_key = rsa.generate_private_key(
        public_exponent=GENERATED_RSA_PUBLIC_EXPONENT,
        key_size=GENERATED_RSA_KEY_SIZE,
    )
    public_key = private_key.public_key()
    return private_key, public_key


def generate_x25519_key_pair() -> tuple[X25519PrivateKey, X25519PublicKey]:
    """
    Generate X25519 key pair matching frontend generateX25519()

    Returns:
        tuple[X25519PrivateKey, X25519PublicKey]: Private and public key pair
    """
    private_key = x25519.X25519PrivateKey.generate()
    public_key = private_key.public_key()
    return private_key, public_key


def array_buffer_to_base64_string(array_buffer: bytes) -> str:
    """Convert bytes to base64 string matching frontend arrayBufferToBase64String()"""
    return base64.b64encode(array_buffer).decode('utf-8')


def base64_string_to_array_buffer(b64str: str) -> bytes:
    """Convert base64 string to bytes matching frontend base64StringToArrayBuffer()"""
    return base64.b64decode(b64str)


def calculate_fingerprint(public_key: AnyPublicKey) -> str:
    """
    Calculate fingerprint from public key matching frontend getFingerprint()

    Args:
        public_key: RSA or X25519 public key

    Returns:
        str: 32-character fingerprint (SHA-256 hash in base-32)
    """
    # Export public key to SPKI binary format (same as Web Crypto exportKey('spki'))
    key_bytes = public_key.public_bytes(
        encoding=serialization.Encoding.DER,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )

    # Hash with SHA-256 (same as Web Crypto digest('SHA-256'))
    digest = hashes.Hash(hashes.SHA256())
    digest.update(key_bytes)
    hash_bytes = digest.finalize()

    # Convert to base-32 representation matching frontend toString(32).padStart(2, "0")
    hash_array = list(hash_bytes)

    def to_base32_padded(byte_val: int) -> str:
        """Convert byte to base-32 string, padded to 2 characters"""
        base32_chars = '0123456789abcdefghijklmnopqrstuv'
        if byte_val == 0:
            return '00'

        result = ''
        val = byte_val
        while val > 0:
            result = base32_chars[val % 32] + result
            val //= 32

        return result.zfill(2)  # pad to 2 characters

    hash_base32 = ''.join(to_base32_padded(b) for b in hash_array)

    # Take first 32 characters (matching frontend .slice(0, 32))
    return hash_base32[:32]


def encrypt_text_with_aes(text: str, key: bytes) -> str:
    """
    Encrypt text with AES-GCM matching frontend encryptTextWithAES()

    Args:
        text: Text to encrypt
        key: 32-byte AES key

    Returns:
        str: Base64-encoded encrypted text (IV + ciphertext + tag)

    Raises:
        EncryptionError: If key size is invalid
    """
    if len(key) != AES_KEY_SIZE:
        raise EncryptionError(f'AES key must be {AES_KEY_SIZE} bytes, got {len(key)}')

    iv = secrets.token_bytes(GCM_IV_SIZE)
    cipher = Cipher(algorithms.AES(key), modes.GCM(iv))
    encryptor = cipher.encryptor()
    text_bytes = text.encode('utf-8')
    ciphertext = encryptor.update(text_bytes) + encryptor.finalize()
    result = iv + ciphertext + encryptor.tag

    return array_buffer_to_base64_string(result)


def decrypt_text_with_aes(encrypted_text: str, key: bytes) -> str:
    """
    Decrypt AES-GCM encrypted text matching frontend decryptTextWithAES()

    Args:
        encrypted_text: Base64-encoded encrypted text (IV + ciphertext + tag)
        key: 32-byte AES key used for encryption

    Returns:
        str: Decrypted plaintext

    Raises:
        EncryptionError: If key size is invalid or data format is incorrect
        InvalidTag: If authentication fails (data corrupted or wrong key)
    """
    if len(key) != AES_KEY_SIZE:
        raise EncryptionError(f'AES key must be {AES_KEY_SIZE} bytes, got {len(key)}')

    encrypted_data = base64_string_to_array_buffer(encrypted_text)

    min_length = GCM_IV_SIZE + GCM_TAG_SIZE
    if len(encrypted_data) < min_length:
        raise EncryptionError(
            f'Encrypted data too short: {len(encrypted_data)} bytes, minimum {min_length}'
        )

    iv = encrypted_data[:GCM_IV_SIZE]
    ciphertext = encrypted_data[GCM_IV_SIZE:-GCM_TAG_SIZE]
    tag = encrypted_data[-GCM_TAG_SIZE:]

    cipher = Cipher(algorithms.AES(key), modes.GCM(iv))
    decryptor = cipher.decryptor()

    decrypted_bytes = decryptor.update(ciphertext) + decryptor.finalize_with_tag(tag)
    return decrypted_bytes.decode('utf-8')


def import_public_key_from_pem(pem_key: str) -> AnyPublicKey:
    """
    Import public key from PEM format, supporting both standard and frontend custom labels

    Args:
        pem_key: PEM-encoded public key (RSA or X25519)

    Returns:
        AnyPublicKey: RSAPublicKey or X25519PublicKey instance

    Raises:
        EncryptionError: If PEM format is invalid
    """
    encoded = _extract_pem_base64_content(pem_key)
    binary_data = base64.b64decode(encoded)
    return serialization.load_der_public_key(binary_data)


def import_private_key_from_pem(pem_key: str) -> AnyPrivateKey:
    """
    Import private key from PEM format, supporting both standard and frontend custom labels

    Args:
        pem_key: PEM-encoded private key (RSA or X25519)

    Returns:
        AnyPrivateKey: RSAPrivateKey or X25519PrivateKey instance

    Raises:
        EncryptionError: If PEM format is invalid
    """
    encoded = _extract_pem_base64_content(pem_key)
    binary_data = base64.b64decode(encoded)
    return serialization.load_der_private_key(binary_data, password=None)


def export_public_key_to_pem(public_key: AnyPublicKey) -> str:
    """
    Export public key to PEM format with frontend-compatible custom labels

    Args:
        public_key: RSA or X25519 public key

    Returns:
        str: PEM-encoded public key with custom labels for frontend compatibility
    """
    # Export to DER first, then create custom PEM format
    key_bytes = public_key.public_bytes(
        encoding=serialization.Encoding.DER,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )

    # Use frontend-compatible custom labels
    if isinstance(public_key, X25519PublicKey):
        return _create_custom_pem(key_bytes, 'X25519 PUBLIC KEY')
    # RSA key
    return _create_custom_pem(key_bytes, 'RSA PUBLIC KEY')


def export_private_key_to_pem(private_key: AnyPrivateKey) -> str:
    """
    Export private key to PEM format with frontend-compatible custom labels

    Args:
        private_key: RSA or X25519 private key

    Returns:
        str: PEM-encoded private key with custom labels for frontend compatibility
    """
    # Export to DER first, then create custom PEM format
    key_bytes = private_key.private_bytes(
        encoding=serialization.Encoding.DER,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )

    # Use frontend-compatible custom labels
    if isinstance(private_key, X25519PrivateKey):
        return _create_custom_pem(key_bytes, 'X25519 PRIVATE KEY')
    # RSA key
    return _create_custom_pem(key_bytes, 'RSA PRIVATE KEY')


def wrap_aes_key_with_rsa(aes_key: bytes, rsa_public_key: RSAPublicKey) -> str:
    """
    Wrap AES key with RSA public key matching frontend RSA wrapping

    Args:
        aes_key: 32-byte AES key to wrap
        rsa_public_key: RSA public key for encryption

    Returns:
        str: Base64-encoded wrapped AES key

    Raises:
        EncryptionError: If AES key size is invalid
    """

    if len(aes_key) != AES_KEY_SIZE:
        raise EncryptionError(
            f'AES key must be {AES_KEY_SIZE} bytes, got {len(aes_key)}'
        )

    encrypted_key = rsa_public_key.encrypt(
        aes_key,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None,
        ),
    )
    return array_buffer_to_base64_string(encrypted_key)


def unwrap_aes_key_with_rsa(wrapped_key: str, rsa_private_key: RSAPrivateKey) -> bytes:
    """
    Unwrap AES key with RSA private key

    Args:
        wrapped_key: Base64-encoded wrapped AES key
        rsa_private_key: RSA private key for decryption

    Returns:
        bytes: 32-byte unwrapped AES key
    """

    encrypted_data = base64_string_to_array_buffer(wrapped_key)
    return rsa_private_key.decrypt(
        encrypted_data,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None,
        ),
    )


def wrap_aes_key_with_x25519(aes_key: bytes, x25519_public_key: X25519PublicKey) -> str:
    """
    Wrap AES key with X25519 using ephemeral key exchange (frontend compatible)

    Args:
        aes_key: 32-byte AES key to wrap
        x25519_public_key: X25519 public key for key exchange

    Returns:
        str: Wrapped key in format "encrypted_data|#|ephemeral_public_key_pem"

    Raises:
        EncryptionError: If AES key size is invalid
    """
    if len(aes_key) != AES_KEY_SIZE:
        raise EncryptionError(
            f'AES key must be {AES_KEY_SIZE} bytes, got {len(aes_key)}'
        )

    ephemeral_private_key = x25519.X25519PrivateKey.generate()
    ephemeral_public_key = ephemeral_private_key.public_key()

    shared_secret = ephemeral_private_key.exchange(x25519_public_key)
    iv = secrets.token_bytes(GCM_IV_SIZE)

    cipher = Cipher(algorithms.AES(shared_secret), modes.GCM(iv))
    encryptor = cipher.encryptor()

    ciphertext = encryptor.update(aes_key) + encryptor.finalize()
    encrypted_package = iv + ciphertext + encryptor.tag

    ephemeral_key_bytes = ephemeral_public_key.public_bytes(
        encoding=serialization.Encoding.DER,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )
    ephemeral_pem = _create_x25519_public_key_pem(ephemeral_key_bytes)

    encrypted_b64 = array_buffer_to_base64_string(encrypted_package)
    return f'{encrypted_b64}{X25519_WRAPPED_KEY_SEPARATOR}{ephemeral_pem}'


def unwrap_aes_key_with_x25519(
    wrapped_key: str,
    x25519_private_key: X25519PrivateKey,  # gitleaks:allow # false positive
) -> bytes:
    """
    Unwrap AES key with X25519 using ephemeral key exchange

    Args:
        wrapped_key: Wrapped key in format "encrypted_data|#|ephemeral_public_key_pem"
        x25519_private_key: X25519 private key for key exchange

    Returns:
        bytes: 32-byte unwrapped AES key

    Raises:
        EncryptionError: If wrapped key format is invalid
        InvalidTag: If decryption fails (wrong key or corrupted data)
    """
    parts = wrapped_key.split(X25519_WRAPPED_KEY_SEPARATOR)
    if len(parts) != X25519_WRAPPED_KEY_PARTS:
        raise EncryptionError(
            f'Invalid X25519 wrapped key format: expected "data{X25519_WRAPPED_KEY_SEPARATOR}pem"'
        )

    encrypted_b64, ephemeral_pem = parts
    ephemeral_public_key = import_public_key_from_pem(ephemeral_pem)
    shared_secret = x25519_private_key.exchange(ephemeral_public_key)
    encrypted_package = base64_string_to_array_buffer(encrypted_b64)

    min_length = GCM_IV_SIZE + GCM_TAG_SIZE
    if len(encrypted_package) < min_length:
        raise EncryptionError(
            f'Encrypted package too short: {len(encrypted_package)} bytes, minimum {min_length}'
        )

    iv = encrypted_package[:GCM_IV_SIZE]
    ciphertext = encrypted_package[GCM_IV_SIZE:-GCM_TAG_SIZE]
    tag = encrypted_package[-GCM_TAG_SIZE:]

    cipher = Cipher(algorithms.AES(shared_secret), modes.GCM(iv))
    decryptor = cipher.decryptor()

    return decryptor.update(ciphertext) + decryptor.finalize_with_tag(tag)


def wrap_aes_key(
    aes_key: bytes, public_key: AnyPublicKey, algorithm: EncryptionKeyAlgorithmT
) -> str:
    """
    Wrap AES key with public key (RSA or X25519) matching frontend wrapAESKey()

    Args:
        aes_key: 32-byte AES key to wrap
        public_key: RSA or X25519 public key for wrapping
        algorithm: Algorithm identifier ('RSA' or 'X25519')

    Returns:
        str: Wrapped AES key (base64 for RSA, "data|#|pem" format for X25519)

    Raises:
        EncryptionError: If algorithm is unsupported or parameters are invalid
    """
    if algorithm == EncryptionKeyAlgorithmT.RSA:
        return wrap_aes_key_with_rsa(aes_key, public_key)
    if algorithm == EncryptionKeyAlgorithmT.X25519:
        return wrap_aes_key_with_x25519(aes_key, public_key)
    raise EncryptionError(f'Unsupported algorithm: {algorithm}')


def unwrap_aes_key(
    wrapped_key: str, private_key: AnyPrivateKey, algorithm: EncryptionKeyAlgorithmT
) -> bytes:
    """
    Unwrap AES key with private key (RSA or X25519)

    Args:
        wrapped_key: Wrapped AES key (format depends on algorithm)
        private_key: RSA or X25519 private key for unwrapping
        algorithm: Algorithm identifier ('RSA' or 'X25519')

    Returns:
        bytes: 32-byte unwrapped AES key

    Raises:
        EncryptionError: If algorithm is unsupported or parameters are invalid
        InvalidTag: If unwrapping fails (wrong key or corrupted data)
    """
    if algorithm == EncryptionKeyAlgorithmT.RSA:
        return unwrap_aes_key_with_rsa(wrapped_key, private_key)
    if algorithm == EncryptionKeyAlgorithmT.X25519:
        return unwrap_aes_key_with_x25519(wrapped_key, private_key)
    raise EncryptionError(f'Unsupported algorithm: {algorithm}')
