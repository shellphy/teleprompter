import asyncio
import json
from pydantic import RootModel
from openai.types.chat.chat_completion_chunk import ChatCompletionChunk
from pytauri.webview import WebviewWindow
from pytauri.ipc import Channel, JavaScriptChannelId
from pytauri import Commands
from pydantic import BaseModel
from ..entities.setting import Setting
from ..services import minimax_service

Msg = RootModel[str]

class CommonChatBody(BaseModel):
    type: int
    channel: JavaScriptChannelId[Msg]

# 默认提示词
# DEFAULT_PROMPT = """
# 你现在是一名抖音主播，正在直播间与观众互动。下面有一些值得聊天的话题，根据这些话题来与观众互动，尽量幽默风趣一些，不要让观众觉得无聊。
# """

DEFAULT_PROMPT = """
你现在是一名抖音主播，正在直播间与观众互动。尽量幽默风趣一些，不要让观众觉得无聊。
"""

TOPIC_PROMPT = """
你现在是一名抖音主播，正在直播间与观众互动。尽量幽默风趣一些，不要让观众觉得无聊。
"""

PRODUCT_PROMPT = """
你现在是一名抖音主播，正在直播间与观众互动。尽量幽默风趣一些，不要让观众觉得无聊。
"""

def register_chat_commands(commands: Commands) -> None:
    """注册聊天相关的命令"""

    @commands.command()
    async def commonChat(body: CommonChatBody, webview_window: WebviewWindow) -> bytes:
        """闲聊"""
        def handle_message(message, channel):
            channel.send_model(Msg(message))

        channel: Channel[Msg] = body.channel.channel_on(webview_window.as_ref_webview())
        prompt = DEFAULT_PROMPT
        if body.type == 1:
            prompt = DEFAULT_PROMPT
        elif body.type == 2:
            prompt = TOPIC_PROMPT
        elif body.type == 3:
            prompt = PRODUCT_PROMPT
        await minimax_service.getResponse(prompt, 50, lambda message: handle_message(message, channel))
        return b"null"


   