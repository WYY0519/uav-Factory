<template>
  <div class="log-management">
    <!-- 1. 搜索组件：原有逻辑不变 -->
    <CommonSearch
      :search-items="searchItems"
      :initial-data="initialSearchData"
      @search="handleSearch"
      @reset="handleReset"
    />

    <!-- 2. 表格组件：新增ref、多选事件，顶部新增批量下载按钮 -->
    <CommonTable
      title="飞控日志列表"
      ref="logTableRef"
      :table-data="logList"
      :columns="tableColumns"
      :total="total"
      :loading="loading"
      :show-action="true"
      @row-click="handleRowClick"
      @radio-change="handleRadioChange"
      @selection-change="handleSelectionChange"
      :action-width="120"
    >
      <!-- 新增顶部批量操作按钮：批量下载（与单条下载风格统一） -->
      <template #header-actions>
        <el-button type="primary" @click="handleBatchDownload" :icon="Download">
          批量下载
        </el-button>
      </template>

      <!-- 操作列：原有逻辑不变 -->
      <template #action="{ row }">
        <el-button-group>
          <!-- <el-tooltip content="查看飞控日志" placement="top">
            <el-button
              type="primary"
              link
              @click="handleView(row)"
              :icon="View"
            />
          </el-tooltip> -->
        </el-button-group>
        <el-button-group>
          <el-tooltip content="下载飞控日志" placement="top">
            <el-button
              type="primary"
              link
              @click="handleTemplate(row)"
              :icon="Upload"
            />
          </el-tooltip>
        </el-button-group>
      </template>

      <!-- 分页组件：原有逻辑不变 -->
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
// 新增导入Download下载图标，与原有图标统一管理
import { Upload, View, Download } from "@element-plus/icons-vue";
// 引入公共组件
import CommonSearch from "@/components/CommonSearch.vue";
import CommonTable from "@/components/CommonTable.vue";
import CommonPagination from "@/components/CommonPagination.vue";
// 接口：新增批量下载日志接口（请确认后端实际接口名，若不同请修改）
import {
  logFlightLogList,
  flightLogDownload,
  flightLogBatchDownload, // 新增：飞控日志批量下载接口，核心！
} from "@/api/log";

// ===== 搜索配置：原有逻辑完全不变 =====
const searchItems = [
  { prop: "id", label: "ID:", placeholder: "请输入ID" },
  { prop: "deviceNumber", label: "设备编号:", placeholder: "请输入设备编号" },
  {
    type: "daterange",
    prop: "limitDay",
    label: "截止时间",
    rangeSeparator: "-",
    startPlaceholder: "开始日期",
    endPlaceholder: "结束日期",
    size: "default",
  },
];
const initialSearchData = {
  deviceNumber: "",
  limitDay: [],
  id: "",
};
const formInline = reactive({ ...initialSearchData });

// ===== 表格配置：原有逻辑完全不变 =====
const tableColumns = [
  { prop: "id", label: "ID", width: 80 },
  {
    prop: "deviceNumber",
    label: "设备编号",
    width: 220,
    showOverflowTooltip: true,
  },
  {
    prop: "filePath",
    label: "文件路径",
    minWidth: 280,
    showOverflowTooltip: true,
  },
  { prop: "startTime", label: "开始时间", width: 180 },
];

// ===== 状态管理：新增批量操作核心状态，原有状态保留 =====
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(5);
const total = ref(0);
const logList = ref([]);
const selectedlogId = ref("");
// 新增：批量操作核心状态（与之前所有批量操作逻辑完全一致）
const logTableRef = ref(null); // 表格实例引用，用于清空选中状态
const selectedRows = ref([]); // 存储表格多选的日志行数据

// ===== 日期格式化+设备编号截取工具函数：原有逻辑完全不变 =====
const addZero = (num) => num.toString().padStart(2, "0");
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = addZero(date.getMonth() + 1);
  const day = addZero(date.getDate());
  return `${year}-${month}-${day}`;
};
const extractDeviceNumber = (name) => {
  if (!name) return "";
  const reg = /flight_log_(.*?)_/;
  const match = name.match(reg);
  return match ? match[1] : name;
};

// ===== 方法：原有方法保留，新增多选/批量下载方法，优化原有操作清空选中 =====
// 获取日志列表：原有逻辑完全不变
const getLogList = async () => {
  loading.value = true;
  try {
    const requestParams = {
      ...formInline,
      pageSize: pageSize.value,
      currentPage: currentPage.value,
      order: "DESC",
    };
    if (
      Array.isArray(requestParams.limitDay) &&
      requestParams.limitDay.length === 2
    ) {
      const [startDate, endDate] = requestParams.limitDay;
      requestParams.startTime = formatDate(startDate);
      requestParams.endTime = formatDate(endDate);
      delete requestParams.limitDay;
    } else {
      delete requestParams.limitDay;
    }
    const res = await logFlightLogList(requestParams);
    if (res.code === 200) {
      const list = res.data.list.map((item) => {
        return {
          ...item,
          // deviceNumber: extractDeviceNumber(item.name),
        };
      });
      logList.value = list;
      total.value = res.data.total;
    }
  } catch (error) {
    ElMessage.error("获取日志列表失败");
    console.error("获取飞控日志失败：", error);
  } finally {
    loading.value = false;
  }
};

