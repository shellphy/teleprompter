import asyncio
from typing import Callable, List, Any
from tortoise import Tortoise
from pathlib import Path
from pytauri import AppHandle, Manager

class LifecycleManager:
    def __init__(self):
        self._startup_tasks: List[Callable[[AppHandle], Any]] = []
        self._shutdown_tasks: List[Callable[[], Any]] = []

    def add_startup_task(self, task: Callable[[AppHandle], Any]) -> None:
        """添加启动时需要执行的任务"""
        self._startup_tasks.append(task)

    def add_shutdown_task(self, task: Callable[[], Any]) -> None:
        """添加关闭时需要执行的任务"""
        self._shutdown_tasks.append(task)

    async def run_startup_tasks(self, handle: AppHandle) -> None:
        """执行所有启动任务"""
        for task in self._startup_tasks:
            await task(handle)

    async def run_shutdown_tasks(self) -> None:
        """执行所有关闭任务"""
        for task in self._shutdown_tasks:
            await task()

    @staticmethod
    async def init_database(handle: AppHandle) -> None:
        """初始化数据库连接"""
        path: Path = Manager.path(handle).app_local_data_dir()
        await Tortoise.init(
            db_url=f"sqlite:///{path}/teleprompter.db",
            modules={"models": [
                "tauri_app.entities.block",
                "tauri_app.entities.topic",
                "tauri_app.entities.setting"
            ]},
        )

    @staticmethod
    async def close_database() -> None:
        """关闭数据库连接"""
        await Tortoise.close_connections() 