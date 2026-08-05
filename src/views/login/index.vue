<template>
  <div class="login-page">
    <div class="login-container">
      <div class="tabs">
        <div
          :class="['tab-item', { active: activeTab === 'phone' }]"
          @click="activeTab = 'phone'"
        >
          手机号登录
        </div>
        <div
          :class="['tab-item', { active: activeTab === 'account' }]"
          @click="activeTab = 'account'"
        >
          账号登录
        </div>
      </div>

      <!-- 手机号登录 -->
      <div v-if="activeTab === 'phone'" class="form-content">
        <div class="form-item">
          <div class="label">手机号</div>
          <el-input
            v-model="formData.mobile"
            placeholder="请输入手机号"
            maxlength="11"
          >
            <template #suffix>
              <span class="input-counter"
                >{{ formData.mobile.length }} / 11</span
              >
            </template>
          </el-input>
        </div>

        <div class="form-item">
          <div class="label">图形验证码</div>
          <div class="verification-code">
            <el-input
              v-model="formData.field105"
              placeholder="请输入图形验证码"
            />
            <div class="captcha-wrapper">
              <Captcha v-model="captcha1" :width="100" :height="38" />
            </div>
          </div>
        </div>

        <div class="form-item">
          <div class="label">短信验证码</div>
          <div class="verification-code">
            <el-input
              v-model="formData.field124"
              placeholder="请输入短信验证码"
            />
            <el-button
              type="primary"
              :disabled="isCounting"
              @click="getCode"
              class="verify-btn"
            >
              {{ buttonText }}
            </el-button>
          </div>
        </div>

        <div class="button-group">
          <el-button type="primary" @click="submitForm" class="submit-btn">
            立即登录
          </el-button>
          <el-button @click="ToRegister" class="register-btn">
            免费注册
          </el-button>
        </div>
      </div>

      <!-- 账号登录 -->
      <div v-if="activeTab === 'account'" class="form-content">
        <div class="form-item">
          <div class="label">账号</div>
          <el-input
            v-model="formData.field100"
            placeholder="请输入账号"
            @keydown.enter="submitForm"
          />
        </div>

        <div class="form-item">
          <div class="label">密码</div>
          <el-input
            v-model="formData.field101"
            type="password"
            placeholder="请输入密码"
            show-password
            @keydown.enter="submitForm"
          />
        </div>

        <!-- <div class="form-item">
          <div class="label">图形验证码</div>
          <div class="verification-code">
            <el-input v-model="formData.field105" placeholder="请输入图形验证码" @keydown.enter="submitForm" />
            <div class="captcha-wrapper">
              <Captcha v-model="captcha1" :width="100" :height="38" />
            </div>
          </div>
        </div> -->

        <div class="button-group">
          <el-button type="primary" @click="submitForm" class="submit-btn">
            立即登录
          </el-button>
          <el-button @click="ToRegister" class="register-btn">
            免费注册
          </el-button>
        </div>
      </div>
    </div>
  </div>
  <div
    class="versionInfo"
    :style="{ color: bgColor }"
    @click.stop="versionInfor"
  >
    版本信息
  </div>
  <!-- 展示版本的内容 -->
  <VersionModal
    :show="showVersionList"
    :versionList="versionList"
    @close="handleVersionClose"
  />
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, nextTick } from "vue";
import Captcha from "@/components/Captcha.vue";
import router from "@/router/index";
import { http } from "@/utils/request";
import { ElMessage } from "element-plus";
// import { userlogin } from "@/api/user";
import versionList from "./components/version.js";
import VersionModal from "./components/VersionModal.vue";
// console.log("当前Token:", localStorage.getItem("token"));
const activeTab = ref("phone");

// 表单数据和规则
const formData = reactive({
  mobile: "",
  field105: "",
  field124: "",
  field100: "",
  field101: "",
});

