<template>
  <div class="company-management">
    <!-- 1. 搜索组件：公司名称+税号核心搜索 -->
    <CommonSearch :search-items="searchItems" :initial-data="initialSearchData" @search="handleSearch"
      @reset="handleReset" />

    <!-- 2. 表格组件：添加ref、多选事件，修复批量操作 -->
    <CommonTable title="客户列表" ref="companyTableRef" :table-data="companyList" :columns="tableColumns" :total="total"
      :loading="loading" :action-width="100" @row-click="handleRowClick" @radio-change="handleRadioChange"
      @selection-change="handleSelectionChange">
      <!-- 头部操作按钮：导出/批量注册/注册/添加/批量删除 -->
      <template #header-actions>
        <!-- <el-button type="primary" @click="handleTemplate" :icon="Document">
          导出模版
        </el-button>

        <el-upload class="upload-btn" action="#" :auto-upload="false" :on-change="validateImportFile" ref="uploadRef"
          :show-file-list="false">
          <el-button type="primary" :icon="DocumentAdd"> 批量注册 </el-button>
        </el-upload>
        <el-button type="success" @click="openRegisterDialog" :icon="Plus">
          注册公司
        </el-button> -->
        <el-button type="success" @click="openPartnerDialog" :icon="Plus">
          添加合作公司
        </el-button>
        <el-button type="danger" @click="handleBatchDelete" :icon="Delete">
          批量删除
        </el-button>
      </template>

      <!-- 操作列：编辑 + 删除 -->
      <template #action="{ row }">
        <el-button-group>
          <el-tooltip content="编辑公司" placement="top">
            <el-button type="primary" link @click="handleEdit(row)" :icon="Edit" />
          </el-tooltip>
          <el-tooltip content="删除合作公司" placement="top">
            <el-button type="danger" link @click="handleDelete(row)" :icon="Delete" />
          </el-tooltip>
        </el-button-group>
      </template>

      <!-- 分页组件 -->
      <template #pagination>
        <CommonPagination :total="total" :current-page="currentPage" :page-size="pageSize"
          @size-change="handleSizeChange" @current-change="handleCurrentChange" />
      </template>
    </CommonTable>

    <!-- 3. 注册公司弹窗：带唯一性失焦校验 -->
    <CommonFormDialog :title="registerDialogTitle" v-model="registerDialogVisible" :form-items="registerFormItems"
      :rules="registerFormRules" :initial-data="registerFormInitial" :is-edit="false" @submit="handleRegisterSubmit"
      @cancel="handleRegisterCancel" label-width="160px" />

    <!-- 4. 添加合作公司弹窗：下拉选择 -->
    <CommonFormDialog :title="partnerDialogTitle" v-model="partnerDialogVisible" :form-items="partnerFormItems"
      :rules="partnerFormRules" :initial-data="partnerFormInitial" :is-edit="false" @submit="handlePartnerSubmit"
      @cancel="handlePartnerCancel" />

    <!-- 5. 编辑公司弹窗：税号和公司名称不可编辑 -->
    <CommonFormDialog :title="editDialogTitle" v-model="editDialogVisible" :form-items="editFormItems"
      :rules="editFormRules" :initial-data="editFormInitial" :is-edit="true" @submit="handleEditSubmit"
      @cancel="handleEditCancel" label-width="160px" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, h } from "vue";
import { ElMessage, ElMessageBox, ElNotification } from "element-plus";
import { DocumentAdd, Document, Plus, Delete, Edit } from "@element-plus/icons-vue";
// 引入公共组件
import CommonSearch from "@/components/CommonSearch.vue";
import CommonTable from "@/components/CommonTable.vue";
import CommonPagination from "@/components/CommonPagination.vue";
import CommonFormDialog from "@/components/CommonFormDialog.vue";
import { CompanyMapAll } from "@/api/company";

// 合作公司所有接口（含4个唯一性校验接口）
import {
  opcompanyList,
  opcompanyPartnerCompanyAdd,
  companyAdd,
  opcompanyDelete,
  partnerCompanyBatchDelete,
  companyTemplate,
  companyImport,
  companyValidatePhone,
  companyValidateEmail,
  companyValidateTaxNumber,
  companyValidateCompanyName,
  companyValidateIdCard,
  companyUpdate,
  opcompanyListAll
} from "@/api/company";

