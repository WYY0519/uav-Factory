<template>
  <div class="route-list-container">
    <!-- 搜索区域：沿用原有三个搜索项，适配禁飞区样式 -->
    <div class="route-search">
      <el-input
        v-model="searchKeyword"
        @input="handleSearchInput"
        clearable
        placeholder="请输入要搜索的航线名称"
      />
      <el-input
        v-model="searchRouteArea"
        @input="handleSearchInput"
        clearable
        placeholder="请输入要搜索的城市"
      />
      <el-select
        v-model="searchCompanyId"
        @change="handleSearchInput"
        clearable
        placeholder="请选择要搜索的公司"
        class="company-select"
      >
        <el-option
          v-for="item in companyOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </div>

    <!-- 航线列表：适配禁飞区卡片布局，保留无数据状态 -->
    <div class="route-list-content">
      <!-- 有数据时的航线列表 -->
      <div v-if="displayedRoutes && displayedRoutes.length > 0">
        <div v-for="(item, index) in routeInfo" :key="index">
          <div
            v-for="(itemInfo, indexInfo) in item"
            :key="itemInfo.id"
            class="routeOperation"
          >
            <div class="routeOperation-box">
              <!-- 第一行：航线名称 -->
              <div class="tooltip-container">
                <span class="truncated-text">{{ itemInfo.name }}</span>
              </div>

              <!-- 第二行：航线核心信息（适配禁飞区的info布局） -->
              <div class="zone-info">
                <div class="info-row info-row-between">
                  <div class="info-item">
                    <span class="info-label">总距离：</span>
                    <span class="info-value"
                      >{{ itemInfo.totalDistance }} 米</span
                    >
                  </div>
                  <!-- 航线无标签，保留空位置对齐禁飞区样式 -->
                </div>
                <div class="info-row info-row-single">
                  <div class="info-item">
                    <span class="info-label">合作公司：</span>
                    <span class="info-value">{{
                      itemInfo.companyName || "暂无"
                    }}</span>
                  </div>
                </div>
                <div class="info-row info-row-single">
                  <div class="info-item">
                    <span class="info-label">地址：</span>
                    <span class="info-value">{{
                      itemInfo.routeArea || "暂无"
                    }}</span>
                  </div>
                </div>
              </div>

              <!-- 操作按钮 - 适配禁飞区样式 -->
              <div style="display: flex; justify-content: end; margin-top: 6px">
                <div>
                  <span
                    :class="
                      itemInfo.id === activeRouteId
                        ? 'routeOperation-box-foldUp'
                        : 'routeOperation-box-view'
                    "
                    @click="
                      itemInfo.id === activeRouteId
                        ? retractRoute()
                        : viewRoute(itemInfo)
                    "
                  >
                    {{ itemInfo.id === activeRouteId ? "收起" : "查看" }}
                  </span>
                  <span
                    class="routeOperation-box-edit"
                    @click="downloadRoute(itemInfo)"
                  >
                    下载
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- 无数据时的空状态展示 -->
      <div v-else class="empty-state">
        <el-empty description="暂无航线数据" />
      </div>
    </div>

    <!-- 分页：保持原有结构，适配禁飞区样式 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[5, 10, 20, 30, 50]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { debounce } from "lodash";
import { flightRouteList, downloadFlightRoute } from "@/api/flightRoute";
import { companyPartnerCompanyMap } from "@/api/company";

// Props
const props = defineProps({
  map: {
    type: Object,
    required: true,
  },
  noFlyZoneManagerRef: {
    type: Object,
    required: true,
  },
});

// Emits
const emit = defineEmits([
  "route-view",
  "route-retract",
  "route-edit",
  "route-delete",
  "waypoint-edit",
  "route-save",
]);

