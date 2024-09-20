from datetime import datetime, timedelta

import pm.models as m
from pm.utils.dateutils import utcnow
from pm.workflows import OnChangeWorkflowScript, WorkflowException

__all__ = ('ValidateDueDate',)

MAX_DUE_DATE_PERIOD = 30
DUE_DATE_FIELD = 'Due Date'
ERROR_MSG = 'Due date validation workflow error'


class ValidateDueDate(OnChangeWorkflowScript):
    async def run(self, issue: m.Issue) -> None:
        if not (due_date_field := issue.get_field_by_name(DUE_DATE_FIELD)):
            return
        if not due_date_field.type == m.CustomFieldTypeT.DATE:
            return
        if not (due_date := due_date_field.value):
            return
        today = utcnow().date()
        if isinstance(due_date, datetime):
            due_date = due_date.date()
        if due_date:
            if due_date < today:
                raise WorkflowException(
                    ERROR_MSG,
                    fields_errors={DUE_DATE_FIELD: 'Due date must be in the future'},
                )
            if (due_date - today).days > MAX_DUE_DATE_PERIOD:
                before_date = today + timedelta(days=MAX_DUE_DATE_PERIOD)
                raise WorkflowException(
                    ERROR_MSG,
                    fields_errors={
                        DUE_DATE_FIELD: f'Due date must be before {before_date}'
                    },
                )