// ===== 搜索配置 =====
const searchItems = [
  {
    prop: "companyName",
    label: "公司名称:",
    placeholder: "请输入公司名称",
  },
  // {
  //   prop: "companyTaxNumber",
  //   label: "公司税号:",
  //   placeholder: "请输入公司税号",
  // },
];
const initialSearchData = { companyName: "", companyTaxNumber: "" };
const formInline = reactive({ ...initialSearchData });

// ===== 表格配置 =====
const tableColumns = [
  {
    prop: "companyName",
    label: "公司名称",
    width: 200,
    showOverflowTooltip: true,
  },
  {
    prop: "companyTaxNumber",
    label: "公司税号",
    width: 200,
    showOverflowTooltip: true,
  },
  { prop: "contact", label: "联系人", width: 100 },
  { prop: "contactPhone", label: "联系电话", width: 130 },
  {
    prop: "companyAddress",
    label: "公司地址",
    minWidth: 200,
    showOverflowTooltip: true,
  },
  {
    prop: "companyDescription",
    label: "公司简介",
    minWidth: 200,
    showOverflowTooltip: true,
  },
  { prop: "partnerTime", label: "合作时间", width: 180 },
];

// ===== 注册公司弹窗 - 表单配置（带失焦唯一性校验）=====
const registerDialogTitle = ref("注册公司");
const registerDialogVisible = ref(false);
const registerFormInitial = ref({
  companyName: "",
  companyDescription: "",
  companyTaxNumber: "",
  companyAddress: "",
  companyEmail: "",
  legalName: "",
  legalPhone: "",
  idcardNum: "",
});
const registerFormItems = [
  {
    prop: "companyTaxNumber",
    label: "统一社会信用代码",
    type: "input",
    required: true,
    maxlength: 18,
    placeholder: "请输入统一社会信用代码",
    showWordLimit: true,
  },
  {
    prop: "companyName",
    label: "公司名称",
    type: "input",
    required: true,
    maxlength: 20,
    placeholder: "请输入公司名称",
    showWordLimit: true,
    validateOnBlur: true,
    validateApi: companyValidateCompanyName,
    validateMsg: "该公司名称已被注册",
  },
  {
    prop: "legalName",
    label: "公司联系人姓名",
    type: "input",
    required: true,
    maxlength: 20,
    placeholder: "请输入联系人姓名",
    showWordLimit: true,
  },
  {
    prop: "legalPhone",
    label: "公司联系人电话",
    type: "input",
    required: true,
    maxlength: 11,
    placeholder: "请输入11位手机号",
    showWordLimit: true,
  },
  {
    prop: "idcardNum",
    label: "公司联系人身份证号",
    type: "input",
    required: true,
    maxlength: 18,
    placeholder: "请输入18位身份证号",
    showWordLimit: true,
  },
  {
    prop: "companyEmail",
    label: "公司邮箱",
    type: "input",
    required: true,
    maxlength: 50,
    placeholder: "请输入公司邮箱",
    showWordLimit: true,
  },
  {
    prop: "companyAddress",
    label: "公司地址",
    type: "textarea",
    rows: 2,
    required: true,
    maxlength: 100,
    placeholder: "请输入公司地址",
    showWordLimit: true,
  },
  {
    prop: "companyDescription",
    label: "公司描述",
    type: "textarea",
    rows: 3,
    required: true,
    maxlength: 200,
    placeholder: "请输入公司描述",
    showWordLimit: true,
  },
];
const registerFormRules = {
  companyName: [
    { required: true, message: "请输入公司名称", trigger: "blur" },
    { min: 2, max: 20, message: "长度在2-20个字符之间", trigger: "blur" },
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
          const res = await companyValidateCompanyName({
            message: value,
            id: -1,
          });
          if (res.code === 200) {
            callback();
          } else {
            callback(new Error("该公司名称已被注册"));
          }
        } catch (error) {
          callback(new Error("校验失败，请重试"));
        }
      },
      trigger: "blur",
    },
  ],
  companyTaxNumber: [
    { required: true, message: "请输入统一社会信用代码", trigger: "blur" },
    { max: 18, message: "长度为18个字符", trigger: "blur" },
    {
      validator: async (rule, value, callback) => {
        // 编辑模式跳过唯一性校验
        if (false) {
          callback();
          return;
        }
        // 空值不校验（由必填规则处理）
        if (!value || !value.trim()) {
          callback();
          return;
        }
        try {
          // 调用唯一性校验接口
          const res = await companyValidateTaxNumber({
            message: value,
            id: -1,
          });
          if (res.code === 200) {
            callback();
          } else {
            callback(new Error("该统一社会信用代码已被注册"));
          }
        } catch (error) {
          callback(new Error("校验失败，请重试"));
        }
      },
      trigger: "blur",
    },
  ],
  legalPhone: [
    { required: true, message: "请输入联系人电话", trigger: "blur" },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: "请输入正确的11位手机号",
      trigger: "blur",
    },
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
          const res = await companyValidatePhone({ message: value, id: -1 });
          if (res.code === 200) {
            callback();
          } else {
            callback(new Error("该手机号已被绑定"));
          }
        } catch (error) {
          callback(new Error("校验失败，请重试"));
        }
      },
      trigger: "blur",
    },
  ],
  idcardNum: [
    { required: true, message: "请输入联系人身份证号", trigger: "blur" },
    {
      pattern:
        /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/,
      message: "请输入正确的18位身份证号",
      trigger: "blur",
    },
    {
      validator: async (rule, value, callback) => {
        if (!value || !value.trim()) {
          callback();
          return;
        }
        const idcardPattern =
          /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
        if (!idcardPattern.test(value)) {
          callback();
          return;
        }
        try {
          const res = await companyValidateIdCard({ message: value, id: -1 });
          if (res.code === 200) {
            callback();
          } else {
            callback(new Error("该身份证号已被注册"));
          }
        } catch (error) {
          callback(new Error("校验失败，请重试"));
        }
      },
      trigger: "blur",
    },
  ],
  companyEmail: [
    { required: true, message: "请输入公司邮箱", trigger: "blur" },
    { type: "email", message: "请输入正确的邮箱格式", trigger: "blur" },
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
          const res = await companyValidateEmail({ message: value, id: -1 });
          if (res.code === 200) {
            callback();
          } else {
            callback(new Error("该邮箱已被注册"));
          }
        } catch (error) {
          callback(new Error("校验失败，请重试"));
        }
      },
      trigger: "blur",
    },
  ],
  companyAddress: [
    { required: true, message: "请输入公司地址", trigger: "blur" },
    { min: 5, max: 100, message: "长度在5-100个字符之间", trigger: "blur" },
  ],
  companyDescription: [
    { required: true, message: "请输入公司描述", trigger: "blur" },
    { max: 200, message: "长度不超过200个字符", trigger: "blur" },
  ],
  legalName: [
    { required: true, message: "请输入联系人姓名", trigger: "blur" },
    { min: 2, max: 20, message: "长度在2-20个字符之间", trigger: "blur" },
  ],
};

