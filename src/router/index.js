import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/", //重定向到登录
      redirect: "/login",
    },
    {
      path: "/home", //首页
      name: "home",
      component: () => import("@/views/HomeView.vue"),
      children: [
        //重定向到home
        {
          path: "/user/list", //用户列表
          name: "user-list",
          component: () => import("@/views/user/UserList.vue"),
        },
        {
          path: "/company/list", //合作公司列表
          name: "company-list",
          component: () => import("@/views/company/companyList.vue"),
        },
        {
          path: "/company/all", //全部公司列表
          name: "company-all",
          component: () => import("@/views/company/companyAll.vue"),
        },
        {
          path: "/device/list", //设备管理
          name: "device-list",
          component: () => import("@/views/device/deviceList.vue"),
        },
        {
          path: "/factory/info", //工厂列表
          name: "factory-info",
          component: () => import("@/views/factory/factoryInfo.vue"),
        },
        {
          path: "/log/operationLog", //飞控日志
          name: "log-operationLog",
          component: () => import("@/views/log/operationLog.vue"),
        },
        {
          path: "/log/flightLog", //日志列表
          name: "log-flightLog",
          component: () => import("@/views/log/flightLog.vue"),
        },
        {
          path: "/flightRoute", //航线
          name: "flightRoute",
          component: () => import("@/views/flightRoute/index.vue"),
        },
        {
          path: "/repairOrder/apply", //申请单
          name: "repairOrder-apply",
          component: () => import("@/views/repairOrder/apply.vue"),
        },
        {
          path: "/repairOrder/handle", //维修单
          name: "repairOrder-handle",
          component: () => import("@/views/repairOrder/handle.vue"),
        },
        //
        {
          path: "/faq", //常见问题
          name: "faq",
          component: () => import("@/views/faq/index.vue"),
        },
        ///////////////////////////////////////////////
        {
          path: "/largeScreen", //大屏展示
          name: "largeScreen",
          component: () => import("@/views/largeScreen/index.vue"),
        },
      ],
    },

    {
      path: "/login", //登录
      name: "login",
      component: () => import("@/views/login/index.vue"),
    },

    {
      path: "/text", //测试用的页面
      name: "text",
      component: () => import("@/views/test.vue"),
    },
  ],
});

export default router;
