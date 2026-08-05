<template>
  <!-- 绘制控制 -->
  <div class="control-group">
    <div class="button-group-container">
      <el-button
        type="info"
        :disabled="isDrawing || isViewing"
        class="control-btn"
        @click="handleDraw"
      >
        <el-icon>
          <EditPen />
        </el-icon>
        绘制
      </el-button>
      <el-button
        type="info"
        :disabled="!isDrawing || drawnPoints.length < 2"
        class="control-btn"
        @click="handleComplete"
      >
        <el-icon>
          <Select />
        </el-icon>
        完成
      </el-button>
      <el-button
        type="info"
        :disabled="!isDrawing"
        class="control-btn"
        @click="handleCancel"
      >
        <el-icon>
          <Close />
        </el-icon>
        取消
      </el-button>
    </div>
    <el-button
      class="control-btn emergency"
      type="info"
      @click="handleSaveRoute"
      :disabled="!saveRouteBot"
      :loading="savingRoute"
    >
      <el-icon>
        <Download />
      </el-icon>
      保存路线
    </el-button>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, inject } from "vue";
import { ElMessage } from "element-plus";
import { EditPen, Select, Close, Download } from "@element-plus/icons-vue";
// 定义 props
const props = defineProps({
  isDrawing: {
    type: Boolean,
    default: false,
  },
  isViewing: {
    type: Boolean,
    default: false,
  },
  drawnPoints: {
    type: Array,
    default: () => [],
  },
  saveRouteBot: {
    type: Boolean,
    default: false,
  },
  savingRoute: {
    type: Boolean,
    default: false,
  },
});

// 注入禁飞区方法
const noFlyZoneMethods = inject("noFlyZoneMethods");

const emit = defineEmits([
  "draw-start",
  "draw-complete",
  "draw-cancel",
  "route-save",
]);
// 处理绘制开始
const handleDraw = () => {
  if (props.isDrawing || props.isViewing) return;
  emit("draw-start");
};

// 完成绘制时检查禁飞区
const handleComplete = () => {
  if (
    noFlyZoneMethods &&
    noFlyZoneMethods.isRouteCrossingNoFlyZone(props.drawnPoints)
  ) {
    ElMessage.error("路线穿越禁飞区域，无法完成绘制！");
    return;
  }
  emit("draw-complete", props.drawnPoints);
};
// 处理绘制取消
const handleCancel = () => {
  if (!props.isDrawing) return;
  emit("draw-cancel");
};

// 处理保存路线
const handleSaveRoute = () => {
  if (!props.saveRouteBot) {
    ElMessage.warning("没有可保存的路线");
    return;
  }
  emit("route-save");
};
</script>

<style scoped>
.control-group {
  padding: 16px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

/* 按钮容器使用弹性布局 */
.button-group-container {
  display: flex;
  width: 100%;
  gap: 4px;
}

/* 按钮自适应样式 */
.button-group-container :deep(.el-button) {
  flex: 1;
  min-width: 60px;
  padding: clamp(4px, 2vw, 8px);
  font-size: clamp(12px, 1.5vw, 14px);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 图标与文字间距优化 */
.button-group-container :deep(.el-button .el-icon) {
  margin-right: 2px;
  font-size: clamp(12px, 1.5vw, 14px);
}

.control-group:last-child {
  border-bottom: none;
}

.control-btn.emergency {
  margin-top: 12px;
  grid-column: span 2;
  height: 32px;
  background: #2c3d45;
  width: 100%;
  color: #fff;
}

/* 响应式适配 */
@media (max-width: 800px) {
  .button-group-container {
    gap: 0;
  }

  .button-group-container :deep(.el-button span:not(.el-icon)) {
    font-size: 0;
  }

  .button-group-container :deep(.el-button span:not(.el-icon))::after {
    font-size: 12px;
  }

  /* 为每个按钮设置简化文字 */
  .button-group-container
    :deep(.el-button:nth-child(1) span:not(.el-icon))::after {
    content: "绘";
  }

  .button-group-container
    :deep(.el-button:nth-child(2) span:not(.el-icon))::after {
    content: "完";
  }

  .button-group-container
    :deep(.el-button:nth-child(3) span:not(.el-icon))::after {
    content: "取";
  }
}
</style>
