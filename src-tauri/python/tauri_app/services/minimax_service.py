from openai import OpenAI
from typing import Callable

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
    
async def getResponse(apiKey: str, prompt: str, onMessage: Callable[[str], None]) -> None:
    """
    获取MiniMax的响应
    """
    client = OpenAI(api_key=apiKey)
    response = client.chat.completions.create(
        model="MiniMax-Text-01",
        messages=[{"role": "user", "content": prompt}],
        stream=True,
    )
    for chunk in response:
        onMessage(chunk.choices[0].delta.content)