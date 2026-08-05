<template>
  <div class="user-management">
    <!-- 1. 搜索组件 -->
    <CommonSearch
      :search-items="searchItems"
      :initial-data="initialSearchData"
      @search="handleSearch"
      @reset="handleReset"
    />

    <!-- 2. 表格组件：新增ref、多选事件，完善批量删除按钮 -->
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
      <!-- 头部操作按钮：完善批量删除按钮 -->
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
        <!-- 完善批量删除按钮：加类型、点击事件、图标，与之前逻辑一致 -->
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
      <el-button class="!ml-0" plain @click="open"></el-button>
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
// 接口：包含批量删除、三个失焦校验接口
import {
  adminUserList,
  adminAddUser,
  admiadminUpdaten,
  adminDeleteUser,
  updateStatus,
  userTemplate,
  userImport,
  userBatchDelete,
  validateUsername, // 用户名唯一性校验接口
  validatePhone, // 手机号唯一性校验接口
  validateEmail, // 邮箱唯一性校验接口
} from "@/api/admin";
// ===== 搜索配置 =====
const searchItems = [
  {
    prop: "userName",
    label: "用户名:",
    placeholder: "请输入用户名",
  },
];
const initialSearchData = { userName: "" };
const formInline = reactive({ ...initialSearchData });
// ===== 表格配置 =====
const tableColumns = [
  { prop: "userName", label: "用户名", width: 120, showOverflowTooltip: true },
  { prop: "phone", label: "手机号", minWidth: 120 },
  { prop: "email", label: "邮箱", minWidth: 180 },
  { prop: "userType", label: "用户类型", minWidth: 180 },
  { prop: "status", label: "状态", width: 100 },
  { prop: "createTime", label: "创建时间", width: 180 },
  { prop: "loginTime", label: "上次登录时间", width: 180 },
];

// ===== 表单配置：核心！为三个字段添加失焦校验配置 =====
const formItems = [
  {
    prop: "userName",
    label: "用户名",
    type: "input",
    required: true,
    maxlength: 20,
    // disabled: false,
    // 新增：失焦校验配置
    validateOnBlur: true, // 开启失焦校验
    validateApi: validateUsername, // 绑定用户名校验接口
    validateMsg: "该用户名已存在，请更换", // 校验失败提示
    disabled: (v) => v.isEdit,
  },
  {
    prop: "phone",
    label: "手机号",
    type: "input",
    required: true,
    maxlength: 11,
    placeholder: "请输入11位手机号",
    // 新增：失焦校验配置
    validateOnBlur: true,
    validateApi: validatePhone,
    validateMsg: "该手机号已被注册，请更换",
  },
  {
    prop: "email",
    label: "邮箱",
    type: "input",
    required: true,
    maxlength: 20,
    placeholder: "请输入邮箱地址",
    // 新增：失焦校验配置
    validateOnBlur: true,
    validateApi: validateEmail,
    validateMsg: "该邮箱已被注册，请更换",
  },
  {
    prop: "userType",
    label: "用户类型",
    type: "select",
    required: true,
    placeholder: "请选择用户类型",
    options: [
      { label: "系统管理员", value: "0" },
      { label: "工厂管理员", value: "1" },
      { label: "普通员工", value: "2" },
    ],
    disabled: true,
  },
];
const formRules = {
  userName: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { min: 2, max: 20, message: "长度在2-20个字符之间", trigger: "blur" }, // 修正原规则min=1错误
  ],
  phone: [
    { required: true, message: "请输入手机号", trigger: "blur" },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: "请输入正确的手机号",
      trigger: "blur",
    },
  ],
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    { type: "email", message: "请输入正确的邮箱格式", trigger: "blur" },
  ],
  userType: [{ required: true, message: "请选择角色", trigger: "change" }],
};

