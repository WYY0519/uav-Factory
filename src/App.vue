<template>
  <RouterView />
</template>
<!-- <script
  src="https://api.tianditu.gov.cn/api?v=3.0&tk=9ba367ae035d60d46439d8cf1be3c485"
  type="text/javascript"
></script> -->
<!-- <script src="http://api.tianditu.gov.cn/api?v=4.0&tk=9ba367ae035d60d46439d8cf1be3c485"></script> -->
<script setup>
import { ref, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
</script>

<style>
* {
  margin: 0;
  padding: 0;
}
</style>
