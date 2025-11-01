import logging
import re
from collections.abc import Collection
from http import HTTPStatus
from typing import Any, Literal

import beanie.operators as bo
from fastapi import Depends, HTTPException

import pm.models as m
from pm.api.context import current_user, current_user_context_dependency
from pm.api.issue_query import split_query
from pm.api.issue_query.parse_logical_expression import (
    BracketError,
    ExpressionNode,
    LogicalOperatorT,
    Node,
    OperatorError,
    OperatorNode,
    UnexpectedEndOfExpressionError,
    check_brackets,
    parse_logical_expression,
)
from pm.api.issue_query.search import (
    HASHTAG_VALUES,
    RESERVED_FIELDS,
)
from pm.api.issue_query.sort import SortTransformer
from pm.api.issue_query.sort import parser as sort_parser
from pm.api.utils.router import APIRouter
from pm.api.views.custom_fields import ShortOptionOutput
from pm.api.views.error_responses import error_responses
from pm.api.views.issue import FavoriteFilterOutput, FavoriteFilterType
from pm.api.views.output import BaseListOutput, ErrorOutput, SuccessPayloadOutput
from pm.api.views.project import ProjectShortOutput
from pm.api.views.query_builder import (
    AvailableFieldRootModel,
    BooleanCustomFieldAvailable,
    BooleanCustomFieldParsed,
    DateCustomFieldAvailable,
    DateCustomFieldParsed,
    DateTimeCustomFieldAvailable,
    DateTimeCustomFieldParsed,
    DurationCustomFieldAvailable,
    DurationCustomFieldParsed,
    EnumCustomFieldAvailable,
    EnumCustomFieldParsed,
    EnumMultiCustomFieldAvailable,
    EnumMultiCustomFieldParsed,
    FloatCustomFieldAvailable,
    FloatCustomFieldParsed,
    HashtagFieldAvailable,
    HashtagFieldParsed,
    IntegerCustomFieldAvailable,
    IntegerCustomFieldParsed,
    OwnedCustomFieldAvailable,
    OwnedCustomFieldParsed,
    OwnedMultiCustomFieldAvailable,
    OwnedMultiCustomFieldParsed,
    ParsedQueryObjectRootModel,
    ParsedSortObject,
    ProjectFieldAvailable,
    ProjectFieldParsed,
    QueryBuilderInput,
    QueryBuilderOutput,
    QueryFieldTypeT,
    SortObject,
    SprintCustomFieldAvailable,
    SprintCustomFieldParsed,
    SprintMultiCustomFieldAvailable,
    SprintMultiCustomFieldParsed,
    StateCustomFieldAvailable,
    StateCustomFieldParsed,
    StringCustomFieldAvailable,
    StringCustomFieldParsed,
    TagFieldAvailable,
    TagFieldParsed,
    UserCustomFieldAvailable,
    UserCustomFieldParsed,
    UserMultiCustomFieldAvailable,
    UserMultiCustomFieldParsed,
    VersionCustomFieldAvailable,
    VersionCustomFieldParsed,
    VersionMultiCustomFieldAvailable,
    VersionMultiCustomFieldParsed,
)
from pm.api.views.user import UserOutput
from pm.models.tag import TagLinkField
from pm.permissions import ProjectPermissions

logger = logging.getLogger(__name__)

__all__ = ('router',)


router = APIRouter(prefix='/filters')

VALUE_PATTERN = re.compile(r'("[^"]*"|\S+)')

OPTION_BASED_FIELD_TYPES = (
    m.CustomFieldTypeT.ENUM,
    m.CustomFieldTypeT.ENUM_MULTI,
    m.CustomFieldTypeT.STATE,
    m.CustomFieldTypeT.VERSION,
    m.CustomFieldTypeT.VERSION_MULTI,
    m.CustomFieldTypeT.OWNED,
    m.CustomFieldTypeT.OWNED_MULTI,
    m.CustomFieldTypeT.SPRINT,
    m.CustomFieldTypeT.SPRINT_MULTI,
)

USER_BASED_FIELD_TYPES = (
    m.CustomFieldTypeT.USER,
    m.CustomFieldTypeT.USER_MULTI,
)

