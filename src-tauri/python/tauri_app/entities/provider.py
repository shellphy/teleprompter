from tortoise import Tortoise, fields, run_async
from tortoise.contrib.pydantic import pydantic_model_creator, pydantic_queryset_creator
from tortoise.models import Model

class Provider(Model):
    id = fields.IntField(primary_key=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)
    name = fields.CharField(max_length=32)
    description = fields.CharField(max_length=1024, default='')
    type = fields.CharField(max_length=16, default='openai')
    url = fields.CharField(max_length=1024)
    api_key = fields.CharField(max_length=1024)
    enabled = fields.BooleanField(default=True)
    class Meta:
        table = "providers"
