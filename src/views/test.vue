<template>
  <div class="map-wrapper">
    <div id="map" class="map-container"></div>

    <!-- 控制工具栏 -->
    <div class="control-toolbar">
      <h3>禁飞区管理系统</h3>
      <button @click="startDrawPolygon" class="btn primary">
        <i class="icon-polygon"></i> 绘制多边形禁飞区
      </button>
      <button @click="startDrawCircle" class="btn primary">
        <i class="icon-circle"></i> 绘制圆形禁飞区
      </button>
      <button @click="startDrawRoute" class="btn success">
        <i class="icon-route"></i> 规划航线
      </button>
      <!-- 关键：添加明确的点击状态样式，确保按钮可交互 -->
      <button
        @click="toggleEditMode"
        class="btn secondary"
        :class="{ 'edit-active': isEditing }"
        ref="editButton"
      >
        <i v-if="!isEditing" class="icon-edit"></i>
        <i v-if="isEditing" class="icon-save"></i>
        {{ isEditing ? "保存编辑" : "编辑禁飞区" }}
      </button>

      <!-- 数据操作按钮 -->
      <button @click="exportZones" class="btn secondary">
        <i class="icon-export"></i> 导出数据
      </button>
      <button @click="importZones" class="btn secondary">
        <i class="icon-import"></i> 导入数据
      </button>
      <button @click="clearAllZones" class="btn danger">
        <i class="icon-trash"></i> 清除所有禁飞区
      </button>

      <div class="legend">
        <div class="legend-item">
          <div class="legend-color red"></div>
          <span>禁飞区域</span>
        </div>
        <div class="legend-item">
          <div class="legend-color blue"></div>
          <span>航线</span>
        </div>
        <div class="legend-item">
          <div class="legend-color green"></div>
          <span>航线检查点</span>
        </div>
      </div>

      <div class="route-info" v-if="routeDistance">
        <h4>航线信息</h4>
        <p>总距离: {{ routeDistance.toFixed(2) }} 公里</p>
        <p>检查点: {{ checkpointCount }} 个</p>
        <p v-if="hasViolation" style="color: #e74c3c">警告: 航线穿过禁飞区!</p>
        <p v-else style="color: #2ecc71">航线安全: 未穿过禁飞区</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from "vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";

// 天地图密钥
const TIAN_DI_TU_KEY = "0c09d0cbd8da28e0f79cfc1627c23fd4";
let map = null;
let drawControl = null;
let editableLayers = null;
let routeLayer = null;
let checkpointsLayer = null;
const isEditing = ref(false);
const routeDistance = ref(0);
const checkpointCount = ref(0);
const hasViolation = ref(false);
const noFlyZones = ref([]);
const editButton = ref(null); // 编辑按钮的ref引用

// 生成唯一ID
const generateId = () => {
  return "zone-" + Math.random().toString(36).substr(2, 9);
};