OPTION_FIELD_TYPES = (m.CustomFieldTypeT.ENUM, m.CustomFieldTypeT.ENUM_MULTI)
STATE_OPTION_FIELD_TYPES = (m.CustomFieldTypeT.STATE,)
VERSION_OPTION_FIELD_TYPES = (
    m.CustomFieldTypeT.VERSION,
    m.CustomFieldTypeT.VERSION_MULTI,
)
OWNED_OPTION_FIELD_TYPES = (
    m.CustomFieldTypeT.OWNED,
    m.CustomFieldTypeT.OWNED_MULTI,
)
SPRINT_OPTION_FIELD_TYPES = (
    m.CustomFieldTypeT.SPRINT,
    m.CustomFieldTypeT.SPRINT_MULTI,
)

CUSTOM_FIELD_AVAILABLE_MAP = {
    m.CustomFieldTypeT.STRING: StringCustomFieldAvailable,
    m.CustomFieldTypeT.INTEGER: IntegerCustomFieldAvailable,
    m.CustomFieldTypeT.FLOAT: FloatCustomFieldAvailable,
    m.CustomFieldTypeT.BOOLEAN: BooleanCustomFieldAvailable,
    m.CustomFieldTypeT.DATE: DateCustomFieldAvailable,
    m.CustomFieldTypeT.DATETIME: DateTimeCustomFieldAvailable,
    m.CustomFieldTypeT.DURATION: DurationCustomFieldAvailable,
    m.CustomFieldTypeT.ENUM: EnumCustomFieldAvailable,
    m.CustomFieldTypeT.ENUM_MULTI: EnumMultiCustomFieldAvailable,
    m.CustomFieldTypeT.STATE: StateCustomFieldAvailable,
    m.CustomFieldTypeT.VERSION: VersionCustomFieldAvailable,
    m.CustomFieldTypeT.VERSION_MULTI: VersionMultiCustomFieldAvailable,
    m.CustomFieldTypeT.USER: UserCustomFieldAvailable,
    m.CustomFieldTypeT.USER_MULTI: UserMultiCustomFieldAvailable,
    m.CustomFieldTypeT.OWNED: OwnedCustomFieldAvailable,
    m.CustomFieldTypeT.OWNED_MULTI: OwnedMultiCustomFieldAvailable,
    m.CustomFieldTypeT.SPRINT: SprintCustomFieldAvailable,
    m.CustomFieldTypeT.SPRINT_MULTI: SprintMultiCustomFieldAvailable,
}

CUSTOM_FIELD_PARSED_MAP = {
    m.CustomFieldTypeT.STRING: StringCustomFieldParsed,
    m.CustomFieldTypeT.INTEGER: IntegerCustomFieldParsed,
    m.CustomFieldTypeT.FLOAT: FloatCustomFieldParsed,
    m.CustomFieldTypeT.BOOLEAN: BooleanCustomFieldParsed,
    m.CustomFieldTypeT.DATE: DateCustomFieldParsed,
    m.CustomFieldTypeT.DATETIME: DateTimeCustomFieldParsed,
    m.CustomFieldTypeT.DURATION: DurationCustomFieldParsed,
    m.CustomFieldTypeT.ENUM: EnumCustomFieldParsed,
    m.CustomFieldTypeT.ENUM_MULTI: EnumMultiCustomFieldParsed,
    m.CustomFieldTypeT.STATE: StateCustomFieldParsed,
    m.CustomFieldTypeT.VERSION: VersionCustomFieldParsed,
    m.CustomFieldTypeT.VERSION_MULTI: VersionMultiCustomFieldParsed,
    m.CustomFieldTypeT.USER: UserCustomFieldParsed,
    m.CustomFieldTypeT.USER_MULTI: UserMultiCustomFieldParsed,
    m.CustomFieldTypeT.OWNED: OwnedCustomFieldParsed,
    m.CustomFieldTypeT.OWNED_MULTI: OwnedMultiCustomFieldParsed,
    m.CustomFieldTypeT.SPRINT: SprintCustomFieldParsed,
    m.CustomFieldTypeT.SPRINT_MULTI: SprintMultiCustomFieldParsed,
}

RESERVED_AVAILABLE_FOR_FILTERING = HASHTAG_VALUES | RESERVED_FIELDS
RESERVED_AVAILABLE_FOR_SORTING = RESERVED_FIELDS

