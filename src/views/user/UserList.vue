<template>
  <div class="user-management">
    <!-- 1. 搜索组件 -->
    <CommonSearch
      :search-items="searchItems"
      :initial-data="initialSearchData"
      @search="handleSearch"
      @reset="handleReset"
    />

    <!-- 2. 表格组件 -->
    <CommonTable
      title="用户列表"
      ref="userTableRef"
      :table-data="userList"
      :columns="tableColumns"
      :total="total"
      :loading="loading"
      :action-width="120"
      @row-click="handleRowClick"
      @radio-change="handleRadioChange"
      @selection-change="handleSelectionChange"
    >
      <!-- 头部操作按钮 -->
      <template #header-actions>
        <el-button type="primary" @click="handleTemplate" :icon="Document">
          导出模版
        </el-button>

        <el-upload
          class="upload-btn"
          action="#"
          :auto-upload="false"
          :on-change="validateImportFile"
          ref="uploadRef"
          :show-file-list="false"
        >
          <el-button type="primary" :icon="DocumentAdd"> 导入模版 </el-button>
        </el-upload>
        <el-button type="success" @click="handleAdd" :icon="Plus">
          添加用户
        </el-button>
        <el-button type="danger" @click="handleBatchDelete" :icon="Delete">
          批量删除
        </el-button>
      </template>

      <!-- 角色列自定义渲染 -->
      <template #col-userType="{ row }">
        {{
          row.userType === "0"
            ? "系统管理员"
            : row.userType === "1"
              ? "工厂管理员"
              : "普通员工"
        }}
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

      <!-- 操作列 -->
      <template #action="{ row }">
        <el-button-group>
          <el-tooltip content="编辑" placement="top">
            <el-button
              type="primary"
              link
              @click="handleEdit(row)"
              :icon="Edit"
            />
          </el-tooltip>
          <el-tooltip content="删除" placement="top">
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
      :form-items="formItems"
      :rules="formRules"
      :initial-data="formInitialData"
      :is-edit="isEditMode"
      @submit="handleFormSubmit"
      @cancel="handleFormCancel"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, h } from "vue";
import { ElMessage, ElMessageBox, ElNotification } from "element-plus";
import {
  DocumentAdd,
  Document,
  Plus,
  Edit,
  Delete,
} from "@element-plus/icons-vue";

// 引入公共组件
import CommonSearch from "@/components/CommonSearch.vue";
import CommonTable from "@/components/CommonTable.vue";
import CommonPagination from "@/components/CommonPagination.vue";
import CommonFormDialog from "@/components/CommonFormDialog.vue";

// 引入接口
import {
  adminUserList,
  adminAddUser,
  admiadminUpdaten,
  adminDeleteUser,
  updateStatus,
  userTemplate,
  userImport,
  userBatchDelete,
  validateUsername,
  validatePhone,
  validateEmail,
} from "@/api/admin";

// 引入抽离的配置
import {
  tableColumns,
  formItems,
  formRules as baseFormRules,
  searchItems,
  initialSearchData,
} from "./userConfig.js";

// 创建响应式表单规则，添加异步校验
const formRules = reactive({
  ...baseFormRules,
  userName: [
    ...baseFormRules.userName,
    {
      validator: async (rule, value, callback) => {
        if (!value || !value.trim()) {
          callback();
          return;
        }
        if (value.length < 2 || value.length > 20) {
          callback();
          return;
        }
        try {
          const res = await validateUsername({
            message: value,
            id: formInitialData.value.id || -1,
          });
          if (res.code === 200) {
            callback();
          } else {
            callback(new Error("该用户名已存在，请更换"));
          }
        } catch (error) {
          callback(new Error("该用户名已存在，请更换"));
        }
      },
      trigger: "blur",
    },
  ],
  phone: [
    ...baseFormRules.phone,
    {
      validator: async (rule, value, callback) => {
        if (!value || !value.trim()) {
          callback();
          return;
        }
        if (!/^1[3-9]\d{9}$/.test(value)) {
          callback();
          return;
        }
        try {
          const res = await validatePhone({
            message: value,
            id: formInitialData.value.id || -1,
          });
          if (res.code === 200) {
            callback();
          } else {
            callback(new Error("该手机号已被注册，请更换"));
          }
        } catch (error) {
          callback(new Error("该手机号已被注册，请更换"));
        }
      },
      trigger: "blur",
    },
  ],
  email: [
    ...baseFormRules.email,
    {
      validator: async (rule, value, callback) => {
        if (!value || !value.trim()) {
          callback();
          return;
        }
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(value)) {
          callback();
          return;
        }
        try {
          const res = await validateEmail({
            message: value,
            id: formInitialData.value.id || -1,
          });
          if (res.code === 200) {
            callback();
          } else {
            callback(new Error("该邮箱已被注册，请更换"));
          }
        } catch (error) {
          callback(new Error("该邮箱已被注册，请更换"));
        }
      },
      trigger: "blur",
    },
  ],
});