onMounted(() => {
  try {
    // 1. 初始化地图
    map = L.map("map", {
      center: [39.9042, 116.4074],
      zoom: 13,
      maxZoom: 18,
      minZoom: 1,
    });

    // 2. 初始化可编辑图层组
    editableLayers = L.featureGroup().addTo(map);

    // 3. 加载天地图
    const baseLayer = L.tileLayer(
      `//t0.tianditu.gov.cn/img_w/wmts?service=WMTS&request=GetTile&version=1.0.0&LAYER=img&tileMatrixSet=w&TileMatrix={z}&TileRow={y}&TileCol={x}&style=default&format=tiles&tk=${TIAN_DI_TU_KEY}`,
      { attribution: "© 天地图", tileSize: 256, crossOrigin: "" }
    ).addTo(map);

    const labelLayer = L.tileLayer(
      `//t0.tianditu.gov.cn/cia_w/wmts?service=WMTS&request=GetTile&version=1.0.0&LAYER=cia&tileMatrixSet=w&TileMatrix={z}&TileRow={y}&TileCol={x}&style=default&format=tiles&tk=${TIAN_DI_TU_KEY}`,
      { attribution: "© 天地图", tileSize: 256, crossOrigin: "" }
    ).addTo(map);

    // 4. 初始化其他图层
    routeLayer = L.featureGroup().addTo(map);
    checkpointsLayer = L.featureGroup().addTo(map);

    // 5. 初始化绘图控件
    initDrawControl();

    // 6. 加载本地数据
    loadZonesFromStorage();

    // 7. 监听绘图事件
    initDrawEvents();

    // 8. 监听编辑/删除事件
    map.on(L.Draw.Event.EDITED, (e) => {
      e.layers.eachLayer((layer) => {
        if (layer._zoneId) {
          const type = layer instanceof L.Polygon ? "polygon" : "circle";
          const realLayer = getRealShapeLayer(layer, type);
          const area = calculateArea(realLayer, type);
          updateZoneInCollection(layer._zoneId, realLayer, type, area);
        }
      });
    });

    map.on(L.Draw.Event.DELETED, (e) => {
      e.layers.eachLayer((layer) => {
        if (layer._zoneId) deleteZone(layer._zoneId);
      });
    });

    // 9. 关键：手动绑定编辑按钮的点击事件（避免Vue事件绑定失效）
    nextTick(() => {
      if (editButton.value) {
        editButton.value.addEventListener("click", handleEditButtonClick);
      }
    });
  } catch (error) {
    console.error("地图初始化失败:", error);
    alert("地图加载出错，请刷新重试");
  }
});

// 关键：独立的编辑按钮点击处理函数（确保事件能触发）
const handleEditButtonClick = (e) => {
  e.stopPropagation(); // 阻止事件冒泡
  e.preventDefault(); // 阻止默认行为

  if (!drawControl || !map || !editableLayers) {
    console.error("编辑工具未初始化");
    alert("编辑功能加载失败，请刷新页面");
    return;
  }

  const editToolbar = drawControl._toolbars.edit;
  const drawToolbar = drawControl._toolbars.draw;

  if (!isEditing.value) {
    // 进入编辑模式
    if (drawToolbar && drawToolbar.disable) {
      drawToolbar.disable();
    }
    if (editToolbar && editToolbar.enable) {
      // 确保所有图层都能被编辑
      editableLayers.eachLayer((layer) => {
        if (!editableLayers.hasLayer(layer)) {
          editableLayers.addLayer(layer);
        }
      });
      editToolbar.enable();
      isEditing.value = true;
      console.log("进入编辑模式");
      alert("已进入编辑模式：点击禁飞区可拖动顶点修改形状");
    }
  } else {
    // 退出编辑模式
    if (editToolbar && editToolbar.disable) {
      editToolbar.disable();
      isEditing.value = false;
    }
    if (drawToolbar && drawToolbar.enable) {
      drawToolbar.enable();
    }
    console.log("退出编辑模式");
  }
};

