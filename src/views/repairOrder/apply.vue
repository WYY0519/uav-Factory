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
      title="申请单列表"
      ref="applyTableRef"
      :table-data="repairOrderList"
      :columns="tableColumns"
      :total="total"
      :loading="loading"
      @row-click="handleRowClick"
      @radio-change="handleRadioChange"
      :showAction="false"
      @selection-change="handleSelectionChange"
    >
      <!-- 头部操作按钮：完善批量删除按钮绑定 -->
      <template #header-actions>
        <el-button type="success" @click="handleAdd" :icon="Plus">
          新增维修申请
        </el-button>
        <el-tooltip
          content="申请单状态为已处理，支持批量删除"
          placement="top"
          effect="dark"
        >
          <el-button
            type="danger"
            :disabled="batchDeleteDisabled"
            @click="handleBatchDelete"
            :icon="Delete"
          >
            批量删除
          </el-button>
        </el-tooltip>
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
          <!-- 编辑按钮：仅有效状态显示 -->
          <el-tooltip
            v-if="handleStatus === 1"
            content="编辑维修单"
            placement="top"
          >
            <el-button
              type="primary"
              link
              @click="handleEdit(row)"
              :icon="Edit"
            />
          </el-tooltip>
          <!-- 删除按钮 -->
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

    <!-- 3. 新增/编辑表单对话框 -->
    <CommonFormDialog
      :title="formDialogTitle"
      v-model="formDialogVisible"
      :form-items="currentFormItems"
      :rules="currentFormRules"
      :initial-data="formInitialData"
      :is-edit="isEditMode"
      @submit="handleFormSubmit"
      @cancel="handleFormCancel"
    />
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
import { ref, reactive, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Delete, Edit } from "@element-plus/icons-vue";
// 引入公共组件
import CommonSearch from "@/components/CommonSearch.vue";
import CommonTable from "@/components/CommonTable.vue";
import CommonPagination from "@/components/CommonPagination.vue";
import CommonFormDialog from "@/components/CommonFormDialog.vue";
// 接口：补充批量删除接口，传参统一为apply
import {
  repairOrderApplyList,
  repairOrderApplyAdd,
  repairOrderDelete,
  repairOrderDeleteBatch, // 新增：批量删除接口（与单行删除共用api，传apply标识）
} from "@/api/repairOrder";
import { dictionaryDicName } from "@/api/dictionary";
import { deviceMap } from "@/api/device";

// ===== 搜索配置 =====
const searchItems = [
  {
    prop: "deviceNumber",
    label: "设备编号:",
    placeholder: "请输入设备编号",
  },
  {
    prop: "status",
    label: "申请单状态:",
    type: "select",
    placeholder: "请选择申请单状态",
    options: [
      { label: "待处理", value: "1" },
      { label: "已处理", value: "0" },
    ],
  },
];
const initialSearchData = { deviceNumber: "", status: "1" };
const formInline = reactive({ ...initialSearchData });
const batchDeleteDisabled = computed(() => {
  // 只有选中"已处理"（status=0）时，按钮才可用（batchDeleteDisabled=false）
  return formInline.status !== "0";
});

// ===== 表格配置 =====
const tableColumns = [
  { prop: "id", label: "ID", width: "60" },
  {
    prop: "deviceNumber",
    label: "设备编号",
    minWidth: "220",
    maxlength: 20,
    showOverflowTooltip: true,
  },
  { prop: "contactUser", label: "联系人", minWidth: "100" },
  { prop: "contactPhone", label: "联系电话", minWidth: "120" },
  {
    prop: "reason",
    label: "报修原因",
    minWidth: "200",
    showOverflowTooltip: true,
  },
  { prop: "backWay", label: "退回方式", minWidth: "120" },
  { prop: "backTime", label: "报修时间", minWidth: "180" },
  {
    prop: "reply",
    label: "最新回复内容",
    minWidth: "200",
    showOverflowTooltip: true,
    align: "left",
  },
  {
    prop: "completedResult",
    label: "回复记录",
    minWidth: "120",
    slot: "completedResult",
    align: "left",
  },
];
const refundMethodOptions = ref([]);
const companyOptions = ref([]);

