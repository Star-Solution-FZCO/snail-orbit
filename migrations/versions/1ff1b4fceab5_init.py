"""init

Revision ID: 1ff1b4fceab5
Revises:
Create Date: 2024-07-29 20:46:39.232618

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1ff1b4fceab5'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('audits',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('object_id', sa.Integer(), nullable=False),
    sa.Column('object_revision', sa.Integer(), nullable=False),
    sa.Column('table_name', sa.String(), nullable=False),
    sa.Column('class_name', sa.String(), nullable=False),
    sa.Column('fields', sa.String(), nullable=False),
    sa.Column('json_data', sa.JSON(none_as_null=True), nullable=False),
    sa.Column('time', sa.DateTime(timezone=True), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('user', sa.String(), nullable=False),
    sa.Column('ip', sa.String(), nullable=False),
    sa.Column('action', sa.String(), nullable=False),
    sa.Column('data', sa.LargeBinary(), nullable=False),
    sa.Column('comment', sa.String(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_audits_class_name'), 'audits', ['class_name'], unique=False)
    op.create_index(op.f('ix_audits_object_id'), 'audits', ['object_id'], unique=False)
    op.create_index(op.f('ix_audits_table_name'), 'audits', ['table_name'], unique=False)
    op.create_index(op.f('ix_audits_time'), 'audits', ['time'], unique=False)
    op.create_index(op.f('ix_audits_user_id'), 'audits', ['user_id'], unique=False)
    op.create_table('projects',
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('description', sa.String(), nullable=True),
    sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('revision', sa.Integer(), nullable=False),
    sa.Column('created', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated', sa.DateTime(timezone=True), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('users',
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('email', sa.String(), nullable=False),
    sa.Column('password_hash', sa.String(), nullable=True),
    sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
    sa.Column('is_admin', sa.Boolean(), server_default=sa.text('false'), nullable=False),
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('revision', sa.Integer(), nullable=False),
    sa.Column('created', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated', sa.DateTime(timezone=True), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
    op.drop_table('projects')
    op.drop_index(op.f('ix_audits_user_id'), table_name='audits')
    op.drop_index(op.f('ix_audits_time'), table_name='audits')
    op.drop_index(op.f('ix_audits_table_name'), table_name='audits')
    op.drop_index(op.f('ix_audits_object_id'), table_name='audits')
    op.drop_index(op.f('ix_audits_class_name'), table_name='audits')
    op.drop_table('audits')
    # ### end Alembic commands ###
