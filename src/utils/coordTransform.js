// utils/coordTransform.js
/**
 * 坐标转换工具：WGS-84、GCJ-02、BD-09 相互转换
 * 包含必要的加密算法常量
 */

// 定义必要的数学常量（加密算法核心）
const PI = Math.PI;
const AXIS = 6378245.0; // 1975年IAG(国际大地测量协会)推荐椭球体长半轴
const OFFSET = 0.00669342162296594323; // 偏心率平方 (e^2)

/**
 * 判断坐标点是否在中国境外
 * @param {number} lng - 经度
 * @param {number} lat - 纬度
 * @returns {boolean} true-在国外，false-在国内
 */
function isOutOfChina(lng, lat) {
  return !(lng > 73.66 && lng < 135.05 && lat > 3.86 && lat < 53.55);
}

/**
 * 转换经度（WGS-84 -> GCJ-02 加密算法部分）
 * @param {number} lng - 经度
 * @param {number} lat - 纬度
 * @returns {number} 转换后的经度偏移量
 */
function transformLng(lng, lat) {
  let ret =
    300.0 +
    lng +
    2.0 * lat +
    0.1 * lng * lng +
    0.1 * lng * lat +
    0.1 * Math.sqrt(Math.abs(lng));
  ret +=
    ((20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) *
      2.0) /
    3.0;
  ret +=
    ((20.0 * Math.sin(lng * PI) + 40.0 * Math.sin((lng / 3.0) * PI)) * 2.0) /
    3.0;
  ret +=
    ((150.0 * Math.sin((lng / 12.0) * PI) +
      300.0 * Math.sin((lng / 30.0) * PI)) *
      2.0) /
    3.0;
  return ret;
}

/**
 * 转换纬度（WGS-84 -> GCJ-02 加密算法部分）
 * @param {number} lng - 经度
 * @param {number} lat - 纬度
 * @returns {number} 转换后的纬度偏移量
 */
function transformLat(lng, lat) {
  let ret =
    -100.0 +
    2.0 * lng +
    3.0 * lat +
    0.2 * lat * lat +
    0.1 * lng * lat +
    0.2 * Math.sqrt(Math.abs(lng));
  ret +=
    ((20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) *
      2.0) /
    3.0;
  ret +=
    ((20.0 * Math.sin(lat * PI) + 40.0 * Math.sin((lat / 3.0) * PI)) * 2.0) /
    3.0;
  ret +=
    ((160.0 * Math.sin((lat / 12.0) * PI) + 320 * Math.sin((lat * PI) / 30.0)) *
      2.0) /
    3.0;
  return ret;
}

/**
 * 核心转换：WGS-84 转 GCJ-02（火星坐标系）
 * @param {number} lng - WGS-84经度
 * @param {number} lat - WGS-84纬度
 * @returns {[number, number]} [GCJ-02经度, GCJ-02纬度]
 */
export function wgs84togcj02(lng, lat) {
  // 坐标点在中国境外，不进行转换
  if (isOutOfChina(lng, lat)) {
    return [lng, lat];
  }

  let dlat = transformLat(lng - 105.0, lat - 35.0);
  let dlng = transformLng(lng - 105.0, lat - 35.0);

  const radlat = (lat / 180.0) * PI;
  let magic = Math.sin(radlat);
  magic = 1 - OFFSET * magic * magic;
  const sqrtmagic = Math.sqrt(magic);

  dlat = (dlat * 180.0) / (((AXIS * (1 - OFFSET)) / (magic * sqrtmagic)) * PI);
  dlng = (dlng * 180.0) / ((AXIS / sqrtmagic) * Math.cos(radlat) * PI);

  const mglat = lat + dlat;
  const mglng = lng + dlng;

  return [mglng, mglat];
}

/**
 * GCJ-02 转 WGS-84（需要时使用）
 * @param {number} lng - GCJ-02经度
 * @param {number} lat - GCJ-02纬度
 * @returns {[number, number]} [WGS-84经度, WGS-84纬度]
 */
export function gcj02towgs84(lng, lat) {
  // 如果已有此函数，可保留原有实现
  if (isOutOfChina(lng, lat)) {
    return [lng, lat];
  }

  let dlat = transformLat(lng - 105.0, lat - 35.0);
  let dlng = transformLng(lng - 105.0, lat - 35.0);

  const radlat = (lat / 180.0) * PI;
  let magic = Math.sin(radlat);
  magic = 1 - OFFSET * magic * magic;
  const sqrtmagic = Math.sqrt(magic);

  dlat = (dlat * 180.0) / (((AXIS * (1 - OFFSET)) / (magic * sqrtmagic)) * PI);
  dlng = (dlng * 180.0) / ((AXIS / sqrtmagic) * Math.cos(radlat) * PI);

  const mglat = lat + dlat;
  const mglng = lng + dlng;

  // 与 wgs84togcj02 不同，这里是减去偏移量
  return [lng * 2 - mglng, lat * 2 - mglat];
}

/**
 * 批量转换坐标点（提高性能）
 * @param {Array} points - 坐标点数组 [[lng, lat], ...]
 * @param {Function} transformFunc - 转换函数
 * @returns {Array} 转换后的坐标点数组
 */
export function transformPoints(points, transformFunc) {
  return points.map((point) => {
    const [lng, lat] = point;
    return transformFunc(lng, lat);
  });
}
/**
 * 工具方法：校验经纬度格式是否合法
 * @param {string} str - 待校验的字符串
 * @returns {Object|null} 合法返回{lng, lat}，不合法返回null
 */
export const validateLatLng = (str) => {
  // 经纬度正则：经度(-180~180) 纬度(-90~90)，支持整数/小数
  const latLngReg =
    /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),[-+]?((180(\.0+)?)|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/;
  if (!latLngReg.test(str)) {
    return null;
  }
  // 分割经纬度并转换为数字
  const [lng, lat] = str.split(",").map(Number);
  // 范围校验
  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
    return null;
  }
  return { lng, lat };
};
