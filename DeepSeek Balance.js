// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: money-bill-wave;

// ============================================================
// DeepSeek Balance — 查询 DeepSeek API 余额 + 月花费
// ============================================================
// 使用说明：
//   1. 填写下方的 API_KEY 和 USER_TOKEN
//   2. userToken 获取：浏览器登录 platform.deepseek.com
//      F12 → Application → Local Storage → 复制 userToken 值
//   3. 可作为桌面小组件使用（medium / large）
//   4. 长按小组件 > 编辑小组件 > 可传入标题后缀
// ============================================================

const API_KEY = "sk-你的DeepSeek_API_Key"
const USER_TOKEN = "你的Platform_UserToken"

const API_BALANCE_URL = "https://api.deepseek.com/user/balance"
const PLATFORM_COST_URL = "https://platform.deepseek.com/api/v0/usage/cost"

// ─── 余额 API ───────────────────────────────────────────────────

async function fetchBalance() {
  const req = new Request(API_BALANCE_URL)
  req.headers = {
    "Authorization": `Bearer ${API_KEY}`,
    "Accept": "application/json"
  }
  req.timeoutInterval = 10
  const resp = await req.loadJSON()
  const info = resp.balance_infos && resp.balance_infos[0]
  return info || resp
}

// ─── 平台花费 API ────────────────────────────────────────────────

async function fetchPlatformCost(month, year) {
  const url = `${PLATFORM_COST_URL}?month=${String(month).padStart(2, "0")}&year=${year}`
  const req = new Request(url)
  req.headers = {
    "Authorization": `Bearer ${USER_TOKEN}`,
    "Accept": "application/json",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Referer": "https://platform.deepseek.com/usage"
  }
  req.timeoutInterval = 10

  const resp = await req.loadJSON()
  if (resp.code && resp.code !== 0) {
    throw new Error(`平台 API 错误: ${resp.msg || resp.code}`)
  }

  const bizData = resp.data && resp.data.biz_data && resp.data.biz_data[0]
  if (!bizData) throw new Error("biz_data 为空")

  const currency = bizData.currency || "CNY"

  // 每日花费
  const daily = (bizData.days || []).map(day => {
    let total = 0
    ;(day.data || []).forEach(modelItem => {
      ;(modelItem.usage || []).forEach(u => {
        total += parseFloat(u.amount) || 0
      })
    })
    return { date: day.date, spending: parseFloat(total.toFixed(6)) }
  })

  // 按模型汇总
  const modelTotals = (bizData.total || []).map(modelItem => {
    let total = 0
    ;(modelItem.usage || []).forEach(u => {
      total += parseFloat(u.amount) || 0
    })
    return {
      model: modelItem.model.replace("deepseek-", "").replace("DeepSeek-", ""),
      total: parseFloat(total.toFixed(6))
    }
  }).sort((a, b) => b.total - a.total)

  // 当月总花费
  const monthTotal = daily.reduce((s, d) => s + d.spending, 0)

  return { currency, monthTotal, daily, modelTotals }
}

// ─── 格式化 ──────────────────────────────────────────────────────

function formatMoney(value) {
  if (value === undefined || value === null) return "—"
  return parseFloat(value).toFixed(2)
}

function formatTime(date) {
  const h = date.getHours().toString().padStart(2, "0")
  const m = date.getMinutes().toString().padStart(2, "0")
  return `更新于 ${h}:${m}`
}

// ─── 小组件 ──────────────────────────────────────────────────────

function createWidget(balanceData, costData, widgetParam) {
  const widget = new ListWidget()
  const bg = new LinearGradient()
  bg.colors = [new Color("#0f0f23"), new Color("#1a1a3e")]
  bg.locations = [0, 1]
  widget.backgroundGradient = bg

  // 标题
  const title = widgetParam ? `DeepSeek · ${widgetParam}` : "DeepSeek"
  const titleText = widget.addText(title)
  titleText.font = Font.boldSystemFont(13)
  titleText.textColor = new Color("#a0a0c0")
  titleText.minimumScaleFactor = 0.7

  widget.addSpacer(4)

  // 余额 - 大号
 const total = balanceData.total_balance ?? balanceData.balance ?? "—"
  const totalStack = widget.addStack()
  totalStack.layoutHorizontally()

  const totalText = totalStack.addText(`${formatMoney(total)}`)
  totalText.font = Font.regularSystemFont(38)
  totalText.textColor = new Color("#00d2ff")
  totalText.minimumScaleFactor = 0.5

  totalStack.addSpacer(4)

  const totalUnit = totalStack.addText("CNY")
  totalUnit.font = Font.lightSystemFont(12)
  totalUnit.textColor = new Color("#6dd3ff")

  widget.addSpacer(2)
  widget.addSpacer(2)

  // 充值 / 赠送
  const subStack = widget.addStack()
  subStack.layoutHorizontally()
  subStack.addSpacer(2)

  function addTag(label, value, colorHex) {
    const tag = subStack.addText(`${label} ¥${formatMoney(value)}  `)
    tag.font = Font.regularSystemFont(9)
    tag.textColor = new Color(colorHex)
    tag.lineLimit = 1
  }
  addTag("充值", balanceData.topped_up_balance, "#4ade80")
  addTag("赠送", balanceData.granted_balance, "#f59e0b")

  // 当月花费
  if (costData && costData.monthTotal > 0) {
    widget.addSpacer(4)
    const sep = widget.addText("—".repeat(24))
    sep.font = Font.lightSystemFont(7)
    sep.textColor = new Color("#333355")
    sep.lineLimit = 1

    widget.addSpacer(2)

    const now = new Date()
    const monthLabel = `${now.getMonth() + 1}月花费`
    const costStack = widget.addStack()
    costStack.layoutHorizontally()
    costStack.addSpacer(2)

    const monthLabelText = costStack.addText(monthLabel)
    monthLabelText.font = Font.regularSystemFont(12)
    monthLabelText.textColor = new Color("#bebebe")

    costStack.addSpacer(6)

    const costValue = costStack.addText(`¥ ${formatMoney(costData.monthTotal)}`)
    costValue.font = Font.regularSystemFont(12)
    costValue.textColor = new Color("#ff6b6b")
  }

  widget.addSpacer(3)

  // 刷新时间
  const timeText = widget.addText(formatTime(new Date()))
  timeText.font = Font.lightSystemFont(8)
  timeText.textColor = new Color("#a1a1b4")
  timeText.rightAlignText()

  return widget
}

