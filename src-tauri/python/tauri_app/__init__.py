from anyio.from_thread import start_blocking_portal
from pytauri import (
    BuilderArgs,
    Commands,
    builder_factory,
    context_factory,
)
from .commands import register_all_commands

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
        exit_code = app.run_return()
        return exit_code
