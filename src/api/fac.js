import service from "@/utils/request";
//退出
export const facInfo = () => {
  return service({
    url: "/factory/fac/finfo",
    method: "GET",
  });
};

//常见问题
export const fqaList = () => {
  return service({
    url: "/factory/fqa/list",
    method: "GET",
  });
};
//根据问题模糊检索符合条件的常见问题
export const fqaSearch = (params) => {
  return service({
    url: "/factory/fqa/search",
    method: "GET",
    params,
  });
};
