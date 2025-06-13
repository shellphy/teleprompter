import asyncio
from pytauri import Commands
from pydantic import BaseModel
from ..entities.topic import Topic
from ..entities.block import Block
from ..services import minimax_service

class AddTopicBody(BaseModel):
    name: str

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
    async def getTopicList() -> list[Topic]:
        """获取我的话题列表"""
        topic_list = await Topic.all()
        return topic_list
    
    @commands.command()
    async def addTopic(body: AddTopicBody) -> Topic:    
        """添加话题"""
        topic = Topic(name=body.name)
        await topic.save()
        return topic
    
    @commands.command()
    async def removeTopic(body: RemoveTopicBody) -> bool:
        """移除话题"""
        topic = await Topic.filter(id=body.topicId).first()
        if topic is None:
            return False
        await topic.delete()
        return True
    
    @commands.command()
    async def enableTopic(body: EnableTopicBody) -> bool:
        """启用话题"""
        topic = await Topic.filter(id=body.topicId).first()
        if topic is None:
            return False
        topic.enabled = True
        await topic.save()
        return True
    
    @commands.command()
    async def disableTopic(body: DisableTopicBody) -> bool:
        """禁用话题"""
        topic = await Topic.filter(id=body.topicId).first()
        if topic is None:
            return False
        topic.enabled = False
        await topic.save()
        return True
    
    @commands.command()
    async def updateTopic(body: UpdateTopicBody) -> bool:
        """更新话题"""
        topic = await Topic.filter(id=body.topicId).first()
        if topic is None:
            return False
        topic.name = body.name
        await topic.save()
        return True
    
    @commands.command()
    async def generateHotTopicByAI() -> list[str]:
        """通过AI生成热门话题"""
        return await minimax_service.generateHotTopicByAI()
    
    @commands.command()
    async def getBlocksList() -> list[Block]:
        """获取屏蔽话题列表"""
        block_list = await Block.all()
        return block_list
    
    @commands.command()
    async def addBlock(body: AddBlockBody) -> Block:
        """添加屏蔽话题"""
        block = Block(name=body.name)
        await block.save()
        return block
    
    @commands.command()
    async def removeBlock(body: RemoveBlockBody) -> bool:
        """移除屏蔽话题"""
        block = await Block.filter(name=body.name).first()
        if block is None:
            return False
        await block.delete()
        return True
    
    
    
    
    
