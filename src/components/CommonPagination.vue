<template>
  <div class="pagination-container">
    <el-pagination
      :current-page="currentPage"
      :page-size="pageSize"
      :page-sizes="pageSizes"
      :total="total"
      :layout="layout"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
</template>

<script setup>
import { ref, watch } from "vue";

// 接收父组件参数
const props = defineProps({
  total: {
    type: Number,
    default: 0,
  },
  pageSize: {
    type: Number,
    default: 10,
  },
  currentPage: {
    type: Number,
    default: 1,
  },
  pageSizes: {
    type: Array,
    default: () => [5, 10, 20, 50, 100],
  },
  layout: {
    type: String,
    default: "total, sizes, prev, pager, next, jumper",
  },
});

// 向父组件传递事件
const emit = defineEmits(["size-change", "current-change"]);

// 监听页码变化
const handleSizeChange = (val) => {
  emit("size-change", val);
};

// 监听页数变化
const handleCurrentChange = (val) => {
  emit("current-change", val);
};
</script>

<style scoped>
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  padding: 10px 0;
}
</style>