// 初始化绘图控件（确保编辑工具正确配置）
const initDrawControl = () => {
  if (!map || !editableLayers) return;

  // 设置中文本地化
  if (L.drawLocal) {
    L.drawLocal.draw.toolbar.actions.text = "保存";
    L.drawLocal.draw.toolbar.finish.text = "完成";
    L.drawLocal.draw.toolbar.undo.text = "删除最后一个点";
    L.drawLocal.draw.handlers.polygon.tooltip.start = "点击开始绘制多边形";
    L.drawLocal.draw.handlers.circle.tooltip.start = "点击并拖动绘制圆形";
    L.drawLocal.edit.toolbar.actions.save.text = "保存";
    L.drawLocal.edit.toolbar.actions.cancel.text = "取消";
  }

  // 移除已存在的控件（避免重复添加）
  if (drawControl) {
    map.removeControl(drawControl);
  }

  drawControl = new L.Control.Draw({
    position: "topleft",
    draw: {
      polygon: {
        allowIntersection: false,
        shapeOptions: {
          color: "#e74c3c",
          weight: 2,
          fillColor: "#e74c3c",
          fillOpacity: 0.3,
        },
        layerClass: L.Polygon,
      },
      circle: {
        shapeOptions: {
          color: "#e74c3c",
          weight: 2,
          fillColor: "#e74c3c",
          fillOpacity: 0.3,
        },
        layerClass: L.Circle,
      },
      marker: false,
      polyline: false,
      rectangle: false,
      circlemarker: false,
    },
    edit: {
      featureGroup: editableLayers,
      remove: true,
      edit: { selectedPathOptions: { color: "#4285f4", weight: 3 } },
    },
  });

  map.addControl(drawControl);

  // 隐藏默认编辑按钮，避免冲突
  setTimeout(() => {
    const defaultEditBtns = document.querySelectorAll(
      ".leaflet-draw-edit-edit, .leaflet-draw-edit-remove"
    );
    defaultEditBtns.forEach((btn) => (btn.style.display = "none"));
  }, 300);
};

// 初始化绘图事件（确保绘制的图层可编辑）
const initDrawEvents = () => {
  if (!map || !editableLayers) return;

  map.on(L.Draw.Event.CREATED, (e) => {
    const layer = e.layer;
    const type = e.layerType;
    const realLayer = getRealShapeLayer(layer, type);

    realLayer.setStyle({
      color: "#e74c3c",
      weight: 2,
      fillColor: "#e74c3c",
      fillOpacity: 0.3,
    });
    realLayer._zoneId = generateId(); // 标记ID

    // 计算面积并绑定弹窗
    const areaText = getAreaText(realLayer, type);
    realLayer.bindPopup(`<b>禁飞区</b><br>${areaText}`);

    // 关键：添加到可编辑图层组
    editableLayers.addLayer(realLayer);
    map.fitBounds(realLayer.getBounds(), { padding: [50, 50] });

    // 保存数据
    saveZoneToCollection(
      realLayer,
      type,
      parseFloat(areaText.match(/[\d.]+/)[0])
    );
  });
};

// 切换编辑模式（与手动绑定的事件处理保持一致）
const toggleEditMode = () => {
  // 由handleEditButtonClick统一处理，这里留空或仅作为触发点
};

// 开始绘制多边形（确保退出编辑模式）
const startDrawPolygon = () => {
  if (isEditing.value) {
    handleEditButtonClick({
      stopPropagation: () => {},
      preventDefault: () => {},
    });
  }

  const drawToolbar = drawControl?._toolbars.draw;
  if (drawToolbar && drawToolbar._modes.polygon?.handler) {
    drawToolbar._modes.polygon.handler.disable();
    setTimeout(() => drawToolbar._modes.polygon.handler.enable(), 100);
  }
};

// 开始绘制圆形（同上）
const startDrawCircle = () => {
  if (isEditing.value) {
    handleEditButtonClick({
      stopPropagation: () => {},
      preventDefault: () => {},
    });
  }

  const drawToolbar = drawControl?._toolbars.draw;
  if (drawToolbar && drawToolbar._modes.circle?.handler) {
    drawToolbar._modes.circle.handler.disable();
    setTimeout(() => drawToolbar._modes.circle.handler.enable(), 100);
  }
};

