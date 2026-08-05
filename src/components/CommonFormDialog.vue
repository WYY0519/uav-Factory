<template>
  <el-dialog
    :title="formDialogTitle"
    :model-value="modelValue"
    @update:model-value="handleVisibleChange"
    :width="dialogWidth"
    :destroy-on-close="destroyOnClose"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="{ ...props.rules, ...customRules }"
      :label-width="labelWidth"
      :validate-on-rule-change="false"
      class="form-container"
    >
      <!-- 动态渲染表单项 -->
      <el-form-item
        v-for="item in formItems"
        :key="`form-item-${item.prop}`"
        :label="item.label"
        :prop="item.prop"
        :required="item.required || false"
        :hidden="item.hidden || false"
        :label-width="item.labelWidth || props.labelWidth"
      >
        <!-- 输入框类型：绑定失焦事件，支持失焦校验 -->
        <template v-if="item.type === 'input'">
          <el-input
            v-model="formData[item.prop]"
            :placeholder="item.placeholder || `请输入${item.label}`"
            :disabled="
              typeof item.disabled === 'boolean'
                ? item.disabled
                : item.disabled?.value || (isEdit && item.prop === 'phone')
            "
            :maxlength="item.maxlength"
            :show-word-limit="!!item.maxlength"
            clearable="true"
            @blur="item.validateOnBlur && handleFieldBlur(item)"
          />
        </template>

        <!-- 下拉选择类型：原有逻辑不变 -->
        <template v-if="item.type === 'select'">
          <el-select
            v-model="formData[item.prop]"
            :placeholder="item.placeholder || `请选择${item.label}`"
            :disabled="
              typeof item.disabled === 'boolean'
                ? item.disabled
                : item.disabled?.value || (isEdit && item.prop === 'userType')
            "
            :clearable="item.clearable ?? true"
            :filterable="item.filterable || false"
            style="width: 100%"
          >
            <el-option
              v-if="!item.options || item.options.length === 0"
              label="暂无可选数据"
              value=""
              disabled
            />
            <el-option
              v-for="opt in item.options || []"
              :key="`select-opt-${item.prop}-${opt.value || opt.id}`"
              :label="opt.label"
              :value="opt.value || opt.id"
            />
          </el-select>
        </template>

        <!-- 文本域类型：绑定失焦事件 -->
        <template v-if="item.type === 'textarea'">
          <el-input
            v-model="formData[item.prop]"
            type="textarea"
            :placeholder="item.placeholder || `请输入${item.label}`"
            :rows="item.rows || 4"
            :maxlength="item.maxlength"
            :show-word-limit="!!item.maxlength"
            @blur="item.validateOnBlur && handleFieldBlur(item)"
          />
        </template>

        <!-- 自定义内容插槽：原有逻辑不变 -->
        <slot
          :name="`form-${item.prop}`"
          :formData="formData"
          :formItem="item"
        ></slot>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, nextTick } from "vue";
import { ElMessage } from "element-plus";

// 接收父组件参数（完整类型定义 + 默认值）
const props = defineProps({
  formDialogTitle: {
    type: String,
    required: true,
    default: "表单弹窗",
  },
  modelValue: {
    type: Boolean,
    default: false,
  },
  formItems: {
    type: Array,
    required: true,
    default: () => [],
  },
  rules: {
    type: Object,
    default: () => ({}),
  },
  initialData: {
    type: Object,
    default: () => ({}),
  },
  dialogWidth: {
    type: String,
    default: "500px",
  },
  labelWidth: {
    type: String,
    default: "100px",
  },
  destroyOnClose: {
    type: Boolean,
    default: true,
  },
  isEdit: {
    type: Boolean,
    default: false,
  },
  validateBeforeSubmit: {
    type: Boolean,
    default: true,
  },
});

// 向父组件传递事件
const emit = defineEmits(["submit", "cancel", "update:modelValue", "close"]);

// 核心状态：表单数据、表单引用
const formData = reactive({});
const formRef = ref(null);
// 失焦校验专用状态
const fieldValidatePass = ref({}); // 字段接口校验是否通过：{ prop: true/false }
const validateLoading = ref({}); // 字段校验加载状态：{ prop: true/false }
const submitLoading = ref(false); // 表单提交加载状态（恢复原有注释的状态）
const customRules = ref({}); // 自定义校验规则：用于接口校验失败的动态验证

// 初始化表单数据 + 校验状态
const initFormData = () => {
  // 清空原有表单数据
  Object.keys(formData).forEach((key) => delete formData[key]);
  // 赋值初始数据
  Object.assign(formData, { ...props.initialData });
  // 初始化校验状态：未校验默认为true（首次提交会触发整体校验）
  const initValidateStatus = {};
  props.formItems.forEach((item) => {
    initValidateStatus[item.prop] = true;
  });
  fieldValidatePass.value = initValidateStatus;
  validateLoading.value = {};
  submitLoading.value = false;
  // 清空自定义校验规则
  customRules.value = {};
};

// 监听初始数据变化（深度监听，适配编辑场景数据回显）
watch(
  () => props.initialData,
  (newVal) => {
    if (newVal && props.modelValue) {
      initFormData();
    }
  },
  { deep: true, immediate: true },
);

// 监听表单配置变化，重置校验状态
watch(
  () => props.formItems,
  () => {
    nextTick(() => {
      formRef.value?.clearValidate();
    });
  },
  { deep: true },
);

