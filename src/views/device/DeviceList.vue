<template>
  <div class="device-management">
    <!-- 1. 公共搜索组件 -->
    <CommonSearch :search-items="searchItems" :initial-data="initialSearchData" @search="handleSearch"
      @reset="handleReset" />

    <!-- 2. 公共表格组件 -->
    <CommonTable title="设备列表" ref="deviceTableRef" :table-data="filteredDeviceList" :columns="tableColumns"
      :total="total" :loading="loading" @row-click="handleRowClick" @radio-change="handleRadioChange"
      @selection-change="handleSelectionChange" :action-width="120" :sortIdColumn="true" :idDefaultSort="idSortOrder"
      @sort-change="handleIdSort">
      <template #header-actions>
        <el-button type="success" @click="handleBatchAllocate" :icon="DocumentAdd">
          批量分配公司
        </el-button>
        <el-button type="danger" @click="handleBatchDeallocate" :icon="DocumentRemove">
          批量取消分配
        </el-button>
      </template>

      <!-- 在线状态列自定义渲染 -->
      <!-- <template #col-status="{ row }">
        <el-tag :type="row.status === 0 ? 'danger' : 'success'">
          {{ row.status === 0 ? "离线" : "在线" }}
        </el-tag>
      </template> -->

      <!-- 设备状态列自定义渲染 -->
      <!-- <template #col-factoryDisable="{ row }">
        <el-switch
          v-model.lazy="row.factoryDisable"
          :active-value="0"
          :inactive-value="1"
          @change="handleSwitchChange(row)"
        />
      </template> -->

      <!-- 操作列自定义渲染 -->
      <template #action="{ row }">
        <el-button-group>
          <el-tooltip content="为公司分配" placement="top">
            <el-button type="primary" link @click="companyAllocation(row)">
              <el-icon>
                <DocumentAdd />
              </el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="取消分配" placement="top">
            <el-button type="danger" link @click="deallocate(row)">
              <el-icon>
                <DocumentRemove />
              </el-icon>
            </el-button>
          </el-tooltip>
        </el-button-group>
      </template>

      <!-- 分页组件插槽 -->
      <template #pagination>
        <CommonPagination :total="total" :current-page="currentPage" :page-size="pageSize"
          :page-sizes="[5, 10, 20, 30, 50]" @size-change="handleSizeChange" @current-change="handleCurrentChange" />
      </template>
    </CommonTable>

    <!-- 3. 公共表单对话框 -->
    <CommonFormDialog :title="formDialogTitle" v-model="formDialogVisible" :form-items="formItems" :rules="formRules"
      :initial-data="formInitialData" @submit="handleFormSubmit" @cancel="handleFormCancel" idKey="id" />
  </div>
</template>

