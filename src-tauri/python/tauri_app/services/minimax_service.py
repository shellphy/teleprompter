from openai import OpenAI
from typing import Callable

async def chatTest(apiKey: str) -> bool:
    """
    测试MiniMax的API Key是否有效
    """
    client = OpenAI(api_key=apiKey)
    
    try:
        client.chat.completions.create(
            model="MiniMax-Text-01",
            messages=[{"role": "user", "content": "Hello, how are you?"}],
        )
        return True
    except Exception as e:
        print(e)
        return False
    
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