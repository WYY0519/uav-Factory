<template>
  <div class="layout">
    <!-- 左侧侧边栏 -->
    <div class="sidebar" :class="{ collapsed: isCollapse }">
      <el-menu class="el-menu-vertical" :default-active="activeMenu" router :collapse="isCollapse"
        background-color="#001529" text-color="#a6adb4" active-text-color="#409EFF">
        <div class="logo-container">
          <img src="@/assets/wrj.png" alt="Logo" class="logo" />
          <span v-if="!isCollapse" class="title">无人机管理系统</span>
        </div>

        <!-- 菜单渲染 -->
        <template v-for="item in meunList" :key="item.id">
          <!-- 有子菜单 -->
          <el-sub-menu class="menu-item" v-if="item.children && item.children.length > 0" :index="item.id">
            <template #title>
              <el-icon>
                <component :is="getIconComponent(item.icon)" />
              </el-icon>
              <span>{{ item.title }}</span>
            </template>
            <!-- 子菜单项 -->
            <el-menu-item v-for="itemChildren in item.children" :key="itemChildren?.id" :index="itemChildren?.name"
              @click="handleMenuClick(itemChildren.name)">
              <el-icon>
                <component :is="getIconComponent(itemChildren.icon)" />
              </el-icon>
              <span>{{ itemChildren.title }}</span>
            </el-menu-item>
          </el-sub-menu>

          <!-- 无子菜单的一级菜单 -->
          <el-menu-item class="menu-item" v-else :index="item.name" @click="handleMenuClick(item.name)">
            <el-icon>
              <component :is="getIconComponent(item.icon)" />
            </el-icon>
            <template #title>{{ item.title }}</template>
          </el-menu-item>
        </template>

        <!-- 折叠按钮 -->
        <div class="collapse-btn" @click="toggleCollapse">
          <el-icon v-if="isCollapse">
            <Expand />
          </el-icon>
          <el-icon v-else>
            <Fold />
          </el-icon>
        </div>
      </el-menu>
    </div>

    <!-- 右侧主内容 -->
    <div class="main-content">
      <!-- 顶部导航栏 -->
      <div class="top-navbar">
        <div class="nav-left">
          <el-breadcrumb separator="/" class="custom-breadcrumb">
            <el-breadcrumb-item v-if="parentMenu">{{
              parentMenu
            }}</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentPages }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="nav-right">
          <el-space>
            <!-- 全屏按钮 -->
            <el-tooltip content="全屏" placement="bottom">
              <el-button :icon="FullScreen" circle @click="toggleFullScreen" />
            </el-tooltip>

            <!-- 用户信息下拉 -->
            <el-dropdown trigger="click">
              <div class="user-info">
                <el-avatar :size="32" :icon="UserFilled" class="user-avatar" />
                <span class="username">{{ username }}</span>
                <el-icon class="el-icon--right">
                  <CaretBottom />
                </el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item divided @click="logoutOrLogin">
                    <el-icon>
                      <SwitchButton />
                    </el-icon>退出登录
                  </el-dropdown-item>
                  <el-dropdown-item divided @click="changePassword">
                    <el-icon>
                      <Compass />
                    </el-icon>修改密码
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </el-space>
        </div>
      </div>

      <!-- 主要内容区域 -->
      <div class="page-content">
        <!-- 路由视图 -->
        <router-view v-slot="{ Component }" v-if="!isShow" :key="$route.fullPath">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>

        <!-- 首页欢迎内容 -->
        <div v-if="isShow" class="dashboard">
          <div class="device-monitor">
            <el-row class="statistics">
              <el-col style="
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  padding-top: 10px;
                ">
                <h1>欢迎使用本系统</h1>
              </el-col>
            </el-row>
          </div>
        </div>
      </div>
    </div>

    <!-- 修改密码弹窗 -->
    <el-dialog title="修改密码" v-model="changePasswordVisible" width="500px" destroy-on-close>
      <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="100px">
        <el-form-item label="旧密码" prop="oldPassword">
          <el-input v-model="passwordForm.oldPassword" placeholder="请输入旧密码" show-word-limit />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" placeholder="请输入新密码" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="changePasswordVisible = false">取消</el-button>
          <el-button type="primary" @click="submitPsaawordForm">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, provide } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage } from "element-plus";

