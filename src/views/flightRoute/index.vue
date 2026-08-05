<template>
  <div class="demo-container">
    <!-- 主要内容区 -->
    <div class="main-content">
      <!-- 地图容器 -->
      <div class="map-container">
        <div ref="mapContainer" class="map-wrapper">
          <!-- 加载中遮罩 -->
          <div v-if="loading" class="loading-mask">
            <el-spin size="large">加载中...</el-spin>
          </div>
        </div>
        <!-- 左侧控制面板，浮动在地图上层   -->
        <div class="floating-panel left-panel" v-show="!isPanelCollapsed">
          <el-card
            class="control-card"
            style="background-color: #00285a80; height: 100%"
          >
            <div style="height: calc(100% - 30px)">
              <!-- 引入航线列表组件 -->
              <RouteList
                ref="routeListRef"
                :map="map"
                :no-fly-zone-manager-ref="noFlyZoneManagerRef"
                @route-view="handleRouteView"
                @route-retract="handleRouteRetract"
                @route-edit="handleRouteEdit"
                @route-delete="handleRouteDelete"
                @waypoint-edit="handleWaypointEdit"
                @route-save="handleRouteSave"
              />
            </div>
          </el-card>
        </div>
      </div>

      <!-- 面板收起/展开按钮 -->
      <div
        style="
          position: absolute;
          top: 18px;
          left: 22px;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: flex-end;
        "
      >
        <div
          style="
            background: #fff;
            border-radius: 50%;
            width: 26px;
            height: 26px;
            display: flex;
            justify-content: center;
            align-items: center;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            transition: all 0.3s ease;
          "
          @click="togglePanel"
        >
          <el-icon :style="{ color: '#409eff !important' }">
            <Fold v-if="!isPanelCollapsed" />
            <Expand v-else />
          </el-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, inject } from "vue";
import { ElMessage } from "element-plus";
import { Fold, Expand } from "@element-plus/icons-vue";
import { debounce } from "lodash";
import RouteList from "./components/gisDome/RouteList.vue";
import { gcj02towgs84 } from "@/utils/coordTransform";

// 注入父组件提供的上下文
const collapseContext = inject("collapseContext", {
  isCollapse: ref(false),
});
const { isCollapse } = collapseContext;

// 状态变量
const mapContainer = ref(null);
const currentPosition = ref(null);
let map = ref(null);
const loading = ref(true);

// 绘制相关状态
const isDrawing = ref(false);
const drawnPoints = ref([]);
let drawingLine = null;
let drawingClickHandler = null;
const geocoder = ref(null);
const options = ref([]);

// 保存路线相关
const saveRouteDialogVisible = ref(false);
const saveRouteForm = ref({
  name: "",
  description: "",
  points: [],
  waypointStrategy: "",
});
// 路线查看功能
const activeRouteId = ref(null);
const currentRoutePolyline = ref(null);
const newArr = ref([]);
// 面板控制
const isPanelCollapsed = ref(false);
// 禁飞区相关
const noFlyZoneManagerRef = ref(null);
const isNoFlyZoneManagerMounted = ref(false);
let trackPolyline = null;
let noFlyZonesLayer = null;

