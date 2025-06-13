import asyncio
from pytauri import Commands
from pydantic import BaseModel
from typing import List
from ..entities.topic import Topic
from ..entities.block import Block
from ..services import minimax_service

class TopicResponse(BaseModel):
    id: int
    created_at: str
    updated_at: str  
    name: str
    enabled: bool

class BlockResponse(BaseModel):
    id: int
    created_at: str
    updated_at: str
    name: str

class TopicListResponse(BaseModel):
    topics: List[TopicResponse]

class BlockListResponse(BaseModel):
    blocks: List[BlockResponse]

class HotTopicsResponse(BaseModel):
    topics: List[str]

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
    async def getTopicList() -> TopicListResponse:
        """获取我的话题列表"""
        topic_list = await Topic.all()
        topics = []
        for topic in topic_list:
            topics.append(TopicResponse(
                id=topic.id,
                created_at=topic.created_at.isoformat() if topic.created_at else "",
                updated_at=topic.updated_at.isoformat() if topic.updated_at else "",
                name=topic.name,
                enabled=topic.enabled
            ))
        return TopicListResponse(topics=topics)
    
    @commands.command()
    async def addTopic(body: AddTopicBody) -> TopicResponse:    
        """添加话题"""
        topic = Topic(name=body.name)
        await topic.save()
        return TopicResponse(
            id=topic.id,
            created_at=topic.created_at.isoformat() if topic.created_at else "",
            updated_at=topic.updated_at.isoformat() if topic.updated_at else "",
            name=topic.name,
            enabled=topic.enabled
        )
    
    @commands.command()
    async def removeTopic(body: RemoveTopicBody) -> bytes:
        """移除话题"""
        topic = await Topic.filter(id=body.topicId).first()
        if topic is None:
            return b"null"
        await topic.delete()
        return b"null"
    
    @commands.command()
    async def enableTopic(body: EnableTopicBody) -> bytes:
        """启用话题"""
        topic = await Topic.filter(id=body.topicId).first()
        if topic is None:
            return BoolResponse(success=False)
        topic.enabled = True
        await topic.save()
        return b"null"
    
    @commands.command()
    async def disableTopic(body: DisableTopicBody) -> bytes:
        """禁用话题"""
        topic = await Topic.filter(id=body.topicId).first()
        if topic is None:
            return BoolResponse(success=False)
        topic.enabled = False
        await topic.save()
        return b"null"
    
    @commands.command()
    async def updateTopic(body: UpdateTopicBody) -> bytes:
        """更新话题"""
        topic = await Topic.filter(id=body.topicId).first()
        if topic is None:
            return BoolResponse(success=False)
        topic.name = body.name
        await topic.save()
        return b"null"
    
    @commands.command()
    async def generateHotTopicByAI() -> HotTopicsResponse:
        """通过AI生成热门话题"""
        topics = await minimax_service.generateHotTopicByAI()
        return HotTopicsResponse(topics=topics)
    
    @commands.command()
    async def getBlocksList() -> BlockListResponse:
        """获取屏蔽话题列表"""
        block_list = await Block.all()
        blocks = []
        for block in block_list:
            blocks.append(BlockResponse(
                id=block.id,
                created_at=block.created_at.isoformat() if block.created_at else "",
                updated_at=block.updated_at.isoformat() if block.updated_at else "",
                name=block.name
            ))
        return BlockListResponse(blocks=blocks)
    
    @commands.command()
    async def addBlock(body: AddBlockBody) -> BlockResponse:
        """添加屏蔽话题"""
        block = Block(name=body.name)
        await block.save()
        return BlockResponse(
            id=block.id,
            created_at=block.created_at.isoformat() if block.created_at else "",
            updated_at=block.updated_at.isoformat() if block.updated_at else "",
            name=block.name
        )
    
    @commands.command()
    async def removeBlock(body: RemoveBlockBody) -> bytes:
        """移除屏蔽话题"""
        block = await Block.filter(name=body.name).first()
        if block is None:
            return BoolResponse(success=False)
        await block.delete()
        return b"null"    
    
    
    
    
    
