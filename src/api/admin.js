import service from "@/utils/request";

//管理员查看所有用户信息
export const adminUserList = (data) => {
  return service({
    url: "/factory/user/list",
    method: "PUT",
    data,
  });
};
///查看个人信息
export const userPersoninfo = (params) => {
  return service({
    url: "/factory/user/personinfo",
    method: "GET",
    params,
  });
};
//管理员删除用户
export const adminDeleteUser = (id) => {
  return service({
    url: `/factory/user/delete/${id}`,
    method: "DELETE",
  });
};

//管理员添加用户
export const adminAddUser = (data) => {
  return service({
    url: "/factory/user/add",
    method: "POST",
    data,
  });
};

//修改用户信息
export const admiadminUpdaten = (data) => {
  return service({
    url: `/factory/user/updateinfo`,
    method: "PUT",
    data,
  });
};

//修改帐号状态
export const updateStatus = (id) => {
  return service({
    url: `/factory/user/upstatus/${id}`,
    method: "PUT",
  });
};
//获取当前用户信息
export const adminInfo = () => {
  return service({
    url: `/factory/info`,
    method: "GET",
  });
};
//修改密码
export const userPassword = (data) => {
  return service({
    url: "/factory/user/changepassword",
    method: "PUT",
    data,
  });
};
//
//批量删除用户
export const userBatchDelete = (ids) => {
  return service({
    url: `/factory/user/batchDelete`,
    method: "DELETE",
    data: ids,
  });
};
// 用户名校验
export const validateUsername = (data) => {
  return service({
    url: "/factory/user/validate/username",
    method: "POST",
    data,
  });
};
// 用户手机号校验
export const validatePhone = (data) => {
  return service({
    url: "/factory/user/validate/phone",
    method: "POST",
    data,
  });
};
// 邮箱校验
export const validateEmail = (data) => {
  return service({
    url: "/factory/user/validate/email",
    method: "POST",
    data,
  });
};

// 导出用户模板
export const userTemplate = (id) => {
  return service({
    url: `/factory/user/template`,
    method: "GET",
    responseType: "blob",
    transformResponse: [(data) => data],
    skipCodeCheck: true, // 自定义标识：跳过响应拦截器的code校验
  });
};
// 导入用户模板
export const userImport = (formData) => {
  return service({
    url: "/factory/user/import", // 接口路径（无需硬编码IP+端口，service已配baseURL）
    method: "POST",
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data", // 表单上传必须的头
    },
    // 无需手动加token：service的请求拦截器会自动添加
  });
};
