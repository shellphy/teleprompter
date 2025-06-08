import asyncio
from pytauri import Commands
from ..dtos import Person, Greeting

def register_conversations_commands(commands: Commands) -> None:
    """注册会话相关的命令"""
    
    @commands.command()
    async def getConversationList():
        """获取会话列表"""
        print("getConversationList")
        
    @commands.command()
    async def deleteConversation(conversation_id: int):
        """删除会话"""
        print("deleteConversation")
        
    @commands.command()
    async def updateConversationTitle(conversation_id: int, title: str):
        """更新会话标题"""
        print("updateConversationTitle")
