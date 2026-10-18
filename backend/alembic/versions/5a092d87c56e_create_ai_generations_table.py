"""create ai_generations table

Revision ID: 5a092d87c56e
Revises: 6447368fa155
Create Date: 2026-10-18 19:55:24.717108

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "5a092d87c56e"
down_revision: Union[str, Sequence[str], None] = "6447368fa155"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "ai_generations",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("document_id", sa.Uuid(), nullable=True),
        sa.Column("note_id", sa.Uuid(), nullable=True),
        sa.Column("kind", sa.String(length=20), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("result", sa.JSON(), nullable=True),
        sa.Column("provider", sa.String(length=40), nullable=True),
        sa.Column("model", sa.String(length=80), nullable=True),
        sa.Column("error", sa.String(length=1000), nullable=True),
        sa.Column("tokens_used", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["document_id"],
            ["documents.id"],
            name=op.f("fk_ai_generations_document_id_documents"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["note_id"],
            ["notes.id"],
            name=op.f("fk_ai_generations_note_id_notes"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["profiles.id"],
            name=op.f("fk_ai_generations_user_id_profiles"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_ai_generations")),
    )
    op.create_index(
        op.f("ix_ai_generations_user_id"), "ai_generations", ["user_id"], unique=False
    )
    op.create_index(
        op.f("ix_ai_generations_document_id"),
        "ai_generations",
        ["document_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_ai_generations_note_id"), "ai_generations", ["note_id"], unique=False
    )
    op.create_index(op.f("ix_ai_generations_kind"), "ai_generations", ["kind"], unique=False)
    op.create_index(
        op.f("ix_ai_generations_status"), "ai_generations", ["status"], unique=False
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_ai_generations_status"), table_name="ai_generations")
    op.drop_index(op.f("ix_ai_generations_kind"), table_name="ai_generations")
    op.drop_index(op.f("ix_ai_generations_note_id"), table_name="ai_generations")
    op.drop_index(op.f("ix_ai_generations_document_id"), table_name="ai_generations")
    op.drop_index(op.f("ix_ai_generations_user_id"), table_name="ai_generations")
    op.drop_table("ai_generations")
