import asyncio
from pytauri import Commands
from pydantic import BaseModel
from ..entities.setting import Setting
from ..services import minimax_service

class TestApiKeyBody(BaseModel):
    apiKey: str

class TestApiKeyResponse(BaseModel):
    success: bool
    failureReason: str | None = None
    
class GetMiniMaxApiKeyResponse(BaseModel):
    apiKey: str
    
class SetMiniMaxApiKeyBody(BaseModel):
    apiKey: str
    

def register_settings_commands(commands: Commands) -> None:
    """注册配置相关的命令"""
    
    # @commands.command()
    # async def getSettingListByCategory(category: str) -> NonModel:
    #     """获取指定分类的配置列表"""
    #     print("getSettingListByCategory")
    
    # @commands.command()
    # async def updateCategorySettings(category: str, settings: list[Setting]):
    #     """更新指定分类的配置列表"""
    #     print("updateCategorySettings")
         
    @commands.command()
    async def setMiniMaxApiKey(body: SetMiniMaxApiKeyBody) -> bytes:
        """设置MiniMax的API Key"""
        setting = Setting(category="miniMax", name="apiKey", payload=body.apiKey)
        await setting.save()
        return b"null"
    
    @commands.command()
    async def getMiniMaxApiKey() -> GetMiniMaxApiKeyResponse:
        """获取MiniMax的API Key"""
        setting = await Setting.filter(category="miniMax", name="apiKey").first()
        if setting is None:
            return GetMiniMaxApiKeyResponse(apiKey="")
        return GetMiniMaxApiKeyResponse(apiKey=setting.payload)
    
    @commands.command()
    async def testMiniMaxApiKey(body: TestApiKeyBody) -> TestApiKeyResponse:
        """测试MiniMax的API Key"""
        if body.apiKey is None:
            return TestApiKeyResponse(success=False, failureReason="API Key不能为空")   
        success, failureReason = await minimax_service.chatTest(body.apiKey)
        return TestApiKeyResponse(success=success, failureReason=failureReason)
    
    
    
    
    
