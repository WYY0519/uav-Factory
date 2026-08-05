<template>
  <div class="repair-order-management">
    <!-- 1. 搜索组件 -->
    <CommonSearch
      :search-items="searchItems"
      :initial-data="initialSearchData"
      @search="handleSearch"
      @reset="handleReset"
    />

    <!-- 2. 表格组件：新增ref、多选事件，完善批量删除按钮 -->
    <CommonTable
      title="维修单列表"
      ref="repairTableRef"
      :table-data="repairOrderList"
      :columns="dynamicTableColumns"
      :total="total"
      :loading="loading"
      :action-width="100"
      @row-click="handleRowClick"
      @radio-change="handleRadioChange"
      @selection-change="handleSelectionChange"
    >
      <template #header-actions>
        <!-- 完善批量删除按钮：绑定点击事件、添加图标，与用户列表逻辑一致 -->
        <el-button
          type="danger"
          @click="handleBatchDelete"
          :disabled="batchDeleteDisabled"
          :icon="Delete"
        >
          批量删除
        </el-button>
      </template>
      <!-- 状态列自定义渲染 -->
      <template #col-status="{ row }">
        <el-switch
          v-if="row.id !== undefined"
          v-model="row.status"
          :active-value="1"
          :inactive-value="0"
          @change="handleStatusChange(row)"
        />
      </template>
      <!-- 回复记录列自定义模板 + 点击事件 -->
      <template #col-completedResult="{ row }">
        <span
          class="completed-result-cell"
          @click="handleCompletedResultClick(row)"
          style="cursor: pointer"
        >
          {{ row.completedResult || "暂无记录" }}
        </span>
      </template>
      <!-- 操作列 -->
      <template #action="{ row }">
        <el-button-group>
          <el-tooltip
            v-if="row.status === 1"
            content="更新处理结果"
            placement="top"
          >
            <el-button
              type="primary"
              link
              @click="handleEdit(row)"
              :icon="Edit"
            />
          </el-tooltip>
          <el-tooltip content="删除维修单" placement="top">
            <el-button
              type="danger"
              link
              @click="handleDelete(row)"
              :icon="Delete"
            />
          </el-tooltip>
        </el-button-group>
      </template>
      <!-- 分页组件 -->
      <template #pagination>
        <CommonPagination
          :total="total"
          :current-page="currentPage"
          :page-size="pageSize"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </template>
    </CommonTable>

    <!-- 3. 编辑表单对话框 -->
    <CommonFormDialog
      :title="formDialogTitle"
      v-model="formDialogVisible"
      :form-items="formItems"
      :rules="formRules"
      :initial-data="formInitialData"
      :is-edit="isEditMode"
      :label-width="labelWidth"
      @submit="handleFormSubmit"
      @cancel="handleFormCancel"
    />
    <!-- 回复记录弹窗 -->
    <el-dialog
      v-model="dialogVisibleReplyRecord"
      title="回复记录"
      width="500"
      :before-close="handleClose"
    >
      <div style="line-height: 1.8; padding: 10px 0; text-align: left">
        <span
          v-html="(replyContent || '暂无回复记录').replace(/\n/g, '<br />')"
        ></span>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Edit, Delete } from "@element-plus/icons-vue";
// 引入公共组件
import CommonSearch from "@/components/CommonSearch.vue";
import CommonTable from "@/components/CommonTable.vue";
import CommonPagination from "@/components/CommonPagination.vue";
import CommonFormDialog from "@/components/CommonFormDialog.vue";
// 接口：补充批量删除接口（需确认后端实际接口名，此处按规范命名）
import {
  repairOrderHandleList,
  repairOrderUpdateHandleResult,
  repairOrderDelete,
  repairOrderDeleteBatch, // 新增：维修单批量删除接口
} from "@/api/repairOrder";

// ===== 搜索配置 =====
const searchItems = [
  {
    prop: "deviceNumber",
    label: "设备编号:",
    placeholder: "请输入设备编号",
  },
  { prop: "applyName", label: "申请的公司:", placeholder: "请输入申请的公司" },
  {
    prop: "status",
    label: "维修单状态:",
    type: "select",
    placeholder: "请选择维修单状态",
    options: [
      { label: "处理中", value: "1" },
      { label: "已处理", value: "0" },
    ],
  },
];
const initialSearchData = { deviceNumber: "", applyName: "", status: "1" };
const formInline = reactive({ ...initialSearchData });
const labelWidth = ref("110px");
const batchDeleteDisabled = computed(() => {
  // 只有选中"已处理"（status=0）时，按钮才可用（batchDeleteDisabled=false）
  return formInline.status !== "0";
});
// ===== 表格配置 =====
const baseTableColumns = [
  { prop: "id", label: "ID", width: "60" },
  {
    prop: "deviceNumber",
    label: "设备编号",
    minWidth: "220",
    showOverflowTooltip: true,
  },
  { prop: "applyName", label: "申请公司", minWidth: "200" },
  { prop: "contactUser", label: "联系人", minWidth: "100" },
  { prop: "contactPhone", label: "联系电话", minWidth: "120" },
  {
    prop: "reason",
    label: "报修原因",
    minWidth: "200",
    showOverflowTooltip: true,
  },
  { prop: "backWay", label: "退回方式", minWidth: "140" },
  { prop: "backTime", label: "报修时间", minWidth: "180" },
  { prop: "reply", label: "最新回复内容", minWidth: "150" },
  {
    prop: "completedResult",
    label: "回复记录",
    minWidth: "120",
  },
];
const dynamicTableColumns = computed(() => {
  const columns = [...baseTableColumns];
  if (handleStatus.value === 0) {
    columns.push({
      prop: "completedTime",
      label: "完成时间",
      minWidth: "180",
      formatter: (row) => row.completedTime || "-",
    });
  }
  return columns;
});