// ===== 公司下拉选项 =====
const companyOptions = ref([]); // 公司下拉数据源
// 状态变量：搜索关键字独立维护
const searchKeyword = ref(""); // 航线名称（输入框）
const searchRouteArea = ref(""); // 城市（输入框）
const searchCompanyId = ref(""); // 公司ID（下拉框绑定值，空为未选择）
const routeInfo = ref([]);
const displayedRoutes = ref([]); // 用于判断是否有数据
const currentPage = ref(1);
const pageSize = ref(5);
const total = ref(0);
const activeRouteId = ref(null);
const waypointSettingVisible = ref(false);
const saveRouteDialogVisible = ref(false);
const formData = ref({
  heading_angle: {
    mode: "",
    angle: "",
    lon: "",
    lat: "",
  },
});
const saveRouteForm = ref({
  name: "",
  description: "",
  points: [],
  waypointStrategy: "",
});

// 工具函数：原有方法不变
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

function getDistanceBetweenTwoPoints(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δφ = toRadians(lat2 - lat1);
  const Δλ = toRadians(lng2 - lng1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c * 1000) / 1000;
}

const calculateTotalDistance = (points) => {
  let totalDistance = 0;

  for (let i = 0; i < points?.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const distance = getDistanceBetweenTwoPoints(
      p1.lat,
      p1.lng,
      p2.lat,
      p2.lng,
    );
    totalDistance += distance;
  }

  return {
    total: Math.round(totalDistance * 1000) / 1000,
  };
};

const convertItem = (item) => {
  const pointsObj = JSON.parse(item.pointsJson);

  const convertedPoints = pointsObj?.routeData?.points.map((point) => ({
    lat: point.lat,
    lng: point.lon,
    alt: point.alt,
    action: point.action,
    headingAngle: {
      mode: point.heading_angle?.mode || "",
      angle: point.heading_angle?.angle || "",
      lon: point.heading_angle?.lon || "",
      lat: point.heading_angle?.lat || "",
    },
    heightStrategy: point.height_strategy,
    residenceTime: point.residence_time,
    routeLossBehavior: point.route_loss_behavior,
    velocity: point.velocity,
    priority: point.priority,
    sort: point.sort,
  }));

  return {
    name: item.name,
    description: item.description,
    id: item.id,
    points: convertedPoints,
    companyId: item.companyId,
    companyName: item.companyName,
    routeArea: item.routeArea,
  };
};

// 获取公司列表：初始化加载下拉框数据源
const fetchCompanyList = async () => {
  try {
    const res = await companyPartnerCompanyMap();
    if (res.code === 200) {
      // 转换为el-select所需的value/label格式
      companyOptions.value = res.data.map((item) => ({
        value: item.cid, // 绑定值为公司ID
        label: item.cname, // 显示值为公司名称
      }));
    } else {
      ElMessage.error("获取公司列表失败：" + res.message);
    }
  } catch (error) {
    console.error("获取公司列表失败:", error);
    ElMessage.error("加载公司列表失败，请刷新页面重试");
  }
};

// 核心：多条件搜索的列表请求方法（适配公司下拉框的ID值）
const routeList = async () => {
  try {
    // 组装3个搜索条件，公司ID直接传值（空则不过滤）
    const searchParams = {
      name: searchKeyword.value.trim(), // 航线名称
      routeArea: searchRouteArea.value.trim(), // 城市
      companyId: searchCompanyId.value, // 公司ID（下拉框绑定值，无需trim）
      pageNum: currentPage.value, // 注意：接口参数为pageNum，原代码currentPage需对应
      pageSize: pageSize.value,
    };
    // 调用接口，传递多条件参数
    const res = await flightRouteList(searchParams);
    console.log("航线列表接口返回数据：", res);
    if (res.code === 200) {
      // 兼容不同的数据结构
      const dataList = res.data?.list || res.data?.records || res.data || [];
      const totalCount = res.data?.total || res.data?.count || 0;

      if (!Array.isArray(dataList) || dataList.length === 0) {
        routeInfo.value = [[]];
        displayedRoutes.value = [];
        total.value = 0;
        console.log("航线列表为空");
        return;
      }

      let newRouteInfo = [dataList.map(convertItem)];
      total.value = totalCount;
      displayedRoutes.value = dataList; // 更新显示的路由数据

      // 计算每条航线的总距离
      newRouteInfo[0].forEach((item) => {
        const result = calculateTotalDistance(item.points);
        item.totalDistance = result.total;
      });
      routeInfo.value = newRouteInfo;

      // 保留激活航线的自动重绘逻辑
      if (activeRouteId.value) {
        const activeRoute = newRouteInfo[0].find(
          (item) => item.id === activeRouteId.value,
        );
        if (activeRoute) {
          setTimeout(() => viewRoute(activeRoute), 300);
        }
      }
    } else {
      ElMessage.error(res.message || "获取航线列表失败");
    }
  } catch (error) {
    console.error("获取航线列表失败：", error);
    ElMessage.error("加载航线列表失败，请刷新重试");
  }
};

