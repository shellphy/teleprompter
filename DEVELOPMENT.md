# 开发

## Windows 平台

> 至少需要 Windows 10 (1803)

1. 安装 [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)（选择"使用 C++ 的桌面开发"）
2. 安装 [Rust](https://www.rust-lang.org/zh-CN/tools/install)
3. 安装 [Node.js LTS](https://nodejs.org/zh-cn)
4. 安装 pnpm：`npm install -g pnpm@latest-10`
5. 安装 [Python 3.13](https://www.python.org/downloads/)
6. 安装 uv：`powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"`
7. 初始化虚拟环境：
   ```powershell
   uv venv --python-preference only-system
   .venv\Scripts\Activate.ps1
   ```
8. 运行项目：
   ```powershell
   pnpm install
   pnpm tauri dev
   ```

## macOS 平台

1. 安装 Xcode：`xcode-select --install`
2. 安装 [Rust](https://www.rust-lang.org/tools/install)
3. 安装 [Node.js LTS](https://nodejs.org/zh-cn)
4. 安装 pnpm：`npm install -g pnpm@latest-10`
5. 安装 [Python 3.13](https://www.python.org/downloads/)
6. 安装 uv：`curl -LsSf https://astral.sh/uv/install.sh | sh`
7. 初始化虚拟环境：
   ```shell
   uv venv --python-preference only-system
   source .venv/bin/activate
   ```
8. 运行项目：
   ```shell
   pnpm install
   pnpm tauri dev
   ```

