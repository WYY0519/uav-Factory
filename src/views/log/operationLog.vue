<template>
  <div class="log-management">
    <!-- 1. 搜索组件 -->
    <CommonSearch
      :search-items="searchItems"
      :initial-data="initialSearchData"
      @search="handleSearch"
      @reset="handleReset"
    />

    <!-- 2. 表格组件 -->
    <CommonTable
      title="日志列表"
      :table-data="logList"
      :columns="tableColumns"
      :total="total"
      :loading="loading"
      :show-action="false"
      @row-click="handleRowClick"
      @radio-change="handleRadioChange"
    >
      <!-- 分页组件 -->
      <template #pagination>
        <CommonPagination
          :total="total"
          :current-page="currentPage"
          :page-size="pageSize"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </template>
    </CommonTable>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
// 引入公共组件
import CommonSearch from "@/components/CommonSearch.vue";
import CommonTable from "@/components/CommonTable.vue";
import CommonPagination from "@/components/CommonPagination.vue";
// 接口
import { logSystemLog } from "@/api/log";
import { dictionaryDicName } from "@/api/dictionary";
const logTypeOptions = ref([]);
const opBriefOptions = ref([]);
// ===== 搜索配置 =====
const searchItems = ref([
  {
    prop: "logType",
    label: "日志类型:",
    type: "select",
    placeholder: "请选择日志类型",
    options: logTypeOptions,
  },
  {
    prop: "operationBrief",
    label: "操作:",
    type: "select",
    placeholder: "请输入操作",
    options: opBriefOptions,
  },
  {
    prop: "detail",
    label: "日志详情:",
    placeholder: "请输入详情",
  },
  {
    type: "daterange",
    prop: "day", // 对应formData的字段名（数组格式：[开始日期, 结束日期]）
    label: "截止时间",
    rangeSeparator: "-", // 自定义分隔符（替换默认的To）
    startPlaceholder: "开始日期", // 自定义开始占位符
    endPlaceholder: "结束日期", // 自定义结束占位符
    size: "default", // 组件尺寸
  },
]);
// 【修改1】修正day初始值为空数组（daterange必须绑定数组，否则选择异常）
const initialSearchData = {
  logType: "",
  operationBrief: "",
  day: [],
  detail: "",
};
const formInline = reactive({ ...initialSearchData });

// ===== 表格配置 =====
const tableColumns = [
  { prop: "logType", label: "日志类型", width: 120 },
  {
    prop: "operationBrief",
    label: "操作",
    minWidth: 100,
    showOverflowTooltip: true,
  },
  {
    prop: "logDetail",
    label: "日志详情",
    minWidth: 280,
    showOverflowTooltip: true,
  },

  { prop: "operationTime", label: "操作时间", minWidth: 100 },
];

// ===== 状态管理 =====
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(5);
const total = ref(0);
const logList = ref([]);
const selectedlogId = ref("");

// ===== 【新增/保留】日期转换工具函数 =====
// 补0工具函数：个位数日期/月份补0（如 1→01，5→05）
const addZero = (num) => num.toString().padStart(2, "0");
// 改造后：Date对象 → 毫秒级时间戳（数字类型，如 1736371200000）
const formatDate = (date) => {
  if (!date) return ""; // 空值返回空字符串

  // 确保 date 是 Date 对象
  const dateObj = date instanceof Date ? date : new Date(date);

  // 获取年月日
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0"); // 月份从0开始，所以要+1
  const day = String(dateObj.getDate()).padStart(2, "0");

  // 返回 YYYY-MM-DD 格式
  return `${year}-${month}-${day}`;
};

// ===== 方法 =====
// 获取日志列表
// 获取日志列表（仅修改日期参数赋值行，其余逻辑不变）
const getLogList = async () => {
  loading.value = true;
  try {
    const requestParams = {
      ...formInline,
      pageSize: pageSize.value,
      currentPage: currentPage.value,
      order: "DESC",
    };
    if (Array.isArray(requestParams.day) && requestParams.day.length === 2) {
      const [startDate, endDate] = requestParams.day;
      console.log(startDate, endDate, "startDate, endDate");

      // 【改造】直接传时间戳数字，替代原YYYY-MM-DD字符串
      requestParams.startTime = formatDate(startDate); // 结果：1736371200000（数字）
      requestParams.endTime = formatDate(endDate); // 结果：1736457599999（数字）
      delete requestParams.day;
    } else {
      delete requestParams.day;
    }

    const res = await logSystemLog(requestParams);
    if (res.code === 200) {
      logList.value = res.data.list;
      total.value = res.data.total;
    }
  } catch (error) {
    ElMessage.error("获取日志列表失败");
    console.error("获取日志失败：", error);
  } finally {
    loading.value = false;
  }
};
// 日志类型
const refundMethodList = async () => {
  try {
    const res = await dictionaryDicName("logType ");
    if (res.code === 200) {
      logTypeOptions.value = res.data.map((item) => ({
        value: item.dicKey,
        label: item.dicValue,
      }));
    } else {
      ElMessage.error("获取退回方式失败：" + res.message);
    }
  } catch (error) {
    console.error("获取退回方式失败:", error);
    ElMessage.error("加载退回方式失败，请刷新页面重试");
  }
};
// 操作简述
const refundMethodList1 = async () => {
  try {
    const res = await dictionaryDicName("opBrief ");
    if (res.code === 200) {
      opBriefOptions.value = res.data.map((item) => ({
        value: item.dicKey,
        label: item.dicValue,
      }));
    } else {
      ElMessage.error("获取退回方式失败：" + res.message);
    }
  } catch (error) {
    console.error("获取退回方式失败:", error);
    ElMessage.error("加载退回方式失败，请刷新页面重试");
  }
};
// 搜索
const handleSearch = (params) => {
  Object.assign(formInline, params);
  currentPage.value = 1;
  getLogList();
};

// 重置
const handleReset = () => {
  Object.assign(formInline, initialSearchData);
  currentPage.value = 1;
  getLogList();
};

// 分页
const handleSizeChange = (val) => {
  pageSize.value = val;
  getLogList();
};
const handleCurrentChange = (val) => {
  currentPage.value = val;
  getLogList();
};

// 行点击/单选
const handleRowClick = (row) => {
  selectedlogId.value = row.id;
};
const handleRadioChange = (row) => {
  selectedlogId.value = row.id;
};

// 初始化
onMounted(() => {
  getLogList();
  refundMethodList();
  refundMethodList1();
});
</script>

<style scoped>
.log-management {
  /* height: 100vh; */
  box-sizing: border-box;
}
</style>
