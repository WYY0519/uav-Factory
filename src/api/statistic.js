import service from "@/utils/request";
//数量统计
export const statisticCount = () => {
  return service({
    url: "/factory/statistic/count",
    method: "GET",
  });
};
