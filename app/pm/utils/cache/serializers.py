from beanie import PydanticObjectId

__all__ = (
    'deserialize_objectid_set',
    'serialize_objectid_set',
)


def serialize_objectid_set(data: set[PydanticObjectId]) -> list[str]:
    """Convert set of PydanticObjectId to list of strings for JSON serialization."""
    return [str(obj_id) for obj_id in data]


def deserialize_objectid_set(data: list[str]) -> set[PydanticObjectId]:
    """Convert list of ObjectId strings back to set of PydanticObjectId."""
    return {PydanticObjectId(id_str) for id_str in data}
