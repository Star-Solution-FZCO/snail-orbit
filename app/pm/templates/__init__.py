import os
from enum import StrEnum

from jinja2 import Environment, FileSystemLoader

from pm.config import CONFIG

__all__ = (
    'TemplateT',
    'render_template',
)


class TemplateT(StrEnum):
    INVITE_EMAIL = 'invite-email'
    INVITE_PARARAM = 'invite-pararam'


JINJA_ENV = Environment(
    loader=FileSystemLoader(os.path.join(os.path.dirname(__file__), 'templates')),
    autoescape=True,
)

DEFAULT_VARS = {
    'public_base_url': CONFIG.PUBLIC_BASE_URL,
}

TEMPLATES_MAP: dict[TemplateT, str] = {
    TemplateT.INVITE_EMAIL: 'invite-email.html.jinja',
    TemplateT.INVITE_PARARAM: 'invite-pararam.md.jinja',
}


def render_template(template_name: TemplateT, **kwargs) -> str:
    if not (template_file := TEMPLATES_MAP.get(template_name)):
        raise ValueError(f'Unknown template name: {template_name}')
    template = JINJA_ENV.get_template(template_file)
    return template.render(**{**DEFAULT_VARS, **kwargs})