<script setup>
import { ref, reactive, onUnmounted, onMounted, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { DocumentRemove, DocumentAdd, Delete } from "@element-plus/icons-vue";

// 引入公共组件
import CommonSearch from "@/components/CommonSearch.vue";
import CommonTable from "@/components/CommonTable.vue";
import CommonPagination from "@/components/CommonPagination.vue";
import CommonFormDialog from "@/components/CommonFormDialog.vue";

// 接口导入
import {
  getCompanyDevices,
  deviceCancelAllocate,
  updateDisable,
  deviceAllocate,
  deviceBatchCancel,
  deviceBatchAllocate,
} from "@/api/device";
import { companyPartnerCompanyMap } from "@/api/company";

// ===== 公司下拉选项 =====
const companyOptions = ref([]);

// ===== 搜索配置 =====
const searchItems = ref([
  {
    prop: "deviceNumber",
    label: "设备编号:",
    placeholder: "输入设备编号搜索",
  },
  {
    prop: "companyId",
    label: "合作公司:",
    type: "select",
    placeholder: "选择合作公司",
    options: companyOptions,
  },
]);
const initialSearchData = { deviceNumber: "", companyId: "" };
const formInline = reactive({ ...initialSearchData });

// ===== 表格列配置 =====
const tableColumns = [
  { prop: "id", label: "设备ID", width: "100", align: "center" },
  {
    prop: "name",
    label: "设备名称",
    minWidth: "120",
    align: "center",
    showOverflowTooltip: true,
  },
  {
    prop: "deviceNumber",
    label: "设备编号",
    minWidth: "180",
    align: "center",
    showOverflowTooltip: true,
  },
  { prop: "companyName", label: "合作公司", minWidth: "200", align: "center" },
  // { prop: "status", label: "在线状态", align: "center" },
  // { prop: "factoryDisable", label: "设备状态", align: "center" },
  // { prop: "ip", label: "IP", minWidth: "120", align: "center" },
  // { prop: "dataPort", label: "数据端口", minWidth: "120", align: "center" },
  // { prop: "controlPort", label: "控制端口", minWidth: "120", align: "center" },
  // { prop: "picturePort", label: "图片端口", minWidth: "120", align: "center" },
  { prop: "videoIp", label: "视频IP", minWidth: "280", align: "center" },
];

// ===== 表单配置 =====
const formItems = ref([
  {
    prop: "companyId",
    label: "公司名称",
    type: "select",
    required: true,
    placeholder: "请选择要分配的公司",
    options: companyOptions,
    filterable: true,
  },
]);

const formRules = {
  companyId: [{ required: true, message: "请选择公司名称", trigger: "change" }],
};

// ===== 状态管理 =====
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(5);
const total = ref(0);
const selectedDeviceId = ref("");
const formDialogVisible = ref(false);
const formDialogTitle = ref("为公司分配设备");
const formInitialData = ref({});
const companyInfo = ref({});
const filteredDeviceList = ref([]);
const originDeviceList = ref([]); // 存储原始数据，用于恢复无排序状态
const deviceTableRef = ref(null);
const selectedRows = ref([]);
const isBatchAllocate = ref(false);

// 排序核心状态
const idSortOrder = ref(""); // ""=无排序，"asc"=正序，"desc"=降序

// ===== 核心业务方法 =====
const fetchDeviceList = async () => {
  try {
    loading.value = true;
    let data = {
      // deviceNumber: formInline.deviceNumber,
      // deviceNumber: formInline.deviceNumber,
      ...formInline,
      currentPage: currentPage.value,
      pageSize: pageSize.value,
    };
    const res = await getCompanyDevices(data);
    if (res.code === 200) {
      let list = res.data.list || [];
      list = list.map((item) => {
        const originalDisable = item.factoryDisable;
        const finalDisable =
          originalDisable === undefined || originalDisable === null
            ? 1
            : Number(originalDisable);
        return {
          ...item,
          factoryDisable: finalDisable,
          isSwitchInit: false,
        };
      });
      originDeviceList.value = [...list];
      filteredDeviceList.value = [...list];
      total.value = res.data.total;
      setTimeout(() => {
        filteredDeviceList.value.forEach((row) => {
          row.isSwitchInit = true;
        });
      }, 0);
    } else {
      ElMessage.error(res.message || "获取设备列表失败");
    }
  } catch (error) {
    console.error("获取设备列表失败:", error);
    ElMessage.error("获取设备列表失败");
  } finally {
    loading.value = false;
  }
};

// 核心：ID列排序逻辑（兼容无排序状态）
const handleIdSort = (sort) => {
  // 切换排序状态："" → "asc" → "desc" → ""
  if (sort.prop !== "id") return;
  if (sort.order === "ascending") {
    idSortOrder.value = "asc";
  } else if (sort.order === "descending") {
    idSortOrder.value = "desc";
  } else {
    idSortOrder.value = "";
  }

  // 根据排序状态处理数据
  if (idSortOrder.value === "asc") {
    filteredDeviceList.value = [...originDeviceList.value].sort(
      (a, b) => a.id - b.id,
    );
    ElMessage.success("设备ID已按正序排列");
  } else if (idSortOrder.value === "desc") {
    filteredDeviceList.value = [...originDeviceList.value].sort(
      (a, b) => b.id - a.id,
    );
    ElMessage.success("设备ID已按降序排列");
  } else {
    filteredDeviceList.value = [...originDeviceList.value];
    ElMessage.success("已取消设备ID排序，恢复原始顺序");
  }
};

// 获取公司列表
const fetchCompanyList = async () => {
  try {
    const res = await companyPartnerCompanyMap();
    if (res.code === 200) {
      companyOptions.value = res.data.map((item) => ({
        value: item.cid,
        label: item.cname,
      }));
    } else {
      ElMessage.error("获取公司列表失败：" + res.message);
    }
  } catch (error) {
    console.error("获取公司列表失败:", error);
    ElMessage.error("加载公司列表失败，请刷新页面重试");
  }
};

// 搜索
const handleSearch = (params) => {
  Object.assign(formInline, params);
  currentPage.value = 1;
  fetchDeviceList();
};

// 重置
const handleReset = () => {
  Object.assign(formInline, initialSearchData);
  selectedDeviceId.value = "";
  currentPage.value = 1;
  fetchDeviceList();
  selectedRows.value = [];
  if (deviceTableRef.value) {
    deviceTableRef.value.clearSelection();
  }
  idSortOrder.value = ""; // 重置时恢复无排序
};

// 开关状态变更
const handleSwitchChange = async (row) => {
  if (!row.isSwitchInit) return;
  const originalstatus = row.factoryDisable;
  try {
    const res = await updateDisable(row.id);
    if (res.code === 200) {
      ElMessage.success(res.message);
      fetchDeviceList();
    } else {
      ElMessage.error("状态更新失败");
      row.factoryDisable = originalstatus;
    }
  } catch (error) {
    ElMessage.error("启用/禁用操作失败");
    row.factoryDisable = originalstatus;
    console.error("修改设备状态异常:", error);
  }
};

// 单行分配
const companyAllocation = (row) => {
  formDialogTitle.value = "为公司分配设备";
  companyInfo.value = row;
  isBatchAllocate.value = false;
  let defaultCompanyId = "";
  if (row.companyName && companyOptions.value.length > 0) {
    const targetCompany = companyOptions.value.find(
      (item) => item.label === row.companyName,
    );
    defaultCompanyId = targetCompany ? targetCompany.value : "";
  }
  formInitialData.value = {
    companyId: defaultCompanyId,
  };
  formDialogVisible.value = true;
  selectedRows.value = [];
  if (deviceTableRef.value) {
    deviceTableRef.value.clearSelection();
  }
};

// 批量分配
const handleBatchAllocate = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning("请选择要分配的设备");
    return;
  }
  isBatchAllocate.value = true;
  formDialogTitle.value = "批量为公司分配设备";
  formInitialData.value = { companyId: "" };
  formDialogVisible.value = true;
};