// 单条下载飞控日志：原有逻辑 + 新增清空选中状态
const handleTemplate = async (row) => {
  // 新增：单条下载时清空选中状态，保持交互一致
  clearSelectedState();
  try {
    let data = { filename: row.name };
    const blob = await flightLogDownload(data);
    if (!(blob instanceof Blob) || blob.size === 0) {
      ElMessage.error("下载失败：返回的文件数据无效");
      return;
    }
    const fileBlob = new Blob([blob]);
    const url = window.URL.createObjectURL(fileBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = row.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    ElMessage.success(`${row.name}下载成功！`);
  } catch (error) {
    console.error("文件下载异常：", error);
    ElMessage.error("文件下载失败，请稍后重试");
  }
};

// 查看飞控日志：原有逻辑 + 新增清空选中状态
const handleView = async (row) => {
  // 新增：查看时清空选中状态，保持交互一致
  clearSelectedState();
  console.log("查看飞控日志：", row);
  // 可自行补充查看日志的业务逻辑
  // ElMessage.info(`正在查看日志${row.id}，请补充业务逻辑`);
};

// 新增：监听表格多选状态变化，同步选中行数据（与之前批量操作完全一致）
const handleSelectionChange = (val) => {
  selectedRows.value = val;
};

// 新增：批量下载核心方法（贴合日志业务，返回压缩包格式）
// 新增：批量下载核心方法（贴合日志业务，返回压缩包格式，适配新接口）
const handleBatchDownload = async () => {
  // 1. 校验是否选中日志，未选中弹友好提示
  if (selectedRows.value.length === 0) {
    ElMessage.warning("请选择要下载的飞控日志");
    return;
  }
  // 2. 收集选中日志的ID（与批量删除一致，收集id数组）
  const ids = selectedRows.value.map((row) => row.id);
  const selectCount = selectedRows.value.length;

  loading.value = true;
  try {
    // 3. 核心修改：接口调用直接传ids数组（适配调整后的flightLogBatchDownload接口）
    const blob = await flightLogBatchDownload(ids);
    // 4. 校验Blob有效性，排除空/错误文件流
    if (!(blob instanceof Blob) || blob.size === 0) {
      ElMessage.error("批量下载失败：返回的压缩包数据无效");
      return;
    }
    // 5. 处理压缩包下载（默认zip格式，符合批量下载习惯）
    const zipBlob = new Blob([blob], {
      type: "application/zip", // 定义zip压缩包MIME类型，适配日志压缩包
    });
    const url = window.URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `飞控日志批量下载_${new Date().getTime()}.zip`; // 加时间戳避免重名
    document.body.appendChild(a);
    a.click();
    // 6. 清理临时资源，避免浏览器内存泄漏
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    // 7. 成功提示，告知用户下载数量，提升体验
    ElMessage.success(`成功下载${selectCount}条飞控日志，已打包为压缩包！`);
    // 8. 下载完成后清空选中状态，贴合业务操作习惯
    clearSelectedState();
  } catch (error) {
    console.error("批量下载飞控日志异常:", error);
    ElMessage.error("批量下载失败：网络异常或接口错误，请稍后重试");
  } finally {
    // 无论成功/失败，最终关闭loading
    loading.value = false;
  }
};

// 新增：通用清空选中状态方法（抽离公共逻辑，便于维护）
const clearSelectedState = () => {
  selectedRows.value = [];
  if (logTableRef.value) {
    logTableRef.value.clearSelection();
  }
};

// 搜索：原有逻辑 + 新增清空选中状态
const handleSearch = (params) => {
  Object.assign(formInline, params);
  currentPage.value = 1;
  // 新增：搜索时清空选中状态
  clearSelectedState();
  getLogList();
};

// 重置：原有逻辑 + 新增清空选中状态
const handleReset = () => {
  Object.assign(formInline, initialSearchData);
  currentPage.value = 1;
  // 新增：重置时清空选中状态
  clearSelectedState();
  getLogList();
};

// 分页：原有逻辑完全不变
const handleSizeChange = (val) => {
  pageSize.value = val;
  getLogList();
};
const handleCurrentChange = (val) => {
  currentPage.value = val;
  getLogList();
};

// 行点击/单选：原有逻辑完全不变
const handleRowClick = (row) => {
  selectedlogId.value = row.id;
};
const handleRadioChange = (row) => {
  selectedlogId.value = row.id;
};

// 初始化：原有逻辑完全不变
onMounted(() => {
  getLogList();
});
</script>
<style scoped>
.log-management {
  /* height: 100vh; */
  box-sizing: border-box;
}
</style>
