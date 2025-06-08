from tortoise import Tortoise, fields, run_async
from tortoise.contrib.pydantic import pydantic_model_creator, pydantic_queryset_creator
from tortoise.models import Model


class Provider(Model):
    id = fields.IntField(primary_key=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)
    provider_id = fields.IntField()
    name = fields.CharField(max_length=32)
    enabled = fields.BooleanField(default=True)
    class Meta:
        table = "models"