// 多选变化
const handleSelectionChange = (val) => {
  selectedRows.value = val;
};

// 取消分配
const deallocate = (row) => {
  if (deviceTableRef.value) {
    deviceTableRef.value.clearSelection();
    deviceTableRef.value.toggleRowSelection(row, true);
  }
  selectedRows.value = [row];

  ElMessageBox.confirm(`确定要取消分配【${row.name}】`, "提示", {
    type: "warning",
    confirmButtonText: "确定",
    cancelButtonText: "取消",
  })
    .then(async () => {
      try {
        const res = await deviceCancelAllocate(row.id);
        if (res.code === 200) {
          ElMessage.success("取消设备成功");
          selectedRows.value = [];
          if (deviceTableRef.value) {
            deviceTableRef.value.clearSelection();
          }
          fetchDeviceList();
        } else {
          ElMessage.error("取消分配失败：" + res.message);
        }
      } catch (error) {
        console.log("取消分配异常:", error);
        ElMessage.error("取消分配失败");
      }
    })
    .catch((error) => {
      if (error !== "cancel") {
        ElMessage.error("操作异常，请重试");
        console.error("弹窗操作报错：", error);
      }
      selectedRows.value = [];
      if (deviceTableRef.value) {
        deviceTableRef.value.clearSelection();
      }
    });
};