// 开始绘制航线（同上）
const startDrawRoute = () => {
  if (!map || !routeLayer) return;
  if (isEditing.value) {
    handleEditButtonClick({
      stopPropagation: () => {},
      preventDefault: () => {},
    });
  }

  routeLayer.clearLayers();
  checkpointsLayer.clearLayers();
  routeDistance.value = 0;
  checkpointCount.value = 0;
  hasViolation.value = false;

  alert("请在地图上点击添加检查点，双击结束绘制");

  const polyline = L.polyline([], {
    color: "#3498db",
    weight: 4,
    opacity: 0.7,
    dashArray: "10, 10",
  }).addTo(routeLayer);

  let isDrawing = true;
  let points = [];

  const onMapClick = (e) => {
    if (!isDrawing) return;
    const latlng = e.latlng;
    points.push(latlng);
    polyline.setLatLngs(points);

    const marker = L.marker(latlng, {
      icon: L.divIcon({
        className: "checkpoint-marker",
        html: '<div style="background-color: #2ecc70; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 3px #2ecc70;"></div>',
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      }),
    }).addTo(checkpointsLayer);

    marker.bindPopup(
      `检查点 ${points.length}<br>位置: ${latlng.lat.toFixed(
        4
      )}, ${latlng.lng.toFixed(4)}`
    );
    checkRouteViolation();
  };

  const onMapDblClick = () => {
    if (points.length < 2) {
      alert("航线至少需要两个检查点");
      return;
    }
    isDrawing = false;
    map.off("click", onMapClick);
    map.off("dblclick", onMapDblClick);
    calculateRouteDistance(points);
    checkpointCount.value = points.length;
    checkRouteViolation();
  };

  map.on("click", onMapClick);
  map.on("dblclick", onMapDblClick);
};

// 其他函数（保持原有逻辑，确保空值检查）
const checkRouteViolation = () => {
  if (!routeLayer || !editableLayers) return;
  hasViolation.value = false;
  const routes = routeLayer.getLayers();
  if (routes.length === 0) return;

  const route = routes[0];
  const routePoints = route.getLatLngs();
  if (routePoints.length < 2) return;

  editableLayers.eachLayer((zone) => {
    if (hasViolation.value) return;
    if (isRouteIntersectingZone(routePoints, zone)) {
      hasViolation.value = true;
      zone.setStyle({
        color: "#ff0000",
        fillColor: "#ff0000",
        fillOpacity: 0.5,
      });
    } else {
      zone.setStyle({
        color: "#e74c3c",
        fillColor: "#e74c3c",
        fillOpacity: 0.3,
      });
    }
  });
};

const isRouteIntersectingZone = (routePoints, zone) => {
  if (!zone) return false;
  try {
    const zoneBounds = zone.getBounds();
    for (let i = 0; i < routePoints.length - 1; i++) {
      const lineBounds = L.latLngBounds([routePoints[i], routePoints[i + 1]]);
      if (lineBounds.intersects(zoneBounds)) return true;
    }
  } catch (error) {
    console.error("相交检测失败:", error);
  }
  return false;
};

