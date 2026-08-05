import service from "@/utils/request";
//查看合作公司下的航线

export const flightRouteList = (data) => {
  return service({
    url: "/factory/flightRoute/list",
    method: "PUT",
    data,
  });
};
// 下载航线文件的接口（
export const downloadFlightRoute = (id) => {
  return service({
    url: `/factory/flightRoute/export/${id}`,
    method: "GET",
    responseType: "blob",
    transformResponse: [(data) => data],
    skipCodeCheck: true, // 自定义标识：跳过响应拦截器的code校验
  });
};