// 面板控制
const togglePanel = () => {
  isPanelCollapsed.value = !isPanelCollapsed.value;
  ElMessage.success(isPanelCollapsed.value ? "面板已收起" : "面板已展开");
};
// 地图初始化
const initMap = () => {
  if (!window.T) {
    ElMessage.error("天地图API未加载，请检查网络连接");
    loading.value = false;
    return;
  }

  try {
    map = new T.Map(mapContainer.value);
    const TIANDITU_KEY = "0c09d0cbd8da28e0f79cfc1627c23fd4";

    map.addEventListener("load", () => {
      loading.value = false;
      map.checkResize();
      ElMessage.success("地图加载成功");
      geocoder.value = new T.Geocoder();
      initNoFlyZones();
      map.addEventListener("zoomend", handleMapZoom);
    });

    map.addEventListener("error", (e) => {
      console.error("地图加载错误:", e);
      loading.value = false;
      ElMessage.error("地图加载失败，请刷新页面重试");
    });

    const defaultLng = 113.65644;
    const defaultLat = 34.78723;
    map.centerAndZoom(new T.LngLat(defaultLng, defaultLat), 15);

    const layer = new T.TileLayer("img_w", {
      zIndex: 1,
      token: TIANDITU_KEY,
    });
    map.addLayer(layer);

    map.addControl(new T.Control.MapType());
    map.addControl(new T.Control.Scale());
    map.setMapType(TMAP_HYBRID_MAP);

    trackPolyline = new T.Polyline([], {
      color: "#2C64A7",
      weight: 4,
      opacity: 0.8,
      lineStyle: "solid",
    });
    map.addOverLay(trackPolyline);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lng = position.coords.longitude;
          const lat = position.coords.latitude;
          map.centerAndZoom(new T.LngLat(lng, lat), 15);
        },
        (err) => {
          console.warn("定位失败:", err);
          switch (err.code) {
            case 1:
              ElMessage.warning("请授予位置权限，否则无法获取当前位置");
              break;
            case 2:
              ElMessage.warning("无法获取位置信息，请检查网络或稍后重试");
              break;
            case 3:
              ElMessage.warning("获取位置超时，请重试");
              break;
            default:
              ElMessage.error("获取位置失败，请稍后再试");
          }
        },
      );
    }
  } catch (error) {
    console.error("地图初始化失败:", error);
    loading.value = false;
    ElMessage.error("地图初始化失败，请检查配置");
  }
};

const handleMapZoom = () => {
  if (map && typeof map.checkResize === "function") {
    setTimeout(() => {
      map.checkResize();
      if (currentPosition.value) {
        map.panTo(
          new T.LngLat(currentPosition.value.lng, currentPosition.value.lat),
        );
      }
    }, 300);
  }
};

// 航线列表组件事件处理
const handleRouteView = (route) => {
  viewRoute(route);
};

const handleRouteRetract = () => {
  retractRoute();
};

const handleRouteEdit = (route) => {
  console.log("编辑航线:", route);
};

const handleRouteDelete = (route) => {
  console.log("删除航线:", route);
};

const handleWaypointEdit = (data) => {
  console.log("编辑航点:", data);
};

const handleRouteSave = () => {
  console.log("航线保存");
};

const debounceUpdatePolyline = debounce((polyline, newPath) => {
  if (polyline) {
    polyline.setLngLats(newPath);
  }
}, 10);