// ===== 状态管理 =====
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(5);
const total = ref(0);
const userList = ref([]);
const selectedUserId = ref("");

// 表单对话框状态
const formDialogVisible = ref(false);
const formDialogTitle = ref("添加用户");
const formInitialData = ref({});
const isEditMode = ref(false);

// 批量操作状态
const userTableRef = ref(null);
const selectedRows = ref([]);
const uploadRef = ref(null);

// 搜索表单数据
const formInline = reactive({ ...initialSearchData });

// ===== 核心方法 =====
// 获取用户列表
const getUserList = async () => {
  loading.value = true;
  try {
    const res = await adminUserList({
      ...formInline,
      pageSize: pageSize.value,
      currentPage: currentPage.value,
      order: "ASC",
    });
    if (res.code === 200) {
      userList.value = res.data.list;
      total.value = res.data.total;
    }
  } catch (error) {
    ElMessage.error("获取用户列表失败");
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = (params) => {
  Object.assign(formInline, params);
  currentPage.value = 1;
  getUserList();
};

// 重置
const handleReset = () => {
  Object.assign(formInline, initialSearchData);
  currentPage.value = 1;
  getUserList();
};

// 分页尺寸变化
const handleSizeChange = (val) => {
  pageSize.value = val;
  getUserList();
};

// 分页页码变化
const handleCurrentChange = (val) => {
  currentPage.value = val;
  getUserList();
};

// 行点击/单选
const handleRowClick = (row) => {
  selectedUserId.value = row.id;
};
const handleRadioChange = (row) => {
  selectedUserId.value = row.id;
};

// 多选状态变化
const handleSelectionChange = (val) => {
  selectedRows.value = val;
};

// 状态切换
const handleStatusChange = async (row) => {
  const oldStatus = row.status;
  try {
    const res = await updateStatus(row.id);
    if (res.code == 200) {
      ElMessage.success(res.message);
      getUserList();
    }
  } catch (error) {
    row.status = oldStatus;
    getUserList();
  }
};

// 添加用户
const handleAdd = () => {
  isEditMode.value = false;
  formDialogTitle.value = "添加用户";
  formInitialData.value = { userName: "", phone: "", email: "", userType: "2" };
  formDialogVisible.value = true;

  // 清空选中状态
  selectedRows.value = [];
  if (userTableRef.value) {
    userTableRef.value.clearSelection();
  }
};

// 导出模板
const handleTemplate = async () => {
  try {
    const blob = await userTemplate();
    if (!(blob instanceof Blob) || blob.size === 0) {
      ElMessage.error("下载失败：返回的Excel文件数据无效");
      return;
    }
    const excelBlob = new Blob([blob], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(excelBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "用户模板.xlsx";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    ElMessage.success("用户模板Excel下载成功！");
  } catch (error) {
    console.error("Excel文件下载异常：", error);
    if (error.message.includes("404")) {
      ElMessage.error("下载失败：Excel模板接口不存在");
    } else if (error.message.includes("401")) {
      ElMessage.error("下载失败：登录已过期，请重新登录");
    } else {
      ElMessage.error("Excel文件下载失败：服务器返回异常");
    }
  }
};

// 验证导入文件
const validateImportFile = (file) => {
  const extension = file.name.split(".").pop().toLowerCase();
  const isExcel = extension === "xlsx" || extension === "xls";
  if (!isExcel) {
    ElMessage.error("请上传Excel文件 (xlsx/xls)");
  } else {
    handleBatchImport(file);
  }
};

// 解析导入错误信息
const open = (resData) => {
  const parseErrorMsg = (msg) => {
    const match = msg.match(/\[([^\]]+)\]/);
    if (match && match[1]) {
      return match[1].split(",").map((item) => item.trim());
    }
    return [msg];
  };
  ElNotification({
    title: "部分数据导入失败",
    type: "error",
    duration: 10000,
    message: h("div", { style: "line-height: 1.8;" }, [
      h("p", { style: "margin: 0 0 8px 0; color: #606266;" }, "错误明细："),
      ...parseErrorMsg(resData.message).map((errorItem, index) =>
        h(
          "p",
          {
            key: index,
            style: "margin: 4px 0; color: red; padding-left: 8px;",
          },
          errorItem,
        ),
      ),
    ]),
  });
};

// 批量导入
const handleBatchImport = async (file) => {
  if (!file?.raw) {
    ElMessage.warning("请选择要导入的Excel文件！");
    return;
  }
  try {
    const formData = new FormData();
    formData.append("file", file.raw);
    const res = await userImport(formData);
    ElMessage.success(res.message || "数据导入成功！");
    await getUserList();
  } catch (error) {
    console.error("导入异常：", error);
    open(error);
  }
};

// 编辑用户
const handleEdit = (row) => {
  // 清空多选，仅选中当前行
  if (userTableRef.value) {
    userTableRef.value.clearSelection();
    userTableRef.value.toggleRowSelection(row, true);
  }
  selectedRows.value = [row];

  isEditMode.value = true;
  formDialogTitle.value = "编辑用户";
  formInitialData.value = {
    id: row.id,
    userName: row.userName,
    phone: row.phone,
    email: row.email,
    userType: row.userType,
  };
  formDialogVisible.value = true;
};

// 移除第91行的测试按钮

// 提交表单
const handleFormSubmit = async (formData) => {
  try {
    if (isEditMode.value) {
      delete formData.phone; // 编辑时手机号不可改
      const res = await admiadminUpdaten(formData);
      if (res.code === 200) {
        ElMessage.success("修改成功");
      }
    } else {
      const res = await adminAddUser(formData);
      if (res.code === 200) {
        ElMessage.success("添加成功，默认密码：123456");
      }
    }
    formDialogVisible.value = false;
    // 清空选中状态
    selectedRows.value = [];
    if (userTableRef.value) {
      userTableRef.value.clearSelection();
    }
    getUserList();
  } catch (error) {
    ElMessage.error(error.message || "操作失败");
  }
};

// 取消表单
const handleFormCancel = () => {
  formDialogVisible.value = false;
  // 清空选中状态
  selectedRows.value = [];
  if (userTableRef.value) {
    userTableRef.value.clearSelection();
  }
};

// 删除单个用户
const handleDelete = (row) => {
  // 清空多选，仅选中当前行
  if (userTableRef.value) {
    userTableRef.value.clearSelection();
    userTableRef.value.toggleRowSelection(row, true);
  }
  selectedRows.value = [row];

  ElMessageBox.confirm(`确定删除用户【${row.userName}】吗？`, "警告", {
    type: "warning",
  })
    .then(async () => {
      try {
        const res = await adminDeleteUser(row.id);
        if (res.code === 200) {
          ElMessage.success("删除成功");
          selectedRows.value = [];
          if (userTableRef.value) {
            userTableRef.value.clearSelection();
          }
          getUserList();
        }
      } catch (error) {
        ElMessage.error("删除失败");
      }
    })
    .catch((error) => {
      if (error !== "cancel") {
        ElMessage.error("操作异常，请重试");
        console.error("弹窗操作报错：", error);
      }
      // 取消后清空选中状态
      selectedRows.value = [];
      if (userTableRef.value) {
        userTableRef.value.clearSelection();
      }
    });
};

// 批量删除
const handleBatchDelete = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning("请选择要删除的用户");
    return;
  }
  const deleteIds = selectedRows.value.map((row) => row.id);
  const selectCount = selectedRows.value.length;

  ElMessageBox.confirm(
    `确定要删除选中的【${selectCount}】个用户吗？删除后不可恢复！`,
    "批量删除确认",
    {
      type: "danger",
      confirmButtonText: "确定删除",
      cancelButtonText: "取消",
    },
  ).then(async () => {
    loading.value = true;
    try {
      const res = await userBatchDelete(deleteIds);
      if (res.code === 200) {
        ElMessage.success(`成功删除${selectCount}个用户`);
        selectedRows.value = [];
        if (userTableRef.value) {
          userTableRef.value.clearSelection();
        }
        getUserList();
      } else {
        ElMessage.error(`批量删除失败：${res.message || "未知错误"}`);
      }
    } catch (error) {
      console.error("批量删除用户异常：", error);
      ElMessage.error("批量删除失败：网络异常，请重试");
    } finally {
      loading.value = false;
    }
  });
};

// 初始化加载列表
onMounted(() => {
  getUserList();
});
</script>

<style scoped>
.user-management {
  box-sizing: border-box;
}
:deep(.upload-btn) {
  display: inline-block;
  margin: 0 8px;
}
</style>
