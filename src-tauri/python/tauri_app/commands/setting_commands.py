import asyncio
from pytauri import Commands

def register_settings_commands(commands: Commands) -> None:
    """注册配置相关的命令"""
    
    @commands.command()
    async def getSettingListByCategory(category: str):
        """获取指定分类的配置列表"""
        print("getSettingListByCategory")
    
    @commands.command()
    async def updateCategorySettings(category: str, settings: list[Setting]):
        """更新指定分类的配置列表"""
        print("updateCategorySettings")
         