// 防抖搜索方法：输入/选择后触发，重置为第1页
const handleSearchInput = debounce(() => {
  currentPage.value = 1; // 搜索/选择后回到第1页，符合通用交互
  routeList();
}, 500);

// 分页方法：带当前搜索条件翻页
const handleSizeChange = (val) => {
  pageSize.value = val;
  routeList();
};
const handleCurrentChange = (val) => {
  currentPage.value = val;
  routeList();
};

// 原有业务方法：均保持不变
const viewRoute = (route) => {
  emit("route-view", route);
  activeRouteId.value = route.id;
};
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
const retractRoute = () => {
  emit("route-retract");
  activeRouteId.value = null;
};
const getRealNoFlyZoneManager = () => {
  const propValue = props.noFlyZoneManagerRef;
  if (propValue && typeof propValue === "object" && "value" in propValue) {
    return propValue.value;
  } else if (
    propValue &&
    typeof propValue === "object" &&
    "isPointInNoFlyZone" in propValue
  ) {
    return propValue;
  }
  return null;
};

// 监听器和生命周期：原有逻辑不变，初始化加载公司列表
watch(waypointSettingVisible, (newValue) => {
  if (!newValue) {
    formData.value = {
      heading_angle: {
        mode: "",
        angle: "",
        lon: "",
        lat: "",
      },
    };
  }
});
watch(saveRouteDialogVisible, (newValue) => {
  if (!newValue) {
    saveRouteForm.value = {
      name: "",
      description: "",
      points: [],
    };
  }
});
onMounted(() => {
  const manager = getRealNoFlyZoneManager();
  console.log("真正的禁飞区管理器实例：", manager);
  console.log("是否有isPointInNoFlyZone方法：", !!manager?.isPointInNoFlyZone);
  fetchCompanyList(); // 初始化加载公司下拉数据
  routeList(); // 初始化加载航线列表
});

// 暴露方法：原有逻辑不变
defineExpose({
  routeList,
  retractRoute,
});
</script>

<style scoped>
/* 完全替换为禁飞区的样式体系 */
.route-list-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  color: #fff;
  box-sizing: border-box;
  padding: 8px;
}

/* 搜索区域：适配禁飞区样式，保留三个搜索项的布局 */
.route-search {
  margin-bottom: 12px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}
.route-search :deep(.el-input),
.route-search :deep(.el-select) {
  flex: 1;
  min-width: 200px;
  height: 40px;
}
:deep(.route-search .el-input__wrapper),
:deep(.route-search .el-select__wrapper) {
  background-color: #2e3649db;
  border: none;
}
:deep(.route-search .el-input__inner),
:deep(.route-search .el-select__placeholder) {
  color: #fff;
}
:deep(.route-search .el-select__icon) {
  color: rgba(255, 255, 255, 0.7);
}

