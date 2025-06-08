from tortoise import Tortoise, fields, run_async
from tortoise.contrib.pydantic import pydantic_model_creator, pydantic_queryset_creator
from tortoise.models import Model

class Setting(Model):
    id = fields.IntField(primary_key=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)
    category = fields.CharField(max_length=128)
    name = fields.CharField(max_length=128)
    payload = fields.TextField()
    class Meta:
        table = "settings"
