import fs from 'node:fs/promises'
import path from 'node:path'

const locales = ['en', 'zh', 'zh-TW', 'fr', 'ja', 'ru', 'vi']
const localeDir = path.resolve('src/i18n/locales')
const replacements = {
  'New API': '云渡',
  NewAPI: '云渡',
  'New API &lt;noreply@example.com&gt;': '云渡 &lt;noreply@example.com&gt;',
  'New API Project Repository:': '项目仓库：',
  'e.g. New API Console': '例如：云渡控制台',
  'Welcome to our New API...': '欢迎使用云渡...',
  "New API's flexible channel lets you configure upstream addresses and authentication per endpoint, choose native forwarding or supported protocol conversions, and configure model listing and balance queries independently":
    "云渡的灵活渠道支持按端点配置上游地址和认证，可选择原生转发或受支持的协议转换，并可独立配置模型列表和余额查询",
  'Connect to model services from another New API instance':
    '连接到另一套云渡实例中的模型服务',
  'Format: AccessKey|SecretKey (or just ApiKey if upstream is New API)':
    '格式：AccessKey|SecretKey（如果上游是云渡，也可以只填写 ApiKey）',
  'If connecting to upstream One API or New API relay projects, use OpenAI type instead unless you know what you are doing':
    '如果连接到上游 One API 或云渡中转项目，除非明确了解差异，否则请使用 OpenAI 类型',
  'Supports one-click configuration and perfectly adapts to NewAPI multi-protocol configuration.':
    '支持一键配置，完美适配云渡多协议配置。',
  'Warning: Base URL should not end with /v1. New API will handle it automatically. This may cause request failures.':
    '警告：基础 URL 不应以 /v1 结尾，云渡会自动处理。否则可能导致请求失败。',
}

for (const locale of locales) {
  const file = path.join(localeDir, `${locale}.json`)
  const json = JSON.parse(await fs.readFile(file, 'utf8'))
  for (const [key, value] of Object.entries(replacements)) {
    if (Object.hasOwn(json.translation, key)) json.translation[key] = value
  }
  json.translation = Object.fromEntries(
    Object.entries(json.translation).sort(([a], [b]) => a.localeCompare(b))
  )
  await fs.writeFile(file, `${JSON.stringify(json, null, 2)}\n`, 'utf8')
}
