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

def register_topic_commands(commands: Commands) -> None:
    """注册话题相关的命令"""
         
    @commands.command()
    async def getHotTopicList() -> bytes:
        """获取热门话题列表"""
        print("getHotTopicList")
        return b"null"
    
    @commands.command()
    async def getMyTopicList() -> bytes:
        """获取我的话题列表"""
        print("getMyTopicList")
        return b"null"
    
    @commands.command()
    async def addHotTopicToMyTopic(body: AddTopicBody) -> bytes:
        """添加热门话题到我的话题列表"""
        print("addHotTopicToMyTopic")
        return b"null"
    
    @commands.command()
    async def removeTopicFromMyTopic(body: RemoveTopicBody) -> bytes:
        """从我的话题列表中移除话题"""
        print("removeTopicFromMyTopic")
        return b"null"
    
    @commands.command()
    async def getForbiddenTopicList() -> bytes:
        """获取禁用话题列表"""
        print("getForbiddenTopicList")
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
    
    
    
    