// ===== 表单配置（新增/编辑 统一5个输入框字段）=====
const baseFormItems = ref([
  {
    prop: "deviceNumber",
    label: "设备",
    type: "select",
    placeholder: "请选择设备",
    minWidth: 300,
    required: true,
    options: companyOptions,
  },
  {
    prop: "contactUser",
    label: "联系人",
    type: "input",
    placeholder: "请输入联系人姓名",
    minWidth: 200,
    required: true,
    maxlength: 20,
  },
  {
    prop: "contactPhone",
    label: "联系电话",
    type: "input",
    placeholder: "请输入11位手机号",
    minWidth: 200,
    required: true,
    maxlength: 11,
  },
  {
    prop: "reason",
    label: "报修原因",
    type: "textarea",
    placeholder: "请输入报修原因",
    rows: 3,
    minWidth: 300,
    required: true,
    maxlength: 200,
  },
  {
    prop: "backWay",
    label: "退回方式",
    type: "select",
    placeholder: "请选择退回方式",
    minWidth: 200,
    required: true,
    options: refundMethodOptions,
  },
]);

// ===== 表单验证规则 =====
const baseFormRules = ref({
  deviceNumber: [
    { required: true, message: "设备编号为必填项", trigger: "blur" },
  ],
  contactUser: [
    { required: true, message: "联系人为必填项", trigger: "blur" },
    { max: 20, message: "长度不超过20字符", trigger: "blur" },
  ],
  contactPhone: [
    { required: true, message: "联系电话为必填项", trigger: "blur" },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: "请输入正确的11位手机号",
      trigger: "blur",
    },
  ],
  reason: [
    { required: true, message: "报修原因为必填项", trigger: "blur" },
    { min: 5, max: 500, message: "长度5-500字符", trigger: "blur" },
  ],
  backWay: [{ required: true, message: "退回方式为必填项", trigger: "change" }],
});

// ===== 状态管理：新增批量操作核心状态 =====
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(5);
const total = ref(0);
const repairOrderList = ref([]);
const selectedOrderId = ref("");
// 表单对话框状态
const formDialogVisible = ref(false);
const formDialogTitle = ref("");
const formInitialData = ref({});
const isEditMode = ref(false); // true=编辑，false=新增
const handleStatus = ref(1);
const dialogVisibleReplyRecord = ref(false);
const replyContent = ref("");
// 动态表单配置
const currentFormItems = computed(() => baseFormItems.value);
const currentFormRules = computed(() => baseFormRules.value);
// 新增：批量操作核心状态（与维修单逻辑一致）
const applyTableRef = ref(null); // 表格实例引用，用于操作选中状态
const selectedRows = ref([]); // 存储表格多选的行数据