const viewRoute = (route) => {
  console.log("viewRoute", route);
  if (!map) {
    ElMessage.error("地图未初始化，无法查看路线");
    return;
  }
  try {
    clearRouteOverlaysOnly();
    currentRoutePolyline.value = null;
    activeRouteId.value = route.id;

    if (!route?.points || route.points.length < 2) {
      ElMessage.warning("路线点数量不足，无法显示");
      return;
    }

    const path = route.points.map((p) => new T.LngLat(p.lng, p.lat));
    const polyline = new T.Polyline(path, {
      color: "#2c64a7",
      weight: 4,
      opacity: 0.8,
      lineStyle: "solid",
    });
    polyline._isRouteOverlay = true;
    polyline._isRoutePolyline = true;
    map.addOverLay(polyline);
    currentRoutePolyline.value = polyline;

    route.points.forEach((point, index) => {
      const markerId = `marker-${route.id}-${index}`;
      const marker = addDraggablePointMarker(
        point,
        index,
        route.points.length,
        markerId,
      );

      marker.addEventListener("dragstart", () => {
        const iconElement = document.getElementById(markerId);
        if (iconElement) {
          iconElement.style.transform = "scale(1.2)";
          iconElement.style.transition = "transform 0.2s";
          iconElement.style.zIndex = "100";
        }
      });

      marker.addEventListener("drag", () => {
        const newLngLat = marker.getLngLat();
        const pointIndex = marker.pointIndex;
        route.points[pointIndex].lng = newLngLat.lng;
        route.points[pointIndex].lat = newLngLat.lat;
        const newPath = route.points.map((p) => new T.LngLat(p.lng, p.lat));
        debounceUpdatePolyline(currentRoutePolyline.value, newPath);
      });

      marker.addEventListener("dragend", () => {
        const iconElement = document.getElementById(markerId);
        if (iconElement) {
          iconElement.style.transform = "scale(1)";
          iconElement.style.zIndex = "1";
        }

        const newLngLat = marker.getLngLat();
        const pointIndex = marker.pointIndex;

        // 校验新位置是否在禁飞区
        const isPointInNoFlyZone =
          noFlyZoneManagerRef.value?.isPointInNoFlyZone({
            lng: newLngLat.lng,
            lat: newLngLat.lat,
          });
        if (isPointInNoFlyZone) {
          ElMessage.error("航点不能放置在禁飞区内，已恢复原位置");
          // 恢复原位置
          route.points[pointIndex].lng = marker.originalLng;
          route.points[pointIndex].lat = marker.originalLat;
          marker.setLngLat(
            new T.LngLat(marker.originalLng, marker.originalLat),
          );
          const newPath = route.points.map((p) => new T.LngLat(p.lng, p.lat));
          debounceUpdatePolyline(currentRoutePolyline.value, newPath);
          return;
        }

        // 校验拖拽后的路线是否穿越禁飞区
        const isCrossingNoFlyZone =
          noFlyZoneManagerRef.value?.isRouteCrossingNoFlyZone(route.points);
        if (isCrossingNoFlyZone) {
          ElMessage.error("拖拽后航线穿越禁飞区，已恢复原位置");
          // 恢复原位置
          route.points[pointIndex].lng = marker.originalLng;
          route.points[pointIndex].lat = marker.originalLat;
          marker.setLngLat(
            new T.LngLat(marker.originalLng, marker.originalLat),
          );
          const newPath = route.points.map((p) => new T.LngLat(p.lng, p.lat));
          debounceUpdatePolyline(currentRoutePolyline.value, newPath);
          return;
        }

        // 校验是否穿越警告区（仅提示）
        const isCrossingWarningZone =
          noFlyZoneManagerRef.value?.isRouteCrossingWarningZone(route.points);
        if (isCrossingWarningZone) {
          ElMessage.warning("注意：拖拽后航线经过警告区域，请注意飞行安全");
        }

        // 记录新位置
        route.points[pointIndex].lng = newLngLat.lng;
        route.points[pointIndex].lat = newLngLat.lat;

        ElMessage.success(`航点 ${pointIndex + 1} 已更新：
    经度 ${newLngLat.lng.toFixed(6)},
    纬度 ${newLngLat.lat.toFixed(6)}`);
      });
    });

    let minLng = Infinity,
      minLat = Infinity;
    let maxLng = -Infinity,
      maxLat = -Infinity;
    path.forEach((lnglat) => {
      minLng = Math.min(minLng, lnglat.lng);
      minLat = Math.min(minLat, lnglat.lat);
      maxLng = Math.max(maxLng, lnglat.lng);
      maxLat = Math.max(maxLat, lnglat.lat);
    });

    const centerLng = (minLng + maxLng) / 2;
    const centerLat = (minLat + maxLat) / 2;
    const centerPoint = new T.LngLat(centerLng, centerLat);

    const mapContainerEl = document.getElementById("mapContainer");
    const aspectRatio = mapContainerEl
      ? mapContainerEl.clientWidth / mapContainerEl.clientHeight
      : 1.6;

    const baseBuffer = 0.01;
    const lngDiff = maxLng - minLng;
    const latDiff = maxLat - minLat;
    const buffer = Math.max(baseBuffer, Math.min(lngDiff * 0.1, latDiff * 0.1));

    const getZoomByBounds = (lngDiff, latDiff, aspectRatio) => {
      const adjustedLngDiff = lngDiff * aspectRatio;
      const effectiveDiff = Math.max(adjustedLngDiff, latDiff);

      const zoomLevels = [
        { max: 1000, level: 1 },
        { max: 500, level: 2 },
        { max: 200, level: 3 },
        { max: 100, level: 4 },
        { max: 50, level: 5 },
        { max: 20, level: 6 },
        { max: 10, level: 7 },
        { max: 5, level: 8 },
        { max: 2, level: 9 },
        { max: 1, level: 10 },
        { max: 0.5, level: 11 },
        { max: 0.2, level: 12 },
        { max: 0.1, level: 13 },
        { max: 0.05, level: 14 },
        { max: 0.02, level: 15 },
        { max: 0.01, level: 16 },
        { max: 0.005, level: 17 },
        { max: 0, level: 18 },
      ];

      for (const { max, level } of zoomLevels) {
        if (effectiveDiff > max) {
          return level;
        }
      }
      return 18;
    };

    const zoomLevel = getZoomByBounds(
      maxLng + buffer - (minLng - buffer),
      maxLat + buffer - (minLat - buffer),
      aspectRatio,
    );
    const safeZoomLevel = Math.max(1, Math.min(18, zoomLevel));

    map.panTo(centerPoint);
    map.setZoom(safeZoomLevel);
    map.checkResize();

    ElMessage.success(
      `已显示路线: ${route.name}（缩放级别: ${safeZoomLevel}）\n航点支持拖拽调整位置`,
    );
  } catch (error) {
    console.error("查看路线时发生错误:", error);
    ElMessage.error("查看路线失败，请重试");
  }
};

