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