/* 列表区域 */
.route-list-content {
  flex: 1;
  overflow-y: auto;
  padding-right: 6px;
}
/* 自定义滚动条 */
.route-list-content::-webkit-scrollbar {
  width: 6px;
}
.route-list-content::-webkit-scrollbar-track {
  background: rgba(80, 80, 80, 0.1);
  border-radius: 3px;
}
.route-list-content::-webkit-scrollbar-thumb {
  background: rgba(88, 130, 179, 0.5);
  border-radius: 3px;
}
.route-list-content::-webkit-scrollbar-thumb:hover {
  background: rgba(88, 130, 179, 0.8);
}

/* 空状态样式 */
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  padding: 40px 20px;
}
.empty-state :deep(.el-empty) {
  --el-empty-padding: 0;
}
.empty-state :deep(.el-empty__description) {
  color: rgba(255, 255, 255, 0.5);
}

/* 分页容器 */
.pagination-container {
  margin-top: 10px;
}

/* 航线卡片样式（完全复用禁飞区卡片） */
.routeOperation {
  background-color: #2e3649db;
  color: #fff;
  margin-bottom: 12px;
  padding: 16px 12px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
}
.routeOperation-box {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 标题区域 */
.tooltip-container {
  position: relative;
  display: block;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
}
.truncated-text {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  display: block;
}

/* 核心信息区域（适配禁飞区的zone-info样式） */
.zone-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}
.info-row {
  display: flex;
  align-items: center;
  gap: 0;
}
.info-row-between {
  justify-content: space-between;
}
.info-row-between .info-item {
  flex: 0 1 auto;
}
.info-row-single {
  justify-content: flex-start;
}
.info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}
.info-label {
  font-size: 14px;
  flex-shrink: 0;
  opacity: 0.8;
}
.info-value {
  color: #cbd5e1;
  font-size: 13px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 操作按钮样式（完全复用禁飞区） */
.routeOperation-box-view {
  color: #7db164;
  cursor: pointer;
  margin-right: 12px;
}
.routeOperation-box-foldUp {
  color: rgb(255 255 255 / 34%);
  cursor: pointer;
  margin-right: 12px;
}
.routeOperation-box-edit {
  color: #1677ff;
  cursor: pointer;
  margin-right: 12px;
}

/* Element Plus 样式穿透（完全复用禁飞区） */
:deep(.el-pagination) {
  justify-content: left !important;
  overflow-x: scroll;
  margin-top: 10px;
  background: #2e3649db;
  padding: 12px 8px 8px !important;
  border-radius: 12px 12px 0 0;
}
:deep(.el-pagination__classifier) {
  color: #fff;
}
:deep(.el-select__wrapper) {
  margin: 6px 0 0 0;
}
:deep(.el-pagination .el-select__wrapper),
:deep(.el-pagination .btn-prev),
:deep(.el-pager li),
:deep(.el-pagination button),
:deep(.el-input__wrapper) {
  background: none;
}
:deep(.el-pager li.is-active, .el-pager li:hover) {
  color: #409eff;
}
:deep(.el-pagination > .is-first),
:deep(.el-pagination > .is-last),
:deep(.el-pagination .el-select__placeholder),
:deep(.el-pagination > .el-icon svg),
:deep(.el-pager li),
:deep(.el-pagination .el-input__inner),
:deep(.el-pagination button) {
  color: #fff;
}

/* 响应式适配（完全复用禁飞区） */
@media screen and (max-width: 800px) {
  .tooltip-container {
    width: 65%;
  }
  .zone-info {
    gap: 6px;
    padding: 8px;
  }
  .info-row {
    gap: 0;
  }
  .info-item {
    font-size: 12px;
  }
  .info-label {
    font-size: 12px;
  }
  .info-value {
    font-size: 11px;
  }
  .routeOperation-box-view,
  .routeOperation-box-foldUp,
  .routeOperation-box-edit {
    font-size: 0;
    width: 20px;
    text-align: center;
    margin-right: 8px;
  }
  .routeOperation-box-view::after {
    content: "查";
    font-size: 16px;
  }
  .routeOperation-box-foldUp::after {
    content: "收";
    font-size: 16px;
  }
  .routeOperation-box-edit::after {
    content: "下";
    font-size: 16px;
  }
}
</style>