# Default sort constants (matches existing issue list endpoint behavior)
DEFAULT_SORT_PARSED_OBJECT = ParsedSortObject(
    type=QueryFieldTypeT.DATETIME,
    name='updated_at',
    gid=None,
    direction='desc',
)
DEFAULT_SORT_OBJECT = SortObject(
    name='updated_at',
    direction='desc',
)


async def _get_custom_field_groups() -> dict[str, m.CustomField]:
    """Get custom field groups deduplicated by gid."""
    fields = await m.CustomField.find(with_children=True).to_list()
    groups = {}
    for field in fields:
        if field.gid not in groups:
            groups[field.gid] = field
    return groups


async def _get_all_custom_fields() -> dict[str, list[m.CustomField]]:
    """Get all custom fields grouped by name (for parsing)."""
    fields = await m.CustomField.find(with_children=True).to_list()
    res = {}
    for field in fields:
        res.setdefault(field.name.lower(), []).append(field)
    return res


def _create_available_field(
    field: m.CustomField,
) -> AvailableFieldRootModel:
    """Create available field model from custom field."""
    field_class = CUSTOM_FIELD_AVAILABLE_MAP.get(field.type)
    if not field_class:
        raise ValueError(f'Unknown field type: {field.type}')

    return AvailableFieldRootModel(
        root=field_class(
            type=field.type,
            name=field.name,
            gid=field.gid,
        )
    )


async def _collect_field_options(
    field: m.CustomField,
) -> list[Any]:
    """Collect all options from field group using same pattern as select options endpoint."""
    group_fields = await m.CustomField.find(
        m.CustomField.gid == field.gid, with_children=True
    ).to_list()

    try:
        all_options = []
        for group_field in group_fields:
            if group_field.type in OPTION_FIELD_TYPES:
                all_options.extend(group_field.enum_options or [])
            elif group_field.type in STATE_OPTION_FIELD_TYPES:
                all_options.extend(group_field.state_options or [])
            elif group_field.type in VERSION_OPTION_FIELD_TYPES:
                all_options.extend(group_field.version_options or [])
            elif group_field.type in OWNED_OPTION_FIELD_TYPES:
                all_options.extend(group_field.owned_options or [])
            elif group_field.type in SPRINT_OPTION_FIELD_TYPES:
                all_options.extend(group_field.options or [])

        return all_options
    except (AttributeError, ValueError):
        return []


def _parse_field_value(field_val: str) -> Any:
    """Parse field value from query string."""
    if field_val == 'null':
        return None
    if field_val.startswith('"') and field_val.endswith('"'):
        return field_val[1:-1]
    return field_val


def _contains_or_operator_in_tree(node: Node) -> bool:
    """Check if the parse tree contains any OR operators."""
    if isinstance(node, OperatorNode):
        if node.operator == LogicalOperatorT.OR:
            return True
        return _contains_or_operator_in_tree(
            node.left
        ) or _contains_or_operator_in_tree(node.right)
    return False


def _extract_expressions_from_tree(node: Node) -> list[str]:
    """Extract all expression strings from the parse tree."""
    if isinstance(node, ExpressionNode):
        return [node.expression]
    if isinstance(node, OperatorNode):
        left_exprs = _extract_expressions_from_tree(node.left)
        right_exprs = _extract_expressions_from_tree(node.right)
        return left_exprs + right_exprs
    return []


async def _create_parsed_field_object(
    field_name: str, parsed_value: Any
) -> ParsedQueryObjectRootModel | None:
    """Create a parsed field object for a reserved field."""
    if field_name in ('subject', 'text', 'id'):
        return ParsedQueryObjectRootModel(
            root=StringCustomFieldParsed(
                type=QueryFieldTypeT.STRING,
                name=field_name,
                value=parsed_value,
                gid=None,
            )
        )

    if field_name in ('updated_at', 'created_at'):
        return ParsedQueryObjectRootModel(
            root=DateTimeCustomFieldParsed(
                type=QueryFieldTypeT.DATETIME,
                name=field_name,
                value=parsed_value,
                gid=None,
            )
        )

    if field_name in ('updated_by', 'created_by'):
        user = await m.User.find_one(m.User.email == parsed_value)
        user_output = UserOutput.from_obj(user) if user else None
        return ParsedQueryObjectRootModel(
            root=UserCustomFieldParsed(
                type=QueryFieldTypeT.USER,
                name=field_name,
                value=user_output,
                gid=None,
            )
        )

    if field_name == 'project':
        project = await m.Project.find_one(m.Project.slug == parsed_value)
        project_output = ProjectShortOutput.from_obj(project) if project else None
        return ParsedQueryObjectRootModel(
            root=ProjectFieldParsed(
                type=QueryFieldTypeT.PROJECT,
                name=field_name,
                value=project_output,
                gid=None,
            )
        )

    if field_name == 'tag':
        tag = await m.Tag.find_one(m.Tag.name == parsed_value)
        tag_output = TagLinkField.from_obj(tag) if tag else None
        return ParsedQueryObjectRootModel(
            root=TagFieldParsed(
                type=QueryFieldTypeT.TAG,
                name=field_name,
                value=tag_output,
                gid=None,
            )
        )

    return None


