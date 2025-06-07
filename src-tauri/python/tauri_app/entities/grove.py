from tortoise import Tortoise, fields, run_async
from tortoise.contrib.pydantic import pydantic_model_creator, pydantic_queryset_creator
from tortoise.models import Model


class User(Model):
    id = fields.IntField(primary_key=True)
    name = fields.TextField()
