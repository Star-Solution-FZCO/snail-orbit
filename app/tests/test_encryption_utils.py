import base64

import pytest
from cryptography.exceptions import InvalidTag

from pm.enums import EncryptionKeyAlgorithmT
from pm.utils.encryption import (
    EncryptionError,
    array_buffer_to_base64_string,
    base64_string_to_array_buffer,
    calculate_fingerprint,
    decrypt_text_with_aes,
    encrypt_text_with_aes,
    export_private_key_to_pem,
    export_public_key_to_pem,
    generate_aes_key,
    generate_rsa_key_pair,
    generate_x25519_key_pair,
    import_private_key_from_pem,
    import_public_key_from_pem,
    unwrap_aes_key,
    wrap_aes_key,
)


def test_generate_aes_key():
    """Test AES key generation"""
    key = generate_aes_key()
    assert len(key) == 32  # 256-bit key
    # Should generate different keys each time
    key2 = generate_aes_key()
    assert key != key2


def test_base64_encoding_roundtrip():
    """Test base64 encoding/decoding"""
    original = b'Hello, World!'
    encoded = array_buffer_to_base64_string(original)
    decoded = base64_string_to_array_buffer(encoded)
    assert decoded == original


@pytest.mark.parametrize(
    'text',
    [
        pytest.param('Hello, encryption!', id='basic'),
        pytest.param('Test message', id='simple'),
        pytest.param('Same message', id='duplicate'),
        pytest.param('Hello 🌍! 你好 世界!', id='unicode'),
        pytest.param('', id='empty'),
        pytest.param('A' * 10000, id='long_text'),
    ],
)
def test_encrypt_decrypt_roundtrip(text):
    """Test encryption and decryption roundtrip with various texts"""
    key = generate_aes_key()
    encrypted = encrypt_text_with_aes(text, key)
    decrypted = decrypt_text_with_aes(encrypted, key)
    assert decrypted == text


def test_encrypt_different_results_same_text():
    """Test that same text produces different encrypted results (due to random IV)"""
    text = 'Same message'
    key = generate_aes_key()

    encrypted1 = encrypt_text_with_aes(text, key)
    encrypted2 = encrypt_text_with_aes(text, key)

    # Should be different due to random IV
    assert encrypted1 != encrypted2

    # But both should decrypt to same text
    assert decrypt_text_with_aes(encrypted1, key) == text
    assert decrypt_text_with_aes(encrypted2, key) == text


@pytest.mark.parametrize(
    'invalid_key',
    [
        pytest.param(b'short', id='too_short'),
        pytest.param(b'x' * 16, id='half_size'),
        pytest.param(b'y' * 64, id='double_size'),
    ],
)
def test_invalid_key_fails(invalid_key):
    """Test that invalid key size raises error"""
    text = 'Test'

    with pytest.raises(EncryptionError, match='AES key must be 32 bytes'):
        encrypt_text_with_aes(text, invalid_key)

    with pytest.raises(EncryptionError, match='AES key must be 32 bytes'):
        decrypt_text_with_aes('dummy', invalid_key)


def test_corrupted_ciphertext_fails():
    """Test that corrupted ciphertext fails to decrypt"""
    text = 'Test message'
    key = generate_aes_key()
    encrypted = encrypt_text_with_aes(text, key)

    # Corrupt the encrypted text
    corrupted = encrypted[:-5] + 'XXXXX'

    with pytest.raises(InvalidTag):
        decrypt_text_with_aes(corrupted, key)


def test_base64_format():
    """Test that encrypted text is valid base64"""
    text = 'Test'
    key = generate_aes_key()
    encrypted = encrypt_text_with_aes(text, key)

    # Should be able to decode as base64 without error
    try:
        base64.b64decode(encrypted)
    except (ValueError, TypeError) as e:
        pytest.fail(f'Encrypted text is not valid base64: {e}')


def test_iv_and_tag_structure():
    """Test the structure of encrypted data (IV + ciphertext + tag)"""
    text = 'Test message'
    key = generate_aes_key()
    encrypted = encrypt_text_with_aes(text, key)

    # Decrypt the base64 to get raw bytes
    encrypted_bytes = base64_string_to_array_buffer(encrypted)

    # Should be at least IV (12) + tag (16) = 28 bytes
    assert len(encrypted_bytes) >= 28

    # IV should be first 12 bytes, tag should be last 16 bytes
    iv = encrypted_bytes[:12]
    tag = encrypted_bytes[-16:]
    ciphertext = encrypted_bytes[12:-16]

    assert len(iv) == 12
    assert len(tag) == 16
    assert len(ciphertext) >= 0  # Could be 0 for empty string


def test_frontend_compatibility_format():
    """Test that output format matches frontend expectations"""
    text = 'Frontend test'
    key = generate_aes_key()
    encrypted = encrypt_text_with_aes(text, key)

    # Should be base64 string
    assert isinstance(encrypted, str)

    # Should be valid base64
    try:
        base64_string_to_array_buffer(encrypted)
    except (ValueError, TypeError) as e:
        pytest.fail(f'Output not compatible with frontend: {e}')