async def _create_parsed_custom_field_object(
    field: m.CustomField, parsed_value: Any
) -> ParsedQueryObjectRootModel | None:
    """Create a parsed field object for a custom field with correct type."""
    field_class = CUSTOM_FIELD_PARSED_MAP.get(field.type)
    if not field_class:
        return None

    final_value = parsed_value
    is_already_converted = isinstance(
        parsed_value, (ShortOptionOutput, UserOutput, ProjectShortOutput, TagLinkField)
    )

    if not is_already_converted:
        if field.type in OPTION_BASED_FIELD_TYPES:
            converted_value = await _convert_option_value_to_output(field, parsed_value)
            if converted_value is not None:
                final_value = converted_value
        elif field.type in USER_BASED_FIELD_TYPES:
            converted_value = await _convert_entity_value_to_output(
                'user', parsed_value
            )
            if converted_value is not None:
                final_value = converted_value

    return ParsedQueryObjectRootModel(
        root=field_class(
            name=field.name,
            value=final_value,
            gid=field.gid,
        )
    )


async def _find_matching_custom_field(
    fields: list[m.CustomField], parsed_value: Any
) -> tuple[m.CustomField, Any] | None:
    """Find the field in the group that can successfully convert the parsed value."""
    for field in fields:
        try:
            if field.type in OPTION_BASED_FIELD_TYPES:
                converted_value = await _convert_option_value_to_output(
                    field, parsed_value
                )
                if converted_value is not None:
                    return field, converted_value
            elif field.type in USER_BASED_FIELD_TYPES:
                converted_value = await _convert_entity_value_to_output(
                    'user', parsed_value
                )
                if converted_value is not None:
                    return field, converted_value
            else:
                return field, parsed_value

        except (AttributeError, ValueError, TypeError) as e:
            logger.debug('Field conversion failed for %s: %s', field.name, e)
            continue

    if fields:
        return fields[0], parsed_value

    return None


async def _convert_option_value_to_output(
    field: m.CustomField, raw_value: Any
) -> ShortOptionOutput | None:
    """Convert raw option value to ShortOptionOutput for option-based fields."""
    if raw_value is None or not isinstance(raw_value, str):
        return None

    all_options = await _collect_field_options(field)

    for option in all_options:
        if hasattr(option, 'value') and option.value == raw_value:
            return ShortOptionOutput.from_obj(option)

    return ShortOptionOutput(value=raw_value, color=None)


async def _convert_entity_value_to_output(
    entity_type: str, raw_value: Any
) -> UserOutput | ProjectShortOutput | TagLinkField | None:
    """Convert raw value to structured output for entity-based fields."""
    if raw_value is None:
        return None

    if not isinstance(raw_value, str):
        return None

    if entity_type == 'user':
        user = await m.User.find_one(m.User.email == raw_value)
        return UserOutput.from_obj(user) if user else None

    if entity_type == 'project':
        project = await m.Project.find_one(m.Project.slug == raw_value)
        return ProjectShortOutput.from_obj(project) if project else None

    if entity_type == 'tag':
        tag = await m.Tag.find_one(m.Tag.name == raw_value)
        return TagLinkField.from_obj(tag) if tag else None

    return None