// 批量取消分配
const handleBatchDeallocate = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning("请选择要取消分配的设备");
    return;
  }
  const deallocateIds = selectedRows.value.map((row) => row.id);
  const selectCount = selectedRows.value.length;

  ElMessageBox.confirm(
    `确定要取消选中的【${selectCount}】台设备的分配吗？`,
    "批量取消分配确认",
    {
      type: "warning",
      confirmButtonText: "确定取消",
      cancelButtonText: "取消",
      width: "500px",
    },
  ).then(async () => {
    loading.value = true;
    try {
      const res = await deviceBatchCancel(deallocateIds);
      if (res.code === 200) {
        ElMessage.success(`成功取消${selectCount}台设备的分配`);
        selectedRows.value = [];
        if (deviceTableRef.value) {
          deviceTableRef.value.clearSelection();
        }
        fetchDeviceList();
      } else {
        ElMessage.error(`批量取消分配失败：${res.message || "未知错误"}`);
      }
    } catch (error) {
      console.error("批量取消设备分配异常:", error);
      ElMessage.error("批量取消分配失败：网络异常，请重试");
    } finally {
      loading.value = false;
    }
  });
};

// 表单提交
const handleFormSubmit = async (formData) => {
  try {
    loading.value = true;
    if (isBatchAllocate.value) {
      const allocateIds = selectedRows.value.map((row) => row.id);
      const res = await deviceBatchAllocate(allocateIds, formData.companyId);
      if (res.code === 200) {
        ElMessage.success(`成功为${allocateIds.length}台设备分配公司`);
        formDialogVisible.value = false;
        selectedRows.value = [];
        if (deviceTableRef.value) {
          deviceTableRef.value.clearSelection();
        }
        fetchDeviceList();
      } else {
        ElMessage.error("批量分配失败：" + res.message);
      }
    } else {
      const res = await deviceAllocate(
        formData.companyId,
        companyInfo.value.id,
      );
      if (res.code === 200) {
        ElMessage.success("设备分配成功");
        formDialogVisible.value = false;
        fetchDeviceList();
      } else {
        ElMessage.error("分配失败：" + res.message);
      }
    }
  } catch (error) {
    console.error("设备分配异常:", error);
    // ElMessage.error("设备分配失败，请重试");
  } finally {
    loading.value = false;
    isBatchAllocate.value = false;
  }
};

// 表单取消
const handleFormCancel = () => {
  formDialogVisible.value = false;
  formInitialData.value = {
    companyId: "",
  };
  selectedRows.value = [];
  if (deviceTableRef.value) {
    deviceTableRef.value.clearSelection();
  }
  isBatchAllocate.value = false;
};

// 行点击
const handleRowClick = (row) => {
  selectedDeviceId.value = row.id;
};
const handleRadioChange = (row) => {
  selectedDeviceId.value = row.id;
};

// 分页
const handleSizeChange = (val) => {
  pageSize.value = val;
  fetchDeviceList();
};
const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchDeviceList();
};

// 监听对话框关闭
watch(formDialogVisible, (newVal) => {
  if (newVal === false) {
    formInitialData.value = { companyId: "" };
    isBatchAllocate.value = false;
  }
});

// 初始化
onMounted(async () => {
  await fetchCompanyList();
  fetchDeviceList();
});

onUnmounted(() => { });
</script>

<style scoped>
.device-management {
  box-sizing: border-box;
  background-color: #f5f7fa;
  height: 100%;
}

:deep(.table-card) {
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

:deep(.el-table) {
  margin-top: 0;
}

:deep(.el-table .cell) {
  padding: 8px;
}

:deep(.el-radio) {
  margin-right: 0;
  display: flex;
  justify-content: center;
}

:deep(.el-radio__label) {
  display: none;
}

:deep(.el-button-group) {
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  :deep(.card-header) {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  :deep(.header-right) {
    width: 100%;
    justify-content: flex-start;
  }

  :deep(.el-table) {
    min-width: 600px;
  }
}
</style>
