"""add interface language

Revision ID: 20260617_interface_language
Revises: 20260610_stars_tickets
Create Date: 2026-06-17
"""

from alembic import op
import sqlalchemy as sa


revision = "20260617_interface_language"
down_revision = "20260610_stars_tickets"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("interface_language", sa.String(length=8), nullable=False, server_default="en"),
    )


def downgrade() -> None:
    op.drop_column("users", "interface_language")
