<template>
  <div class="factory-list">
    <!-- 2. 公共表格组件 -->
    <CommonTable
      title="工厂列表"
      :table-data="filteredFactoryList"
      :columns="tableColumns"
      :total="total"
      :loading="loading"
      @row-click="handleRowClick"
      @radio-change="handleRadioChange"
      :action-width="120"
      :showAction="false"
    >
      <!-- 分页组件插槽 -->
      <template #pagination>
        <CommonPagination
          :total="total"
          :current-page="currentPage"
          :page-size="pageSize"
          :page-sizes="[5, 10, 20, 30, 50, 100]"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </template>
    </CommonTable>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";

// 引入公共组件
import CommonTable from "@/components/CommonTable.vue";
import CommonPagination from "@/components/CommonPagination.vue";

// 接口导入
import { facInfo } from "@/api/fac";

// ===== 表格列配置）=====
const tableColumns = Object.freeze([
  { prop: "name", label: "工厂名称", minWidth: "180" },
  { prop: "address", label: "工厂地址", minWidth: "220" },
  { prop: "description", label: "工厂描述", minWidth: "200" },
  { prop: "factoryCode", label: "工厂编号", minWidth: "200" },
  { prop: "principal", label: "负责人", minWidth: "200" },
  { prop: "contactPhone", label: "联系人电话", minWidth: "200" },
]);

// ===== 状态管理=====
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(5);
const total = ref(0);
const filteredFactoryList = ref([]);

// ===== 核心业务方法=====
// 获取工厂列表数据
const fetchFactoryList = async () => {
  const data = {
    currentPage: currentPage.value,
    pageSize: pageSize.value,
  };
  loading.value = true;
  try {
    const res = await facInfo(data);
    if (res.code === 200) {
      filteredFactoryList.value = res.data.list;
      total.value = res.data.total;
    } else {
      // 补充：处理非200业务错误
      ElMessage.error(`获取工厂列表失败：${res.message || "未知错误"}`);
    }
  } catch (error) {
    console.error("获取工厂列表异常：", error);
    ElMessage.error("获取工厂列表失败：网络异常，请重试");
  } finally {
    loading.value = false; // 移除：强制延迟500ms，接口返回后立即关闭
  }
};

// 分页事件处理
const handleSizeChange = (val) => {
  pageSize.value = val;
  fetchFactoryList();
};
const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchFactoryList();
};

// 行点击/单选框变更（若无需单选功能，可直接删除这两个方法+selectedFactoryId）
const selectedFactoryId = ref(""); // 修正：变量名和业务对齐
const handleRowClick = (row) => {
  selectedFactoryId.value = row.id;
  console.log("选中工厂:", selectedFactoryId.value);
};
const handleRadioChange = (row) => {
  selectedFactoryId.value = row.id;
  console.log("选中工厂:", selectedFactoryId.value);
};

// 初始化加载数据
onMounted(() => {
  fetchFactoryList();
});
</script>

<style scoped>
.factory-list {
  /* 修正：类名和工厂业务对齐 */
  box-sizing: border-box;
  background-color: #f5f7fa;
  padding: 0 10px;
}

/* 适配公共组件样式 */
:deep(.table-card) {
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

:deep(.el-table) {
  border-radius: 8px;
  margin-top: 20px;
}

:deep(.el-button-group) {
  display: flex;
  gap: 8px;
}

/* 单选框样式 */
:deep(.el-radio) {
  margin-right: 0;
  display: flex;
  justify-content: center;
}

:deep(.el-radio__label) {
  display: none;
}

/* 响应式适配 */
@media (max-width: 768px) {
  :deep(.card-header) {
    flex-direction: column;
    gap: 16px;
  }
  :deep(.header-right) {
    width: 100%;
    flex-direction: column;
    gap: 12px;
  }
}
</style>