// 只保留实际使用的图标
import {
  UserFilled,
  Expand,
  Fold,
  SwitchButton,
  Compass,
  FullScreen,
  CaretBottom,
  Operation,
  List,
  Monitor,
  Avatar,
  Plus,
  Files,
  Position,
  MapLocation,
  FolderChecked,
  SetUp,
  VideoCamera,
  Notification,
  Management,
  Memo,
  Promotion,
  Comment,
  Edit,
} from "@element-plus/icons-vue";

// 接口导入
import { logout } from "@/api/login";
import { adminInfo, userPassword } from "@/api/admin";

// 路由实例
const router = useRouter();
const route = useRoute();

// ===== 核心响应式变量（仅保留使用到的）=====
const isCollapse = ref(false); // 侧边栏折叠状态
const activeMenu = ref(route.path); // 当前激活菜单
const currentPages = ref(""); // 当前页面名称
const parentMenu = ref(""); // 父菜单名称
const isShow = ref(route.path === "/home"); // 是否显示首页欢迎内容
const username = ref(""); // 用户名
const changePasswordVisible = ref(false); // 修改密码弹窗显隐
const passwordFormRef = ref(null); // 密码表单ref
const meunList = ref([]); // 菜单列表
const isLoggedIn = ref(true); // 登录状态

// ===== 密码表单相关 =====
const passwordForm = ref({
  oldPassword: "",
  newPassword: "",
});
const passwordRules = {
  oldPassword: [
    { required: true, message: "请输入旧密码", trigger: "blur" },
    { min: 6, message: "长度至少6个字符", trigger: "blur" },
  ],
  newPassword: [
    { required: true, message: "请输入新密码", trigger: "blur" },
    { min: 6, message: "长度至少6个字符", trigger: "blur" },
  ],
};

// ===== 菜单映射表（核心业务逻辑保留）=====
const menuMap = {
  "/user/list": { parent: "人员管理", text: "人员列表" },
  "/company/list": { parent: "合作公司管理", text: "合作公司列表" },
  "/device/list": { parent: "设备管理", text: "设备列表" },
  "/factory/info": { parent: "工厂管理", text: "工厂信息" },
  "/log/operationLog": { parent: "日志管理", text: "操作日志" },
  "/log/flightLog": { parent: "日志管理", text: "飞控日志" },
  "/flightRoute": { text: "航线列表" },
  "/repairOrder/apply": { parent: "系统待办", text: "申请单" },
  "/repairOrder/handle": { parent: "系统待办", text: "维修单" },
  "/home": { text: "首页" },
  "/largeScreen": { text: "大屏" },
  "/faq": { text: "常见问题" },
};

// ===== 图标映射（仅保留使用到的）=====
const iconComponentMap = {
  Operation,
  List,
  Monitor,
  Avatar,
  Plus,
  Files,
  Position,
  MapLocation,
  FolderChecked,
  SetUp,
  VideoCamera,
  Notification,
  Management,
  Memo,
  Promotion,
  Comment,
  Edit,
};

// ===== 核心方法 =====
// 获取图标组件
const getIconComponent = (iconName) => {
  return iconComponentMap[iconName] || null;
};

// 切换侧边栏折叠
const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value;
};

// 向子组件提供折叠状态
provide("collapseContext", { isCollapse });

// 监听路由变化更新菜单和面包屑
watch(
  () => route.path,
  (newPath) => {
    activeMenu.value = newPath;
    const menuInfo = menuMap[newPath];
    if (menuInfo) {
      parentMenu.value = menuInfo.parent || "";
      currentPages.value = menuInfo.text;
    }
  },
  { immediate: true },
);

// 检查登录状态
const checkLoginStatus = () => {
  const token = localStorage.getItem("authToken");
  if (!token) {
    router.push("/login");
  }
};

