// 工具栏小件：胶囊分组容器 + 图标按钮 Tooltip 包装（render 函数实现，减少模板噪音）
import { defineComponent, h } from 'vue'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

// 胶囊分组：白底 + 1px 边 + 微阴影，包住一组相邻按钮（FigJam/白板类工具栏风格）
// pointer-events-auto：悬浮工具栏容器本身透事件，让画布透过空隙仍可交互
export const PillGroup = defineComponent({
  name: 'PillGroup',
  setup(_, { slots }) {
    return () =>
      h(
        'div',
        {
          class:
            'pointer-events-auto flex shrink-0 items-center gap-0.5 rounded-full border border-border bg-card p-1 shadow-sm'
        },
        { default: () => slots.default?.() }
      )
  }
})

export const TooltipWrapper = defineComponent({
  name: 'TooltipWrapper',
  props: {
    label: { type: String, required: true },
    shortcut: { type: String, default: '' },
    // 默认朝下：工具栏贴窗口顶边，朝上会被裁掉；底部悬浮件（缩放集群）传 top
    side: { type: String, default: 'bottom' }
  },
  setup(props, { slots }) {
    return () =>
      h(Tooltip, { delayDuration: 350 }, {
        default: () => [
          h(TooltipTrigger, { asChild: true }, { default: () => slots.default?.() }),
          h(TooltipContent, { sideOffset: 4, side: props.side }, {
            default: () =>
              props.shortcut
                ? [
                    h('span', { class: 'font-medium' }, props.label),
                    h(
                      'kbd',
                      {
                        class:
                          'ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-[4px] border border-white/25 bg-white/15 px-1 font-mono text-[10px] font-normal leading-none'
                      },
                      props.shortcut
                    )
                  ]
                : props.label
          })
        ]
      })
  }
})
