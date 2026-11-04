import MindMap from 'simple-mind-map'

// OpenMind 自带主题（simple-mind-map 开源库仅内置 default 一个主题，这里通过 defineTheme 注册）
// 画布背景色也在主题里，暗色主题 = 暗色画布
export interface ThemeDef {
  name: string
  label: string
  dark?: boolean
  // 配色方案色板：驱动选择器色条/预览卡片，并在切换主题时同步给彩虹分支
  palette?: string[]
  // 彩虹主题：切换时自动开启彩虹分支（分支线按 palette 多色渲染），切走自动关闭
  rainbow?: boolean
  config: Record<string, any>
}

export const THEMES: ThemeDef[] = [
  {
    name: 'openmind-classic',
    label: '经典绿',
    palette: ['#2f7a6c', '#3d8b7d', '#57a48d', '#7ab8a4', '#a3ccbb', '#c9e0d6'],
    config: {
      lineColor: '#a5c9c1',
      lineStyle: 'curve',
      backgroundColor: '#fafafa',
      root: { fillColor: '#549688', color: '#ffffff', fontSize: 18 },
      second: { fillColor: '#e0f0ec', color: '#2d5c53', fontSize: 15 },
      node: { fillColor: '#ffffff', color: '#3a4a46', fontSize: 14 }
    }
  },
  {
    name: 'openmind-blue',
    label: '海蓝',
    palette: ['#245d9f', '#2b6cb8', '#4a86c9', '#6fa1d8', '#98bfe0', '#c3d9ee'],
    config: {
      lineColor: '#bcd3ee',
      lineStyle: 'curve',
      backgroundColor: '#f8fafd',
      root: { fillColor: '#2b6cb8', color: '#ffffff', fontSize: 18 },
      second: { fillColor: '#dbe9f8', color: '#1e4e8c', fontSize: 15 },
      node: { fillColor: '#ffffff', color: '#2d3d52', fontSize: 14 }
    }
  },
  {
    name: 'openmind-warm',
    label: '暖橙',
    palette: ['#b35f2c', '#d97a3d', '#e39563', '#ecb28f', '#f3cfae', '#f8e4cd'],
    config: {
      lineColor: '#f0c8a0',
      lineStyle: 'curve',
      backgroundColor: '#fdfaf6',
      root: { fillColor: '#d97a3d', color: '#ffffff', fontSize: 18 },
      second: { fillColor: '#fbe8d7', color: '#8a4d21', fontSize: 15 },
      node: { fillColor: '#ffffff', color: '#4d3a2c', fontSize: 14 }
    }
  },
  {
    name: 'openmind-mint',
    label: '薄荷',
    palette: ['#2f7d58', '#3d9a6e', '#5fb089', '#85c6a4', '#aad8bf', '#cfe9da'],
    config: {
      lineColor: '#b8dec9',
      lineStyle: 'curve',
      backgroundColor: '#f6fbf8',
      root: { fillColor: '#3d9a6e', color: '#ffffff', fontSize: 18 },
      second: { fillColor: '#dcf2e7', color: '#20654a', fontSize: 15 },
      node: { fillColor: '#ffffff', color: '#33473d', fontSize: 14 }
    }
  },
  {
    name: 'openmind-rose',
    label: '蔷薇',
    palette: ['#a34a67', '#c25e7e', '#d37f99', '#e0a0b3', '#ecc0cd', '#f5dce4'],
    config: {
      lineColor: '#efc5d4',
      lineStyle: 'curve',
      backgroundColor: '#fdf8fa',
      root: { fillColor: '#c25e7e', color: '#ffffff', fontSize: 18 },
      second: { fillColor: '#fae2ea', color: '#8c3d58', fontSize: 15 },
      node: { fillColor: '#ffffff', color: '#4a343d', fontSize: 14 }
    }
  },
  {
    name: 'openmind-ink',
    label: '墨黑（暗色）',
    palette: ['#2f6fed', '#4a83f2', '#6b9bf5', '#8fb4f8', '#b2ccfa', '#d6e3fc'],
    dark: true,
    config: {
      lineColor: '#4a5568',
      lineStyle: 'curve',
      backgroundColor: '#1e2024',
      root: { fillColor: '#2f6fed', color: '#ffffff', fontSize: 18 },
      second: { fillColor: '#2d323a', color: '#cfd8e3', fontSize: 15 },
      node: { fillColor: '#262a30', color: '#b8c0cc', fontSize: 14 }
    }
  },
  {
    name: 'openmind-nightgreen',
    label: '夜青（暗色）',
    palette: ['#2e8a68', '#3aa37f', '#57b593', '#7cc7ab', '#a3d8c3', '#c8e6d8'],
    dark: true,
    config: {
      lineColor: '#3d5a52',
      lineStyle: 'curve',
      backgroundColor: '#1b1f1e',
      root: { fillColor: '#3aa37f', color: '#ffffff', fontSize: 18 },
      second: { fillColor: '#27332f', color: '#c2d7cf', fontSize: 15 },
      node: { fillColor: '#222a27', color: '#aebbb5', fontSize: 14 }
    }
  },
  {
    name: 'openmind-dawn',
    label: '晨曦',
    rainbow: true,
    palette: ['#f59f2d', '#f76e64', '#4fb0ae', '#5a9cd8', '#8f7ee0', '#c96fb2'],
    config: {
      lineColor: '#f0c8a0',
      lineStyle: 'curve',
      backgroundColor: '#fdfbf7',
      root: { fillColor: '#f76e64', color: '#ffffff', fontSize: 18 },
      second: { fillColor: '#fdeee0', color: '#6b4a2f', fontSize: 15 },
      node: { fillColor: '#ffffff', color: '#4a4438', fontSize: 14 }
    }
  },
  {
    name: 'openmind-rainbow',
    label: '彩虹',
    rainbow: true,
    palette: ['#e5484d', '#f59f2d', '#3fa96f', '#2b6cb8', '#7c5cd6', '#c25e9e'],
    config: {
      lineColor: '#c9ccd6',
      lineStyle: 'curve',
      backgroundColor: '#fafafa',
      root: { fillColor: '#e5484d', color: '#ffffff', fontSize: 18 },
      second: { fillColor: '#f1f2f6', color: '#3d4351', fontSize: 15 },
      node: { fillColor: '#ffffff', color: '#3d4351', fontSize: 14 }
    }
  },
  {
    name: 'openmind-vitality',
    label: '活力',
    rainbow: true,
    palette: ['#3aa37f', '#2b6cb8', '#f59f2d', '#e5484d', '#7c5cd6', '#0e9aa7'],
    config: {
      lineColor: '#a5c9c1',
      lineStyle: 'curve',
      backgroundColor: '#f7fbfa',
      root: { fillColor: '#3aa37f', color: '#ffffff', fontSize: 18 },
      second: { fillColor: '#e2f2ee', color: '#1f5a4c', fontSize: 15 },
      node: { fillColor: '#ffffff', color: '#33473d', fontSize: 14 }
    }
  },
  {
    name: 'openmind-candy',
    label: '糖果',
    rainbow: true,
    palette: ['#ff7eb6', '#ffa94d', '#69db7c', '#4dabf7', '#b197fc', '#ffd43b'],
    config: {
      lineColor: '#f3c4d8',
      lineStyle: 'curve',
      backgroundColor: '#fefbfc',
      root: { fillColor: '#ff7eb6', color: '#ffffff', fontSize: 18 },
      second: { fillColor: '#fdeef5', color: '#7a4258', fontSize: 15 },
      node: { fillColor: '#ffffff', color: '#5a4a52', fontSize: 14 }
    }
  },
  {
    name: 'openmind-wagashi',
    label: '和风',
    rainbow: true,
    palette: ['#b3574f', '#7a9e9f', '#c9a86a', '#5f7a61', '#8a6f8e', '#4a6fa5'],
    config: {
      lineColor: '#d8cfc0',
      lineStyle: 'curve',
      backgroundColor: '#fbf9f4',
      root: { fillColor: '#b3574f', color: '#ffffff', fontSize: 18 },
      second: { fillColor: '#f1ece0', color: '#5a5245', fontSize: 15 },
      node: { fillColor: '#ffffff', color: '#4a463c', fontSize: 14 }
    }
  },
  {
    name: 'openmind-cosmos',
    label: '宇宙（暗色）',
    dark: true,
    rainbow: true,
    palette: ['#8f7ee0', '#4dabf7', '#f55e8a', '#3aa37f', '#f5a623', '#63e6be'],
    config: {
      lineColor: '#3a4152',
      lineStyle: 'curve',
      backgroundColor: '#16181f',
      root: { fillColor: '#7c5cd6', color: '#ffffff', fontSize: 18 },
      second: { fillColor: '#262b38', color: '#c3cbdb', fontSize: 15 },
      node: { fillColor: '#20242e', color: '#aab3c5', fontSize: 14 }
    }
  }
]