const addDraggablePointMarker = (point, index, totalPoints, markerId) => {
  const isStart = index === 0;
  const isEnd = index === totalPoints - 1;
  const markerStyle = isStart ? "start" : isEnd ? "end" : "middle";
  const markerLabel = isStart ? "S" : isEnd ? "E" : (index + 1).toString();

  const markerHtml = `<div id="${markerId}" class="marker ${markerStyle}">${markerLabel}</div>`;

  const marker = new T.Marker(new T.LngLat(point.lng, point.lat), {
    icon: new T.DivIcon({
      html: markerHtml,
      iconSize: new T.Point(40, 40),
      iconAnchor: new T.Point(20, 20),
    }),
    draggable: true,
  });

  // 记录原始位置和索引
  marker.originalLng = point.lng;
  marker.originalLat = point.lat;
  marker.pointIndex = index;
  marker.isRouteMarker = true;

  if (!document.getElementById("route-markers-style")) {
    const style = document.createElement("style");
    style.id = "route-markers-style";
    style.innerHTML = `
      .marker {
        width: 26px;
        height: 26px;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        color: white;
        font-weight: bold;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        font-size: 16px;
        z-index: 10;
      }
      .start { background-color: #7db164;}
      .end { background-color: #f56c6c; }
      .middle { background-color: #909399; }
    `;
    document.head.appendChild(style);
  }
  map.addOverLay(marker);

  return marker;
};
const retractRoute = () => {
  console.log("收起航线，清除地图展示");
  activeRouteId.value = null;
  clearRouteOverlaysOnly();

  if (map) {
    const overlays = map.getOverlays();
    overlays.forEach((overlay) => {
      if (
        overlay instanceof T.Marker &&
        overlay.getLngLat &&
        !overlay._isNoFlyZone
      ) {
        const icon = overlay.getIcon && overlay.getIcon();
        if (
          icon &&
          (icon.html?.includes("marker") ||
            icon.html?.includes("start") ||
            icon.html?.includes("end") ||
            icon.html?.includes("middle"))
        ) {
          map.removeOverLay(overlay);
        }
      }
    });
  }

  currentRoutePolyline.value = null;
  ElMessage.success("航线已收起");
};

// 清除覆盖物函数
const clearRouteOverlaysOnly = () => {
  if (!map) return;

  const overlays = map.getOverlays();
  console.log("开始清除航线覆盖物，总数:", overlays.length);

  overlays.forEach((overlay, index) => {
    if (
      overlay.isRouteMarker ||
      overlay._isRouteOverlay ||
      overlay._isRoutePolyline ||
      overlay._isRoutePoint
    ) {
      console.log(`移除航线覆盖物 ${index}:`, overlay);
      map.removeOverLay(overlay);
    }
  });

  if (drawingLine) {
    map.removeOverLay(drawingLine);
    drawingLine = null;
  }

  currentRoutePolyline.value = null;
  console.log("航线覆盖物清除完成");
};

const clearOverlays = () => {
  if (map) {
    const overlays = map.getOverlays();
    overlays.forEach((overlay) => {
      if (overlay._zoneId || overlay._isNoFlyZone) {
        return;
      }
      if (overlay.isRouteMarker || overlay._isRouteOverlay) {
        map.removeOverLay(overlay);
      }
    });

    if (drawingLine) {
      map.removeOverLay(drawingLine);
      drawingLine = null;
    }

    currentRoutePolyline.value = null;
  }
};

