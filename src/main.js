import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import { zhCn } from "element-plus/es/locale/index";
import VueTianditu from "vue-tianditu";
// import 'vue-tianditu/dist/style.css'
import "video.js/dist/video-js.css";
import "leaflet/dist/leaflet.css";
import videojs from "video.js";
import "videojs-flash";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(ElementPlus, { locale: zhCn });
app.use(VueTianditu, {
  v: "4.0", //目前只支持4.0版本
  // tk:"9ba367ae035d60d46439d8cf1be3c485"
  tk: "69a5cdb2a588f9138791d3ec5136addc",
});

app.mount("#app");
