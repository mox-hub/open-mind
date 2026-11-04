// 内置模板库：每个模板 = 预置结构 + 版式 + 主题，可「新建文档」或「替换当前画布」
import { newSheetId, type OmdSheet } from './omd'

interface TplNode {
  data: Record<string, any>
  children: TplNode[]
}

function n(text: string, children: TplNode[] = [], extra: Record<string, any> = {}): TplNode {
  return { data: { text, expand: true, ...extra }, children }
}

export interface TemplateDef {
  id: string
  name: string
  desc: string
  icon: string // lucide 图标名，对话框里映射组件
  layout: string
  theme: string
  build: () => TplNode
}

export const TEMPLATES: TemplateDef[] = [
  {
    id: 'project-plan',
    name: '项目计划',
    desc: '背景 · 目标 · 里程碑 · 分工 · 风险',
    icon: 'rocket',
    layout: 'logicalStructure',
    theme: 'openmind-classic',
    build: () =>
      n('项目名称', [
        n('项目背景', [n('要解决的问题'), n('相关方与痛点')]),
        n('项目目标', [n('核心目标（可量化）'), n('阶段性目标')]),
        n('里程碑', [n('启动：需求确认'), n('研发：开发与联调'), n('公测：灰度验证'), n('上线：正式发布')]),
        n('团队分工', [n('产品'), n('研发'), n('设计'), n('测试')]),
        n('风险与对策', [n('进度风险 → 缓冲期'), n('技术风险 → 预研')], { icon: ['priority_1'] })
      ])
  },
  {
    id: 'book-note',
    name: '读书笔记',
    desc: '观点 · 摘录 · 行动启发',
    icon: 'book',
    layout: 'mindMap',
    theme: 'openmind-mint',
    build: () =>
      n('书名', [
        n('作者与背景', [n('作者是谁'), n('写作背景')]),
        n('核心观点', [n('观点一'), n('观点二'), n('观点三')]),
        n('精彩摘录', [n('「金句一」'), n('「金句二」')]),
        n('行动启发', [n('可以马上做的一件事'), n('想深入的主题')]),
        n('读后评分', [], { icon: ['priority_3'] })
      ])
  },
  {
    id: 'meeting-note',
    name: '会议记录',
    desc: '议题 · 结论 · 待办',
    icon: 'users',
    layout: 'logicalStructure',
    theme: 'openmind-blue',
    build: () =>
      n('会议主题', [
        n('基本信息', [n('时间 / 地点'), n('参会人'), n('主持人 / 记录人')]),
        n('议题一', [n('讨论要点'), n('结论')]),
        n('议题二', [n('讨论要点'), n('结论')]),
        n('待办事项', [n('事项 → 负责人 → 截止日', [], { icon: ['priority_1'] }), n('事项 → 负责人 → 截止日')], { icon: ['progress_5'] })
      ])
  },
  {
    id: 'brainstorm',
    name: '头脑风暴',
    desc: '发散点子 · 不设限',
    icon: 'lightbulb',
    layout: 'mindMap',
    theme: 'openmind-rainbow',
    build: () =>
      n('风暴主题', [
        n('方向 A', [n('点子 1'), n('点子 2'), n('点子 3')]),
        n('方向 B', [n('点子 1'), n('点子 2')]),
        n('方向 C', [n('点子 1'), n('点子 2')]),
        n('疯狂脑洞区', [n('不考虑可行性，先写下来')])
      ])
  },
  {
    id: 'weekly-plan',
    name: '每周计划',
    desc: '工作 · 学习 · 生活',
    icon: 'calendar',
    layout: 'verticalTimeline',
    theme: 'openmind-warm',
    build: () =>
      n('本周计划', [
        n('周一', [n('最重要的一件事', [], { icon: ['priority_1'] }), n('次要事项')]),
        n('周二', [n('…')]),
        n('周三', [n('…')]),
        n('周四', [n('…')]),
        n('周五', [n('…')]),
        n('周末', [n('复盘本周'), n('安排下周')])
      ])
  },
  {
    id: 'swot',
    name: 'SWOT 分析',
    desc: '优势 · 劣势 · 机会 · 威胁',
    icon: 'grid',
    layout: 'organizationStructure',
    theme: 'openmind-blue',
    build: () =>
      n('SWOT', [
        n('优势 S', [n('内部优势 1'), n('内部优势 2')]),
        n('劣势 W', [n('内部劣势 1'), n('内部劣势 2')]),
        n('机会 O', [n('外部机会 1'), n('外部机会 2')]),
        n('威胁 T', [n('外部威胁 1'), n('外部威胁 2')])
      ])
  },
  {
    id: 'prd',
    name: '产品需求',
    desc: '用户故事 · 功能 · 指标',
    icon: 'package',
    layout: 'logicalStructure',
    theme: 'openmind-rose',
    build: () =>
      n('功能名称', [
        n('用户故事', [n('作为 <角色>，我想 <做什么>，以便 <价值>')]),
        n('功能需求', [n('模块 A', [n('功能点 1'), n('功能点 2')]), n('模块 B')]),
        n('非功能需求', [n('性能'), n('安全'), n('兼容性')]),
        n('数据指标', [n('北极星指标'), n('过程指标')])
      ])
  },
  {
    id: 'study-note',
    name: '学习笔记',
    desc: '概念 · 原理 · 示例 · 疑问',
    icon: 'graduation',
    layout: 'logicalStructure',
    theme: 'openmind-ink',
    build: () =>
      n('学习主题', [
        n('是什么', [n('一句话定义'), n('类比理解')]),
        n('为什么', [n('解决什么问题'), n('底层原理')]),
        n('怎么用', [n('示例 1'), n('示例 2')]),
        n('疑问点', [n('待查证的问题', [], { icon: ['priority_2'] })])
      ])
  },
  {
    id: 'retro',
    name: '项目复盘',
    desc: '目标 · 结果 · 原因 · 经验',
    icon: 'rotate',
    layout: 'fishbone',
    theme: 'openmind-classic',
    build: () =>
      n('项目复盘', [
        n('目标回顾', [n('当初承诺的结果')]),
        n('结果对比', [n('达成 / 未达成')]),
        n('原因分析', [n('主观原因'), n('客观原因')]),
        n('经验沉淀', [n('继续做'), n('停止做'), n('开始做')])
      ])
  },
  {
    id: 'travel',
    name: '旅行计划',
    desc: '行程 · 预算 · 装备',
    icon: 'map',
    layout: 'timeline',
    theme: 'openmind-mint',
    build: () =>
      n('目的地', [
        n('行程安排', [n('Day 1'), n('Day 2'), n('Day 3')]),
        n('预算', [n('交通'), n('住宿'), n('餐饮'), n('门票')]),
        n('装备清单', [n('证件'), n('衣物'), n('电子设备')], { icon: ['progress_1'] }),
        n('美食打卡', [n('必吃 1'), n('必吃 2')])
      ])
  }
]

// 模板 → 画布数据
export function templateToSheet(t: TemplateDef, canvasName = '画布 1'): OmdSheet {
  return {
    id: newSheetId(),
    name: canvasName,
    root: t.build(),
    layout: t.layout,
    theme: { template: t.theme }
  }
}
