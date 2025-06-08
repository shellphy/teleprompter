from tortoise import Tortoise, fields, run_async
from tortoise.contrib.pydantic import pydantic_model_creator, pydantic_queryset_creator
from tortoise.models import Model

class Conversation(Model):
    id = fields.IntField(primary_key=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)
    conversation_id = fields.IntField()
    role = fields.CharField(max_length=16)
    content = fields.TextField()
    class Meta:
        table = "messages"
