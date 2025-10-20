# pylint: disable=import-outside-toplevel
import argparse
from pathlib import Path

__all__ = ('add_encryption_args',)


def generate_key_pair(args: argparse.Namespace) -> None:
    """Generate encryption key pair"""
    from pm.utils.encryption import (
        calculate_fingerprint,
        export_private_key_to_pem,
        export_public_key_to_pem,
        generate_rsa_key_pair,
        generate_x25519_key_pair,
    )

    # Generate key pair based on algorithm
    if args.algorithm == 'rsa':
        private_key, public_key = generate_rsa_key_pair()
        algorithm_name = 'RSA-4096'
    elif args.algorithm == 'x25519':
        private_key, public_key = generate_x25519_key_pair()
        algorithm_name = 'X25519'
    else:
        print(f'❌ Unsupported algorithm: {args.algorithm}')
        return

    # Calculate fingerprint
    fingerprint = calculate_fingerprint(public_key)

    # Export keys to PEM format
    private_pem = export_private_key_to_pem(private_key)
    public_pem = export_public_key_to_pem(public_key)

    # Print fingerprint to console (always)
    print(f'🔑 Generated {algorithm_name} key pair')
    print(f'🔍 Fingerprint: {fingerprint}')

    if args.output_dir:
        # Save to files
        output_path = Path(args.output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        private_file = output_path / f'{fingerprint}_private.pem'
        public_file = output_path / f'{fingerprint}_public.pem'

        with private_file.open('w', encoding='utf-8') as f:
            f.write(private_pem)
        with public_file.open('w', encoding='utf-8') as f:
            f.write(public_pem)

        print(f'📁 Private key saved to: {private_file}')
        print(f'📁 Public key saved to: {public_file}')
        return
    # Output to console
    print('\n🔐 Private Key PEM:')
    print(private_pem)
    print('🔓 Public Key PEM:')
    print(public_pem)


def add_encryption_args(parser: argparse.ArgumentParser) -> None:
    """Add encryption subcommands to parser"""
    subparsers = parser.add_subparsers(required=True)

    # Generate key pair command
    generate_parser = subparsers.add_parser(
        'generate', help='Generate encryption key pair'
    )
    generate_parser.add_argument(
        '--algorithm',
        type=str,
        choices=['rsa', 'x25519'],
        default='x25519',
        help='Key algorithm to generate (rsa for RSA-4096, x25519 for X25519)',
    )
    generate_parser.add_argument(
        '--output-dir',
        type=str,
        help='Directory to save key files (if not specified, output to console)',
    )
    generate_parser.set_defaults(func=generate_key_pair)
