<template>
  <div
    ref="tooltip"
    class="no-fly-tooltip"
    v-show="visible"
    :style="tooltipStyle"
  >
    <div class="tooltip-header">
      <span :class="['tooltip-title', typeClass]">
        {{ title }}
      </span>
    </div>
    <div class="tooltip-content">
      <p><span class="label">名称：</span>{{ data.name || "未命名" }}</p>
      <p>
        <span class="label">类型：</span
        >{{ data.type === "polygon" ? "多边形" : "圆形" }}
      </p>
      <p><span class="label">描述：</span>{{ data.description || "无" }}</p>
      <p v-if="showArea">
        <span class="label">面积：</span>
        {{ formatArea(data.area) }}
      </p>
      <p v-if="data.type === 'circle' && data.radius">
        <span class="label">半径：</span>{{ formatRadius(data.radius) }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  position: {
    type: Object,
    default: () => ({ x: 0, y: 0 }),
  },
  data: {
    type: Object,
    default: () => ({}),
  },
  showArea: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["close"]);

// 计算属性
const typeClass = computed(() => {
  if (!props.data.fillColor) return "tooltip-default";
  return props.data.fillColor === "#ffa500"
    ? "tooltip-warning"
    : "tooltip-restricted";
});

const title = computed(() => {
  if (!props.data.fillColor) return "区域详情";
  return props.data.fillColor === "#ffa500" ? "警告区详情" : "禁飞区详情";
});

const tooltipStyle = computed(() => ({
  left: `${props.position.x - 130}px`,
  top: `${props.position.y - 160}px`,
  transform: "translateY(-10px)",
}));

// 格式化方法
const formatArea = (area) => {
  // 处理空值（undefined、null、""）的情况
  if (area === undefined || area === null || area === "") {
    return "计算中...";
  }

  // 转换为数值类型，处理非数字、负数的情况
  const areaNum = Number(area);
  if (isNaN(areaNum) || areaNum < 0) {
    return "0.00 平方米";
  }

  // 核心：将平方公里换算为平方米（1平方公里 = 1000000平方米）
  const areaInSquareMeter = areaNum * 1000000;
  // 保留2位小数，拼接平方米单位
  return areaInSquareMeter.toFixed(2) + " 平方米";
};

const formatRadius = (radius) => {
  if (!radius) return "计算中...";
  // return (radius / 1000).toFixed(2) + " 公里";
  return radius.toFixed(2) + "米";
};
</script>

<style scoped>
.no-fly-tooltip {
  position: absolute;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 8px;
  padding: 14px;
  box-shadow: 0 3px 15px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  min-width: 220px;
  pointer-events: none;
  border: 1px solid #eee;
}

.tooltip-header {
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 8px;
  margin-bottom: 10px;
}

.tooltip-title {
  font-weight: 600;
  font-size: 15px;
}

.tooltip-title.tooltip-restricted {
  color: #e74c3c;
}

.tooltip-title.tooltip-warning {
  color: #ffa500;
}

.tooltip-title.tooltip-default {
  color: #333;
}

.tooltip-content {
  font-size: 13px;
  line-height: 1.8;
  color: #333;
}

.tooltip-content .label {
  color: #666;
  margin-right: 6px;
  display: inline-block;
  min-width: 50px;
}

.no-fly-tooltip {
  max-width: 300px;
  word-wrap: break-word;
}
</style>
