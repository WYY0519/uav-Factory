// 用户管理页面配置文件
// 表格列配置
export const tableColumns = [
  { prop: "userName", label: "用户名", width: 120, showOverflowTooltip: true },
  { prop: "phone", label: "手机号", minWidth: 120 },
  { prop: "email", label: "邮箱", minWidth: 180 },
  { prop: "userType", label: "用户类型", minWidth: 180 },
  { prop: "status", label: "状态", width: 100 },
  { prop: "createTime", label: "创建时间", width: 180 },
  { prop: "loginTime", label: "上次登录时间", width: 180 },
];

// 表单配置
export const formItems = [
  {
    prop: "userName",
    label: "用户名",
    type: "input",
    required: true,
    maxlength: 20,
    disabled: (v) => v.isEdit,
  },
  {
    prop: "phone",
    label: "手机号",
    type: "input",
    required: true,
    maxlength: 11,
    placeholder: "请输入11位手机号",
  },
  {
    prop: "email",
    label: "邮箱",
    type: "input",
    required: true,
    maxlength: 20,
    placeholder: "请输入邮箱地址",
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

// 表单校验规则
export const formRules = {
  userName: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { min: 2, max: 20, message: "长度在2-20个字符之间", trigger: "blur" },
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

// 验证接口函数占位（由组件内动态注入）
export let validateUsername = null;
export let validatePhone = null;
export let validateEmail = null;

// 搜索项配置（一并抽离，保持配置统一）
export const searchItems = [
  {
    prop: "userName",
    label: "用户名:",
    placeholder: "请输入用户名",
  },
];

// 初始搜索数据
export const initialSearchData = { userName: "" };
