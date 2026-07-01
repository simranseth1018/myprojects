from pydantic import BaseModel, ConfigDict
from typing import Generic, TypeVar, Optional, List

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    message: Optional[str] = None
    data: Optional[T] = None

    @classmethod
    def ok(cls, data: T = None, message: str = None):
        return cls(success=True, message=message, data=data)

    @classmethod
    def error(cls, message: str):
        return cls(success=False, message=message, data=None)


class PageResponse(BaseModel, Generic[T]):
    model_config = ConfigDict(populate_by_name=True)

    content: List[T]
    currentPage: int = 0
    pageSize: int = 12
    totalElements: int
    totalPages: int
    last: bool

    @classmethod
    def from_query(cls, content: List[T], page: int, size: int, total: int) -> "PageResponse[T]":
        import math
        return cls(
            content=content,
            currentPage=page,
            pageSize=size,
            totalElements=total,
            totalPages=math.ceil(total / size) if size else 0,
            last=(page + 1) * size >= total,
        )
