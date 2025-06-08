import asyncio
from pytauri import Commands

def register_models_commands(commands: Commands) -> None:
    """注册模型相关的命令"""
    
    @commands.command()
    async def getOnlineModelList():
        """获取所有在线模型列表"""
        print("getOnlineModelList")
        
    @commands.command()
    async def addOnlineModel():
        """添加在线模型"""
        print("addOnlineModel")
        
    @commands.command()
    async def removeOnlineModel():
        """删除在线模型"""
        print("removeOnlineModel")
        
    @commands.command()
    async def updateOnlineModel():
        """更新在线模型"""
        print("updateOnlineModel")
        
    @commands.command()
    async def checkOnlineModel():
        """检查在线模型"""
        print("checkOnlineModel")
    
    
    
    