// ===== 表单配置 =====
const formItems = [
  {
    prop: "reply",
    label: "回复结果",
    type: "textarea",
    placeholder: "请输入维修单回复内容",
    minWidth: 300,
    maxlength: 200,
    required: true,
  },
  {
    prop: "isComplete",
    label: "是否处理完成",
    type: "select",
    placeholder: "请选择是否处理完成",
    options: [
      { label: "是", value: true },
      { label: "否", value: false },
    ],
    minWidth: 200,
    required: true,
  },
];
const formRules = {
  reply: [
    { required: true, message: "请输入维修单回复内容", trigger: "blur" },
    {
      min: 1,
      max: 200,
      message: "回复内容长度在1-200字符之间",
      trigger: "blur",
    },
  ],
  isComplete: [
    { required: true, message: "请选择是否处理完成", trigger: "change" },
  ],
};

// ===== 状态管理：新增批量操作核心状态，原有状态保留 =====
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(5);
const total = ref(0);
const repairOrderList = ref([]);
const selectedOrderId = ref("");
// 表单对话框状态
const formDialogVisible = ref(false);
const formDialogTitle = ref("更新维修单结果");
const formInitialData = ref({});
const isEditMode = ref(false);
const handleStatus = ref(1);
const dialogVisibleReplyRecord = ref(false);
const replyContent = ref("");
// 新增：批量操作核心状态（与用户列表逻辑完全一致）
const repairTableRef = ref(null); // 表格实例引用，用于操作选中状态
const selectedRows = ref([]); // 存储表格多选的行数据