def test_deterministic_decryption():
    """Test that decryption is deterministic for same input"""
    text = 'Deterministic test'
    key = generate_aes_key()
    encrypted = encrypt_text_with_aes(text, key)

    # Multiple decryptions should give same result
    decrypted1 = decrypt_text_with_aes(encrypted, key)
    decrypted2 = decrypt_text_with_aes(encrypted, key)
    decrypted3 = decrypt_text_with_aes(encrypted, key)

    assert decrypted1 == decrypted2 == decrypted3 == text


@pytest.mark.parametrize(
    'key_type',
    [
        pytest.param('rsa', id='rsa_key'),
        pytest.param('x25519', id='x25519_key'),
    ],
)
def test_key_pair_generation(key_type):
    """Test key pair generation for different algorithms"""
    if key_type == 'rsa':
        private_key, public_key = generate_rsa_key_pair()
        assert private_key.key_size == 4096
    else:  # x25519
        private_key, public_key = generate_x25519_key_pair()

    # Check types
    assert private_key is not None
    assert public_key is not None

    # Keys should be different each time
    if key_type == 'rsa':
        private_key2, public_key2 = generate_rsa_key_pair()
    else:
        private_key2, public_key2 = generate_x25519_key_pair()

    assert private_key != private_key2
    assert public_key != public_key2


@pytest.mark.parametrize(
    ('key_type', 'private_label', 'public_label'),
    [
        pytest.param('rsa', 'RSA PRIVATE KEY', 'RSA PUBLIC KEY', id='rsa_keys'),
        pytest.param(
            'x25519', 'X25519 PRIVATE KEY', 'X25519 PUBLIC KEY', id='x25519_keys'
        ),
    ],
)
def test_key_pem_export_import_roundtrip(key_type, private_label, public_label):
    """Test key PEM export/import roundtrip for different algorithms"""
    if key_type == 'rsa':
        private_key, public_key = generate_rsa_key_pair()
    else:
        private_key, public_key = generate_x25519_key_pair()

    # Export to PEM
    private_pem = export_private_key_to_pem(private_key)
    public_pem = export_public_key_to_pem(public_key)

    # Check PEM format (using custom labels for frontend compatibility)
    assert f'-----BEGIN {private_label}-----' in private_pem
    assert f'-----END {private_label}-----' in private_pem
    assert f'-----BEGIN {public_label}-----' in public_pem
    assert f'-----END {public_label}-----' in public_pem

    # Import back
    imported_private = import_private_key_from_pem(private_pem)
    imported_public = import_public_key_from_pem(public_pem)

    assert imported_private is not None
    assert imported_public is not None


@pytest.mark.parametrize(
    'key_type',
    [
        pytest.param('rsa', id='rsa_fingerprint'),
        pytest.param('x25519', id='x25519_fingerprint'),
    ],
)
def test_fingerprint_format_and_consistency(key_type):
    """Test fingerprint format and consistency for different key types"""
    if key_type == 'rsa':
        private_key, public_key = generate_rsa_key_pair()
    else:
        private_key, public_key = generate_x25519_key_pair()

    fingerprint = calculate_fingerprint(public_key)

    # Should be 32 characters
    assert len(fingerprint) == 32

    # Should contain only base-32 characters (0-9, a-v)
    base32_chars = set('0123456789abcdefghijklmnopqrstuv')
    assert all(c in base32_chars for c in fingerprint)

    # Should be deterministic - same key produces same fingerprint
    fingerprint2 = calculate_fingerprint(public_key)
    assert fingerprint == fingerprint2


def test_different_keys_different_fingerprints():
    """Test that different keys produce different fingerprints"""
    # RSA keys
    _, rsa_pub1 = generate_rsa_key_pair()
    _, rsa_pub2 = generate_rsa_key_pair()

    rsa_fp1 = calculate_fingerprint(rsa_pub1)
    rsa_fp2 = calculate_fingerprint(rsa_pub2)
    assert rsa_fp1 != rsa_fp2

    # X25519 keys
    _, x25519_pub1 = generate_x25519_key_pair()
    _, x25519_pub2 = generate_x25519_key_pair()

    x25519_fp1 = calculate_fingerprint(x25519_pub1)
    x25519_fp2 = calculate_fingerprint(x25519_pub2)
    assert x25519_fp1 != x25519_fp2


def test_fingerprint_from_pem():
    """Test fingerprint calculation from PEM-imported keys"""
    # Generate key pair and export to PEM
    private_key, public_key = generate_x25519_key_pair()
    original_fingerprint = calculate_fingerprint(public_key)

    # Export and re-import
    public_pem = export_public_key_to_pem(public_key)
    imported_public = import_public_key_from_pem(public_pem)
    imported_fingerprint = calculate_fingerprint(imported_public)

    # Should produce the same fingerprint
    assert original_fingerprint == imported_fingerprint