export function registerThemes() {
  for (const t of THEMES) {
    try {
      MindMap.defineTheme(t.name, t.config)
    } catch (e) {
      // 重复注册（热更新）时忽略
    }
  }
}

// ---------- 节点形态变种 ----------
// 在当前主题之上做形态覆盖（shape/圆角/描边/填充），经 setThemeConfig 应用并随文档持久化。
// 库的主题键没有下划线形态，"极简"（纯文字无框）是它的近似替代。
export type ThemeVariant = 'standard' | 'rounded' | 'capsule' | 'ellipse' | 'outline' | 'minimal'

export const THEME_VARIANTS: { value: ThemeVariant; label: string }[] = [
  { value: 'standard', label: '标准' },
  { value: 'rounded', label: '圆角' },
  { value: 'capsule', label: '胶囊' },
  { value: 'ellipse', label: '椭圆' },
  { value: 'outline', label: '描边' },
  { value: 'minimal', label: '极简' }
]

export function buildVariantOverlay(variant: ThemeVariant, theme: ThemeDef): Record<string, any> | null {
  const base = theme.config
  const strong = base.root?.fillColor || '#3d8b7d'
  const line = base.lineColor || '#a5c9c1'
  const overlay: Record<string, any> = {}
  const apply = (level: string, o: Record<string, any>) => {
    overlay[level] = { ...(base[level] || {}), ...o }
  }
  switch (variant) {
    case 'rounded':
      apply('root', { shape: 'roundedRectangle', borderRadius: 10 })
      apply('second', { shape: 'roundedRectangle', borderRadius: 8 })
      apply('node', { shape: 'roundedRectangle', borderRadius: 6 })
      return overlay
    case 'capsule':
      // SVG 会自动把超限圆角钳制到半宽/半高，999 即全胶囊
      apply('root', { shape: 'roundedRectangle', borderRadius: 999 })
      apply('second', { shape: 'roundedRectangle', borderRadius: 999 })
      apply('node', { shape: 'roundedRectangle', borderRadius: 999 })
      return overlay
    case 'ellipse':
      apply('root', { shape: 'ellipse' })
      apply('second', { shape: 'ellipse' })
      apply('node', { shape: 'ellipse' })
      return overlay
    case 'outline':
      // 透明填充 + 粗描边；根节点文字从白色改为深色（透明底上白字不可见）
      apply('root', { shape: 'roundedRectangle', borderRadius: 10, fillColor: 'transparent', borderWidth: 2, borderColor: strong, color: strong })
      apply('second', { shape: 'roundedRectangle', borderRadius: 8, fillColor: 'transparent', borderWidth: 1.5, borderColor: strong })
      apply('node', { shape: 'roundedRectangle', borderRadius: 6, fillColor: 'transparent', borderWidth: 1.5, borderColor: line })
      return overlay
    case 'minimal':
      apply('root', { fillColor: 'transparent', borderWidth: 0, color: strong })
      apply('second', { fillColor: 'transparent', borderWidth: 0 })
      apply('node', { fillColor: 'transparent', borderWidth: 0 })
      return overlay
    default:
      return null
  }
}

// 从文档持久化的主题覆盖里反推当前变种（用于打开文档时回显选择器状态）
export function inferVariant(config: Record<string, any> | undefined | null): ThemeVariant {
  const node = config?.node || {}
  if (node.shape === 'ellipse') return 'ellipse'
  if (node.shape === 'roundedRectangle') {
    if ((node.borderRadius || 0) >= 100) return 'capsule'
    if (node.fillColor === 'transparent') return 'outline'
    return 'rounded'
  }
  if (node.fillColor === 'transparent') return 'minimal'
  return 'standard'
}
