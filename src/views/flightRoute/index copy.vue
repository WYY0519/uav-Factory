<template>
  <div class="route-list">
    <!-- 1. 公共搜索组件 -->
    <CommonSearch
      :search-items="searchItems"
      :initial-data="initialSearchData"
      @search="handleSearch"
      @reset="handleReset"
    />

    <!-- 2. 公共表格组件 -->
    <CommonTable
      title="航线列表"
      :table-data="filteredRouteList"
      :columns="tableColumns"
      :total="total"
      :loading="loading"
      @row-click="handleRowClick"
      @radio-change="handleRadioChange"
      :action-width="120"
    >
      <!-- 操作列自定义插槽 -->
      <template #action="{ row }">
        <el-button-group>
          <el-tooltip content="查看" placement="top">
            <el-button type="primary" link @click="downloadRoute(row)">
              <el-icon><View /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="下载航线" placement="top">
            <el-button type="primary" link @click="downloadRoute(row)">
              <el-icon><Download /></el-icon>
            </el-button>
          </el-tooltip>
        </el-button-group>
      </template>

      <!-- 分页组件插槽 -->
      <template #pagination>
        <CommonPagination
          :total="total"
          :current-page="currentPage"
          :page-size="pageSize"
          :page-sizes="[5, 10, 20, 30, 50, 100]"
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
import { Download, View } from "@element-plus/icons-vue";

// 引入公共组件（和目标代码保持一致）
import CommonSearch from "@/components/CommonSearch.vue";
import CommonTable from "@/components/CommonTable.vue";
import CommonPagination from "@/components/CommonPagination.vue";

// 接口导入（保留原有接口）
import { flightRouteList, downloadFlightRoute } from "@/api/flightRoute";
import { companyPartnerCompanyMap } from "@/api/company";

// ===== 搜索配置（适配公共搜索组件）=====
const searchItems = [
  { prop: "name", label: "航线名称:", placeholder: "请输入航线名称" },
  {
    prop: "companyId",
    label: "公司:",
    placeholder: "请选择公司",
    type: "select",
    options: [],
  },
];
const initialSearchData = { name: "", companyId: "" };
const formInline = reactive({ ...initialSearchData });

// ===== 表格列配置（和原有列保持一致）=====
const tableColumns = [
  { prop: "name", label: "航线名称", minWidth: "180" },
  { prop: "companyName", label: "合作公司", minWidth: "220" },
  { prop: "description", label: "描述", minWidth: "200" },
  { prop: "createTime", label: "开始时间", minWidth: "200" },
];

// ===== 状态管理（对齐目标代码格式）=====
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(5);
const total = ref(0);
const selectedRouteId = ref("");
const filteredRouteList = ref([]);
const companyOptions = ref([]);

// ===== 核心业务方法 =====
// 获取航线列表数据（对齐目标代码的companyListData命名）
const routeListData = async () => {
  console.log(formInline, "formInline");
  const data = {
    currentPage: currentPage.value,
    pageSize: pageSize.value,
    name: formInline.name,
    companyId: formInline.companyId,
  };
  loading.value = true;
  try {
    const res = await flightRouteList(data);
    if (res.code === 200) {
      filteredRouteList.value = res.data.list;
      total.value = res.data.total;
    }
  } catch (error) {
    ElMessage.error("获取航线列表失败");
  } finally {
    setTimeout(() => {
      loading.value = false;
    }, 500);
  }
};

// 获取公司列表（下拉选项）
const getCompanyList = async () => {
  try {
    const res = await companyPartnerCompanyMap();
    companyOptions.value = res.data.map((item) => ({
      value: item.cid,
      label: item.cname,
    }));
    // 同步更新搜索组件的公司下拉选项
    searchItems[1].options = companyOptions.value;
  } catch (error) {
    console.error("获取公司列表失败:", error);
    ElMessage.error("加载公司列表失败");
  }
};

// 搜索（适配公共搜索组件）
const handleSearch = (params) => {
  Object.assign(formInline, params);
  currentPage.value = 1;
  routeListData();
};

// 重置（适配公共搜索组件）
const handleReset = () => {
  Object.assign(formInline, initialSearchData);
  selectedRouteId.value = "";
  currentPage.value = 1;
  routeListData();
};

// 分页事件处理（和目标代码格式一致）
const handleSizeChange = (val) => {
  pageSize.value = val;
  routeListData();
};
const handleCurrentChange = (val) => {
  currentPage.value = val;
  routeListData();
};

// 行点击/单选框变更（和目标代码格式一致）
const handleRowClick = (row) => {
  selectedRouteId.value = row.id;
  console.log("选中航线:1", selectedRouteId.value);
};
const handleRadioChange = (row) => {
  selectedRouteId.value = row.id;
  console.log("选中航线:2", selectedRouteId.value);
};

// 下载航线的KML文件（保留原有完整逻辑）
const downloadRoute = async (row) => {
  if (!row?.id) {
    ElMessage.warning("请选择要下载的航线！");
    return;
  }
  try {
    const blob = await downloadFlightRoute(row.id);
    if (!(blob instanceof Blob) || blob.size === 0) {
      ElMessage.error("下载失败：返回的文件数据无效");
      return;
    }
    const kmlBlob = new Blob([blob], {
      type: "application/vnd.google-earth.kml+xml",
    });
    const url = window.URL.createObjectURL(kmlBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `航线_${row.name || row.id}.kml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    ElMessage.success(`《${row.name || "航线"}》KML文件下载成功！`);
  } catch (error) {
    console.error("KML文件下载异常：", error);
    if (error.message.includes("404")) {
      ElMessage.error("下载失败：航线文件接口不存在");
    } else if (error.message.includes("401")) {
      ElMessage.error("下载失败：登录已过期，请重新登录");
    } else {
      ElMessage.error("KML文件下载失败：服务器返回异常");
    }
  }
};

// 初始化加载数据（和目标代码格式一致）
onMounted(() => {
  getCompanyList();
  routeListData();
});
</script>

<style scoped>
.route-list {
  box-sizing: border-box;
  background-color: #f5f7fa;
  padding: 0 10px;
}

/* 适配公共组件样式（对齐目标代码的样式结构） */
:deep(.table-card) {
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

:deep(.el-table) {
  border-radius: 8px;
  margin-top: 20px;
}

:deep(.el-button-group) {
  display: flex;
  /* gap: 8px; */
  justify-content: center;
}

/* 单选框样式（保留原有逻辑） */
:deep(.el-radio) {
  margin-right: 0;
  display: flex;
  justify-content: center;
}

:deep(.el-radio__label) {
  display: none;
}

/* 响应式适配（和目标代码一致） */
@media (max-width: 768px) {
  :deep(.card-header) {
    flex-direction: column;
    gap: 16px;
  }
  :deep(.header-right) {
    width: 100%;
    flex-direction: column;
    gap: 12px;
  }
}
</style>
