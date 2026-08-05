import service from "@/utils/request";
import qs from "qs";
export const getLogList = (data) => {
  return service({
    url: "/factory/log/list",
    method: "GET",
    data,
  });
};

// 查看操作日志
export const logSystemLog = (data) => {
  return service({
    url: "/factory/log/systemLog",
    method: "POST",
    data,
  });
};

//查看飞控日志列表
export const logFlightLogList = (data) => {
  return service({
    url: "/factory/log/flightLogList",
    method: "POST",
    data,
  });
};

export const logFlightLog = (filename, params) => {
  return service({
    url: `/factory/log/flightLog/${filename}`,
    method: "GET",
    params,
  });
};
// /log/flightLog/{filename}

// 下载飞控日志文件
export const flightLogDownload = (params) => {
  return service({
    url: `/factory/log/flightLog/download`,
    method: "GET",
    responseType: "blob",
    transformResponse: [(data) => data],
    skipCodeCheck: true, // 自定义标识：跳过响应拦截器的code校验
    params,
  });
};

// 批量下载飞控日志文件 - 直接接收纯数组 [1,12,9]
export const flightLogBatchDownload = (data) => {
  // 入参直接是纯数组 [1,12,9]
  return service({
    url: `/factory/log/flightLog/batchDownload`,
    method: "POST",
    responseType: "blob", // 下载文件必备：二进制流响应
    transformResponse: (data) => data, // 跳过JSON解析，保留原始流
    skipCodeCheck: true, // 跳过code校验，避免二进制流报错
    // 核心1：将纯数组封装为 { ids: 纯数组 }，用于后续序列化
    data,
    // 核心2：序列化配置，将数组转为 ids=1&ids=12&ids=9（后端通用格式）
    paramsSerializer: (params) =>
      qs.stringify(params, { arrayFormat: "repeat" }),
  });
};

// export const flightLogDownloadBatch = (ids) => {
//   return service({
//     url: `/api/headquarters/flight-logs/download/batch`,
//     method: "POST",
//     responseType: "blob", // 关键：指定返回二进制流
//     transformResponse: [(data) => data], // 禁用默认转换，保留原始 blob
//     skipCodeCheck: true, // 跳过响应拦截器的 code 校验
//     data: { ids }, // GET 请求用 params 传参（后端通常接收逗号分隔的ID）
//   });
// };
