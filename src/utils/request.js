import axios from 'axios';
import { ElMessage } from 'element-plus';
import router from '@/router';
// 创建 axios 实例
const service = axios.create({
  // baseURL: "http://192.168.1.4:34556", // 小岳
  // baseURL: "http://192.168.1.179:8081", // 小崔
  // baseURL: 'http://121.41.60.99:34556', //华启-服务
  // baseURL: 'http://121.41.60.99:33333', //公司-工厂-服务器
  baseURL: 'http://121.43.96.187:33333', //新服务器
  timeout: 15000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json;charset=utf-8',
  },
});

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    console.log(config, 'config1');
    // 在请求发送之前做一些处理
    const token = localStorage.getItem('authToken');
    // console.log("当前Token:", localStorage.getItem("token"));
    if (token) {
      // 让每个请求携带token
      config.headers['Authorization'] = token;
    }
    if (token == '') {
      //跳转登录页
      router.push('/login');
    }
    return config;
  },
  (error) => {
    // 处理请求错误
    console.error('请求错误：', error);
    return Promise.reject(error);
  }
);
// 错误状态标记 - 用于控制网络错误只提示一次
let networkErrorReported = false;
// 响应拦截器
service.interceptors.response.use(
  (response) => {
    // 核心修改：如果是文件下载请求（skipCodeCheck为true）或响应是Blob，直接返回原始数据
    if (response.config.skipCodeCheck || response.data instanceof Blob) {
      return response.data; // 直接返回Blob，不校验code
    }

    const res = response.data;
    // 成功响应时重置错误标记
    networkErrorReported = false;
    // 根据自定义错误码判断请求是否成功
    if (res.code === 200) {
      // if (res.code === 0) {
      // 成功返回数据
      return res;
    } else {
      // 处理业务错误
      //导入模版的错误信息以消息弹窗的方式呈现
      if (response.config.url !== '/factory/user/import' && response.config.url !== '/factory/company/import') {
        switch (res.code) {
          case 401:
            // token 过期或未登录
            ElMessage.error('登录已过期，请重新登录');
            console.log('【登录过期】状态码:', response.status);
            console.log('【登录过期】本地token存在:', !!localStorage.getItem('token'));
            console.log('【登录过期】当前路由:', router.currentRoute.value.path);
            localStorage.removeItem('authToken');
            router.push('/login');
            break;
          case 403:
            // 权限不足
            ElMessage.error('权限不足');
            break;
          default:
            // 其他错误
            ElMessage.error(res.message || '操作失败');
            console.log(res.message);
          // ElMessage.error("操作失败");
        }
      }
      return Promise.reject(res);
    }
  },
  (error) => {
    // 处理 HTTP 错误
    if (error.response) {
      // 有响应但状态码错误时重置标记
      networkErrorReported = false;
      switch (error.response.status) {
        case 401:
          ElMessage.error('登录已过期，请重新登录');
          localStorage.removeItem('authToken');
          router.push('/login');
          break;
        case 403:
          ElMessage.error('权限不足');
          break;
        case 404:
          ElMessage.error('请求的资源不存在');
          break;
        case 500:
          ElMessage.error('服务器错误');
          break;
        default:
          ElMessage.error('网络错误');
      }
    } else {
      if (!networkErrorReported) {
        ElMessage.error('网络连接失败');
        networkErrorReported = true; // 标记为已提示
      }
    }
    return Promise.reject(error);
  }
);

// 文件下载方法
export const downloadFile = async (url, filename) => {
  const token = localStorage.getItem('authToken');

  if (!token) {
    throw new Error('未获取到认证信息，请重新登录');
  }
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: token,
        Accept: 'application/octet-stream',
      },
      credentials: 'include',
    });
    if (!response.ok) {
      // 输出完整 URL 到控制台，方便排查
      console.error('请求的 URL 不存在:', url);
      throw new Error(`${response.status} - 接口不存在或路径错误（URL: ${url}）`);
    }
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename || '日志文件';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    }, 100);
  } catch (error) {
    throw new Error(error.message || '下载请求失败');
  }
};

// 封装请求方法
export const http = {
  get(url, params) {
    return service.get(url, { params });
  },

  post(url, data) {
    return service.post(url, data);
  },

  put(url, data) {
    return service.put(url, data);
  },

  delete(url, params) {
    return service.delete(url, { params });
  },
};

// export default
export default service;