async def _parse_query_to_objects(
    query: str,
) -> list[ParsedQueryObjectRootModel]:
    """Parse query string into filter objects using proper logical expression parsing."""
    if not query:
        return []

    try:
        search_part, _ = split_query(query)
        check_brackets(search_part)
        tree = parse_logical_expression(search_part)
        if not tree:
            return []

        if _contains_or_operator_in_tree(tree):
            raise HTTPException(
                status_code=HTTPStatus.BAD_REQUEST,
                detail='OR operator is not supported in query builder. Only AND operations are allowed.',
            )

        expressions = _extract_expressions_from_tree(tree)
        custom_fields = await _get_all_custom_fields()
        filters = []

        for expr in expressions:
            if expr in HASHTAG_VALUES:
                filters.append(
                    ParsedQueryObjectRootModel(
                        root=HashtagFieldParsed(
                            name=expr,  # Use hashtag value as name
                            value=None,  # No separate value needed
                        )
                    )
                )
                continue

            if ':' not in expr:
                continue

            field_name, field_val = expr.split(':', 1)
            field_name = field_name.strip()
            field_val = field_val.strip()

            if field_name.startswith('"') and field_name.endswith('"'):
                field_name = field_name[1:-1]
            field_name = field_name.lower()

            parsed_value = _parse_field_value(field_val)

            if field_name in RESERVED_FIELDS:
                filter_obj = await _create_parsed_field_object(field_name, parsed_value)
                if filter_obj:
                    filters.append(filter_obj)

            elif field_name in custom_fields:
                field_match = await _find_matching_custom_field(
                    custom_fields[field_name], parsed_value
                )
                if field_match:
                    field, converted_value = field_match
                    filter_obj = await _create_parsed_custom_field_object(
                        field,
                        converted_value,
                    )
                    if filter_obj:
                        filters.append(filter_obj)

        return filters

    except BracketError as err:
        if err.value:
            raise HTTPException(
                status_code=HTTPStatus.BAD_REQUEST,
                detail=f'Invalid bracket "{err.value}" at position {err.pos}',
            ) from err
        raise HTTPException(
            status_code=HTTPStatus.BAD_REQUEST,
            detail=f'Missing bracket at position {err.pos}',
        ) from err

    except OperatorError as err:
        raise HTTPException(
            status_code=HTTPStatus.BAD_REQUEST,
            detail=f'Invalid operator "{err.operator}" at position {err.pos}',
        ) from err

    except UnexpectedEndOfExpressionError as err:
        raise HTTPException(
            status_code=HTTPStatus.BAD_REQUEST,
            detail=f'Unexpected end of expression after "{err.previous_token}"',
        ) from err


async def _build_query_from_filters(
    filters: list[dict[str, Any]],
) -> str:
    """Build query string from filter objects using existing filter logic."""
    if not filters:
        return ''

    query_parts = []
    for filter_obj in filters:
        if filter_obj.get('type') == 'hashtag':
            query_parts.append(filter_obj['name'])
        else:
            field_name = filter_obj.get('name', '')
            field_value = filter_obj.get('value')

            if not field_name:
                continue

            if field_value is None:
                field_value = 'null'

            if isinstance(field_value, dict):
                if 'email' in field_value:
                    value_str = field_value['email']
                elif 'slug' in field_value:
                    value_str = field_value['slug']
                elif 'name' in field_value:
                    value_str = field_value['name']
                elif 'value' in field_value:
                    value_str = field_value['value']
                else:
                    value_str = str(field_value)
            else:
                value_str = str(field_value)

            if not value_str or ' ' in value_str or ':' in value_str:
                value_str = f'"{value_str}"'

            query_parts.append(f'{field_name}: {value_str}')

    return ' and '.join(query_parts)


