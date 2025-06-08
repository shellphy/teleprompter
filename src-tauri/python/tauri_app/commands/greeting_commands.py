import asyncio
from pytauri import Commands
from ..dtos import Person, Greeting
from ..services import GreetingService

def register_greeting_commands(commands: Commands) -> None:
    """注册问候相关的命令"""
    
    @commands.command()
    async def greet(body: Person) -> Greeting:
        """问候命令"""
        return await GreetingService.create_greeting(body) 
    