// 搜索功能
const debouncedSearch = debounce((keyword) => {
  if (keyword && keyword.length >= 1) {
    searchLocation(keyword);
  } else {
    options.value = [];
  }
}, 500);

const getCurrentPosition = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error("浏览器不支持地理位置API"));
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        resolve({ latitude, longitude });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error("用户拒绝了位置请求"));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error("位置信息不可用"));
            break;
          case error.TIMEOUT:
            reject(new Error("获取位置超时"));
            break;
          default:
            reject(new Error("未知错误"));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  });
};

const searchLocation = async (keyword) => {
  const safeKeyword = String(keyword).trim();
  if (!safeKeyword) {
    options.value = [];
    return;
  }

  try {
    let position;
    try {
      position = await getCurrentPosition();
    } catch (err) {
      ElMessage.warning(`定位失败，使用默认位置: ${err.message}`);
      position = { latitude: 34.74769, longitude: 113.65337 };
    }

    const url = `https://digital-elevation.djigate.com/amap-proxy/e9faf6/v3/assistant/inputtips?keywords=${safeKeyword}&location=${position.longitude},${position.latitude}&language=zh-CN`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.tips || data.tips.length === 0) {
      ElMessage.info("未找到匹配地点");
      options.value = [];
      return;
    }

    const validTips = data.tips.filter((item) => {
      return typeof item.location === "string" && item.location.trim() !== "";
    });

    if (validTips.length === 0) {
      ElMessage.warning("未找到有效的地点坐标");
      options.value = [];
      return;
    }

    options.value = validTips.map((item) => {
      const [gcjLng, gcjLat] = item?.location?.split(",").map(Number);
      const [wgsLng, wgsLat] = gcj02towgs84(gcjLng, gcjLat);

      return {
        value: item.id,
        label: item.name,
        location: `${wgsLng},${wgsLat}`,
        originalLocation: item.location,
      };
    });
  } catch (error) {
    console.error("搜索错误:", error);
  }
};

const initNoFlyZones = () => {
  noFlyZonesLayer = new T.LayerGroup();
  map.addLayer(noFlyZonesLayer);
};

watch(saveRouteDialogVisible, (newValue) => {
  if (!newValue) {
    if (newValue === false) {
      isDrawing.value = false;
      map.removeEventListener("click", drawingClickHandler);
      drawingClickHandler = null;
      clearOverlays();
      drawnPoints.value = [];
      activeRouteId.value = null;
    }
    saveRouteForm.value = {
      name: "",
      description: "",
      points: [],
    };
  }
});

watch(
  isCollapse,
  (newVal) => {
    if (map && typeof map.checkResize === "function") {
      setTimeout(() => {
        map.checkResize();
        if (currentPosition.value) {
          map.panTo(
            new T.LngLat(currentPosition.value.lng, currentPosition.value.lat),
          );
        }
      }, 300);
    }
  },
  { immediate: true },
);
// 监听 NoFlyZoneManager 挂载完成
watch(noFlyZoneManagerRef, (newVal) => {
  if (newVal) {
    isNoFlyZoneManagerMounted.value = true;
    console.log("NoFlyZoneManager 已挂载");
  }
});
// 初始化
onMounted(async () => {
  initMap();
  //去掉父级继承的padding
  const pageContent = document.querySelector(".page-content");
  if (pageContent) {
    pageContent.classList.add("current-page-no-padding");
  }
});

onBeforeUnmount(() => {
  const pageContent = document.querySelector(".page-content");
  if (pageContent) {
    pageContent.classList.remove("current-page-no-padding");
  }

  if (map) {
    map.removeEventListener("zoomend", handleMapZoom);
  }

  try {
    if (drawingLine) {
      map.removeOverLay(drawingLine);
      drawingLine = null;
    }

    if (map) {
      const overlays = map.getOverlays();
      overlays.forEach((overlay) => {
        map.removeOverLay(overlay);
      });
    }

    if (map) {
      // map.removeEventListener("click", handleMapClick);
      map.removeEventListener("load");
      map.removeEventListener("error");
    }

    if (map) {
      map = null;
    }

    isDrawing.value = false;
    loading.value = false;
    currentPosition.value = null;
    drawnPoints.value = [];
  } catch (error) {
    console.error("清理资源失败:", error);
  }

  if (map) {
    map.removeEventListener("load", () => {});
    map.removeEventListener("error", () => {});
    if (drawingClickHandler) {
      map.removeEventListener("click", drawingClickHandler);
    }
    map = null;
  }
  drawingLine = null;
});
</script>

