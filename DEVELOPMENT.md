# 开发

## windows 平台

> 至少需要 Windows 10 (1803)

1，下载 [Microsoft C++ Build](https://visualstudio.microsoft.com/visual-cpp-build-tools/)，安装程序并打开它以开始安装，在安装过程中，选中“使用 C++ 的桌面开发”选项。

2，下载并安装 [Rust](https://www.rust-lang.org/zh-CN/tools/install)

3，访问 [Node.js网站](https://nodejs.org/zh-cn)，下载并安装最新的长期支持版本（LTS）

4，安装 pnpm

```shell
npm install -g pnpm@latest-10
```

5，下载并安装最新的 [python 3.13](https://www.python.org/downloads/)。

6，安装 uv

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

7，初始化并激活 python 虚拟环境

```powershell
uv venv --python-preference only-system
.venv\Scripts\Activate.ps1
```

8，运行

```powershell
pnpm install
pnpm tauri dev
```

## macos 平台

1，安装 xcode

```shell
xcode-select --install
```

2，下载并安装 [Rust](https://www.rust-lang.org/tools/install)

3，访问 [Node.js网站](https://nodejs.org/zh-cn)，下载并安装最新的长期支持版本（LTS）

4，安装 pnpm

```shell
npm install -g pnpm@latest-10
```

5，下载并安装最新的 [python 3.13](https://www.python.org/downloads/)。

6，安装 uv

```shell
curl -LsSf https://astral.sh/uv/install.sh | sh
```

7，初始化并激活 python 虚拟环境

```shell
uv venv --python-preference only-system
source .venv/bin/activate
```

8，运行

```shell
pnpm install
pnpm tauri dev
```