// ===== 状态管理：新增批量操作核心状态，原有状态保留 =====
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
// 新增：批量操作核心状态（与之前页面逻辑完全一致）
const userTableRef = ref(null); // 表格实例引用，用于操作选中状态
const selectedRows = ref([]); // 存储表格多选的行数据

// ===== 方法：原有方法保留，新增多选/批量方法，改造单行编辑/删除方法 =====
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

// 分页
const handleSizeChange = (val) => {
  pageSize.value = val;
  getUserList();
};
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

// 新增：监听表格多选状态变化，同步选中行数据（与之前页面逻辑一致）
const handleSelectionChange = (val) => {
  selectedRows.value = val;
};

// 状态切换
const handleStatusChange = async (row) => {
  const oldStatus = row.status; // 保存旧状态
  try {
    const res = await updateStatus(row.id);
    if (res.code == 200) {
      ElMessage.success(res.message);
      getUserList();
    }
  } catch (error) {
    row.status = oldStatus; // 接口失败时回滚
    getUserList();
  }
};

// 新增用户 + 清空选中状态（提升交互）
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

// 导出用户模板
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

// 改造：单行编辑方法（核心：点击编辑时取消所有多选，仅保留当前行）
const handleEdit = (row) => {
  // 1. 清空所有多选状态，仅选中当前点击的行
  if (userTableRef.value) {
    userTableRef.value.clearSelection();
    userTableRef.value.toggleRowSelection(row, true);
  }
  // 2. 更新选中行数据，仅保留当前行
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

// 提交表单（新增/编辑） + 清空选中状态
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
    getUserList(); // 刷新列表
  } catch (error) {
    ElMessage.error(error.message || "操作失败");
  }
};

// 取消表单：原有逻辑 + 清空选中状态
const handleFormCancel = () => {
  formDialogVisible.value = false;
  // 清空选中状态
  selectedRows.value = [];
  if (userTableRef.value) {
    userTableRef.value.clearSelection();
  }
};

// 改造：单行删除方法（核心：点击删除时取消所有多选，仅保留当前行，捕获cancel错误）
const handleDelete = (row) => {
  // 1. 清空所有多选状态，仅选中当前点击的行
  if (userTableRef.value) {
    userTableRef.value.clearSelection();
    userTableRef.value.toggleRowSelection(row, true);
  }
  // 2. 更新选中行数据，仅保留当前行
  selectedRows.value = [row];

  ElMessageBox.confirm(`确定删除用户【${row.userName}】吗？`, "警告", {
    type: "warning",
  })
    .then(async () => {
      try {
        const res = await adminDeleteUser(row.id);
        if (res.code === 200) {
          ElMessage.success("删除成功");
          // 清空选中状态
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
      // 捕获弹窗取消的cancel错误，静默处理，不报错
      if (error !== "cancel") {
        ElMessage.error("操作异常，请重试");
        console.error("弹窗操作报错：", error);
      }
      // 取消后清空选中状态，避免残留
      selectedRows.value = [];
      if (userTableRef.value) {
        userTableRef.value.clearSelection();
      }
    });
};

// 新增：批量删除核心方法（与之前页面逻辑完全一致，适配本页面业务）
const handleBatchDelete = () => {
  // 1. 校验是否选中数据
  if (selectedRows.value.length === 0) {
    ElMessage.warning("请选择要删除的用户");
    return;
  }
  // 2. 获取选中的用户ID数组和用户名（用于提示）
  const deleteIds = selectedRows.value.map((row) => row.id);
  const selectCount = selectedRows.value.length;

  // 3. 批量确认弹窗：提示选中数量和用户名，操作更直观
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
      // 4. 调用批量删除接口，传id数组
      const res = await userBatchDelete(deleteIds);
      if (res.code === 200) {
        ElMessage.success(`成功删除${selectCount}个用户`);
        // 5. 操作成功后清空选中状态
        selectedRows.value = [];
        if (userTableRef.value) {
          userTableRef.value.clearSelection();
        }
        // 6. 刷新列表
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

// 初始化
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