@pytest.mark.parametrize(
    'algorithm',
    [
        pytest.param(EncryptionKeyAlgorithmT.RSA, id='rsa_wrapping'),
        pytest.param(EncryptionKeyAlgorithmT.X25519, id='x25519_wrapping'),
    ],
)
def test_key_wrapping_roundtrip(algorithm):
    """Test AES key wrapping/unwrapping roundtrip for different algorithms"""
    if algorithm == EncryptionKeyAlgorithmT.RSA:
        private_key, public_key = generate_rsa_key_pair()
    else:
        private_key, public_key = generate_x25519_key_pair()

    aes_key = generate_aes_key()

    # Wrap and unwrap
    wrapped = wrap_aes_key(aes_key, public_key, algorithm)
    unwrapped = unwrap_aes_key(wrapped, private_key, algorithm)

    assert unwrapped == aes_key


def test_x25519_wrapped_key_format():
    """Test X25519 wrapped key format"""
    private_key, public_key = generate_x25519_key_pair()
    aes_key = generate_aes_key()

    wrapped = wrap_aes_key(aes_key, public_key, EncryptionKeyAlgorithmT.X25519)

    # Should contain the separator
    assert '|#|' in wrapped

    # Should have two parts
    parts = wrapped.split('|#|')
    assert len(parts) == 2

    # Second part should be PEM
    assert '-----BEGIN' in parts[1]
    assert '-----END' in parts[1]


def test_different_algorithm_keys_not_interchangeable():
    """Test that RSA and X25519 keys can't be used interchangeably"""
    rsa_private, rsa_public = generate_rsa_key_pair()
    x25519_private, x25519_public = generate_x25519_key_pair()
    aes_key = generate_aes_key()

    # Wrap with RSA
    rsa_wrapped = wrap_aes_key(aes_key, rsa_public, EncryptionKeyAlgorithmT.RSA)

    # Try to unwrap with X25519 - should fail
    with pytest.raises(EncryptionError):
        unwrap_aes_key(rsa_wrapped, x25519_private, EncryptionKeyAlgorithmT.X25519)


def test_full_hybrid_encryption_workflow():
    """Test complete hybrid encryption workflow"""
    # Generate asymmetric key pair
    private_key, public_key = generate_x25519_key_pair()

    # Generate AES key
    aes_key = generate_aes_key()

    # Encrypt data with AES
    plaintext = 'Secret message for hybrid encryption!'
    encrypted_data = encrypt_text_with_aes(plaintext, aes_key)

    # Wrap AES key with public key
    wrapped_aes_key = wrap_aes_key(aes_key, public_key, EncryptionKeyAlgorithmT.X25519)

    # Simulate sending encrypted_data + wrapped_aes_key to recipient

    # Recipient unwraps AES key
    unwrapped_aes_key = unwrap_aes_key(
        wrapped_aes_key, private_key, EncryptionKeyAlgorithmT.X25519
    )

    # Recipient decrypts data
    decrypted_data = decrypt_text_with_aes(encrypted_data, unwrapped_aes_key)

    assert decrypted_data == plaintext


def test_multiple_key_wrapping_same_aes():
    """Test wrapping same AES key with multiple public keys"""
    # Generate multiple key pairs
    priv1, pub1 = generate_x25519_key_pair()
    priv2, pub2 = generate_x25519_key_pair()

    aes_key = generate_aes_key()

    # Wrap with both public keys
    wrapped1 = wrap_aes_key(aes_key, pub1, EncryptionKeyAlgorithmT.X25519)
    wrapped2 = wrap_aes_key(aes_key, pub2, EncryptionKeyAlgorithmT.X25519)

    # Both recipients should be able to unwrap
    unwrapped1 = unwrap_aes_key(wrapped1, priv1, EncryptionKeyAlgorithmT.X25519)
    unwrapped2 = unwrap_aes_key(wrapped2, priv2, EncryptionKeyAlgorithmT.X25519)

    assert unwrapped1 == aes_key
    assert unwrapped2 == aes_key


def test_invalid_algorithm_handling():
    """Test handling of mismatched key types and algorithms"""
    _, rsa_public_key = generate_rsa_key_pair()
    aes_key = generate_aes_key()

    # Test with mismatched algorithm - using X25519 algorithm with RSA key should fail
    with pytest.raises(
        TypeError
    ):  # The underlying crypto library raises TypeError for type mismatch
        wrap_aes_key(aes_key, rsa_public_key, EncryptionKeyAlgorithmT.X25519)

    # Test unwrapping with wrong algorithm
    rsa_private, rsa_public = generate_rsa_key_pair()
    wrapped = wrap_aes_key(aes_key, rsa_public, EncryptionKeyAlgorithmT.RSA)

    # Try to unwrap RSA-wrapped key with X25519 algorithm - should fail
    x25519_private, _ = generate_x25519_key_pair()
    with pytest.raises((EncryptionError, ValueError)):  # Could be various error types
        unwrap_aes_key(wrapped, x25519_private, EncryptionKeyAlgorithmT.X25519)