// ===== 添加合作公司弹窗 - 表单配置 =====
const partnerDialogTitle = ref("添加合作公司");
const partnerDialogVisible = ref(false);
const partnerFormInitial = ref({
  companyTaxNumber: "",
});

// ===== 公司下拉选项 =====
const companyOptions = ref([]);
const partnerFormItems = ref([
  {
    prop: "companyTaxNumber",
    label: "合作公司",
    type: "select",
    required: true,
    placeholder: "请选择合作公司",
    showWordLimit: true,
    options: companyOptions,
  },
]);
const partnerFormRules = {
  companyTaxNumber: [
    { required: true, message: "请选择合作公司", trigger: "blur" },
  ],
};

// ===== 编辑公司弹窗 - 表单配置（税号和公司名称不可编辑）=====
const editDialogTitle = ref("编辑公司");
const editDialogVisible = ref(false);
const editCurrentId = ref(null);
const editFormInitial = ref({
  companyName: "",
  companyDescription: "",
  companyTaxNumber: "",
  companyAddress: "",
  companyEmail: "",
  legalName: "",
  legalPhone: "",
  idcardNum: "",
});
const editFormItems = [
  {
    prop: "companyTaxNumber",
    label: "统一社会信用代码",
    type: "input",
    required: true,
    maxlength: 18,
    placeholder: "请输入统一社会信用代码",
    showWordLimit: true,
    disabled: true,
  },
  {
    prop: "companyName",
    label: "公司名称",
    type: "input",
    required: true,
    maxlength: 20,
    placeholder: "请输入公司名称",
    showWordLimit: true,
    disabled: true,
  },
  {
    prop: "legalName",
    label: "公司联系人姓名",
    type: "input",
    required: true,
    maxlength: 20,
    placeholder: "请输入联系人姓名",
    showWordLimit: true,
  },
  {
    prop: "legalPhone",
    label: "公司联系人电话",
    type: "input",
    required: true,
    maxlength: 11,
    placeholder: "请输入11位手机号",
    showWordLimit: true,
  },
  {
    prop: "idcardNum",
    label: "公司联系人身份证号",
    type: "input",
    required: true,
    maxlength: 18,
    placeholder: "请输入18位身份证号",
    showWordLimit: true,
  },
  {
    prop: "companyEmail",
    label: "公司邮箱",
    type: "input",
    required: true,
    maxlength: 50,
    placeholder: "请输入公司邮箱",
    showWordLimit: true,
  },
  {
    prop: "companyAddress",
    label: "公司地址",
    type: "textarea",
    rows: 2,
    required: true,
    maxlength: 100,
    placeholder: "请输入公司地址",
    showWordLimit: true,
  },
  {
    prop: "companyDescription",
    label: "公司描述",
    type: "textarea",
    rows: 3,
    required: true,
    maxlength: 200,
    placeholder: "请输入公司描述",
    showWordLimit: true,
  },
];
const editFormRules = {
  legalPhone: [
    { required: true, message: "请输入联系人电话", trigger: "blur" },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: "请输入正确的11位手机号",
      trigger: "blur",
    },
  ],
  idcardNum: [
    { required: true, message: "请输入联系人身份证号", trigger: "blur" },
    {
      pattern:
        /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/,
      message: "请输入正确的18位身份证号",
      trigger: "blur",
    },
  ],
  companyEmail: [
    { required: true, message: "请输入公司邮箱", trigger: "blur" },
    { type: "email", message: "请输入正确的邮箱格式", trigger: "blur" },
  ],
  companyAddress: [
    { required: true, message: "请输入公司地址", trigger: "blur" },
    { min: 5, max: 100, message: "长度在5-100个字符之间", trigger: "blur" },
  ],
  companyDescription: [
    { required: true, message: "请输入公司描述", trigger: "blur" },
    { max: 200, message: "长度不超过200个字符", trigger: "blur" },
  ],
  legalName: [
    { required: true, message: "请输入联系人姓名", trigger: "blur" },
    { min: 2, max: 20, message: "长度在2-20个字符之间", trigger: "blur" },
  ],
};