// ===== 方法 =====
// 获取申请单列表
const getRepairOrderList = async () => {
  loading.value = true;
  try {
    const res = await repairOrderApplyList({
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
    ElMessage.error("获取申请单列表失败");
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = (params) => {
  Object.assign(formInline, params);
  handleStatus.value = params.status ? Number(params.status) : 1;
  currentPage.value = 1;
  getRepairOrderList();
};

// 重置：新增清空多选状态
const handleReset = () => {
  Object.assign(formInline, initialSearchData);
  handleStatus.value = 1;
  currentPage.value = 1;
  getRepairOrderList();
  // 清空多选选中状态
  selectedRows.value = [];
  if (applyTableRef.value) {
    applyTableRef.value.clearSelection();
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

// 新增：监听表格多选状态变化
const handleSelectionChange = (val) => {
  selectedRows.value = val;
};

// 状态切换：补充接口缺失提示（原代码无updateStatus接口）
const handleStatusChange = async (row) => {
  const oldStatus = row.status;
  try {
    // 请替换为项目真实的状态更新接口
    // const res = await updateStatus(row.id);
    // if (res.code == 200) {
    //   ElMessage.success(res.message);
    //   getRepairOrderList();
    // } else {
    //   throw new Error(res.message);
    // }
    ElMessage.success("申请单状态修改成功");
    getRepairOrderList();
  } catch (error) {
    row.status = oldStatus; // 接口失败回滚状态
    ElMessage.error("状态修改失败：" + (error.message || "未知错误"));
    getRepairOrderList();
  }
};

// 回复记录点击事件
const handleCompletedResultClick = (row) => {
  dialogVisibleReplyRecord.value = true;
  replyContent.value = row.completedResult;
};

// 关闭回复记录弹窗
const handleClose = () => {
  dialogVisibleReplyRecord.value = false;
  replyContent.value = "";
};

// 新增维修申请：新增清空多选状态
const handleAdd = () => {
  isEditMode.value = false;
  formDialogTitle.value = "新增维修申请";
  formInitialData.value = {
    deviceNumber: "",
    contactUser: "",
    contactPhone: "",
    reason: "",
    backWay: "",
  };
  formDialogVisible.value = true;
  // 清空多选选中状态
  selectedRows.value = [];
  if (applyTableRef.value) {
    applyTableRef.value.clearSelection();
  }
};

// 编辑维修单：改造为清空多选，仅选中当前行
const handleEdit = (row) => {
  if (!row.id) {
    ElMessage.warning("申请单ID不存在，无法编辑");
    return;
  }
  // 清空所有多选，仅选中当前行
  if (applyTableRef.value) {
    applyTableRef.value.clearSelection();
    applyTableRef.value.toggleRowSelection(row, true);
  }
  selectedRows.value = [row];

  isEditMode.value = true;
  formDialogTitle.value = "编辑维修单";
  formInitialData.value = {
    id: row.id,
    deviceNumber: row.deviceNumber || "",
    contactUser: row.contactUser || "",
    contactPhone: row.contactPhone || "",
    reason: row.reason || "",
    backWay: row.backWay || "",
  };
  formDialogVisible.value = true;
};

// 提交表单：新增清空多选状态
const handleFormSubmit = async (formData) => {
  try {
    let res;
    res = await repairOrderApplyAdd(formData);
    ElMessage.success(res.message || "新增维修申请成功");

    formDialogVisible.value = false;
    // 清空多选选中状态
    selectedRows.value = [];
    if (applyTableRef.value) {
      applyTableRef.value.clearSelection();
    }
    getRepairOrderList();
  } catch (error) {
    console.error("表单提交失败：", error);
    ElMessage.error(isEditMode.value ? "编辑失败" : "新增失败");
  }
};

// 取消表单：新增清空多选状态
const handleFormCancel = () => {
  formDialogVisible.value = false;
  // 清空多选选中状态
  selectedRows.value = [];
  if (applyTableRef.value) {
    applyTableRef.value.clearSelection();
  }
};

// 获取退回方式选项
const refundMethodList = async () => {
  try {
    const res = await dictionaryDicName("backway");
    if (res.code === 200) {
      refundMethodOptions.value = res.data.map((item) => ({
        value: item.dicKey,
        label: item.dicValue,
      }));
    } else {
      ElMessage.error("获取退回方式失败：" + res.message);
    }
  } catch (error) {
    console.error("获取退回方式失败:", error);
    ElMessage.error("加载退回方式失败，请刷新页面重试");
  }
};
//获取设备
const queryDevice = async () => {
  try {
    const res = await deviceMap();
    if (res.code === 200) {
      companyOptions.value = res.data.map((item) => ({
        value: item.dnumber,
        label: item.dname,
      }));
    } else {
      ElMessage.error("获取退回方式失败：" + res.message);
    }
  } catch (error) {
    console.error("获取退回方式失败:", error);
    ElMessage.error("加载退回方式失败，请刷新页面重试");
  }
};
// 改造：单行删除 - 清空多选仅选当前行，捕获cancel错误
const handleDelete = (row) => {
  // 清空所有多选，仅选中当前行
  if (applyTableRef.value) {
    applyTableRef.value.clearSelection();
    applyTableRef.value.toggleRowSelection(row, true);
  }
  selectedRows.value = [row];

  ElMessageBox.confirm(`确定删除申请单【${row.deviceNumber}】吗？`, "警告", {
    type: "warning",
  })
    .then(async () => {
      try {
        const res = await repairOrderDelete(row.id, "apply");
        if (res.code === 200) {
          ElMessage.success("删除成功");
          // 清空多选状态
          selectedRows.value = [];
          if (applyTableRef.value) {
            applyTableRef.value.clearSelection();
          }
          getRepairOrderList();
        }
      } catch (error) {
        ElMessage.error("删除失败：" + (error.message || "未知错误"));
      }
    })
    .catch((error) => {
      // 捕获弹窗取消的cancel错误，静默处理
      if (error !== "cancel") {
        ElMessage.error("操作异常，请重试");
        console.error("弹窗操作报错：", error);
      }
      // 取消后清空选中状态
      selectedRows.value = [];
      if (applyTableRef.value) {
        applyTableRef.value.clearSelection();
      }
    });
};

// 新增：批量删除核心方法 - 严格传参apply，与单行删除一致
const handleBatchDelete = () => {
  // 1. 校验是否选中数据
  if (selectedRows.value.length === 0) {
    ElMessage.warning("请选择要删除的申请单");
    return;
  }
  // 2. 获取选中的申请单ID数组
  const deleteIds = selectedRows.value.map((row) => row.id);
  const selectCount = selectedRows.value.length;

  // 3. 批量确认弹窗
  ElMessageBox.confirm(
    `确定要删除选中的【${selectCount}】条申请单吗？删除后不可恢复！`,
    "批量删除确认",
    {
      type: "danger",
      confirmButtonText: "确定删除",
      cancelButtonText: "取消",
    },
  ).then(async () => {
    loading.value = true;
    try {
      // 4. 调用批量删除接口，第二个参数严格传apply（与单行删除一致）
      const res = await repairOrderDeleteBatch(deleteIds, "apply");
      if (res.code === 200) {
        ElMessage.success(`成功删除${selectCount}条申请单`);
        // 5. 清空选中状态
        selectedRows.value = [];
        if (applyTableRef.value) {
          applyTableRef.value.clearSelection();
        }
        // 6. 刷新列表
        getRepairOrderList();
      } else {
        ElMessage.error(`批量删除失败：${res.message || "未知错误"}`);
      }
    } catch (error) {
      console.error("批量删除申请单异常：", error);
      // ElMessage.error("批量删除失败：网络异常，请重试");
    } finally {
      loading.value = false;
    }
  });
};

// 初始化
onMounted(() => {
  getRepairOrderList();
  refundMethodList(); // 提前加载退回方式选项
  queryDevice(); //获取设备
});
</script>

<style scoped>
.repair-order-management {
  box-sizing: border-box;
  background-color: #f5f7fa;
  height: calc(100%);
  /* min-height: 100vh; */
}
/* 强制“最新回复内容”“回复记录”列的单元格内容靠左 */
:deep(.el-table td.el-table__cell[prop="reply"]) {
  text-align: left !important;
}
:deep(.el-table td.el-table__cell[prop="completedResult"]) {
  text-align: left !important;
}
/* 确保表头仍居中 */
:deep(.el-table th.el-table__cell[prop="reply"]) {
  text-align: center !important;
}
:deep(.el-table th.el-table__cell[prop="completedResult"]) {
  text-align: center !important;
}
/* 优化回复记录文字样式，提升点击体验 */
.completed-result-cell {
  /* color: #409eff; */
  text-decoration: underline;
}
/* 表格卡片样式优化 */
:deep(.table-card) {
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}
:deep(.el-table) {
  margin-top: 0;
}
</style>
