import asyncio
from pytauri import Commands
from pydantic import BaseModel
from ..entities.topic import Topic

class AddTopicBody(BaseModel):
    topicId: int

class RemoveTopicBody(BaseModel):
    topicId: int

class EnableTopicBody(BaseModel):
    topicId: int

class DisableTopicBody(BaseModel):
    topicId: int

class UpdateTopicBody(BaseModel):
    topicId: int
    name: str
    
class AddBlockBody(BaseModel):
    name: str

class RemoveBlockBody(BaseModel):
    name: str

def register_topic_commands(commands: Commands) -> None:
    """注册话题相关的命令"""
         
    @commands.command()
    async def getTopicList() -> bytes:
        """获取我的话题列表"""
        print("getTopicList")
        return b"null"
    
    @commands.command()
    async def addTopic(body: AddTopicBody) -> bytes:
        """添加话题"""
        print("addTopic")
        return b"null"
    
    @commands.command()
    async def removeTopic(body: RemoveTopicBody) -> bytes:
        """移除话题"""
        print("removeTopic")
        return b"null"
    
    @commands.command()
    async def enableTopic(body: EnableTopicBody) -> bytes:
        """启用话题"""
        print("enableTopic")
        return b"null"
    
    @commands.command()
    async def disableTopic(body: DisableTopicBody) -> bytes:
        """禁用话题"""
        print("disableTopic")
        return b"null"
    
    @commands.command()
    async def updateTopic(body: UpdateTopicBody) -> bytes:
        """更新话题"""
        print("updateTopic")
        return b"null"
    
    @commands.command()
    async def generateHotTopicByAI() -> bytes:
        """通过AI生成热门话题"""
        print("generateHotTopicByAI")
        return b"null"
    
    @commands.command()
    async def getBlocksList() -> bytes:
        """获取屏蔽话题列表"""
        print("getBlocksList")
        return b"null"
    
    @commands.command()
    async def addBlock(body: AddBlockBody) -> bytes:
        """添加屏蔽话题"""
        print("addBlock")
        return b"null"
    
    @commands.command()
    async def removeBlock(body: RemoveBlockBody) -> bytes:
        """移除屏蔽话题"""
        print("removeBlock")
        return b"null"
    
    
    
    
    
