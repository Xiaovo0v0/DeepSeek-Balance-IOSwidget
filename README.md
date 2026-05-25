# DeepSeek Balance

一个 [Scriptable](https://scriptable.app/) 脚本，在 iOS / Mac 桌面小组件上显示 **DeepSeek API 余额**和**当月花费**，也支持 App 内查询和 Siri 快捷指令。

## 功能

- **桌面小组件**：深色渐变背景，展示总余额、充值/赠送明细、当月花费
- **App 内查询**：运行脚本可选择「查询余额」或「查看月花费统计」
- **Siri 快捷指令**：通过 Siri 语音查询余额
- **小组件参数**：长按小组件 → 编辑小组件 → 可传入自定义标题后缀

## 预览

小组件推荐使用 **小号/中号** 尺寸：

![screenshot](screenshot.jpg)

## 配置

打开 `DeepSeek Balance.js`，修改第 16-17 行：

```js
const API_KEY = "sk-你的DeepSeek_API_Key"
const USER_TOKEN = "你的Platform_UserToken"
```

### 获取 API Key

前往 [DeepSeek API Keys](https://platform.deepseek.com/api_keys) 创建，格式为 `sk-...`。

### 获取 UserToken

1. 浏览器打开 [platform.deepseek.com](https://platform.deepseek.com/) 并登录
2. 按 `F12` → **Application** → **Local Storage**
3. 复制 `userToken` 的值

> 如果获取失败（如过期），重新按上述步骤获取即可。

## 安装

1. 在 App Store 下载 [Scriptable](https://apps.apple.com/app/scriptable/id1405459188)
2. 将 `DeepSeek Balance.js` 导入 Scriptable（可通过 iCloud、AirDrop 或直接复制粘贴）
3. 在 Scriptable 中运行一次，确认能正常查询
4. 长按桌面 → 添加 Scriptable 小组件 → 编辑小组件选择此脚本

## Siri 快捷指令

App 内运行过一次后，可在 **快捷指令** App 中创建：

1. 新建快捷指令 → 添加操作 → 搜索「Scriptable」
2. 选择「Run Script」→ 脚本选「DeepSeek Balance」
3. 添加到主屏幕或设置 Siri 语音触发

## 许可

MIT
