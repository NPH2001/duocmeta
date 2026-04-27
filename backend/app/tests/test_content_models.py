from app.models.base import Base
from app.models.content import Page, Post, PostTag, Redirect, SeoMetadata, Tag
from app.models.identity import User


def test_content_tables_are_registered_on_metadata() -> None:
    assert {"pages", "posts", "tags", "post_tags", "seo_metadata", "redirects"}.issubset(Base.metadata.tables)


def test_page_model_matches_required_content_fields() -> None:
    pages_table = Page.__table__
    index_names = {index.name for index in pages_table.indexes}
    foreign_keys = {foreign_key.parent.name: foreign_key for foreign_key in pages_table.foreign_keys}

    assert pages_table.c.title.nullable is False
    assert pages_table.c.slug.nullable is False
    assert pages_table.c.content.nullable is False
    assert pages_table.c.status.nullable is False
    assert pages_table.c.published_at.nullable is True
    assert pages_table.c.deleted_at.nullable is True
    assert str(foreign_keys["created_by"].column) == "users.id"
    assert foreign_keys["created_by"].ondelete == "SET NULL"
    assert str(foreign_keys["updated_by"].column) == "users.id"
    assert foreign_keys["updated_by"].ondelete == "SET NULL"
    assert Page.creator.property.back_populates == "created_pages"
    assert Page.updater.property.back_populates == "updated_pages"
    assert User.created_pages.property.back_populates == "creator"
    assert User.updated_pages.property.back_populates == "updater"
    assert "ix_pages_slug_active" in index_names
    assert "ix_pages_status" in index_names
    assert "ix_pages_published_at" in index_names


def test_post_and_tag_models_support_post_tag_assignment() -> None:
    posts_table = Post.__table__
    tags_table = Tag.__table__
    post_tags_table = PostTag.__table__
    post_index_names = {index.name for index in posts_table.indexes}
    tag_index_names = {index.name for index in tags_table.indexes}
    post_tag_index_names = {index.name for index in post_tags_table.indexes}
    post_foreign_keys = {foreign_key.parent.name: foreign_key for foreign_key in posts_table.foreign_keys}
    post_tag_foreign_keys = {foreign_key.parent.name: foreign_key for foreign_key in post_tags_table.foreign_keys}
    unique_constraints = {constraint.name for constraint in post_tags_table.constraints}

    assert posts_table.c.title.nullable is False
    assert posts_table.c.slug.nullable is False
    assert posts_table.c.summary.nullable is True
    assert posts_table.c.content.nullable is False
    assert posts_table.c.deleted_at.nullable is True
    assert str(post_foreign_keys["author_id"].column) == "users.id"
    assert post_foreign_keys["author_id"].ondelete == "SET NULL"
    assert tags_table.c.name.nullable is False
    assert tags_table.c.slug.nullable is False
    assert tags_table.c.is_active.nullable is False
    assert {column.name for column in post_tags_table.primary_key.columns} == {"post_id", "tag_id"}
    assert str(post_tag_foreign_keys["post_id"].column) == "posts.id"
    assert post_tag_foreign_keys["post_id"].ondelete == "CASCADE"
    assert str(post_tag_foreign_keys["tag_id"].column) == "tags.id"
    assert post_tag_foreign_keys["tag_id"].ondelete == "CASCADE"
    assert Post.author.property.back_populates == "posts"
    assert User.posts.property.back_populates == "author"
    assert Post.tags.property.back_populates == "post"
    assert Tag.posts.property.back_populates == "tag"
    assert "ix_posts_slug_active" in post_index_names
    assert "ix_posts_status" in post_index_names
    assert "ix_posts_published_at" in post_index_names
    assert "ix_tags_slug" in tag_index_names
    assert "ix_tags_is_active" in tag_index_names
    assert "ix_post_tags_tag_id" in post_tag_index_names
    assert "uq_post_tags_post_id_tag_id" in unique_constraints


def test_seo_metadata_model_supports_polymorphic_entities_and_og_image() -> None:
    seo_table = SeoMetadata.__table__
    index_names = {index.name for index in seo_table.indexes}
    unique_constraints = {constraint.name for constraint in seo_table.constraints}
    foreign_keys = {foreign_key.parent.name: foreign_key for foreign_key in seo_table.foreign_keys}

    assert seo_table.c.entity_type.nullable is False
    assert seo_table.c.entity_id.nullable is False
    assert seo_table.c.meta_title.nullable is True
    assert seo_table.c.meta_description.nullable is True
    assert seo_table.c.canonical_url.nullable is True
    assert seo_table.c.robots.nullable is True
    assert seo_table.c.og_title.nullable is True
    assert seo_table.c.og_description.nullable is True
    assert seo_table.c.schema_json.nullable is True
    assert str(foreign_keys["og_image_media_id"].column) == "media_files.id"
    assert foreign_keys["og_image_media_id"].ondelete == "SET NULL"
    assert "uq_seo_metadata_entity_type_entity_id" in unique_constraints
    assert "ix_seo_metadata_entity" in index_names
    assert "ix_seo_metadata_og_image_media_id" in index_names


def test_redirect_model_matches_runtime_lookup_fields() -> None:
    redirects_table = Redirect.__table__
    index_names = {index.name for index in redirects_table.indexes}

    assert redirects_table.c.from_path.nullable is False
    assert redirects_table.c.to_path.nullable is False
    assert redirects_table.c.status_code.nullable is False
    assert redirects_table.c.is_active.nullable is False
    assert redirects_table.c.created_at.nullable is False
    assert "ix_redirects_from_path" in index_names
    assert "ix_redirects_is_active" in index_names
