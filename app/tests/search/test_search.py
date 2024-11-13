import mock
import pytest

from ._mock import get_fake_custom_fields


@mock.patch('pm.api.search.issue._get_custom_fields', new_callable=mock.AsyncMock)
@pytest.mark.asyncio
async def test_search(mock__get_custom_fields: mock.AsyncMock) -> None:
    mock__get_custom_fields.return_value = get_fake_custom_fields()

    from pm.api.search.issue import get_suggestions

    res = await get_suggestions('State: open')
    mock__get_custom_fields.assert_awaited_once()
    assert res == ['AND', 'OR']