// 监听弹窗显隐，初始化/清空数据
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      nextTick(() => {
        initFormData();
        // 延迟清除验证，确保表单已渲染
        nextTick(() => {
          formRef.value?.clearValidate();
        });
      });
    } else {
      // 关闭弹窗清空所有状态
      Object.keys(formData).forEach((key) => delete formData[key]);
      fieldValidatePass.value = {};
      validateLoading.value = {};
      submitLoading.value = false;
      customRules.value = {};
    }
  },
  { immediate: true },
);

// 核心改造：表单项失焦校验方法（适配新增传id=-1、编辑传当前行id）
const handleFieldBlur = async (formItem) => {
  const { prop, validateApi, validateMsg } = formItem;
  // 步骤1：先执行前端规则校验，格式错误直接返回，不调用接口
  try {
    await formRef.value.validateField(prop);
  } catch (error) {
    fieldValidatePass.value[prop] = false;
    // 清除自定义校验规则，恢复前端规则
    delete customRules.value[prop];
    return;
  }

  // 步骤2：字段值为空时，不调用接口（前端required已校验，兜底处理）
  if (!formData[prop] && formData[prop] !== 0) {
    fieldValidatePass.value[prop] = true;
    // 清除自定义校验规则
    delete customRules.value[prop];
    return;
  }

  // 步骤3：构造校验接口参数（核心改造点）
  // 新增：{ 校验字段: 字段值, id: -1 }
  // 编辑：{ 校验字段: 字段值, id: 当前行id（从formData.id取） }
  const validateParams = {
    message: formData[prop], // 携带当前校验字段的键值对
    id: props.isEdit ? formData.id || "" : -1, // 新增固定-1，编辑取表单id
  };

  // 步骤4：调用后端接口进行唯一性校验
  validateLoading.value[prop] = true;
  try {
    // 传递构造后的校验参数（替代原formData，仅传必要字段+id）
    const res = await validateApi(validateParams);
    // 接口code=200表示校验通过（字段可用）
    fieldValidatePass.value[prop] = res.code === 200;
    // 校验失败时，添加自定义验证规则，显示红色错误提示
    if (res.code !== 200) {
      // 添加自定义校验规则
      customRules.value[prop] = [
        {
          validator: (rule, value, callback) => {
            if (!fieldValidatePass.value[prop]) {
              callback(new Error(validateMsg || res.message || "该字段已存在"));
            } else {
              callback();
            }
          },
          trigger: "blur",
        },
      ];
      // 延迟触发校验，让错误提示显示出来
      await nextTick();
      formRef.value?.validateField(prop);
    } else {
      // 校验通过，清除自定义校验规则
      delete customRules.value[prop];
      await nextTick();
      formRef.value?.clearValidate([prop]);
    }
  } catch (error) {
    console.error(`【${formItem.label}】校验接口调用失败：`, error);
    fieldValidatePass.value[prop] = false;
    // 接口调用失败也显示错误
    customRules.value[prop] = [
      {
        validator: (rule, value, callback) => {
          if (!fieldValidatePass.value[prop]) {
            callback(new Error(validateMsg || "校验失败，请稍后重试"));
          } else {
            callback();
          }
        },
        trigger: "blur",
      },
    ];
  } finally {
    validateLoading.value[prop] = false;
  }
};

// 批量校验所有带失焦校验的字段（提交前调用）
const validateAllFieldApi = async () => {
  const needValidateItems = props.formItems.filter(
    (item) => item.validateOnBlur,
  );
  if (needValidateItems.length === 0) return true;

  let allPass = true;
  for (const item of needValidateItems) {
    if (!fieldValidatePass.value[item.prop]) {
      // 未通过的字段重新执行失焦校验
      await handleFieldBlur(item);
      // 更新校验结果
      if (!fieldValidatePass.value[item.prop]) {
        allPass = false;
      }
    }
  }
  return allPass;
};

// 表单提交方法：整合前端规则校验 + 后端接口校验
const handleSubmit = async () => {
  if (!props.validateBeforeSubmit) {
    emit("submit", { ...formData });
    return;
  }

  try {
    submitLoading.value = true;
    // 第一步：前端整体规则校验
    await formRef.value.validate();
    // 第二步：所有失焦校验字段的后端接口校验
    const isAllApiPass = await validateAllFieldApi();
    if (!isAllApiPass) {
      ElMessage.warning("部分字段校验失败，请修正后再提交");
      submitLoading.value = false;
      return;
    }
    // 所有校验通过，提交表单
    emit("submit", { ...formData });
  } catch (error) {
    ElMessage.warning("请完善表单必填项并修正格式错误");
    console.error("表单前端规则校验失败：", error);
    submitLoading.value = false;
  }
};

// 对话框显隐变化处理
const handleVisibleChange = (value) => {
  emit("update:modelValue", value);
};

// 取消按钮点击事件
const handleCancel = () => {
  emit("cancel");
  emit("update:modelValue", false);
};

// 对话框关闭事件
const handleClose = () => {
  emit("close");
  emit("update:modelValue", false);
};

// 暴露方法给父组件
defineExpose({
  clearForm: () => {
    initFormData();
    formRef.value?.clearValidate();
  },
  validateForm: () => formRef.value?.validate(),
});
</script>

<style scoped>
.form-container {
  margin-top: 10px;
  padding-right: 10px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 10px 0;
}

:deep(.el-input.is-disabled .el-input__inner) {
  background-color: #f5f7fa;
  color: #606266;
  cursor: not-allowed;
}

:deep(.el-option[disabled]) {
  color: #909399;
}

@media (max-width: 768px) {
  :deep(.el-dialog) {
    width: 90% !important;
  }
}
</style>
