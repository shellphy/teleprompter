import asyncio
from pytauri import Commands
from ..dtos import Person, Greeting

def register_message_commands(commands: Commands) -> None:
    """注册消息相关的命令"""
    
    @commands.command()
    async def getMessageList(conversation_id: int):
        """获取消息列表"""
        print("getMessageList")
        
    @commands.command()
    async def chat():
        """聊天"""
        print("chat")

    