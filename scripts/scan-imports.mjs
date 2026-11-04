// 扫描 ui 组件：模板里用了但没 import 的组件标签
import fs from 'node:fs'
import path from 'node:path'

function walk(d) {
  return fs.readdirSync(d, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]
  )
}

for (const f of walk('src/components/ui').filter(f => f.endsWith('.vue'))) {
  const src = fs.readFileSync(f, 'utf8')
  const tpl = src.slice(src.indexOf('<template>'))
  const tags = new Set([...tpl.matchAll(/<([A-Z][A-Za-z0-9]+)/g)].map(m => m[1]))
  const missing = [...tags].filter(t => !new RegExp('import[^\\n]*\\b' + t + '\\b').test(src))
  if (missing.length) console.log(f.replace(/\\/g, '/'), '→ 缺导入:', missing.join(', '))
}
console.log('scan done')
