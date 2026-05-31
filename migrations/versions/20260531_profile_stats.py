"""add profile stats aggregates

Revision ID: 20260531_profile_stats
Revises:
Create Date: 2026-05-31
"""

from alembic import op
import sqlalchemy as sa


revision = "20260531_profile_stats"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("correct_messages_count", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column("users", sa.Column("active_dates", sa.JSON(), nullable=True))
    op.execute("UPDATE users SET active_dates = '[]' WHERE active_dates IS NULL")


def downgrade() -> None:
    op.drop_column("users", "active_dates")
    op.drop_column("users", "correct_messages_count")
