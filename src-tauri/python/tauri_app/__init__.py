import asyncio
from anyio.from_thread import start_blocking_portal
from pytauri import (
    BuilderArgs,
    Commands,
    builder_factory,
    context_factory,
)
from .commands import register_all_commands
from .lifecycle import LifecycleManager
from .entities.grove import User

# 创建命令实例
commands: Commands = Commands()

# 注册所有命令
register_all_commands(commands)

def main() -> int:
    """应用程序主入口"""
    with start_blocking_portal("asyncio") as portal:  # or `trio`
        # 初始化生命周期管理器
        lifecycle_manager = LifecycleManager()
        
        # 添加启动和关闭任务
        lifecycle_manager.add_startup_task(LifecycleManager.init_database)
        lifecycle_manager.add_shutdown_task(LifecycleManager.close_database)
        
        # 构建应用程序
        app = builder_factory().build(
            BuilderArgs(
                context=context_factory(),
                invoke_handler=commands.generate_handler(portal),
            )
        )
        
        # 执行启动任务
        portal.call(lifecycle_manager.run_startup_tasks, app.handle())
         
        # 运行应用程序
        exit_code = app.run_return()

        # 清理数据库连接
        portal.call(lifecycle_manager.run_shutdown_tasks)

        return exit_code
