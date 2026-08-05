import service from "@/utils/request";

//登陆
export const logout = () => {
  return service({
    url: "/factory/logout",
    method: "POST",
  });
};