const captcha1 = ref("");
const isCounting = ref(false);
const buttonText = ref("发送验证码");
const countdown = ref(60);
const bgColor = ref("#fff");
const rules = {
  mobile: [
    { required: true, message: "请输入手机号", trigger: "blur" },
    { pattern: /^1[3-9]\d{9}$/, message: "手机号格式错误", trigger: "blur" },
  ],
  field105: [{ required: true, message: "请输入图形验证码", trigger: "blur" }],
  field124: [{ required: true, message: "请输入短信验证码", trigger: "blur" }],
  field100: [
    { required: true, message: "请输入账号", trigger: "blur" },
    { min: 5, max: 50, message: "账号长度必须为5到50个字符", trigger: "blur" },
  ],
  field101: [{ required: true, message: "请输入密码", trigger: "blur" }],
};
const showVersionList = ref(false);
const modalContentRef = ref(null);
// 登录方法
const login = async (url, requestBody) => {
  try {
    const response = await http.post(url, requestBody, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log(response, "response");
    if (response.code === 200) {
      // router.push("/home");
      router.push("/largeScreen");
      // if (response.code === 0) {
      // 登录成功，保存 token
      // localStorage.setItem("authToken", "Bearer " + response.data);
      localStorage.setItem("authToken", "Bearer " + response.data.token);
      // router.push("/usertask");
    } else {
      ElMessage.error(response.message || "登录失败");
    }
  } catch (error) {
    ElMessage.error("网络请求失败，请稍后再试");
  }
};

// 发送验证码
const getCode = async () => {
  if (!formData.mobile || !/^1[3-9]\d{9}$/.test(formData.mobile)) {
    ElMessage.warning("手机号不正确！");
    return;
  }
  if (!formData.field105) {
    ElMessage.warning("请输入图形验证码！");
    return;
  }
  // if (formData.field105.toLowerCase() !== captcha1.value.toLowerCase()) {
  //   ElMessage.warning("图形验证码不正确！");
  //   return;
  // }

  try {
    const response = await http.post("/api/user/sendSms", {
      phoneNumber: formData.mobile,
    });

    if (response.data.code === 200) {
      // if (response.data.code === 0) {
      ElMessage.success("验证码发送成功");
      isCounting.value = true;
      startCountdown();
    } else {
      ElMessage.error(response.data.message || "验证码发送失败");
    }
  } catch (error) {
    ElMessage.error("验证码发送失败，请稍后再试");
  }
};

// 开始倒计时
function startCountdown() {
  const timer = setInterval(() => {
    if (countdown.value <= 0) {
      clearInterval(timer);
      isCounting.value = false;
      buttonText.value = "发送验证码";
      countdown.value = 60;
    } else {
      buttonText.value = `${countdown.value--}s 后重新发送`;
    }
  }, 1000);
}

// 提交表单
const submitForm = async () => {
  if (activeTab.value === "phone") {
    // 手机号登录验证
    if (!formData.mobile || !/^1[3-9]\d{9}$/.test(formData.mobile)) {
      ElMessage.warning("请输入正确的手机号");
      return;
    }
    // if (
    //   !formData.field105 ||
    //   formData.field105.toLowerCase() !== captcha1.value.toLowerCase()
    // ) {
    //   ElMessage.warning("图形验证码不正确");
    //   return;
    // }
    if (!formData.field124) {
      ElMessage.warning("请输入短信验证码");
      return;
    }

    // 手机号登录请求
    const requestBody = {
      phoneNumber: formData.mobile,
      code: formData.field124,
    };
    await login("/api/user/smsLogin", requestBody);
  } else {
    // 账号登录验证
    if (!formData.field100) {
      ElMessage.warning("请输入账号");
      return;
    }
    if (!formData.field101) {
      ElMessage.warning("请输入密码");
      return;
    }
    // if (
    //   !formData.field105 ||
    //   formData.field105.toLowerCase() !== captcha1.value.toLowerCase()
    // ) {
    //   ElMessage.warning("图形验证码不正确");
    //   return;
    // }
    // 账号登录请求
    const requestBody2 = {
      account: formData.field100,
      password: formData.field101,
    };
    const res = await login("/factory/login", requestBody2);
  }
};

function ToRegister() {
  router.push("/register");
}
const versionInfor = () => {
  showVersionList.value = !showVersionList.value;
  // 保持按钮样式切换逻辑
  bgColor.value = showVersionList.value ? "skyblue" : "#fff";
  // 调试信息
  console.log(`弹窗状态切换为: ${showVersionList.value}`);
};
// 关闭版本弹窗（从组件接收事件）
const handleVersionClose = () => {
  showVersionList.value = false;
  bgColor.value = "#fff";
};
// 生命周期钩子
onMounted(() => {});

onBeforeUnmount(() => {});
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: url("./components/img.png") no-repeat center center;
  background-size: cover;
}

