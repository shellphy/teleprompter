from pydantic import BaseModel


class Person(BaseModel):
    """人员信息模型"""
    name: str


class Greeting(BaseModel):
    """问候响应模型"""
    message: str 