// ===== 状态管理（含批量操作核心状态，与用户管理页面一致）=====
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(5);
const total = ref(0);
const companyList = ref([]);
const selectedCompanyId = ref("");
// 批量操作核心状态（必须配置，与用户管理页面完全一致）
const companyTableRef = ref(null); // 表格实例引用，用于操作选中状态
const selectedRows = ref([]); // 存储表格多选行数据
const uploadRef = ref(null);

// ===== 核心方法 =====
// 获取合作公司列表
const getCompanyList = async () => {
  loading.value = true;
  try {
    const res = await opcompanyList({
      ...formInline,
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      order: "ASC",
    });
    if (res.code === 200) {
      companyList.value = res.data.list;
      total.value = res.data.total;
    }
  } catch (error) {
    ElMessage.error("获取合作公司列表失败");
    console.error("列表请求异常：", error);
  } finally {
    loading.value = false;
  }
};

// 搜索/重置
const handleSearch = (params) => {
  Object.assign(formInline, params);
  currentPage.value = 1;
  getCompanyList();
};
const handleReset = () => {
  Object.assign(formInline, initialSearchData);
  currentPage.value = 1;
  getCompanyList();
};

// 分页
const handleSizeChange = (val) => {
  pageSize.value = val;
  getCompanyList();
};
const handleCurrentChange = (val) => {
  currentPage.value = val;
  getCompanyList();
};

// 行点击/单选
const handleRowClick = (row) => {
  selectedCompanyId.value = row.id;
};
const handleRadioChange = (row) => {
  selectedCompanyId.value = row.id;
};

// 多选状态监听（核心：同步表格选中行数据，与用户管理页面一致）
const handleSelectionChange = (val) => {
  selectedRows.value = val;
};