// 登录/注销逻辑
const logoutOrLogin = async () => {
  if (isLoggedIn.value) {
    await logout();
    handleLogout();
  } else {
    localStorage.clear();
    sessionStorage.clear();
    router.push("/login");
    location.reload();
  }
};

// 处理登出
const handleLogout = () => {
  localStorage.removeItem("authToken");
  isLoggedIn.value = false;
  ElMessage.warning("登录已过期，请重新登录！");
  localStorage.clear();
  sessionStorage.clear();
  router.push("/login");
};

// 全屏切换
const toggleFullScreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
};

// 获取用户菜单
const userMenu = async () => {
  try {
    const res = await adminInfo();
    username.value = res.data.username;
    let data = res.data.menus;

    // 过滤无用菜单
    const filteredData = data.filter((menu) => menu.name !== "/gis/ceshi");

    // 分离一级菜单和子菜单
    const level0Menus = filteredData.filter((menu) => menu.parentId === 0);
    const subMenus = filteredData.filter((menu) => menu.parentId !== 0);

    // 一级菜单排序（优先大屏）
    const priorityIds = [16];
    level0Menus.sort((a, b) => {
      const indexA = priorityIds.indexOf(a.id);
      const indexB = priorityIds.indexOf(b.id);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return new Date(a.createTime) - new Date(b.createTime);
    });

    // 构建菜单树
    const sortedData = [...level0Menus, ...subMenus];
    const menuMap = new Map();
    sortedData.forEach((menu) => {
      menuMap.set(menu.id, { ...menu, children: [] });
    });

    const result = [];
    sortedData.forEach((menu) => {
      const currentMenu = menuMap.get(menu.id);
      if (menu.parentId === 0) {
        result.push(currentMenu);
      } else {
        const parentMenu = menuMap.get(menu.parentId);
        if (parentMenu) parentMenu.children.push(currentMenu);
      }
    });

    meunList.value = result;
  } catch (error) {
    console.error("获取菜单失败:", error);
  }
};

// 菜单点击事件
const handleMenuClick = (path) => {
  isShow.value = path === "/home";
};

// 打开修改密码弹窗
const changePassword = () => {
  changePasswordVisible.value = true;
};

// 提交修改密码表单
const submitPsaawordForm = () => {
  passwordFormRef.value.validate(async (valid) => {
    if (valid) {
      const data = {
        oldPass: passwordForm.value.oldPassword,
        newPass: passwordForm.value.newPassword,
      };
      const res = await userPassword(data);
      if (res.code === 200) {
        // ElMessage.success("密码修改成功！");
        // changePasswordVisible.value = false;
        // passwordForm.value = { oldPassword: "", newPassword: "" };
        ElMessage({
          message: "密码修改成功,请重新登录！",
          type: "success",
        });
        changePasswordVisible.value = false;
        passwordForm.value = {
          oldPassword: "",
          newPassword: "",
        };
        localStorage.clear(); // 清除所有localStorage数据
        sessionStorage.clear(); // 清除所有sessionStorage数据
        router.push("/login");
      } else {
        ElMessage.error(res.message || "密码修改失败");
        passwordForm.value = { oldPassword: "", newPassword: "" };
      }
    }
  });
};

// ===== 生命周期 =====
onMounted(async () => {
  // 初始化首页显示状态
  isShow.value = route.path === "/home";
  // 检查登录状态
  checkLoginStatus();
  // 获取用户菜单
  await userMenu();
});

onUnmounted(() => {
  // 无需要清理的事件监听（已移除无用的resize监听）
});
</script>

<style scoped>
/* 核心布局样式 - 仅保留使用到的 */
.layout {
  display: flex;
  height: 100vh;
  background-color: #f0f2f5;
}

/* 侧边栏样式 */
.sidebar {
  width: 240px;
  transition: all 0.3s ease;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  background: #000;
  z-index: 1000;
  position: relative;
  overflow-x: hidden;
}

.sidebar.collapsed {
  width: 64px;
}

