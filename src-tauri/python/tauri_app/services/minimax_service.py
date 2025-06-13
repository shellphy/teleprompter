import json
from pytauri.ipc import InvokeException
from openai import OpenAI
from typing import Callable
from ..entities.setting import Setting
from ..entities.topic import Topic
from pydantic import BaseModel
from openai.types.chat.completion_create_params import ResponseFormatJSONSchema
from openai.types.shared_params.response_format_json_schema import JSONSchema

class TopicResponse(BaseModel):
    topics: list[str]

async def chatTest(apiKey: str) -> tuple[bool, str]:
    """
    测试MiniMax的API Key是否有效
    """
    client = OpenAI(api_key=apiKey, base_url="https://api.minimaxi.com/v1")
    
    try:
        response = client.chat.completions.create(
            model="MiniMax-Text-01",
            messages=[{"role": "user", "content": "Hello, how are you?"}],
        )
        # 检查 base_resp 中的 status_code，0 表示成功
        if response.base_resp is not None and response.base_resp.get('status_code', -1) != 0:
            print(response)
            # 提取实际的错误消息
            status_msg = response.base_resp.get('status_msg', '未知错误')
            status_code = response.base_resp.get('status_code', '未知')
            error_message = f"API 调用失败 (代码: {status_code}): {status_msg}"
            return False, error_message
        return True, "API Key 验证成功"
    except Exception as e:
        error_message = getattr(e, 'message', str(e))
        return False, f"请求异常: {error_message}"
    
async def getResponse(prompt: str, maxTokens: int, onMessage) -> None:
    """
    获取MiniMax的响应
    """
    setting = await Setting.filter(category="miniMax", name="apiKey").first()
    if setting is None:
        raise InvokeException("API Key 未设置")
    client = OpenAI(api_key=setting.payload, base_url="https://api.minimaxi.com/v1")
    response = client.chat.completions.create(
        model="MiniMax-Text-01",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=maxTokens,
        stream=True,
    )
    for chunk in response:
        onMessage(chunk.choices[0].delta.content)
        
async def generateHotTopicByAI() -> list[str]:
    """
    通过AI生成热门话题
    """
    topic_list = await Topic.all()
    my_topic_list = "\n".join([f"{topic.name}" for topic in topic_list])
    prompt = f"""
我现在正在抖音直播间里直播,你帮我生成10条适合在直播间里讨论的话题,目前已有的话题列表如下:
-------
{my_topic_list}
-------
注意生成的话题不能与上述话题重复，每个话题前不要有1、2、3这类数字。
"""

    setting = await Setting.filter(category="miniMax", name="apiKey").first()
    if setting is None:
        raise InvokeException("API Key 未设置")
    client = OpenAI(api_key=setting.payload, base_url="https://api.minimaxi.com/v1")
    response = client.chat.completions.create(
        model="MiniMax-Text-01",
        messages=[{"role": "user", "content": prompt}],
        stream=False,
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "result",
                "schema": {
                    "type": "object",
                    "properties": {
                        "topic_list": {
                            "type": "array",
                            "items": {"type": "string"}
                        }
                    }
                }
            }
        }
    )
    result = response.choices[0].message.content
    return json.loads(result)["result"]["topic_list"]

