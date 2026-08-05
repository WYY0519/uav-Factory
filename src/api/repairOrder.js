import service from "@/utils/request";

//查看待处理的维修单申请
export const repairOrderHandleList = (data) => {
  return service({
    url: "/factory/repairOrder/handleList",
    method: "PUT",
    data,
  });
};
//更新维修结果
export const repairOrderUpdateHandleResult = (data) => {
  return service({
    url: "/factory/repairOrder/updateHandleResult",
    method: "PUT",
    data,
  });
};
//查看申请的维修单列表
export const repairOrderApplyList = (data) => {
  return service({
    url: "/factory/repairOrder/applyList",
    method: "PUT",
    data,
  });
};
// 删除某条历史记录
export const repairOrderDelete = (id, type) => {
  return service({
    url: `/factory/repairOrder/delete/${id}/${type}`,
    method: "DELETE",
  });
};
//
export const repairOrderDeleteBatch = (ids, type) => {
  return service({
    url: `/factory/repairOrder/deleteBatch/${type}`,
    method: "DELETE",
    data: ids,
  });
};
// 添加一条维修申请
export const repairOrderApplyAdd = (data) => {
  return service({
    url: `/factory/repairOrder/apply/add`,
    method: "POST",
    data,
  });
};