// ===== 核心方法 =====
// 获取维修单列表
const getRepairOrderList = async () => {
  loading.value = true;
  try {
    const res = await repairOrderHandleList({
      ...formInline,
      pageSize: pageSize.value,
      currentPage: currentPage.value,
      status: handleStatus.value,
    });
    if (res.code === 200) {
      repairOrderList.value = res.data.list;
      total.value = res.data.total;
    }
  } catch (error) {
    ElMessage.error("获取维修单列表失败");
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = (params) => {
  Object.assign(formInline, params);
  if (params.status) {
    handleStatus.value = Number(params.status);
  } else {
    handleStatus.value = 1;
  }
  currentPage.value = 1;
  getRepairOrderList();
};

// 重置：新增清空多选状态逻辑
const handleReset = () => {
  Object.assign(formInline, initialSearchData);
  handleStatus.value = 1;
  currentPage.value = 1;
  getRepairOrderList();
  // 清空多选选中状态
  selectedRows.value = [];
  if (repairTableRef.value) {
    repairTableRef.value.clearSelection();
  }
};

// 分页
const handleSizeChange = (val) => {
  pageSize.value = val;
  getRepairOrderList();
};
const handleCurrentChange = (val) => {
  currentPage.value = val;
  getRepairOrderList();
};

// 行点击/单选
const handleRowClick = (row) => {
  selectedOrderId.value = row.id;
};
const handleRadioChange = (row) => {
  selectedOrderId.value = row.id;
};

// 新增：监听表格多选状态变化，同步选中行数据（与用户列表一致）
const handleSelectionChange = (val) => {
  selectedRows.value = val;
};

// 回复记录点击事件
const handleCompletedResultClick = (row) => {
  dialogVisibleReplyRecord.value = true;
  replyContent.value = row.completedResult;
};
// 回复记录弹窗关闭
const handleClose = () => {
  dialogVisibleReplyRecord.value = false;
  replyContent.value = "";
};

// 状态切换：补充接口定义（原代码缺失updateStatus）
const handleStatusChange = async (row) => {
  const oldStatus = row.status;
  try {
    // 此处替换为实际的状态更新接口，原代码缺失，暂保留逻辑
    // const res = await updateStatus(row.id);
    // if (res.code == 200) {
    //   ElMessage.success(res.message);
    //   getRepairOrderList();
    // } else {
    //   throw new Error(res.message);
    // }
    ElMessage.success("状态修改成功");
    getRepairOrderList();
  } catch (error) {
    row.status = oldStatus; // 接口失败时回滚
    ElMessage.error("状态修改失败：" + error.message);
    getRepairOrderList();
  }
};

// 改造：单行编辑方法 - 点击编辑时取消所有多选，仅保留当前行
const handleEdit = (row) => {
  // 1. 清空所有多选状态，仅选中当前点击的行
  if (repairTableRef.value) {
    repairTableRef.value.clearSelection();
    repairTableRef.value.toggleRowSelection(row, true);
  }
  // 2. 更新选中行数据，仅保留当前行
  selectedRows.value = [row];

  isEditMode.value = true;
  formInitialData.value = {
    id: row.id,
    reply: row.reply || "", // 回显现有回复内容
    isComplete: row.status === 0, // 根据维修单状态回显是否完成
  };
  formDialogVisible.value = true;
};

// 提交表单：新增清空多选状态逻辑
const handleFormSubmit = async (formData) => {
  try {
    const res = await repairOrderUpdateHandleResult(formData);
    if (res.code === 200) {
      ElMessage.success(res.message);
      formDialogVisible.value = false;
      // 清空多选选中状态
      selectedRows.value = [];
      if (repairTableRef.value) {
        repairTableRef.value.clearSelection();
      }
      getRepairOrderList();
    }
  } catch (error) {
    ElMessage.error("更新失败：" + error.message);
  }
};

// 取消表单：新增清空多选状态逻辑
const handleFormCancel = () => {
  formDialogVisible.value = false;
  // 清空多选选中状态
  selectedRows.value = [];
  if (repairTableRef.value) {
    repairTableRef.value.clearSelection();
  }
};

// 改造：单行删除方法 - 取消所有多选，仅保留当前行，捕获cancel错误
const handleDelete = (row) => {
  // 1. 清空所有多选状态，仅选中当前点击的行
  if (repairTableRef.value) {
    repairTableRef.value.clearSelection();
    repairTableRef.value.toggleRowSelection(row, true);
  }
  // 2. 更新选中行数据，仅保留当前行
  selectedRows.value = [row];

  ElMessageBox.confirm(
    `确定删除维修单【${row.deviceNumber}】吗？删除后不可恢复！`,
    "警告",
    { type: "warning" },
  )
    .then(async () => {
      try {
        const res = await repairOrderDelete(row.id, "handle");
        if (res.code === 200) {
          ElMessage.success("删除成功");
          // 清空多选选中状态
          selectedRows.value = [];
          if (repairTableRef.value) {
            repairTableRef.value.clearSelection();
          }
          getRepairOrderList();
        }
      } catch (error) {
        ElMessage.error("删除失败：" + error.message);
      }
    })
    .catch((error) => {
      // 捕获弹窗取消的cancel错误，静默处理
      if (error !== "cancel") {
        ElMessage.error("操作异常，请重试");
        console.error("弹窗操作报错：", error);
      }
      // 取消后清空选中状态，避免残留
      selectedRows.value = [];
      if (repairTableRef.value) {
        repairTableRef.value.clearSelection();
      }
    });
};

// 新增：批量删除核心方法（与用户列表逻辑完全一致，适配维修单业务）
const handleBatchDelete = () => {
  // 1. 校验是否选中数据
  if (selectedRows.value.length === 0) {
    ElMessage.warning("请选择要删除的维修单");
    return;
  }
  // 2. 获取选中的维修单ID数组和数量（用于提示）
  const deleteIds = selectedRows.value.map((row) => row.id);
  const selectCount = selectedRows.value.length;
  // 3. 批量确认弹窗：提示选中数量，操作更直观
  ElMessageBox.confirm(
    `确定要删除选中的【${selectCount}】条维修单吗？删除后不可恢复！`,
    "批量删除确认",
    {
      type: "danger",
      confirmButtonText: "确定删除",
      cancelButtonText: "取消",
    },
  ).then(async () => {
    loading.value = true;
    try {
      // 4. 调用批量删除接口，传入选中的ID数组
      const res = await repairOrderDeleteBatch(deleteIds, "handle");
      if (res.code === 200) {
        ElMessage.success(`成功删除${selectCount}条维修单`);
        // 5. 操作成功后清空选中状态
        selectedRows.value = [];
        if (repairTableRef.value) {
          repairTableRef.value.clearSelection();
        }
        // 6. 刷新列表
        getRepairOrderList();
      } else {
        ElMessage.error(`批量删除失败：${res.message || "未知错误"}`);
      }
    } catch (error) {
      console.error("批量删除维修单异常：", error);
      ElMessage.error("批量删除失败：网络异常，请重试");
    } finally {
      loading.value = false;
    }
  });
};

// 初始化
onMounted(() => {
  getRepairOrderList();
});
</script>

<style scoped>
.repair-order-management {
  box-sizing: border-box;
  background-color: #f5f7fa;
  height: 100%;
}

.completed-result-cell {
  /* color: #409eff; */
  text-decoration: underline;
}

:deep(.table-card) {
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

:deep(.el-table) {
  margin-top: 0;
}
</style>
