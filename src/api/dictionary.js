import service from "@/utils/request";
//退出
export const dictionaryDicName = (dicName) => {
  return service({
    url: `/factory/dictionary/get/${dicName}`,
    method: "GET",
  });
};