// ─── 主逻辑 ──────────────────────────────────────────────────────

const isWidget = config.runsInWidget
const widgetParam = args.widgetParameter || ""

if (config.runsWithSiri) {
  try {
    const data = await fetchBalance()
    Script.setShortcutOutput(`DeepSeek 余额：¥${formatMoney(data.total_balance ?? data.balance)}`)
  } catch (e) {
    Script.setShortcutOutput(`查询失败：${e.message}`)
  }
  return
}

if (isWidget) {
  // 小组件模式：并行请求余额 + 花费
  try {
    const now = new Date()
    const [balanceData, costData] = await Promise.allSettled([
      fetchBalance(),
      fetchPlatformCost(now.getMonth() + 1, now.getFullYear())
    ])

    const bal = balanceData.status === "fulfilled" ? balanceData.value : { total_balance: "—" }
    const cost = costData.status === "fulfilled" ? costData.value : null

    const widget = createWidget(bal, cost, widgetParam)
    Script.setWidget(widget)
  } catch (e) {
    const w = new ListWidget()
    w.addText("查询失败\n请检查 API Key 或网络")
      .font = Font.regularSystemFont(12)
      .textColor = Color.red()
      .centerAlignText()
    Script.setWidget(w)
  }
  Script.complete()
  return
}

// App 内运行模式
const menu = new Alert()
menu.title = "DeepSeek 余额"
menu.message = "选择一个操作"
menu.addAction("查询余额")
menu.addAction("查看月花费统计")
menu.addCancelAction("取消")

const action = await menu.presentAlert()

if (action === 0) {
  console.log("正在查询余额...")
  try {
    const data = await fetchBalance()
    console.log("━━━━━━━━━━━━━━━━━━")
    console.log(`💰 总余额：   ¥ ${formatMoney(data.total_balance ?? data.balance)}`)
    console.log(`💳 充值余额： ¥ ${formatMoney(data.topped_up_balance)}`)
    console.log(`🎁 赠送余额： ¥ ${formatMoney(data.granted_balance)}`)
    console.log("━━━━━━━━━━━━━━━━━━")

    const result = new Alert()
    result.title = "💰 DeepSeek 余额"
    result.message = [
      `总余额：     ¥ ${formatMoney(data.total_balance ?? data.balance)}`,
      `充值余额： ¥ ${formatMoney(data.topped_up_balance)}`,
      `赠送余额： ¥ ${formatMoney(data.granted_balance)}`,
    ].join("\n")
    result.addAction("确定")
    await result.presentAlert()

  } catch (e) {
    console.error(`查询失败：${e.message}`)
    const err = new Alert()
    err.title = "查询失败"
    err.message = e.message
    err.addAction("确定")
    await err.presentAlert()
  }

} else if (action === 1) {
  const now = new Date()
  console.log(`正在查询 ${now.getFullYear()}年${now.getMonth() + 1}月花费...`)
  try {
    const data = await fetchPlatformCost(now.getMonth() + 1, now.getFullYear())

    console.log("━━━━━━━━━━━━━━━━━━")
    console.log(`📊 ${now.getMonth() + 1}月总花费：¥ ${formatMoney(data.monthTotal)} (${data.currency})`)
    console.log("━━━━━━━━━━━━━━━━━━")
    console.log("近7天：")
    data.daily.slice(-7).forEach(d => {
      console.log(`  ${d.date}: ¥ ${formatMoney(d.spending)}`)
    })

    const dailySummary = data.daily.slice(-7)
      .map(d => `  ${d.date}: ¥ ${formatMoney(d.spending)}`)
      .join("\n")

    const result = new Alert()
    result.title = `📊 ${now.getMonth() + 1}月花费统计`
    result.message = [
      `总花费：¥ ${formatMoney(data.monthTotal)} ${data.currency}`,
      "",
      "近7天：",
      dailySummary,
    ].join("\n")
    result.addAction("确定")
    await result.presentAlert()

  } catch (e) {
    console.error(`查询失败：${e.message}`)
    const err = new Alert()
    err.title = "查询失败"
    err.message = `平台请求失败：${e.message}\n\n请检查：\n1. USER_TOKEN 是否正确\n2. userToken 是否过期（需重新从浏览器获取）\n3. 网络连接`
    err.addAction("确定")
    await err.presentAlert()
  }
}