// 注册公司弹窗 - 打开/提交/取消
const openRegisterDialog = () => {
  registerFormInitial.value = {
    companyName: "",
    companyDescription: "",
    companyTaxNumber: "",
    companyAddress: "",
    companyEmail: "",
    legalName: "",
    legalPhone: "",
    idcardNum: "",
  };
  registerDialogVisible.value = true;
};
const handleRegisterSubmit = async (formData) => {
  loading.value = true;
  try {
    const res = await companyAdd(formData);
    if (res.code === 200) {
      ElMessage.success("公司注册成功");
      registerDialogVisible.value = false;
      getCompanyList();
      fetchCompanyList(); // 刷新下拉选项
    }
  } catch (error) {
    ElMessage.error("公司注册失败：" + (error.message || "网络异常"));
  } finally {
    loading.value = false;
  }
};
const handleRegisterCancel = () => {
  registerDialogVisible.value = false;
};

// 添加合作公司弹窗 - 打开/提交/取消
const openPartnerDialog = () => {
  partnerFormInitial.value = { companyTaxNumber: "" };
  partnerDialogVisible.value = true;
};
const handlePartnerSubmit = async (formData) => {
  loading.value = true;
  try {
    const res = await opcompanyPartnerCompanyAdd({
      companyNum: formData.companyTaxNumber,
    });
    if (res.code === 200) {
      ElMessage.success("合作公司添加成功");
      partnerDialogVisible.value = false;
      getCompanyList();
    }
  } catch (error) {
    // ElMessage.error("添加合作公司失败：" + (error.message || "网络异常"));
  } finally {
    loading.value = false;
  }
};
const handlePartnerCancel = () => {
  partnerDialogVisible.value = false;
};

// 编辑公司弹窗 - 打开/提交/取消
const handleEdit = (row) => {
  editCurrentId.value = row.id;
  editFormInitial.value = {
    companyName: row.companyName || "",
    companyDescription: row.companyDescription || "",
    companyTaxNumber: row.companyTaxNumber || "",
    companyAddress: row.companyAddress || "",
    companyEmail: row.companyEmail || "",
    legalName: row.contact || "",
    legalPhone: row.contactPhone || "",
    idcardNum: row.idcardNum || "",
  };
  editDialogVisible.value = true;
};
const handleEditSubmit = async (formData) => {
  loading.value = true;
  try {
    const res = await companyUpdate(editCurrentId.value, formData);
    if (res.code === 200) {
      ElMessage.success("公司信息编辑成功");
      editDialogVisible.value = false;
      getCompanyList();
    }
  } catch (error) {
    ElMessage.error("公司信息编辑失败：" + (error.message || "网络异常"));
  } finally {
    loading.value = false;
  }
};
const handleEditCancel = () => {
  editDialogVisible.value = false;
};

