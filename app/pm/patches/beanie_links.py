"""
This module contains a patch for the Beanie ODM library to allow for ordered fetching of linked documents in MongoDB queries.
https://github.com/BeanieODM/beanie/issues/930#issuecomment-2581508383
"""

from collections.abc import Callable
from functools import partial

from beanie.odm.fields import LinkInfo, LinkTypes


def construct_query_with_ordered_fetch_links(
    link_info: LinkInfo,
    queries: list,
    database_major_version: int,
    current_depth: int | None = None,
    *,
    original_construct_query: Callable,
) -> list | None:
    """Construct a query with ordered fetch_links.
    This function is a patch for beanie.odm.utils.find.construct_query.
    It allows fetching nested fields in a specific order.
    It only overrides the behavior for LinkTypes.LIST and LinkTypes.OPTIONAL_LIST.
    """
    if link_info.is_fetchable is False or (
        current_depth is not None and current_depth <= 0
    ):
        return None

    if link_info.link_type in [  # noqa: SIM102
        LinkTypes.LIST,
        LinkTypes.OPTIONAL_LIST,
    ]:
        if database_major_version >= 5 or link_info.nested_links is None:  # noqa: PLR2004
            queries.append(
                {
                    '$lookup': {
                        'from': link_info.document_class.get_motor_collection().name,  # type: ignore[attr-defined]
                        'let': {
                            'ids': {
                                '$ifNull': [f'${link_info.lookup_field_name}.$id', []]
                            }
                        },
                        'pipeline': [
                            {'$match': {'$expr': {'$in': ['$_id', '$$ids']}}},
                            {
                                '$addFields': {
                                    '_beanie_fetch_order': {
                                        '$indexOfArray': ['$$ids', '$_id']
                                    }
                                }
                            },
                            {'$sort': {'_beanie_fetch_order': 1}},
                            {'$unset': '_beanie_fetch_order'},
                        ],
                        'as': link_info.field_name,
                    }
                }
            )

            new_depth = current_depth - 1 if current_depth is not None else None
            if link_info.nested_links is not None:
                for nested_link in link_info.nested_links:
                    construct_query_with_ordered_fetch_links(
                        link_info=link_info.nested_links[nested_link],
                        queries=queries[-1]['$lookup']['pipeline'],
                        database_major_version=database_major_version,
                        current_depth=new_depth,
                        original_construct_query=original_construct_query,
                    )

            return queries

    return original_construct_query(
        link_info, queries, database_major_version, current_depth
    )


def patch_beanie_construct_query() -> None:
    """Patch beanie.odm.utils.find.construct_query to support ordered fetch_links."""
    import beanie.odm.utils.find as find_module  # pylint: disable=import-outside-toplevel

    original_construct_query = find_module.construct_query
    find_module.construct_query = partial(
        construct_query_with_ordered_fetch_links,
        original_construct_query=original_construct_query,
    )
