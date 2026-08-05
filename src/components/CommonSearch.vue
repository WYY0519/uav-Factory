<template>
  <div class="search-container">
    <el-form :inline="true" :model="formData" class="search-form">
      <!-- 动态渲染搜索项：input/select/daterange日期范围 -->
      <el-form-item
        v-for="item in searchItems"
        :key="item.prop"
        :label="item.label"
        :class="{ 'form-item': true, [item.className]: item.className }"
      >
        <!-- 输入框（默认） -->
        <el-input
          v-if="!item.type || item.type === 'input'"
          width="20%"
          v-model="formData[item.prop]"
          :placeholder="item.placeholder || `请输入${item.label}`"
          :maxlength="item.maxlength"
          clearable
          @clear="handleClear"
        />

        <!-- 下拉选择框 -->
        <el-select
          v-else-if="item.type === 'select'"
          v-model="formData[item.prop]"
          :placeholder="item.placeholder || `请选择${item.label}`"
          clearable
          @clear="handleClear"
          style="width: 100%"
        >
          <el-option
            v-for="option in item.options"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>

        <!-- 日期范围选择器 daterange：新增disabled-date绑定 -->
        <el-date-picker
          v-else-if="item.type === 'daterange'"
          v-model="formData[item.prop]"
          type="daterange"
          :range-separator="item.rangeSeparator || 'To'"
          :start-placeholder="item.startPlaceholder || 'Start date'"
          :end-placeholder="item.endPlaceholder || 'End date'"
          :size="item.size || 'default'"
          :disabled-date="handleDisabledDate"
          clearable
          @clear="handleClear"
          style="width: 100%"
        />
      </el-form-item>

      <!-- 操作按钮 -->
      <div class="button-group">
        <el-button type="primary" @click="handleSearch" :icon="Search">
          搜索
        </el-button>
        <el-button type="default" @click="handleReset" :icon="Refresh">
          重置
        </el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import { Search, Refresh } from "@element-plus/icons-vue";
import dayjs from "dayjs"; // 核心新增：引入dayjs

// 接收父组件参数
const props = defineProps({
  searchItems: {
    type: Array,
    required: true,
    default: () => [],
  },
  initialData: {
    type: Object,
    default: () => ({}),
  },
});

// 表单数据
const formData = reactive({ ...props.initialData });

// 向父组件传递事件
const emit = defineEmits(["search", "reset"]);

// 核心新增：禁用未来日期的方法
// 返回true则禁用该日期，false则允许选择
const handleDisabledDate = (date) => {
  // 禁止选择【当前日期之后】的日期，保留当前日期可选择
  return dayjs(date).isAfter(dayjs(), "day");
};

// 搜索
const handleSearch = () => {
  emit("search", { ...formData });
};

// 重置
const handleReset = () => {
  Object.keys(formData).forEach((key) => {
    formData[key] = props.initialData[key] || "";
  });
  emit("reset");
};

// 单个输入框/下拉框/日期选择器清除时触发搜索
const handleClear = () => {
  handleSearch();
};
</script>

<style scoped>
.search-container {
  background: #fff;
  border-radius: 8px;
  padding: 18px 18px 0 18px;
  margin-bottom: 18px;
}

.search-form {
  display: flex;
  flex-wrap: wrap; /* 自动换行，核心属性 */
  width: 100%;
  gap: 0 10px; /* 列间距不变，4个项自动适配3个间距 */
}

/* 核心修改：宽度改为23.5%，实现每行默认4个 */
.form-item {
  width: 22.5%; /* 4*23.5%=94%，预留6%适配3个10px间距，无溢出 */
  min-width: 200px; /* 保留最小宽度，避免小屏幕挤压 */
  margin-bottom: 18px; /* 行间距不变 */
}

.button-group {
  display: flex;
  margin-left: auto;
  align-items: flex-end;
  gap: 10px;
  margin-bottom: 18px;
  /* 按钮组独占右侧，不参与4列布局 */
}

/* 响应式优化不变：768px以下移动端每行1个 */
@media (max-width: 768px) {
  .button-group {
    width: 100%;
    margin-left: 0;
    justify-content: flex-start;
  }

  .form-item {
    width: 100%; /* 移动端全屏宽度，每行1个 */
    min-width: unset; /* 取消最小宽度，适配移动端 */
  }
}
</style>