// 导出模板
const handleTemplate = async () => {
  try {
    const blob = await companyTemplate();
    if (!(blob instanceof Blob) || blob.size === 0) {
      ElMessage.error("下载失败：返回的Excel模板数据无效");
      return;
    }
    const excelBlob = new Blob([blob], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(excelBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "合作公司模板.xlsx";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    ElMessage.success("合作公司模板Excel下载成功！");
  } catch (error) {
    console.error("Excel模板下载异常：", error);
    if (error.message.includes("404"))
      ElMessage.error("下载失败：模板接口不存在");
    else if (error.message.includes("401"))
      ElMessage.error("下载失败：登录已过期");
    else ElMessage.error("合作公司模板下载失败：服务器返回异常");
  }
};

// 导入验证/批量导入
const validateImportFile = (file) => {
  const extension = file.name.split(".").pop().toLowerCase();
  const isExcel = extension === "xlsx" || extension === "xls";
  if (!isExcel) {
    ElMessage.error("请上传Excel文件 (xlsx/xls)");
    uploadRef.value.clearFiles();
  } else {
    handleBatchImport(file);
  }
};
const parseImportError = (resData) => {
  const parseErrorMsg = (msg) => {
    const match = msg.match(/\[([^\]]+)\]/);
    return match && match[1]
      ? match[1].split(",").map((item) => item.trim())
      : [msg || "导入数据校验失败"];
  };
  ElNotification({
    title: "部分数据导入失败",
    type: "error",
    duration: 15000,
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
const handleBatchImport = async (file) => {
  if (!file?.raw) {
    ElMessage.warning("请选择要导入的Excel文件！");
    return;
  }
  loading.value = true;
  try {
    const formData = new FormData();
    formData.append("file", file.raw);
    const res = await companyImport(formData);
    ElMessage.success(res.message || "合作公司数据导入成功！");
    getCompanyList();
    fetchCompanyList(); // 刷新下拉选项
    uploadRef.value.clearFiles();
  } catch (error) {
    console.error("合作公司导入异常：", error);
    parseImportError(error.response?.data || error);
    uploadRef.value.clearFiles();
  } finally {
    loading.value = false;
  }
};

// 单行删除（优化：点击时清空多余勾选，仅保留当前行，与用户管理页面一致）
const handleDelete = (row) => {
  // 清空所有多选，仅选中当前行，解决勾选残留
  if (companyTableRef.value) {
    companyTableRef.value.clearSelection();
    companyTableRef.value.toggleRowSelection(row, true);
  }
  selectedRows.value = [row];

  ElMessageBox.confirm(
    `确定删除合作公司【${row.companyName}】吗？删除后不可恢复！`,
    "删除警告",
    {
      type: "warning",
      confirmButtonText: "确定删除",
      cancelButtonText: "取消",
    },
  )
    .then(async () => {
      loading.value = true;
      try {
        const res = await opcompanyDelete(row.id);
        if (res.code === 200) {
          ElMessage.success("合作公司删除成功");
          // 操作成功后清空选中状态
          selectedRows.value = [];
          companyTableRef.value?.clearSelection();
          getCompanyList();
          fetchCompanyList(); // 刷新下拉选项
        }
      } catch (error) {
        ElMessage.error("合作公司删除失败");
        console.error("单行删除异常：", error);
      } finally {
        loading.value = false;
      }
    })
    .catch((error) => {
      // 捕获取消弹窗的error，静默处理，不报错
      if (error !== "cancel") {
        ElMessage.error("操作异常，请重试");
        console.error("弹窗操作报错：", error);
      }
      // 取消后清空选中状态
      selectedRows.value = [];
      companyTableRef.value?.clearSelection();
    });
};

// 批量删除（修复：传参正确+清空选中+异常处理，与用户管理页面完全一致）
const handleBatchDelete = () => {
  // 前置校验：未选中数据直接提示
  if (selectedRows.value.length === 0) {
    ElMessage.warning("请选择要删除的合作公司");
    return;
  }
  // 获取选中行ID数组，适配后端批量接口
  const deleteIds = selectedRows.value.map((row) => row.id);
  const selectCount = selectedRows.value.length;

  ElMessageBox.confirm(
    `确定要删除选中的【${selectCount}】家合作公司吗？删除后不可恢复！`,
    "批量删除确认",
    {
      type: "danger",
      confirmButtonText: "确定删除",
      cancelButtonText: "取消",
      dangerouslyUseHTMLString: true,
    },
  ).then(async () => {
    loading.value = true;
    try {
      // 调用批量删除接口，传ID数组（核心修复点）
      const res = await partnerCompanyBatchDelete(deleteIds);
      if (res.code === 200) {
        ElMessage.success(`成功删除${selectCount}家合作公司`);
        // 操作成功后强制清空选中状态，解决勾选残留
        selectedRows.value = [];
        companyTableRef.value?.clearSelection();
        getCompanyList();
        fetchCompanyList(); // 刷新下拉选项
      } else {
        ElMessage.error(`批量删除失败：${res.message || "未知错误"}`);
      }
    } catch (error) {
      console.error("批量删除合作公司异常：", error);
      ElMessage.error("批量删除失败：网络异常，请重试");
    } finally {
      loading.value = false;
    }
  });
};

// 获取公司下拉列表
const fetchCompanyList = async () => {
  try {
    const res = await CompanyMapAll();
    if (res.code === 200) {
      companyOptions.value = res.data.map((item) => ({
        value: item.ctaxNumber,
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

// 初始化
onMounted(async () => {
  getCompanyList();
  fetchCompanyList();

});
</script>

<style scoped>
.company-management {
  box-sizing: border-box;
  /* padding: 0 20px 20px; */
}

:deep(.upload-btn) {
  display: inline-block;
  margin: 0 8px;
}

:deep(.el-button-group) {
  display: flex;
  justify-content: center;
}

:deep(.el-table__cell) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.el-button) {
  margin: 0 4px !important;
}
</style>
