import os

from jinja2 import Environment, FileSystemLoader

from pm.config import CONFIG

__all__ = ('render_template',)


JINJA_ENV = Environment(
    loader=FileSystemLoader(os.path.join(os.path.dirname(__file__), 'templates')),
    autoescape=True,
)

DEFAULT_VARS = {
    'public_base_url': CONFIG.PUBLIC_BASE_URL,
}

TEMPLATES_MAP = {
    'invite': 'invite.html.jinja',
}


def render_template(template_name: str, **kwargs) -> str:
    if not (template_file := TEMPLATES_MAP.get(template_name)):
        raise ValueError(f'Unknown template name: {template_name}')
    template = JINJA_ENV.get_template(template_file)
    return template.render(**{**DEFAULT_VARS, **kwargs})
