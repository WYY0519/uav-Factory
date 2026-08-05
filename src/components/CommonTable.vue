<template>
  <el-card class="table-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <div class="header-left">
          <span class="title">{{ title }}</span>
          <el-tag type="success" effect="plain" class="count-tag">
            共 {{ total }} 条数据
          </el-tag>
        </div>
        <div class="header-right">
          <slot name="header-actions"></slot>
        </div>
      </div>
    </template>

    <el-table
      ref="tableRef"
      :data="tableData"
      border
      stripe
      v-loading="loading"
      style="width: 100%"
      @row-click="handleRowClick"
      :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
      :empty-text="emptyText"
      @selection-change="handleSelectionChange"
      :default-sort="defaultSortConfig"
    >
      <!-- 多选框列 -->
      <el-table-column
        type="selection"
        width="55"
        align="center"
        v-if="showCheckbox"
      >
      </el-table-column>

      <!-- 动态渲染表格列：兼容ID列排序配置 -->
      <el-table-column
        v-for="col in columns"
        :key="col.prop"
        :prop="col.prop"
        :label="col.label"
        :width="col.width"
        :min-width="col.minWidth"
        :align="col.align || 'center'"
        :show-overflow-tooltip="col.showOverflowTooltip || false"
        :formatter="col.formatter"
        :sortable="col.prop === idKey ? sortIdColumn : col.sortable || false"
        :sort-type="col.prop === idKey ? 'number' : col.sortType"
      >
        <template #default="{ row }">
          <slot :name="`col-${col.prop}`" :row="row">
            {{ col.formatter ? col.formatter(row) : row[col.prop] }}
          </slot>
        </template>
      </el-table-column>

      <!-- 操作列 -->
      <el-table-column
        label="操作"
        :label="actionLabel"
        :width="actionWidth"
        :fixed="actionFixed"
        :align="actionAlign"
        fixed="right"
        align="center"
        v-if="showAction"
      >
        <template #default="{ row }">
          <slot name="action" :row="row"></slot>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页插槽 -->
    <slot name="pagination"></slot>
  </el-card>
</template>

<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  title: { type: String, required: true, default: "列表" },
  tableData: { type: Array, default: () => [] },
  columns: { type: Array, required: true, default: () => [] },
  total: { type: Number, default: 0 },
  loading: { type: Boolean, default: false },
  showCheckbox: { type: Boolean, default: true },
  showAction: { type: Boolean, default: true },
  idKey: { type: String, default: "id" }, // 主键字段名（默认id，支持自定义）
  emptyText: { type: String, default: "暂无数据" },
  actionLabel: { type: String, default: "操作" },
  actionWidth: { type: [String, Number], default: 200 },
  actionFixed: { type: [String, Boolean], default: "right" },
  actionAlign: { type: String, default: "center" },
  // 核心新增：ID列排序开关（false=关闭，true=开启，默认false）
  sortIdColumn: { type: Boolean, default: false },
  // 新增：ID列默认排序方式（asc=升序，desc=降序，默认asc）
  idDefaultSort: {
    type: String,
    default: "asc",
    validator: (v) => ["asc", "desc"].includes(v),
  },
});

const tableRef = ref(null);
const selectedRows = ref([]);
const emit = defineEmits([
  "row-click",
  "selection-change",
  "checkbox-change",
  "sort-change", // 新增：暴露排序变化事件，父组件可监听做后端排序
]);

// 新增：计算默认排序配置（仅当开启ID列排序时生效）
const defaultSortConfig = computed(() => {
  if (!props.sortIdColumn) return {};
  return {
    prop: props.idKey, // 排序字段为主键（id/自定义idKey）
    order: props.idDefaultSort === "asc" ? "ascending" : "descending", // 适配el-table的order值
  };
});

const handleRowClick = (row) => {
  emit("row-click", row);
};

const handleSelectionChange = (val) => {
  selectedRows.value = val;
  emit("selection-change", val);
  emit("checkbox-change", val);
};

// 新增：监听表格排序变化，向父组件发射事件（支持后端排序扩展）
const handleSortChange = (sort) => {
  emit("sort-change", sort);
};

defineExpose({
  selectedRows,
  getSelectedIds: () => selectedRows.value.map((row) => row[props.idKey]),
  clearSelection: () => {
    if (tableRef.value) {
      tableRef.value.clearSelection();
    }
  },
  toggleRowSelection: (row, selected) => {
    if (tableRef.value) {
      tableRef.value.toggleRowSelection(row, selected);
    }
  },
  getTableInstance: () => tableRef.value,
  // 新增：手动触发排序的方法（可选扩展）
  sortTable: (prop, order) => {
    if (tableRef.value) {
      tableRef.value.sort(prop, order);
    }
  },
});
</script>

<style scoped>
.table-card {
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.count-tag {
  padding: 4px 8px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

:deep(.el-table) {
  border-radius: 8px;
  margin-top: 20px;
}

:deep(.el-table .cell) {
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}

/* 新增：优化排序图标样式，与表格头部风格统一 */
:deep(.el-table__header .el-table-column--sortable .cell) {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

/* 增大操作列按钮图标大小 */
:deep(.el-button .el-icon) {
  font-size: 16px;
}

@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .header-right {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