<style scoped>
/* 新增样式 - 优化定位逻辑 */
.panel-header {
  position: relative;
  /* 为定位提供参考坐标系 */
}

/* 响应式调整 - 确保不同屏幕下的位置一致性 */
@media (max-width: 1200px) {
  .floating-panel {
    width: 320px;
  }

  /* 按钮位置微调 */
  .update-button-position {
    left: calc(50% - 180px);
    /* 根据面板宽度调整 */
  }
}

@media (max-width: 1000px) {
  .floating-panel {
    width: 300px;
  }

  .update-button-position {
    left: calc(50% - 170px);
  }
}

@media (max-width: 800px) {
  .floating-panel {
    width: 280px;
  }

  .update-button-position {
    left: calc(50% - 160px);
  }
}

.demo-container {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
  overflow: hidden;
  position: relative;
}

.header {
  padding: 16px 24px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h2 {
  margin: 0;
  color: #303133;
  font-weight: 600;
}

.main-content {
  flex: 1;
  position: relative;
  min-height: 0;
  overflow: hidden;
}

.map-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.map-wrapper {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;
}

/* 浮动面板样式 */
.floating-panel {
  position: absolute;
  /* top: 5px;
  left: 5px; */
  z-index: 1000;
  width: 360px;
  /* max-height: calc(100vh - 65px); */
  height: 100%;
  /* overflow-y: auto; */
  /* background: transparent; */
}

/* 航线列表滚动容器 */
.route-list-container {
  /* 限定高度（根据面板高度调整，预留上方操作区域空间） */
  /* max-height: calc(100vh - 260px); */
  /* 减去顶部操作区和面板边框的高度 */
  overflow-y: auto;
  /* 仅在内容超出时显示垂直滚动条 */
  padding-right: 6px;
  padding-top: 30px;
  /* 避免滚动条遮挡内容 */
}

/* 美化滚动条样式 */
.route-list-container::-webkit-scrollbar {
  width: 6px;
  /* 滚动条宽度 */
}

.route-list-container::-webkit-scrollbar-track {
  background: rgba(80, 80, 80, 0.1);
  /* 滚动条轨道颜色 */
  border-radius: 3px;
}

.route-list-container::-webkit-scrollbar-thumb {
  background: rgba(88, 130, 179, 0.5);
  /* 滚动条滑块颜色 */
  border-radius: 3px;
}

.route-list-container::-webkit-scrollbar-thumb:hover {
  background: rgba(88, 130, 179, 0.8);
  /* 滚动条滑块 hover 颜色 */
}

.el-pagination {
  justify-content: left !important;
  overflow-x: scroll;
  margin-top: 10px;
  background: #2e3649db;
  padding: 12px 8px 8px !important;
  border-radius: 12px 12px 0 0;
  /* scrollbar-color: rgb(88, 130, 179) rgba(80, 80, 80, 0.4); */
}

/* 美化滚动条样式 */
.el-pagination::-webkit-scrollbar {
  width: 4px;
  height: 6px;
  /* 滚动条宽度 */
}

.el-pagination::-webkit-scrollbar-track {
  background: rgba(80, 80, 80, 0.1);
  /* 滚动条轨道颜色 */
  border-radius: 3px;
}

.el-pagination::-webkit-scrollbar-thumb {
  background: rgba(88, 130, 179, 0.5);
  /* 滚动条滑块颜色 */
  border-radius: 3px;
}

.el-pagination::-webkit-scrollbar-thumb:hover {
  background: rgba(88, 130, 179, 0.8);
  /* 滚动条滑块 hover 颜色 */
}

:depp(.el-pagination__classifier) {
  color: #fff;
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
:deep(.el-card__body) {
  height: calc(100% - 40px);
}
.pagination .control-btn {
  height: 32px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 4px;
  transition: all 0.3s ease;
  margin: 0;
  background: #2c3d45;
  color: #fff;
  /* border: none; */
}

.control-btn.emergency {
  margin-top: 12px;
  grid-column: span 2;
  height: 32px;
  background: #2c3d45;
  width: 100%;
  color: #fff;
}

.control-card {
  background: rgba(255, 255, 255, 0.95);
  /* backdrop-filter: blur(10px); */
  /* border-radius: 8px; */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.control-card:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.routeOperation {
  background-color: #2e3649db;
  color: #fff;
  margin-bottom: 12px;
  padding: 16px 8px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
}

.routeOperation-box {
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  width: 100%;
}

.tooltip-container {
  position: relative;
  display: inline-block;
}

.truncated-text {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  display: block;
  cursor: pointer;
}

.tooltip-text {
  position: absolute;
  top: 100%;
  left: 0;
  background: #333;
  color: #fff;
  padding: 5px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: normal;
  width: 200px;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s;
  z-index: 10;
  text-align: center;
}

.tooltip-container:hover .tooltip-text {
  opacity: 1;
  visibility: visible;
}

.routeOperation-box-view {
  color: #7db164;
  cursor: pointer;
  margin-right: 6px;
}
.routeOperation-box-foldUp {
  color: rgb(255 255 255 / 34%);
  cursor: pointer;
  margin-right: 6px;
}
.routeOperation-box-edit {
  color: #1677ff;
  cursor: pointer;
  margin-right: 6px;
}

.routeOperation-box-delete {
  color: red;
  cursor: pointer;
}

.routeInformation {
  max-height: 200px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgb(88 130 179) rgba(80, 80, 80, 0.4);
  margin-top: 16px;
}

.routeInformation-list {
  display: flex;
  justify-content: space-between;
  background-color: #50505066;
  padding: 12px;
  margin-top: 16px;
}

.routeInformation-list:first-child {
  margin-top: 0;
}

.routeInformation-list-edit {
  color: #1677ff;
  cursor: pointer;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #303133;
  height: 55px;
}

.control-group {
  /* padding: 16px 0; */
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

/* 按钮容器使用弹性布局 */
.button-group-container {
  display: flex;
  width: 100%;
  /* 占满父容器宽度 */
  gap: 4px;
  /* 按钮间最小间距 */
}

/* 按钮自适应样式 */
.button-group-container :deep(.el-button) {
  flex: 1;
  /* 平均分配宽度 */
  min-width: 60px;
  /* 最小宽度，确保按钮不会过小 */
  padding: clamp(4px, 2vw, 8px);
  /* 内边距随屏幕缩放 */
  font-size: clamp(12px, 1.5vw, 14px);
  /* 字体大小自适应 */
  white-space: nowrap;
  /* 禁止文字换行 */
  overflow: hidden;
  /* 超出部分隐藏 */
  text-overflow: ellipsis;
  /* 文字溢出显示省略号 */
}

/* 图标与文字间距优化 */
.button-group-container :deep(.el-button .el-icon) {
  margin-right: 2px;
  /* 缩小图标间距 */
  font-size: clamp(12px, 1.5vw, 14px);
  /* 图标大小同步缩放 */
}

.control-group:last-child {
  border-bottom: none;
}

.group-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.loading-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.button-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.clear-button {
  width: 100%;
  margin-top: 8px;
}

.save-button {
  margin-top: 12px;
  width: 100%;
}

/* 滚动条样式 */
.floating-panel::-webkit-scrollbar {
  width: 6px;
}

.floating-panel::-webkit-scrollbar-track {
  background: transparent;
}

.floating-panel::-webkit-scrollbar-thumb {
  background: rgba(144, 147, 153, 0.3);
  border-radius: 3px;
}

.floating-panel::-webkit-scrollbar-thumb:hover {
  background: rgba(144, 147, 153, 0.5);
}

:deep(.el-card) {
  border: none;
}

:deep(.el-button-group) {
  gap: 8px;
  display: flex;
  flex-wrap: wrap;
}

:deep(.route-search .el-input__wrapper) {
  background-color: #2e3649db;
  margin: 4px 0;
}

:deep(.route-search .el-input__inner) {
  color: #fff;
}

.el-form {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
}

.el-form-item {
  margin-bottom: 16px;
}

.el-radio-group {
  display: flex;
  gap: 20px;
}

:deep(.el-form-item__label) {
  justify-content: start;
}

:deep(.tdt-div-icon) {
  border: none;
  background: none;
  width: 26px !important;
  height: 26px !important;
  margin-left: -13px !important;
  margin-top: -13px !important;
}

:deep(.save-route .el-form-item__label) {
  width: 60px !important;
}

:deep(.save-route .el-form-item__content) {
  margin-right: 12px !important;
}

.operation-btn {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
}

.add-btn {
  background-color: #409eff;
  color: white;
}

.add-btn:hover {
  background-color: #66b1ff;
}

.delete-btn {
  background-color: #f56c6c;
  color: white;
}

.delete-btn:hover {
  background-color: #f78989;
}

.delete-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

/* 在子组件的样式中添加 */
.map-container,
.map-wrapper {
  width: 100% !important;
  overflow: hidden !important;
}

:deep(.el-card__header) {
  padding-top: 0px;
}

h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.btn {
  width: 100%;
  padding: 8px;
  margin-bottom: 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.primary {
  background-color: #e74c3c;
  color: white;
}

.secondary {
  background-color: #f5f5f5;
  color: #333;
}

.danger {
  background-color: #ff5252;
  color: white;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
  font-size: 13px;
  color: #666;
}

.legend-color {
  width: 12px;
  height: 12px;
  margin-right: 8px;
  border-radius: 2px;
}

.red {
  background-color: rgba(231, 76, 60, 0.6);
}

.no-fly-tooltip .tooltip-header {
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 8px;
  margin-bottom: 10px;
}
.no-fly-tooltip .tooltip-title {
  font-weight: 600;
  color: #e74c3c;
  font-size: 15px;
}
.no-fly-tooltip .tooltip-content {
  font-size: 13px;
  line-height: 1.8;
  color: #333;
}
.no-fly-tooltip .label {
  color: #666;
  margin-right: 6px;
  display: inline-block;
  width: 50px;
}
/* 防止浮层超出视口 */
.no-fly-tooltip {
  max-width: 300px;
  word-wrap: break-word;
}
@media (max-width: 1200px) {
  .floating-panel {
    width: 320px;
  }
}

@media (max-width: 1000px) {
  .floating-panel {
    width: 300px;
  }
}

@media (max-width: 800px) {
  .floating-panel {
    width: 280px;
  }

  .button-group-container {
    gap: 0;
  }
}

/* 超小屏幕下的极限适配 */
@media screen and (max-width: 800px) {
  .button-group-container :deep(.el-button span:not(.el-icon)) {
    /* 进一步缩短文字，只保留核心字 */
    font-size: 0;
  }

  .button-group-container :deep(.el-button span:not(.el-icon))::after {
    font-size: 12px;
    /* 重新设置伪元素字体大小 */
  }

  /* 为每个按钮设置简化文字 */
  .button-group-container
    :deep(.el-button:nth-child(1) span:not(.el-icon))::after {
    content: "绘";
  }

  .button-group-container
    :deep(.el-button:nth-child(2) span:not(.el-icon))::after {
    content: "完";
  }

  .button-group-container
    :deep(.el-button:nth-child(3) span:not(.el-icon))::after {
    content: "取";
  }

  .tooltip-container {
    width: 65%;
  }

  /* 隐藏原文字 */
  .routeOperation-box-view,
  .routeOperation-box-foldUp,
  .routeOperation-box-edit,
  .routeOperation-box-delete {
    font-size: 0;
    /* 隐藏原文字 */
    display: inline-block;
    /* 确保伪元素能正常显示 */
    width: 20px;
    /* 固定宽度避免布局错乱 */
    text-align: center;
  }

  /* 分别设置简化文字 */
  .routeOperation-box-view::after {
    content: "查";
    /* 查看 -> 查 */
    font-size: 16px;
    /* 恢复字体大小 */
  }
  .routeOperation-box-foldUp::after {
    content: "收";
    /* 收起 -> 收 */
    font-size: 16px;
    /* 恢复字体大小 */
  }
  .routeOperation-box-edit::after {
    content: "编";
    /* 编辑 -> 编 */
    font-size: 16px;
  }

  .routeOperation-box-delete::after {
    content: "删";
    /* 删除 -> 删 */
    font-size: 16px;
  }
}
</style>
