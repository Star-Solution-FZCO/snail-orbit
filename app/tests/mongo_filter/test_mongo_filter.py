import pytest
from beanie import Document
from pydantic import BaseModel


class ObjectField(BaseModel):
    name: str


class MockDocument(Document):
    name: str
    str_field: str
    int_field: int
    int_list_field: list[int]
    str_list_field: list[str]
    bool_field: bool
    float_field: float
    float_list_field: list[float]
    obj: ObjectField


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ('filter_', 'expected'),
    [
        pytest.param('', {}, id='empty'),
        pytest.param('name: test', {'name': 'test'}, id='name'),
        pytest.param('int_field:10', {'int_field': 10}, id='int_field'),
        pytest.param('int_field___eq:10', {'int_field': 10}, id='int_field___eq'),
        pytest.param(
            'int_field___ne:10',
            {'int_field': {'$ne': 10}},
            id='int_field___ne',
        ),
        pytest.param(
            'int_field___lt:10',
            {'int_field': {'$lt': 10}},
            id='int_field___lt',
        ),
        pytest.param(
            'int_field___lte:10',
            {'int_field': {'$lte': 10}},
            id='int_field___lte',
        ),
        pytest.param(
            'int_field___gt:10',
            {'int_field': {'$gt': 10}},
            id='int_field___gt',
        ),
        pytest.param(
            'int_field___gte:10',
            {'int_field': {'$gte': 10}},
            id='int_field___gte',
        ),
        pytest.param(
            'int_field___in:10,20',
            {'int_field': {'$in': [10, 20]}},
            id='int_field___in',
        ),
        pytest.param(
            'int_field___nin:10,20',
            {'int_field': {'$nin': [10, 20]}},
            id='int_field___nin',
        ),
        pytest.param('str_field:"test"', {'str_field': 'test'}, id='str_field___quote'),
        pytest.param(
            'str_field:test',
            {'str_field': 'test'},
            id='str_field___no_quote',
        ),
        pytest.param(
            'str_field___eq:"test test"',
            {'str_field': 'test test'},
            id='str_field___eq',
        ),
        pytest.param(
            'str_field___ne:"test"',
            {'str_field': {'$ne': 'test'}},
            id='str_field___ne',
        ),
        pytest.param(
            'str_field___contains:"test"',
            {'str_field': {'$regex': '.*test.*'}},
            id='str_field___contains',
        ),
        pytest.param(
            'str_field___icontains:"test"',
            {'str_field': {'$regex': '.*test.*', '$options': 'i'}},
            id='str_field___icontains',
        ),
        pytest.param(
            'str_field___startswith:"test"',
            {'str_field': {'$regex': '^test.*'}},
            id='str_field___startswith',
        ),
        pytest.param(
            'str_field___endswith:"test"',
            {'str_field': {'$regex': '.*test$'}},
            id='str_field___endswith',
        ),
        pytest.param(
            'str_field___in:"test1","test2"',
            {'str_field': {'$in': ['test1', 'test2']}},
            id='str_field___in',
        ),
        pytest.param(
            'str_field___nin:"test1","test2"',
            {'str_field': {'$nin': ['test1', 'test2']}},
            id='str_field___nin',
        ),
        pytest.param('bool_field:True', {'bool_field': True}, id='bool_field___True'),
        pytest.param(
            'bool_field:False',
            {'bool_field': False},
            id='bool_field___False',
        ),
        pytest.param('bool_field:1', {'bool_field': True}, id='bool_field___1'),
        pytest.param('bool_field:0', {'bool_field': False}, id='bool_field___0'),
        pytest.param('float_field:1.0', {'float_field': 1.0}, id='float_field___1.0'),
        pytest.param('float_field:0', {'float_field': 0.0}, id='float_field___0'),
        pytest.param('float_field:122', {'float_field': 122.0}, id='float_field___0'),
        pytest.param('float_field:1.2', {'float_field': 1.2}, id='float_field___1.2'),
        pytest.param(
            'float_field___eq:1.2',
            {'float_field': 1.2},
            id='float_field___eq',
        ),
        pytest.param(
            'float_field___ne:1.2',
            {'float_field': {'$ne': 1.2}},
            id='float_field___ne',
        ),
        pytest.param(
            'float_field___lt:1.2',
            {'float_field': {'$lt': 1.2}},
            id='float_field___lt',
        ),
        pytest.param(
            'float_field___lte:1.2',
            {'float_field': {'$lte': 1.2}},
            id='float_field___lte',
        ),
        pytest.param(
            'float_field___gt:1.2',
            {'float_field': {'$gt': 1.2}},
            id='float_field___gt',
        ),
        pytest.param(
            'float_field___gte:1.2',
            {'float_field': {'$gte': 1.2}},
            id='float_field___gte',
        ),
        pytest.param(
            'float_field___in:1.2,1.3',
            {'float_field': {'$in': [1.2, 1.3]}},
            id='float_field___in',
        ),
        pytest.param(
            'float_field___nin:1.2,1.3,30',
            {'float_field': {'$nin': [1.2, 1.3, 30.0]}},
            id='float_field___nin',
        ),
        pytest.param('int_list_field:1', {'int_list_field': 1}, id='int_list_field'),
        pytest.param(
            'int_list_field___in:1,2,3',
            {'int_list_field': {'$in': [1, 2, 3]}},
            id='int_list_field___in',
        ),
        pytest.param(
            'int_list_field___nin:1,2,3',
            {'int_list_field': {'$nin': [1, 2, 3]}},
            id='int_list_field___nin',
        ),
        pytest.param(
            'str_list_field:"1"',
            {'str_list_field': '1'},
            id='str_list_field',
        ),
        pytest.param(
            'str_list_field___in:"1","2","3"',
            {'str_list_field': {'$in': ['1', '2', '3']}},
            id='str_list_field___in',
        ),
        pytest.param(
            'str_list_field___nin:"xxx","2",yyyy',
            {'str_list_field': {'$nin': ['xxx', '2', 'yyyy']}},
            id='str_list_field___nin',
        ),
        pytest.param(
            'float_list_field:1.0',
            {'float_list_field': 1.0},
            id='float_list_field',
        ),
        pytest.param(
            'float_list_field___in:1.0,2.0,3.0',
            {'float_list_field': {'$in': [1.0, 2.0, 3.0]}},
            id='float_list_field___in',
        ),
        pytest.param(
            'float_list_field___nin:1.0,2.0,3.0',
            {'float_list_field': {'$nin': [1.0, 2.0, 3.0]}},
            id='float_list_field___nin',
        ),
        pytest.param('obj__name:test', {'obj.name': 'test'}, id='obj.name'),
        pytest.param(
            'str_field: test and int_field: 10',
            {'$and': [{'str_field': 'test'}, {'int_field': 10}]},
            id='simple_and',
        ),
        pytest.param(
            'str_field: test and int_field: 10 and bool_field: True',
            {
                '$and': [
                    {'str_field': 'test'},
                    {'int_field': 10},
                    {'bool_field': True},
                ],
            },
            id='and_and',
        ),
        pytest.param(
            'str_field: test or int_field: 10',
            {'$or': [{'str_field': 'test'}, {'int_field': 10}]},
            id='simple_or',
        ),
        pytest.param(
            'str_field: test and int_field: 10 or bool_field: True',
            {
                '$or': [
                    {'$and': [{'str_field': 'test'}, {'int_field': 10}]},
                    {'bool_field': True},
                ],
            },
            id='and_or',
        ),
        pytest.param(
            'str_field: test and (int_field: 10 or bool_field: True)',
            {
                '$and': [
                    {'str_field': 'test'},
                    {'$or': [{'int_field': 10}, {'bool_field': True}]},
                ],
            },
            id='and_or_brackets',
        ),
        pytest.param(
            'str_field: test or not int_field: 10',
            {'$or': [{'str_field': 'test'}, {'int_field': {'$not': {'$eq': 10}}}]},
            id='and_not',
        ),
        pytest.param(
            'not str_field: test',
            {'str_field': {'$not': {'$eq': 'test'}}},
            id='not',
        ),
        pytest.param(
            'str_field: test and not int_field: 10',
            {'$and': [{'str_field': 'test'}, {'int_field': {'$not': {'$eq': 10}}}]},
            id='and_not',
        ),
        pytest.param(
            'str_field: test and not (int_field: 10 or bool_field: True)',
            {
                '$and': [
                    {'str_field': 'test'},
                    {'$nor': [{'int_field': 10}, {'bool_field': True}]},
                ],
            },
            id='and_not_brackets',
        ),
        pytest.param(
            'not (int_field: 10 or bool_field: True)',
            {'$nor': [{'int_field': 10}, {'bool_field': True}]},
            id='nor',
        ),
        pytest.param(
            'not (int_field: 10 or bool_field: True) and str_field: test',
            {
                '$and': [
                    {'$nor': [{'int_field': 10}, {'bool_field': True}]},
                    {'str_field': 'test'},
                ],
            },
            id='nor_and',
        ),
        pytest.param(
            'not (int_field: 10 or bool_field: True) or str_field: test',
            {
                '$or': [
                    {'$nor': [{'int_field': 10}, {'bool_field': True}]},
                    {'str_field': 'test'},
                ],
            },
            id='nor_or',
        ),
        pytest.param(
            'not (int_field: 10 or bool_field: True) and not str_field: test',
            {
                '$and': [
                    {'$nor': [{'int_field': 10}, {'bool_field': True}]},
                    {'str_field': {'$not': {'$eq': 'test'}}},
                ],
            },
            id='nor_and_not',
        ),
        pytest.param(
            'not (int_field: 10 or bool_field: True) or not str_field: test',
            {
                '$or': [
                    {'$nor': [{'int_field': 10}, {'bool_field': True}]},
                    {'str_field': {'$not': {'$eq': 'test'}}},
                ],
            },
            id='nor_or_not',
        ),
        pytest.param(
            'not (int_field: 10 or bool_field: True) and not (str_field: test or float_field: 1.0)',
            {
                '$and': [
                    {'$nor': [{'int_field': 10}, {'bool_field': True}]},
                    {'$nor': [{'str_field': 'test'}, {'float_field': 1.0}]},
                ],
            },
            id='nor_and_nor',
        ),
        pytest.param(
            'not (int_field: 10 or bool_field: True) or not (str_field: test or float_field: 1.0)',
            {
                '$or': [
                    {'$nor': [{'int_field': 10}, {'bool_field': True}]},
                    {'$nor': [{'str_field': 'test'}, {'float_field': 1.0}]},
                ],
            },
            id='nor_or_nor',
        ),
        pytest.param(
            'not (int_field: 10 or bool_field: True or str_field: test)',
            {'$nor': [{'int_field': 10}, {'bool_field': True}, {'str_field': 'test'}]},
            id='nor_or_nor',
        ),
        pytest.param(
            'not (int_field: 10 and bool_field: True and str_field: test)',
            {
                '$or': [
                    {'int_field': {'$not': {'$eq': 10}}},
                    {'bool_field': {'$not': {'$eq': True}}},
                    {'str_field': {'$not': {'$eq': 'test'}}},
                ],
            },
            id='not_and',
        ),
        pytest.param('not not int_field: 10', {'int_field': 10}, id='not_not'),
    ],
)
async def test_mongo_filter(filter_: str, expected: dict) -> None:
    from pm.utils.mongo_filter import parse_filter

    assert parse_filter(MockDocument, filter_) == expected


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ('sort_', 'expected'),
    [
        pytest.param('name', ['name'], id='name'),
        pytest.param('-name', ['-name'], id='-name'),
        pytest.param('name,-int_field', ['name', '-int_field'], id='name,-int_field'),
        pytest.param(
            'name,-int_field,str_field',
            ['name', '-int_field', 'str_field'],
            id='name,-int_field,str_field',
        ),
        pytest.param('', [], id='empty'),
    ],
)
async def test_mongo_sort(sort_: str, expected: list[str]) -> None:
    from pm.utils.mongo_filter import parse_sort

    assert parse_sort(MockDocument, sort_) == expected
