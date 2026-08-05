import service from "@/utils/request";
//退出
export const getCompanyDevices = (data) => {
  return service({
    url: "/factory/device/list",
    method: "post",
    data,
  });
};

//

export const deviceAllocate = (cid, did) => {
  return service({
    url: `/factory/device/allocate/${cid}/${did}`,
    method: "put",
  });
};

//
//批量取消设备分配
export const deviceBatchCancel = (ids) => {
  return service({
    url: `/factory/device/batchCancel`,
    method: "DELETE",
    data: ids,
  });
};
//
//批量取消设备分配
export const deviceBatchAllocate = (ids, cid) => {
  return service({
    url: `/factory/device/allocate/${cid}`,
    method: "POST",
    data: ids,
  });
};
// 修改某个设备状态
export const updateDisable = (did) => {
  return service({
    url: `/factory/device/upfstatus/${did}`,
    method: "put",
  });
};

// 取消对某个设备的分配
export const deviceCancelAllocate = (did) => {
  return service({
    url: `/factory/device/cancelAllocate/${did}`,
    method: "put",
  });
};

// 获取设备
export const deviceMap = (did) => {
  return service({
    url: `/factory/device/map`,
    method: "GET",
  });
};
