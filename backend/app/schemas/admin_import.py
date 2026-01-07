from pydantic import BaseModel

class ImportResult(BaseModel):
    created_students: int
    created_teachers: int
    skipped_students: int
    skipped_teachers: int
    errors: list[str] = []
