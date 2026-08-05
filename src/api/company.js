import service from '@/utils/request';

//查看合作公司列表
export const opcompanyList = (data) => {
  return service({
    url: '/factory/company/partnerCompany/list',
    method: 'POST',
    data,
  });
};
//添加合作公司
export const opcompanyPartnerCompanyAdd = (params) => {
  return service({
    url: '/factory/company/partnerCompany/add',
    method: 'GET',
    params,
  });
};
//注册公司
export const companyAdd = (data) => {
  return service({
    url: '/factory/company/add',
    method: 'POST',
    data,
  });
};
// 删除公司
export const opcompanyDelete = (id) => {
  return service({
    url: `/factory/company/partnerCompany/delete/${id}`,
    method: 'DELETE',
  });
};

//获取公司
export const companyPartnerCompanyMap = () => {
  return service({
    url: '/factory/company/partnerCompany/map',
    method: 'GET',
  });
};
// 获取系统所有公司
export const CompanyMapAll = () => {
  return service({
    url: '/factory/company/map',
    method: 'GET',
  });
};
//批量删除合作公司
export const partnerCompanyBatchDelete = (ids) => {
  return service({
    url: `/factory/company/partnerCompany/batchDelete`,
    method: 'DELETE',
    data: ids,
  });
};
// 手机号校验
export const companyValidatePhone = (data) => {
  return service({
    url: '/factory/company/validate/phone',
    method: 'POST',
    data,
  });
};
// 公司邮箱校验
export const companyValidateEmail = (data) => {
  return service({
    url: '/factory/company/validate/email',
    method: 'POST',
    data,
  });
};
// 公司税号校验
export const companyValidateTaxNumber = (data) => {
  return service({
    url: '/factory/company/validate/taxNumber',
    method: 'POST',
    data,
  });
};
// 公司名称校验
export const companyValidateCompanyName = (data) => {
  return service({
    url: '/factory/company/validate/companyName',
    method: 'POST',
    data,
  });
};
// 公司法人身份证号校验
export const companyValidateIdCard = (data) => {
  return service({
    url: '/factory/company/validate/idCard',
    method: 'POST',
    data,
  });
};
//重置合作公司的管理用户的密码
export const partnerCompanyResetPassword = (cid) => {
  return service({
    url: `/factory/company/partnerCompany/resetPassword/${cid}`,
    method: 'GET',
  });
};
//导出公司信息模板
export const companyTemplate = (id) => {
  return service({
    url: `/factory/company/template`,
    method: 'GET',
    responseType: 'blob',
    transformResponse: [(data) => data],
    skipCodeCheck: true, // 自定义标识：跳过响应拦截器的code校验
  });
};

export const companyImport = (formData) => {
  return service({
    url: '/factory/company/import', // 接口路径（无需硬编码IP+端口，service已配baseURL）
    method: 'POST',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data', // 表单上传必须的头
    },
    // 无需手动加token：service的请求拦截器会自动添加
  });
};
//编辑合作公司
export const companyUpdate = (id, data) => {
  return service({
    url: `/factory/company/update/${id}`,
    method: 'put',
    data,
  });
};

// 禁用公司
export const companyDisable = (id) => {
  return service({
    url: `/factory/company/disable/${id}`,
    method: 'PUT',
  });
};

// 启用公司
export const companyEnable = (id) => {
  return service({
    url: `/factory/company/enable/${id}`,
    method: 'PUT',
  });
};

export const opcompanyListAll = (data) => {
  return service({
    url: '/factory/company/list/all',
    method: 'POST',
    data,
  });
};
