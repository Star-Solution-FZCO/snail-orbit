from collections.abc import Collection

__all__ = ('filter_dict',)


def filter_dict(
    src: dict,
    include_keys: Collection[str] | None = None,
    excluded_keys: Collection[str] | None = None,
) -> dict:
    def _key_filter(key: str) -> bool:
        res = True
        if include_keys is not None:
            res &= key in include_keys
        if excluded_keys is not None:
            res &= key not in excluded_keys
        return res

    return {k: v for k, v in src.items() if _key_filter(k)}
