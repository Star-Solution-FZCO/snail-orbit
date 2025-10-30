#!/usr/bin/env python3
"""Generate Pydantic models from OpenAPI schema.

This script generates Pydantic v2 models from the Snail Orbit OpenAPI schema,
ensuring they stay in sync with the backend API automatically.
"""

import argparse
import ast
import subprocess
import sys
from pathlib import Path


class RootModelInfo:
    """Information about a detected RootModel with discriminated union."""

    def __init__(
        self, class_name: str, root_type: str, discriminator_field: str | None = None
    ):
        self.class_name = class_name
        self.root_type = root_type
        self.discriminator_field = discriminator_field
        self.wrapper_name = (
            class_name.replace('RootModel', '')
            if class_name.endswith('RootModel')
            else f'{class_name}Enhanced'
        )


def detect_root_models(models_file: Path) -> list[RootModelInfo]:
    """Detect RootModel classes that need enhanced wrappers."""
    try:
        with open(models_file) as f:
            content = f.read()

        tree = ast.parse(content)
        root_models = []

        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef):
                # Check if this class inherits from RootModel
                for base in node.bases:
                    if (
                        isinstance(base, ast.Subscript)
                        and isinstance(base.value, ast.Name)
                        and base.value.id == 'RootModel'
                    ):
                        # Extract the root type
                        root_type = ast.unparse(base.slice)

                        # Check if it's a discriminated union by looking for model_config
                        discriminator_field = None
                        for class_node in node.body:
                            if isinstance(class_node, ast.Assign):
                                for target in class_node.targets:
                                    if (
                                        isinstance(target, ast.Name)
                                        and target.id == 'model_config'
                                        and isinstance(class_node.value, ast.Call)
                                    ):
                                        for keyword in class_node.value.keywords:
                                            if (
                                                keyword.arg == 'discriminator'
                                                and isinstance(
                                                    keyword.value, ast.Constant
                                                )
                                            ):
                                                discriminator_field = (
                                                    keyword.value.value
                                                )

                        root_models.append(
                            RootModelInfo(node.name, root_type, discriminator_field)
                        )

        return root_models
    except Exception as e:
        print(f'❌ Error detecting RootModel classes: {e}')
        return []


def generate_enhanced_wrapper(root_model: RootModelInfo) -> str:
    """Generate enhanced wrapper class for a RootModel."""
    wrapper_name = root_model.wrapper_name
    root_class_name = root_model.class_name

    # Generate the enhanced wrapper class using template string
    wrapper_code = f"""

class {wrapper_name}({root_class_name}):
    \"\"\"Enhanced wrapper for {root_class_name} with transparent property access.\"\"\"

    def __getattr__(self, name: str):
        \"\"\"Provide transparent access to root properties.\"\"\"
        if hasattr(self.root, name):
            return getattr(self.root, name)
        raise AttributeError(f"'{wrapper_name}' object has no attribute '{{name}}'")

    def __setattr__(self, name: str, value):
        \"\"\"Provide transparent setting of root properties.\"\"\"
        if name == 'root' or name.startswith('_'):
            super().__setattr__(name, value)
        elif hasattr(self.root, name):
            setattr(self.root, name, value)
        else:
            super().__setattr__(name, value)

    @property
    def model_fields(self):
        \"\"\"Expose root model fields for compatibility.\"\"\"
        return self.root.model_fields if hasattr(self.root, 'model_fields') else {{}}

    def model_dump(self, **kwargs):
        \"\"\"Delegate model_dump to root for serialization.\"\"\"
        return self.root.model_dump(**kwargs)

    def model_dump_json(self, **kwargs):
        \"\"\"Delegate model_dump_json to root for JSON serialization.\"\"\"
        return self.root.model_dump_json(**kwargs)
"""

    return wrapper_code