const calculateRouteDistance = (points) => {
  let totalDistance = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const R = 6371;
    const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
    const dLon = ((p2.lng - p1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((p1.lat * Math.PI) / 180) *
        Math.cos((p2.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    totalDistance += R * c;
  }
  routeDistance.value = totalDistance;
};

const saveZoneToCollection = (layer, type, area) => {
  const id = layer._zoneId;
  let coordinates =
    type === "polygon"
      ? layer.getLatLngs()
      : { center: layer.getLatLng(), radius: layer.getRadius() };

  noFlyZones.value.push({
    id,
    type,
    coordinates,
    area,
    createdAt: new Date().toISOString(),
  });
  saveZonesToStorage();
};

const saveZonesToStorage = () => {
  try {
    localStorage.setItem("noFlyZones", JSON.stringify(noFlyZones.value));
  } catch (error) {
    console.error("保存失败:", error);
  }
};

const loadZonesFromStorage = () => {
  try {
    const storedZones = localStorage.getItem("noFlyZones");
    if (storedZones) {
      noFlyZones.value = JSON.parse(storedZones);
      noFlyZones.value.forEach((zone) => {
        let layer;
        if (zone.type === "polygon") {
          layer = L.polygon(zone.coordinates, {
            color: "#e74c3c",
            weight: 2,
            fillColor: "#e74c3c",
            fillOpacity: 0.3,
          });
        } else {
          const center = L.latLng(
            zone.coordinates.center.lat,
            zone.coordinates.center.lng
          );
          layer = L.circle(center, zone.coordinates.radius, {
            color: "#e74c3c",
            weight: 2,
            fillColor: "#e74c3c",
            fillOpacity: 0.3,
          });
        }
        layer._zoneId = zone.id;
        editableLayers.addLayer(layer);
      });
    }
  } catch (error) {
    console.error("加载失败:", error);
  }
};

// 其他功能函数（exportZones, importZones, updateZoneInCollection等保持不变）
const exportZones = () => {
  if (noFlyZones.value.length === 0) {
    alert("没有禁飞区数据可导出");
    return;
  }
  const data = JSON.stringify(noFlyZones.value, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `no-fly-zones-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const importZones = () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedZones = JSON.parse(event.target.result);
          noFlyZones.value = importedZones;
          editableLayers.clearLayers();
          loadZonesFromStorage();
          alert("导入成功");
        } catch (error) {
          alert("导入失败");
        }
      };
      reader.readAsText(file);
    }
  };
  input.click();
};

const updateZoneInCollection = (id, layer, type, area) => {
  const index = noFlyZones.value.findIndex((zone) => zone.id === id);
  if (index !== -1) {
    noFlyZones.value[index] = {
      ...noFlyZones.value[index],
      coordinates:
        type === "polygon"
          ? layer.getLatLngs()
          : { center: layer.getLatLng(), radius: layer.getRadius() },
      area,
      updatedAt: new Date().toISOString(),
    };
    saveZonesToStorage();
  }
};

const deleteZone = (id) => {
  noFlyZones.value = noFlyZones.value.filter((zone) => zone.id !== id);
  saveZonesToStorage();
};

const getRealShapeLayer = (layer, type) => {
  try {
    if (layer instanceof L.LayerGroup || layer instanceof L.FeatureGroup) {
      let realLayer = layer;
      while (
        realLayer instanceof L.LayerGroup ||
        realLayer instanceof L.FeatureGroup
      ) {
        const layers = realLayer.getLayers();
        if (layers.length === 0) break;
        realLayer = layers[0];
      }
      return realLayer;
    }
    return layer;
  } catch (error) {
    console.error("提取图层失败:", error);
    return L.polygon([], { color: "#e74c3c" });
  }
};

const getAreaText = (layer, type) => {
  try {
    if (type === "polygon") {
      const area = layer.getArea() / 1000000;
      return `面积: ${area.toFixed(2)} 平方公里`;
    } else {
      const radius = layer.getRadius() / 1000;
      const area = Math.PI * Math.pow(radius, 2);
      return `半径: ${radius.toFixed(2)} 公里<br>面积: ${area.toFixed(
        2
      )} 平方公里`;
    }
  } catch (error) {
    console.error("计算面积失败:", error);
    return "面积: 计算失败";
  }
};

const calculateArea = (layer, type) => {
  try {
    if (type === "polygon") {
      return layer.getArea() / 1000000;
    } else {
      const radius = layer.getRadius() / 1000;
      return Math.PI * Math.pow(radius, 2);
    }
  } catch (error) {
    return 0;
  }
};

const calculatePolygonArea = (latLngs) => {
  let area = 0;
  const earthRadius = 6371000;
  const rad = Math.PI / 180;
  for (let i = 0; i < latLngs.length; i++) {
    const j = (i + 1) % latLngs.length;
    const lat1 = latLngs[i].lat * rad;
    const lon1 = latLngs[i].lng * rad;
    const lat2 = latLngs[j].lat * rad;
    const lon2 = latLngs[j].lng * rad;
    area += (lon2 - lon1) * Math.cos((lat1 + lat2) / 2);
  }
  return Math.abs(area) * Math.pow(earthRadius, 2);
};

const clearAllZones = () => {
  if (confirm("确定要清除所有禁飞区吗？")) {
    if (isEditing.value) {
      handleEditButtonClick({
        stopPropagation: () => {},
        preventDefault: () => {},
      });
    }
    editableLayers.clearLayers();
    noFlyZones.value = [];
    saveZonesToStorage();
  }
};

onUnmounted(() => {
  if (map) {
    map.off();
    map.remove();
  }
  if (editButton.value) {
    editButton.value.removeEventListener("click", handleEditButtonClick);
  }
  drawControl = null;
  editableLayers = null;
});
</script>

<style scoped>
/* 增加编辑按钮激活状态样式 */
.edit-active {
  background-color: #4285f4 !important;
  color: white !important;
}

/* 确保按钮可点击，不受其他元素遮挡 */
.btn {
  position: relative;
  z-index: 1001; /* 高于地图控件 */
  cursor: pointer;
  user-select: none; /* 禁止文本选中，避免点击时选中文本 */
}

/* 其他样式保持不变 */
.map-wrapper {
  position: relative;
  width: 100%;
  height: 100vh;
}

.map-container {
  width: 100%;
  height: 100%;
}

.control-toolbar {
  position: absolute;
  top: 20px;
  right: 20px;
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  width: 280px;
}
/* 样式保持不变，仅优化编辑按钮显示 */
.map-wrapper {
  position: relative;
  width: 100%;
  height: 100vh;
}

.map-container {
  width: 100%;
  height: 100%;
}

.control-toolbar {
  position: absolute;
  top: 20px;
  right: 20px;
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  width: 280px;
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
  padding: 10px;
  margin-bottom: 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
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
  background-color: #4285f4;
  color: white;
}

.secondary {
  background-color: #f5f5f5;
  color: #333;
}

.danger {
  background-color: #e74c3c;
  color: white;
}

.success {
  background-color: #2ecc71;
  color: white;
}

.icon-polygon::before {
  content: "▰";
  margin-right: 5px;
  font-size: 16px;
}

.icon-circle::before {
  content: "○";
  margin-right: 5px;
  font-size: 16px;
}

.icon-edit::before {
  content: "✎";
  margin-right: 5px;
  font-size: 16px;
}

.icon-save::before {
  content: "✓";
  margin-right: 5px;
  font-size: 16px;
}

.icon-trash::before {
  content: "✕";
  margin-right: 5px;
  font-size: 16px;
}

.icon-export::before {
  content: "⤓";
  margin-right: 5px;
  font-size: 16px;
}

.icon-import::before {
  content: "⤒";
  margin-right: 5px;
  font-size: 16px;
}

.icon-route::before {
  content: "➤";
  margin-right: 5px;
  font-size: 16px;
}

.legend {
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px solid #eee;
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

.blue {
  background-color: rgba(52, 152, 219, 0.6);
}

.green {
  background-color: rgba(46, 204, 113, 0.6);
}

/* 确保绘图工具栏样式正常 */
.leaflet-draw-toolbar a {
  background-image: none !important;
  font-family: "Microsoft YaHei", sans-serif;
  font-size: 12px;
  line-height: 26px;
  text-align: center;
  text-indent: 0;
}

.leaflet-draw-toolbar .leaflet-draw-draw-polygon:after {
  content: "多边形";
}

.leaflet-draw-toolbar .leaflet-draw-draw-circle:after {
  content: "圆形";
}

.leaflet-draw-tooltip {
  font-family: "Microsoft YaHei", sans-serif;
  background: rgba(0, 0, 0, 0.7);
  border: none;
  border-radius: 4px;
  color: #fff;
  font-size: 12px;
}

.leaflet-draw-tooltip:before {
  border-right-color: rgba(0, 0, 0, 0.7);
}

.route-info {
  margin-top: 15px;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 4px;
  font-size: 13px;
}

.route-info h4 {
  margin: 0 0 8px 0;
  color: #333;
}

.route-info p {
  margin: 5px 0;
  color: #666;
}
</style>
