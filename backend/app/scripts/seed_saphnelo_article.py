from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import SessionLocal
from app.models.content import Post, SeoMetadata, Tag
from app.models.identity import User
from app.repositories.cms import CmsRepository


ARTICLE_SLUG = "saphnelo-cong-dung-chi-dinh-va-luu-y-khi-dung"
AUTHOR_EMAIL = "content.seed@duocmeta.local"
ARTICLE_TITLE = "Thuốc Saphnelo: Công dụng, chỉ định và lưu ý khi dùng"
ARTICLE_SUMMARY = (
    "Tìm hiểu Saphnelo (anifrolumab): thuốc dùng cho lupus ban đỏ hệ thống, cách truyền, tác dụng phụ và "
    "những lưu ý an toàn quan trọng."
)
PUBLISHED_AT = datetime(2026, 5, 6, 0, 0, tzinfo=UTC)
TAG_SEEDS = (
    ("Lupus", "lupus", "Nội dung liên quan đến lupus ban đỏ hệ thống."),
    ("Saphnelo", "saphnelo", "Nội dung về anifrolumab và điều trị lupus."),
)

ARTICLE_CONTENT: dict[str, object] = {
    "blocks": [
        {
            "type": "paragraph",
            "text": (
                "Saphnelo là thuốc sinh học chứa hoạt chất anifrolumab. Thuốc được dùng phối hợp với các "
                "thuốc điều trị khác để hỗ trợ kiểm soát lupus ban đỏ hệ thống (SLE) mức độ vừa đến nặng ở người lớn."
            ),
        },
        {"type": "heading", "level": 2, "text": "1. Saphnelo là thuốc gì?"},
        {
            "type": "paragraph",
            "text": (
                "Saphnelo là thuốc kê đơn dùng đường truyền tĩnh mạch. Hoạt chất anifrolumab là một kháng thể "
                "đơn dòng nhắm vào thụ thể interferon type I, giúp làm giảm hoạt động bất thường của hệ miễn dịch "
                "trong bệnh lupus."
            ),
        },
        {"type": "heading", "level": 2, "text": "2. Công dụng của thuốc Saphnelo"},
        {
            "type": "list",
            "items": [
                "Hỗ trợ điều trị lupus ban đỏ hệ thống (SLE) mức độ vừa đến nặng ở người lớn.",
                "Dùng phối hợp với thuốc điều trị nền theo chỉ định của bác sĩ chuyên khoa.",
                "Giúp kiểm soát bệnh ở những trường hợp lupus còn hoạt động dù đã dùng điều trị chuẩn.",
            ],
        },
        {"type": "heading", "level": 2, "text": "3. Cách dùng thuốc Saphnelo"},
        {
            "type": "paragraph",
            "text": (
                "Thuốc được truyền tĩnh mạch trong khoảng 30 phút. Liều thường dùng là 300 mg mỗi 4 tuần một lần. "
                "Việc truyền phải được thực hiện và theo dõi bởi nhân viên y tế để phát hiện sớm phản ứng truyền "
                "thuốc hoặc phản ứng quá mẫn."
            ),
        },
        {"type": "heading", "level": 2, "text": "4. Tác dụng phụ có thể gặp"},
        {
            "type": "list",
            "items": [
                "Nhiễm trùng hô hấp trên, viêm phế quản.",
                "Phản ứng liên quan đến truyền thuốc.",
                "Đau đầu, mệt mỏi, buồn nôn hoặc khó chịu trong người.",
                "Herpes zoster (zona) hoặc các dấu hiệu nhiễm trùng khác.",
            ],
        },
        {"type": "heading", "level": 2, "text": "5. Lưu ý quan trọng khi dùng"},
        {
            "type": "list",
            "items": [
                "Báo cho bác sĩ nếu bạn đang bị nhiễm trùng, hay bị nhiễm trùng tái diễn hoặc từng bị dị ứng thuốc.",
                "Không tự ý tiêm vắc xin sống khi đang điều trị nếu chưa hỏi ý kiến bác sĩ.",
                "Trao đổi kỹ với bác sĩ nếu đang mang thai, dự định mang thai hoặc cho con bú.",
                "Không tự ý thay đổi lịch truyền, ngừng thuốc hoặc dùng thêm thuốc khác khi chưa được hướng dẫn.",
            ],
        },
        {"type": "heading", "level": 2, "text": "Kết luận"},
        {
            "type": "paragraph",
            "text": (
                "Saphnelo là thuốc sinh học kê đơn dành cho bệnh nhân lupus ban đỏ hệ thống phù hợp chỉ định. "
                "Người bệnh cần dùng thuốc đúng lịch, theo dõi sát các dấu hiệu bất thường và liên hệ bác sĩ ngay "
                "khi có triệu chứng nghi ngờ nhiễm trùng, phản ứng dị ứng hoặc tác dụng phụ nghiêm trọng."
            ),
        },
    ]
}