def post_process_models(models_file: Path) -> bool:
    """Post-process generated models to add enhanced wrappers for discriminated unions."""
    print('🔄 Post-processing models to generate enhanced wrappers...')

    # Detect RootModel classes
    root_models = detect_root_models(models_file)

    if not root_models:
        print('ℹ️  No RootModel classes found that need enhanced wrappers')
        return True

    print(f'📊 Found {len(root_models)} RootModel classes to enhance:')
    for rm in root_models:
        disc_info = (
            f' (discriminator: {rm.discriminator_field})'
            if rm.discriminator_field
            else ''
        )
        print(f'   - {rm.class_name} → {rm.wrapper_name}{disc_info}')

    try:
        # Read the current models file
        with open(models_file) as f:
            content = f.read()

        # Generate enhanced wrappers
        enhanced_code = '\n\n# Enhanced wrappers for discriminated unions'
        enhanced_code += '\n# These provide transparent property access without .root'

        for root_model in root_models:
            enhanced_code += generate_enhanced_wrapper(root_model)

        # Append enhanced wrappers to the file
        with open(models_file, 'w') as f:
            f.write(content + enhanced_code)

        print(f'✅ Added {len(root_models)} enhanced wrapper classes')
        return True

    except Exception as e:
        print(f'❌ Error post-processing models: {e}')
        return False


def main() -> None:
    """Generate models from OpenAPI schema."""
    parser = argparse.ArgumentParser(
        description='Generate Pydantic models from OpenAPI schema'
    )
    parser.add_argument(
        '--schema-path',
        type=Path,
        default=Path(__file__).parent.parent.parent.parent / 'app' / 'openapi.json',
        help='Path to OpenAPI schema file',
    )
    parser.add_argument(
        '--output-dir',
        type=Path,
        default=Path(__file__).parent.parent / 'snail_orbit_client' / 'generated',
        help='Output directory for generated models',
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be generated without writing files',
    )

    args = parser.parse_args()

    # Check if schema exists
    if not args.schema_path.exists():
        print(f'❌ OpenAPI schema not found: {args.schema_path}')
        print('   Generate it with: python3 app/manage.py api openapi gen')
        sys.exit(1)

    # Create output directory
    args.output_dir.mkdir(parents=True, exist_ok=True)

    print(f'🔄 Generating models from {args.schema_path}')
    print(f'📁 Output directory: {args.output_dir}')

    # Build datamodel-codegen command
    cmd = [
        'datamodel-codegen',
        '--input',
        str(args.schema_path),
        '--output',
        str(args.output_dir / 'models.py'),
        '--input-file-type',
        'openapi',
        '--output-model-type',
        'pydantic_v2.BaseModel',
        '--use-schema-description',
        '--use-field-description',
        '--use-default-kwarg',
        '--use-generic-container-types',
        '--use-union-operator',
        '--enable-faux-immutability',
        '--target-python-version',
        '3.11',
        '--encoding',
        'utf-8',
    ]

    if args.dry_run:
        print('🔍 Dry run - command that would be executed:')
        print(' '.join(cmd))
        return

    try:
        # Run the generation
        subprocess.run(cmd, capture_output=True, text=True, check=True)

        print('✅ Models generated successfully!')

        # Post-process models to add enhanced wrappers
        models_file = args.output_dir / 'models.py'
        if not post_process_models(models_file):
            print('⚠️  Post-processing failed, but base models are still available')

        # Create __init__.py to make it a package
        init_file = args.output_dir / '__init__.py'
        with open(init_file, 'w') as f:
            f.write('"""Generated Pydantic models from OpenAPI schema."""\n')
            f.write('# This file is auto-generated. Do not edit manually.\n\n')
            f.write('from .models import *\n')

        print(f'📦 Created package at {args.output_dir}')

        # Show some stats
        if models_file.exists():
            with open(models_file) as f:
                lines = f.readlines()
                class_count = sum(
                    1 for line in lines if line.strip().startswith('class ')
                )
                enhanced_count = sum(
                    1 for line in lines if 'Enhanced wrapper for' in line
                )
                print(f'📊 Generated {class_count} model classes ({len(lines)} lines)')
                if enhanced_count > 0:
                    print(
                        f'🚀 Added {enhanced_count} enhanced wrappers for transparent property access'
                    )

        print('\n💡 Next steps:')
        print('   1. Review generated models in generated/models.py')
        print('   2. Update resource classes to use enhanced wrappers')
        print(
            '   3. Test transparent property access (e.g., group.name instead of group.root.name)'
        )
        print('   4. Create custom mixins for computed properties if needed')

    except subprocess.CalledProcessError as e:
        print(f'❌ Generation failed: {e}')
        if e.stdout:
            print(f'STDOUT: {e.stdout}')
        if e.stderr:
            print(f'STDERR: {e.stderr}')
        sys.exit(1)
    except FileNotFoundError:
        print('❌ datamodel-codegen not found. Install it with:')
        print('   uv sync')
        sys.exit(1)


if __name__ == '__main__':
    main()
