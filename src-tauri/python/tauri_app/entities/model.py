from tortoise import Tortoise, fields, run_async
from tortoise.contrib.pydantic import pydantic_model_creator, pydantic_queryset_creator
from tortoise.models import Model
from tortoise.exceptions import ValidationError
import json
from typing import List, Dict, Any


class Provider(Model):
    id = fields.IntField(primary_key=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)
    
    name = fields.CharField(max_length=32)
    description = fields.CharField(max_length=1024, default='')   
    enabled = fields.BooleanField(default=True)
    icon = fields.CharField(max_length=1024, default='')
    is_online = fields.BooleanField(default=False)
    type = fields.CharField(max_length=16, default='openai')
    url = fields.CharField(max_length=1024)
    api_key = fields.CharField(max_length=1024)
    default_define = fields.CharField(max_length=32, default='')
    define_list = fields.JSONField(default='[]')
    
    class Meta:
        table = "models"
    
    def clean(self) -> None:
        """验证字段数据"""
        super().clean()
        self._validate_define_list()
    
    def _validate_define_list(self) -> None:
        """验证 define_list 字段格式"""
        if not self.define_list:
            return
            
        # 如果是字符串，尝试解析为 JSON
        if isinstance(self.define_list, str):
            try:
                data = json.loads(self.define_list)
            except json.JSONDecodeError:
                raise ValidationError("define_list 必须是有效的 JSON 格式")
        else:
            data = self.define_list
        
        # 验证是否为列表
        if not isinstance(data, list):
            raise ValidationError("define_list 必须是一个数组")
        
        # 验证每个元素的格式
        for i, item in enumerate(data):
            if not isinstance(item, dict):
                raise ValidationError(f"define_list[{i}] 必须是一个对象")
            
            # 验证必需字段
            if 'name' not in item:
                raise ValidationError(f"define_list[{i}] 缺少必需字段 'name'")
            if 'enabled' not in item:
                raise ValidationError(f"define_list[{i}] 缺少必需字段 'enabled'")
            
            # 验证字段类型
            if not isinstance(item['name'], str):
                raise ValidationError(f"define_list[{i}].name 必须是字符串类型")
            if not isinstance(item['enabled'], bool):
                raise ValidationError(f"define_list[{i}].enabled 必须是布尔类型")
            
            # 验证 name 不能为空
            if not item['name'].strip():
                raise ValidationError(f"define_list[{i}].name 不能为空")
    
    async def save(self, *args, **kwargs) -> None:
        """保存前进行验证"""
        self.clean()
        await super().save(*args, **kwargs)
    
    @classmethod
    def validate_define_list_format(cls, define_list_data: List[Dict[str, Any]]) -> bool:
        """静态方法：验证 define_list 数据格式是否正确"""
        try:
            # 创建临时实例进行验证
            temp_instance = cls(define_list=define_list_data)
            temp_instance._validate_define_list()
            return True
        except ValidationError:
            return False