def _create_reserved_fields(
    allowed_fields: Collection[str],
) -> list[AvailableFieldRootModel]:
    """Create available field objects for all reserved fields."""
    available_fields = []

    for field_name in allowed_fields:
        if field_name not in (RESERVED_FIELDS | HASHTAG_VALUES):
            continue
        if field_name in ('subject', 'text', 'id'):
            available_fields.append(
                AvailableFieldRootModel(
                    root=StringCustomFieldAvailable(
                        type=QueryFieldTypeT.STRING,
                        name=field_name,
                        gid=None,
                    )
                )
            )
            continue
        if field_name in ('updated_at', 'created_at'):
            available_fields.append(
                AvailableFieldRootModel(
                    root=DateTimeCustomFieldAvailable(
                        type=QueryFieldTypeT.DATETIME,
                        name=field_name,
                        gid=None,
                    )
                )
            )
            continue
        if field_name in ('updated_by', 'created_by'):
            available_fields.append(
                AvailableFieldRootModel(
                    root=UserCustomFieldAvailable(
                        type=QueryFieldTypeT.USER,
                        name=field_name,
                        gid=None,
                    )
                )
            )
            continue
        if field_name == 'project':
            available_fields.append(
                AvailableFieldRootModel(
                    root=ProjectFieldAvailable(
                        type=QueryFieldTypeT.PROJECT,
                        name='project',
                    )
                )
            )
            continue
        if field_name == 'tag':
            available_fields.append(
                AvailableFieldRootModel(
                    root=TagFieldAvailable(type=QueryFieldTypeT.TAG, name='tag')
                )
            )
        if field_name in HASHTAG_VALUES:
            available_fields.append(
                AvailableFieldRootModel(
                    root=HashtagFieldAvailable(
                        type=QueryFieldTypeT.HASHTAG,
                        name=field_name,
                    )
                )
            )

    return available_fields


def _get_used_field_names(
    filters: list[ParsedQueryObjectRootModel],
) -> set[str]:
    """Extract field names that are already used in filters."""
    used_names = set()
    for filter_obj in filters:
        field_name = filter_obj.root.name.lower()
        used_names.add(field_name)
    return used_names


def _filter_available_fields(
    available_fields: list[AvailableFieldRootModel], used_field_names: set[str]
) -> list[AvailableFieldRootModel]:
    """Filter out fields that are already used in the query."""
    return [
        field
        for field in available_fields
        if field.root.name.lower() not in used_field_names
    ]


async def _parse_sort_from_query(query: str) -> list[ParsedSortObject]:
    """Parse sort expressions from query string into ParsedSortObject instances.

    When no sort is specified, returns the default sort (updated_at desc).
    """
    if not query:
        return [DEFAULT_SORT_PARSED_OBJECT]

    _, sort_part = split_query(query)
    if not sort_part:
        return [DEFAULT_SORT_PARSED_OBJECT]

    try:
        tree = sort_parser.parse(sort_part)
        transformer = SortTransformer()
        parsed_fields: list[tuple[str, bool]] = transformer.transform(tree)
    except Exception as err:
        logger.debug('Sort parsing failed: %s', err)
        raise HTTPException(
            status_code=HTTPStatus.BAD_REQUEST,
            detail=f'Invalid sort expression: {sort_part}',
        ) from err

    if not parsed_fields:
        return [DEFAULT_SORT_PARSED_OBJECT]

    custom_fields = await _get_all_custom_fields()
    sort_objects = []

    for field_name, is_descending in parsed_fields:
        direction: Literal['asc', 'desc'] = 'desc' if is_descending else 'asc'
        field_name_lower = field_name.lower()

        if field_name_lower in RESERVED_FIELDS:
            sort_objects.append(
                ParsedSortObject(
                    type=_get_reserved_field_type(field_name_lower),
                    name=field_name_lower,
                    gid=None,
                    direction=direction,
                )
            )
            continue
        if field_name_lower in custom_fields:
            field = custom_fields[field_name_lower][0]
            sort_objects.append(
                ParsedSortObject(
                    type=QueryFieldTypeT(field.type),
                    name=field.name,
                    gid=field.gid,
                    direction=direction,
                )
            )
            continue
        raise HTTPException(
            status_code=HTTPStatus.BAD_REQUEST,
            detail=f'Unknown field for sorting: {field_name}',
        )

    return sort_objects


def _get_reserved_field_type(field_name: str) -> QueryFieldTypeT:
    """Get the QueryFieldTypeT for a reserved field name."""
    if field_name in ('subject', 'text', 'id'):
        return QueryFieldTypeT.STRING
    if field_name in ('updated_at', 'created_at'):
        return QueryFieldTypeT.DATETIME
    if field_name in ('updated_by', 'created_by'):
        return QueryFieldTypeT.USER
    if field_name == 'project':
        return QueryFieldTypeT.PROJECT
    if field_name == 'tag':
        return QueryFieldTypeT.TAG
    return QueryFieldTypeT.STRING