.logo-container {
  height: 64px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  overflow: hidden;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo {
  width: 32px;
  height: 32px;
  margin-right: 12px;
  transition: all 0.3s;
}

.title {
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
  white-space: nowrap;
  opacity: 0.95;
  letter-spacing: 1px;
  transition: all 0.3s;
}

/* 当前页面需要的无padding状态 */
.page-content.current-page-no-padding {
  padding: 0 !important;
  overflow: hidden;
  /* 强制覆盖，优先级更高 */
}

/* 菜单样式优化 */
:deep(.el-menu) {
  border-right: none;
  background: transparent !important;
}

:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  height: 50px;
  line-height: 50px;
  margin: 4px 8px;
  border-radius: 4px;
  color: #a6adb4 !important;
  transition: all 0.3s;
}

:deep(.el-menu-item .el-icon),
:deep(.el-sub-menu__title .el-icon) {
  font-size: 18px;
  margin-right: 10px;
  color: #a6adb4;
  transition: all 0.3s;
}

:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
  background: rgba(255, 255, 255, 0.08) !important;
  color: #ffffff !important;
}

:deep(.el-menu-item:hover .el-icon),
:deep(.el-sub-menu__title:hover .el-icon) {
  color: #ffffff;
}

:deep(.el-menu-item.is-active) {
  background: #002357 !important;
  border: 1px solid #004caa;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
}

:deep(.el-menu-item.is-active .el-icon) {
  color: #ffffff !important;
}

:deep(.el-sub-menu.is-opened) {
  background: rgba(0, 0, 0, 0.2);
}

:deep(.el-sub-menu.is-opened > .el-sub-menu__title) {
  color: #ffffff !important;
}

:deep(.el-sub-menu.is-opened > .el-sub-menu__title .el-icon) {
  color: #ffffff;
}

/* 折叠按钮样式 */
.collapse-btn {
  position: fixed;
  bottom: 20px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s;
  margin-left: 16px;
}

.collapse-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.collapse-btn .el-icon {
  font-size: 20px;
  color: #ffffff;
}

/* 顶部导航栏样式 */
.top-navbar {
  height: 64px;
  padding: 0 24px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* 面包屑样式 */
.nav-left .el-breadcrumb {
  font-size: 14px;
}

.nav-left :deep(.el-breadcrumb__item .el-breadcrumb__inner) {
  color: #606266;
  font-weight: normal;
}

.nav-left :deep(.el-breadcrumb__item .el-breadcrumb__inner.is-link) {
  color: #1890ff;
  font-weight: 500;
}

.nav-left :deep(.el-breadcrumb__item .el-breadcrumb__inner.is-link:hover) {
  color: #40a9ff;
}

.nav-left :deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: #303133;
  font-weight: 600;
}

/* 用户信息样式 */
.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 4px 12px;
  border-radius: 24px;
  transition: all 0.3s;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.user-avatar {
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
  border: 2px solid #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.username {
  margin: 0 8px;
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

/* 主内容区域 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.page-content {
  flex: 1;
  padding: 24px;
  overflow: auto;
  height: calc(100%);
}

/* 首页欢迎内容 */
.dashboard .device-monitor {
  background-color: #f5f7fa;
  min-height: calc(100vh - 84px);
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 原有面包屑样式保留，新增以下核心样式 */
/* 面包屑前置分隔符 - 一级/多级菜单都生效 */
:deep(.custom-breadcrumb) {
  position: relative;
  padding-left: 12px;
  /* 给前置/留出空间，避免文字重叠 */
}

:deep(.custom-breadcrumb)::before {
  content: "/";
  /* 前置的/ */
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  /* 垂直居中 */
  color: #606266;
  /* 和默认分隔符颜色一致 */
  font-size: 14px;
  /* 和面包屑文字大小一致 */
}

/* 兼容只有一个面包屑项（一级菜单）的情况 */
:deep(.custom-breadcrumb .el-breadcrumb__item:last-child:only-child) {
  padding-left: 0 !important;
}

/* 响应式调整 */
@media screen and (max-width: 768px) {
  .sidebar {
    position: fixed;
    height: 100vh;
    transform: translateX(-100%);
  }

  .sidebar.collapsed {
    transform: translateX(0);
  }

  .main-content {
    margin-left: 0;
  }
}
</style>
