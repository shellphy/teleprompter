from anyio.from_thread import start_blocking_portal
from pytauri import (
    BuilderArgs,
    Commands,
    builder_factory,
    context_factory,
    AppHandle,
    Manager,
)
from os import getenv
from pathlib import Path
from pytauri.path import PathResolver
from .commands import register_all_commands
from tortoise import Tortoise, run_async

# 创建命令实例
commands: Commands = Commands()

# 注册所有命令
register_all_commands(commands)

def main() -> int:
    """应用程序主入口"""
    with start_blocking_portal("asyncio") as portal:  # or `trio`
        app = builder_factory().build(
            BuilderArgs(
                context=context_factory(),
                invoke_handler=commands.generate_handler(portal),
            )
        )
        
        # 初始化数据库连接
        async def init(manager: AppHandle):
            path: Path = Manager.path(manager).app_local_data_dir()
            await Tortoise.init(
                db_url=f"sqlite:///{path}/grove.db",
                modules={"models": ["tauri_app.entities.grove"]},
            ) 
        portal.call(init, app.handle())

        exit_code = app.run_return()

        print("关闭数据库连接")
        portal.call(Tortoise.close_connections)

        return exit_code