.login-container {
  background: #fff;
  width: 360px;
  padding: 25px;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.tabs {
  display: flex;
  margin-bottom: 25px;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 10px 0;
  font-size: 15px;
  color: #666;
  cursor: pointer;
  position: relative;
}

.tab-item.active {
  color: #409eff;
}

.tab-item.active::after {
  content: "";
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: #409eff;
}

.form-content {
  padding: 0 5px;
}

.form-item {
  margin-bottom: 20px;
}

.label {
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
}

:deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px #dcdfe6;
  padding: 1px 11px;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #409eff;
}

.input-counter {
  font-size: 12px;
  color: #999;
}

.verification-code {
  display: flex;
  gap: 8px;
}

.verification-code .el-input {
  flex: 1;
}

.captcha-wrapper {
  width: 100px;
  height: 38px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.verify-btn {
  width: 110px;
  padding: 0;
  font-size: 14px;
}

.button-group {
  display: flex;
  gap: 12px;
  margin-top: 25px;
}

.submit-btn,
.register-btn {
  flex: 1;
  height: 36px;
  font-size: 14px;
}

.submit-btn {
  background-color: #409eff;
  border-color: #409eff;
}

.register-btn {
  background-color: #fff;
  border-color: #dcdfe6;
  color: #606266;
}

.versionInfo {
  /* 关键：提高按钮层级，确保可点击 */
  position: fixed;
  /* 改为fixed，相对于视口定位 */
  bottom: 20px;
  /* 增加底部距离，避免被遮挡 */
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  /* 确保按钮在最上层 */
  cursor: pointer;
  padding: 8px 16px;
  /* 增加点击区域 */
  background: rgba(0, 0, 0, 0.5);
  /* 增加背景，提高可见性 */
  color: white;
  /* 文字颜色设为白色，适配深色背景 */
  border-radius: 4px;
}

.version-content {
  z-index: 200;
  /* 高于背景和登录表单 */
  position: fixed;
  /* 改为fixed，相对于视口定位 */
  bottom: 10%;
  left: 50%;
  transform: translateX(-50%);
  background: #fff;
  width: 450px;
  max-width: 90vw;
  /* 适配小屏幕 */
  height: 70%;
  border-radius: 10px;
  box-shadow: 10px 10px 20px 5px rgba(0, 0, 0, 0.25);
  padding: 16px;
  overflow-y: auto;
  display: block;
  /* 强制显示 */
  padding-right: 12px;
}

/* 滚动条容器 */
.version-content::-webkit-scrollbar {
  width: 10px;
  /* 滚动条宽度 */
}

/* 滚动条轨道 */
.version-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  /* 轨道背景色 */
  border-radius: 10px;
  /* 轨道圆角 */
}

/* 滚动条滑块 */
.version-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  /* 滑块颜色 */
  border-radius: 10px;
  /* 滑块圆角 */
  transition: background 0.3s;
  /* hover效果过渡 */
  min-height: 200px;
}

/* 滚动条滑块hover状态 */
.version-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
  /* 滑块hover颜色加深 */
}

/* 解决边缘圆角被遮挡问题 */
.version-content::-webkit-scrollbar-track-piece:start {
  border-radius: 10px 10px 0 0;
}

.version-content::-webkit-scrollbar-track-piece:end {
  border-radius: 0 0 10px 10px;
}

@media (max-width: 768px) {
  .login-container {
    /* width: 90%;
    margin: 20px; */
    position: relative;
    z-index: 50;
    /* 低于弹窗的z-index */
  }
}
</style>
