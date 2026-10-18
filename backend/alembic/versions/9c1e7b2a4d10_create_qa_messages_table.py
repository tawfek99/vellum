"""create qa_messages table

Revision ID: 9c1e7b2a4d10
Revises: 5a092d87c56e
Create Date: 2026-10-18 20:30:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "9c1e7b2a4d10"
down_revision: Union[str, Sequence[str], None] = "5a092d87c56e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "qa_messages",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("generation_id", sa.Uuid(), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["generation_id"],
            ["ai_generations.id"],
            name=op.f("fk_qa_messages_generation_id_ai_generations"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_qa_messages")),
    )
    op.create_index(
        op.f("ix_qa_messages_generation_id"),
        "qa_messages",
        ["generation_id"],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_qa_messages_generation_id"), table_name="qa_messages")
    op.drop_table("qa_messages")
