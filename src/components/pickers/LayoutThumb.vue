<template>
  <!-- 结构迷你预览：68x44 灰阶示意，仅表达形态，不反映节点内容 -->
  <svg viewBox="0 0 68 44" class="block h-auto w-full" aria-hidden="true">
    <g class="fill-[#e3e8ee] dark:fill-[#3a4048]">
      <g class="stroke-[#b9c0ca] dark:stroke-[#525a66]" fill="none" stroke-width="1.5">
        <!-- 逻辑图（右）：根在左，子节点在右 -->
        <template v-if="kind === 'logicalStructure'">
          <path d="M22 22 H30 V10 H42 M22 22 H42 M22 22 H30 V34 H42" />
          <rect x="42" y="6" width="20" height="8" rx="2" />
          <rect x="42" y="18" width="20" height="8" rx="2" />
          <rect x="42" y="30" width="20" height="8" rx="2" />
        </template>

        <!-- 逻辑图（左）：镜像 -->
        <template v-else-if="kind === 'logicalStructureLeft'">
          <path d="M46 22 H38 V10 H26 M46 22 H26 M46 22 H38 V34 H26" />
          <rect x="6" y="6" width="20" height="8" rx="2" />
          <rect x="6" y="18" width="20" height="8" rx="2" />
          <rect x="6" y="30" width="20" height="8" rx="2" />
        </template>

        <!-- 思维导图：左右分布 -->
        <template v-else-if="kind === 'mindMap'">
          <path d="M26 22 H20 V12 H24 M26 22 H20 V30 H24" />
          <path d="M42 22 H48 V12 H44 M42 22 H48 V30 H44" />
          <rect x="6" y="8" width="18" height="8" rx="2" />
          <rect x="6" y="26" width="18" height="8" rx="2" />
          <rect x="44" y="8" width="18" height="8" rx="2" />
          <rect x="44" y="26" width="18" height="8" rx="2" />
        </template>

        <!-- 组织架构图：自上而下 -->
        <template v-else-if="kind === 'organizationStructure'">
          <path d="M34 13 V22 H14 V30 M34 13 V30 M34 13 V22 H54 V30" />
          <rect x="6" y="30" width="16" height="8" rx="2" />
          <rect x="26" y="30" width="16" height="8" rx="2" />
          <rect x="46" y="30" width="16" height="8" rx="2" />
        </template>

        <!-- 目录组织图：根在左，子节点纵向列表带缩进 -->
        <template v-else-if="kind === 'catalogOrganization'">
          <path d="M20 22 H28 M28 9 V33 M28 9 H36 M28 21 H36 M28 33 H36" />
          <rect x="36" y="5" width="24" height="8" rx="2" />
          <rect x="36" y="17" width="24" height="8" rx="2" />
          <rect x="36" y="29" width="24" height="8" rx="2" />
        </template>

        <!-- 时间轴（横向）：主轴横贯，节点上下交替 -->
        <template v-else-if="kind === 'timeline'">
          <path d="M4 22 H64 M16 16 V22 M34 22 V30 M52 16 V22" />
          <rect x="8" y="8" width="16" height="8" rx="2" />
          <rect x="26" y="30" width="16" height="8" rx="2" />
          <rect x="44" y="8" width="16" height="8" rx="2" />
        </template>

        <!-- 时间轴（竖向）：主轴纵贯，节点左右交替 -->
        <template v-else-if="kind === 'verticalTimeline'">
          <path d="M34 4 V40 M24 10 H34 M34 22 H44 M24 34 H34" />
          <rect x="8" y="6" width="16" height="8" rx="2" />
          <rect x="44" y="18" width="16" height="8" rx="2" />
          <rect x="8" y="30" width="16" height="8" rx="2" />
        </template>

        <!-- 鱼骨图：斜向主骨 + 横向分支 -->
        <template v-else-if="kind === 'fishbone'">
          <path d="M8 38 L60 6 M24 28 H40 M40 17 H54" />
          <rect x="40" y="24" width="16" height="8" rx="2" />
          <rect x="54" y="13" width="10" height="8" rx="2" />
        </template>
      </g>

      <!-- 根节点（画在最上层） -->
      <rect v-if="['logicalStructure'].includes(kind)" x="6" y="17" width="16" height="10" rx="3" class="fill-[#c6cdd8] dark:fill-[#4d565f]" />
      <rect v-else-if="['logicalStructureLeft'].includes(kind)" x="46" y="17" width="16" height="10" rx="3" class="fill-[#c6cdd8] dark:fill-[#4d565f]" />
      <rect v-else-if="kind === 'mindMap'" x="26" y="17" width="16" height="10" rx="3" class="fill-[#c6cdd8] dark:fill-[#4d565f]" />
      <rect v-else-if="kind === 'organizationStructure'" x="26" y="4" width="16" height="9" rx="3" class="fill-[#c6cdd8] dark:fill-[#4d565f]" />
      <rect v-else-if="kind === 'catalogOrganization'" x="6" y="17" width="14" height="10" rx="3" class="fill-[#c6cdd8] dark:fill-[#4d565f]" />
      <circle v-else-if="kind === 'timeline'" cx="6" cy="22" r="3" class="fill-[#c6cdd8] dark:fill-[#4d565f]" />
      <circle v-else-if="kind === 'verticalTimeline'" cx="34" cy="6" r="3" class="fill-[#c6cdd8] dark:fill-[#4d565f]" />
      <circle v-else-if="kind === 'fishbone'" cx="9" cy="37" r="3" class="fill-[#c6cdd8] dark:fill-[#4d565f]" />
    </g>
  </svg>
</template>

<script setup lang="ts">
defineProps<{ kind: string }>()
</script>