def seed_saphnelo_article(session: Session) -> Post:
    author = _upsert_author(session)
    tags = [_upsert_tag(session, name=name, slug=slug, description=description) for name, slug, description in TAG_SEEDS]
    repository = CmsRepository(session)

    post = session.scalar(select(Post).where(Post.slug == ARTICLE_SLUG, Post.deleted_at.is_(None)))
    if post is None:
        post = Post(slug=ARTICLE_SLUG)
        session.add(post)

    post.title = ARTICLE_TITLE
    post.summary = ARTICLE_SUMMARY
    post.content = ARTICLE_CONTENT
    post.status = "published"
    post.published_at = PUBLISHED_AT
    post.author_id = author.id
    session.flush()

    repository.set_post_tags(post, [tag.id for tag in tags])
    _upsert_seo_metadata(session, post)
    session.commit()
    return post


def _upsert_author(session: Session) -> User:
    author = session.scalar(select(User).where(User.email == AUTHOR_EMAIL, User.deleted_at.is_(None)))

    if author is None:
        author = User(
            email=AUTHOR_EMAIL,
            password_hash=None,
            full_name="Duocmeta Content Seed",
            status="active",
        )
        session.add(author)

    author.full_name = "Duocmeta Content Seed"
    author.status = "active"
    author.email_verified_at = author.email_verified_at or PUBLISHED_AT
    session.flush()
    return author


def _upsert_tag(session: Session, *, name: str, slug: str, description: str) -> Tag:
    tag = session.scalar(select(Tag).where(Tag.slug == slug))

    if tag is None:
        tag = Tag(name=name, slug=slug)
        session.add(tag)

    tag.name = name
    tag.description = description
    tag.is_active = True
    session.flush()
    return tag


def _upsert_seo_metadata(session: Session, post: Post) -> None:
    seo = session.scalar(
        select(SeoMetadata).where(
            SeoMetadata.entity_type == "post",
            SeoMetadata.entity_id == post.id,
        )
    )

    seo_payload = {
        "headline": ARTICLE_TITLE,
        "description": ARTICLE_SUMMARY,
        "datePublished": PUBLISHED_AT.isoformat(),
        "mainEntityOfPage": f"/blog/{ARTICLE_SLUG}",
    }

    if seo is None:
        seo = SeoMetadata(entity_type="post", entity_id=post.id)
        session.add(seo)

    seo.meta_title = ARTICLE_TITLE
    seo.meta_description = ARTICLE_SUMMARY
    seo.canonical_url = f"/blog/{ARTICLE_SLUG}"
    seo.robots = "index,follow"
    seo.og_title = ARTICLE_TITLE
    seo.og_description = ARTICLE_SUMMARY
    seo.schema_json = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        **seo_payload,
    }
    session.flush()


def main() -> None:
    with SessionLocal() as session:
        seed_saphnelo_article(session)


if __name__ == "__main__":
    main()
