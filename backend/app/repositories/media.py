from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.catalog import MediaDerivative, MediaFile


class MediaRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get_by_storage_key(self, storage_key: str) -> MediaFile | None:
        return self.session.scalar(select(MediaFile).where(MediaFile.storage_key == storage_key))

    def add(self, media_file: MediaFile) -> MediaFile:
        self.session.add(media_file)
        self.session.flush()
        return media_file

    def add_derivatives(self, derivatives: list[MediaDerivative]) -> list[MediaDerivative]:
        self.session.add_all(derivatives)
        self.session.flush()
        return derivatives