async def _build_sort_query_string(sort_objects: list[SortObject] | None) -> str:
    """Build sort query string from SortObject instances.

    Returns empty string when sort_objects contains only the default sort.
    """
    if not sort_objects:
        return ''

    if len(sort_objects) == 1 and sort_objects[0] == DEFAULT_SORT_OBJECT:
        return ''

    sort_expressions = []

    for sort_obj in sort_objects:
        direction_suffix = ' desc' if sort_obj.direction == 'desc' else ''
        sort_expressions.append(f'{sort_obj.name}{direction_suffix}')

    return 'sort by: ' + ', '.join(sort_expressions)


@router.post(
    '/query-builder',
    dependencies=[Depends(current_user_context_dependency)],
    responses=error_responses(
        (HTTPStatus.BAD_REQUEST, ErrorOutput),
        (HTTPStatus.UNAUTHORIZED, ErrorOutput),
        (HTTPStatus.FORBIDDEN, ErrorOutput),
        (HTTPStatus.UNPROCESSABLE_ENTITY, ErrorOutput),
    ),
)
async def get_query_builder_data(
    body: QueryBuilderInput,
) -> SuccessPayloadOutput[QueryBuilderOutput]:
    """Bidirectional query builder endpoint.

    Parse Mode: Provide 'query' to parse query string into structured objects
    Build Mode: Provide 'filters' and 'sort_by' to build query string from structured objects

    Both modes return the same unified output format.
    """
    if body.is_build_mode:
        # Build mode: construct query from filters and sort objects
        filter_query = await _build_query_from_filters(body.filters)
        sort_query = await _build_sort_query_string(body.sort_by)
        built_query = f'{filter_query} {sort_query}'.strip()
    else:
        # Parse mode: use provided query
        built_query = body.query or ''

    # Parse filters and sort from the built/provided query
    filters = await _parse_query_to_objects(built_query)
    sort_by = await _parse_sort_from_query(built_query)

    custom_field_groups = await _get_custom_field_groups()

    # Generate available fields for filtering
    available_fields = _create_reserved_fields(RESERVED_AVAILABLE_FOR_FILTERING)
    available_fields.extend(
        [_create_available_field(field) for field in custom_field_groups.values()]
    )

    used_field_names = _get_used_field_names(filters)
    filtered_available_fields = _filter_available_fields(
        available_fields, used_field_names
    )
    filtered_available_fields.sort(key=lambda field: field.root.name.lower())

    # Generate available fields for sorting
    available_sort_fields = _create_reserved_fields(RESERVED_AVAILABLE_FOR_SORTING)
    available_sort_fields.extend(
        [_create_available_field(field) for field in custom_field_groups.values()]
    )
    available_sort_fields.sort(key=lambda field: field.root.name.lower())

    return SuccessPayloadOutput(
        payload=QueryBuilderOutput(
            query=built_query,
            filters=filters,
            available_fields=filtered_available_fields,
            sort_by=sort_by,
            available_sort_fields=available_sort_fields,
        )
    )


@router.get(
    '/favorites/list',
    dependencies=[Depends(current_user_context_dependency)],
    responses=error_responses(
        (HTTPStatus.UNAUTHORIZED, ErrorOutput),
        (HTTPStatus.FORBIDDEN, ErrorOutput),
    ),
)
async def list_favorite_filters() -> BaseListOutput[FavoriteFilterOutput]:
    """List user's favorite filters combining favorite projects and saved searches."""
    user_ctx = current_user()
    filters = []

    project_query = m.Project.find().sort(m.Project.slug)
    if not user_ctx.user.is_admin:
        project_query = project_query.find(
            bo.In(
                m.Project.id,
                user_ctx.get_projects_with_permission(ProjectPermissions.PROJECT_READ),
            ),
        )

    favorite_projects = await project_query.find(
        bo.Eq(m.Project.favorite_of, user_ctx.user.id)
    ).to_list()

    filters.extend(
        [
            FavoriteFilterOutput(
                name=project.name,
                type=FavoriteFilterType.PROJECT,
                query=f'project: {project.slug}',
            )
            for project in favorite_projects
        ]
    )

    return BaseListOutput.make(
        items=filters,
        count=len(filters),
        limit=len(filters),
        offset=0,
    )
