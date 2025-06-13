from pytauri import Commands
from .greeting_commands import register_greeting_commands
from .setting_commands import register_settings_commands
from .chat_commands import register_chat_commands
from .topic_commands import register_topic_commands

def register_all_commands(commands: Commands) -> None:
    """注册所有命令到 commands 实例"""
    register_greeting_commands(commands)
    register_settings_commands(commands)
    register_chat_commands(commands)
    register_topic_commands(commands)


__all__ = ["register_all_commands"]
