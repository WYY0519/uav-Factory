<template>
  <el-dialog
    v-model="visible"
    title="忘记密码"
    width="500px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="80px"
    >
      <el-form-item label="邮箱" prop="email">
        <el-input
          v-model="formData.email"
          placeholder="请输入邮箱"
          maxlength="50"
          clearable
          autocomplete="off"
        />
      </el-form-item>

      <el-form-item label="验证码" prop="code">
        <div style="display: flex; gap: 8px; width: 100%">
          <el-input
            v-model="formData.code"
            placeholder="请输入验证码"
            maxlength="6"
            autocomplete="off"
          />
          <el-button
            type="primary"
            :disabled="isCounting"
            @click="sendCode"
            style="width: 120px; flex-shrink: 0"
          >
            {{ buttonText }}
          </el-button>
        </div>
      </el-form-item>

      <el-form-item label="新密码" prop="newPassword">
        <el-input
          v-model="formData.newPassword"
          type="password"
          placeholder="请输入新密码"
          maxlength="20"
          show-password
          autocomplete="new-password"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, nextTick } from "vue";
import { ElMessage } from "element-plus";
import { http } from "@/utils/request";

// 1. 先定义所有基础变量（避免引用顺序问题）
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "success", "close"]);

// 本地弹窗显隐变量
const visible = ref(props.modelValue);

// 表单数据
const formData = reactive({
  email: "",
  code: "",
  newPassword: "",
});

// 表单验证规则
const formRules = ref({
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    {
      pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      message: "邮箱格式错误",
      trigger: "blur",
    },
  ],
  code: [{ required: true, message: "请输入验证码", trigger: "blur" }],
  newPassword: [
    { required: true, message: "请输入新密码", trigger: "blur" },
    { min: 6, max: 20, message: "密码长度为6-20个字符", trigger: "blur" },
  ],
});

// 验证码倒计时相关
const isCounting = ref(false);
const buttonText = ref("发送验证码");
const countdown = ref(60);

// 表单引用
const formRef = ref(null);

// 2. 先定义所有函数（确保watch调用时函数已存在）
// 清空倒计时函数（提前定义）
const clearCountdown = () => {
  isCounting.value = false;
  buttonText.value = "发送验证码";
  countdown.value = 60;
};

// 重置表单函数
const resetForm = () => {
  formData.email = "";
  formData.code = "";
  formData.newPassword = "";
  nextTick(() => {
    formRef.value?.clearValidate();
  });
  clearCountdown(); // 调用提前定义的函数
};

// 开始倒计时函数
const startCountdown = () => {
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
};

// 发送验证码
const sendCode = async () => {
  try {
    await formRef.value.validateField("email");
  } catch (error) {
    return;
  }

  if (!formData.email) {
    ElMessage.warning("请输入邮箱地址");
    return;
  }

  try {
    // 修复方案：直接拼接 URL 参数，避免序列化问题
    const encodeEmail = encodeURIComponent(formData.email);
    const response = await http.get(
      `/factory/forget/getcode?account=${encodeEmail}`,
    );

    if (response.code === 200) {
      ElMessage.success("验证码发送成功");
      isCounting.value = true;
      startCountdown();
    } else {
      ElMessage.error(response.message || "验证码发送失败");
    }
  } catch (error) {
    ElMessage.error("验证码发送失败，请稍后再试");
    console.error("发送验证码失败：", error);
  }
};

// 提交重置密码
const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();

    // 修复参数传递
    const encodeEmail = encodeURIComponent(formData.email);
    const encodeCode = encodeURIComponent(formData.code);
    const encodePwd = encodeURIComponent(formData.newPassword);
    // const response = await http.get(
    //   `/api/auth/reset-password?email=${encodeEmail}&verificationCode=${encodeCode}&newPassword=${encodePwd}`,
    // );
    const response = await http.post(
      "/api/admin/updateUserPasswordByEmailAndCode",
      {
        email: encodeEmail,
        verificationCode: encodeCode,
        newPassword: encodePwd,
        confirmPassword: encodePwd,
      },
    );
    if (response.code === 200) {
      ElMessage.success("密码重置成功");
      emit("success");
      visible.value = false;
    } else {
      ElMessage.error(response.message || "密码重置失败");
    }
  } catch (error) {
    ElMessage.error("密码重置失败，请稍后再试");
    console.error("重置密码失败：", error);
  }
};

// 取消按钮函数
const handleCancel = () => {
  visible.value = false;
  resetForm();
};

// 弹窗关闭事件函数
const handleClose = () => {
  emit("close");
  resetForm();
};

// 3. 最后定义所有watch监听（此时函数已全部定义）
// 同步父组件v-model
watch(visible, (newVal) => {
  emit("update:modelValue", newVal);
});

watch(
  () => props.modelValue,
  (newVal) => {
    visible.value = newVal;
  },
);

// 监听弹窗显隐，重置表单（此时clearCountdown和resetForm已定义）
watch(
  () => visible.value,
  (newVal) => {
    if (newVal) {
      resetForm(); // 此时函数已存在
    } else {
      clearCountdown(); // 此时函数已存在
    }
  },
  { immediate: true },
);

// 暴露方法给父组件
defineExpose({
  resetForm,
});
</script>

<style scoped>
:deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px #dcdfe6;
  padding: 1px 11px;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #409eff;
}
</style>

}
</style>
