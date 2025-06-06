import sys
from ..models import Person, Greeting


class GreetingService:
    """问候服务"""
    
    @staticmethod
    async def create_greeting(person: Person) -> Greeting:
        """创建问候消息"""
        return Greeting(
            message=f"Hello, {person.name}!! You've been greeted from Python {sys.version}!"
        ) 