<template>
  <div class="faq-container">
    <!-- 搜索框 -->
    <div class="search-wrapper">
      <el-input
        v-model="searchKeyword"
        placeholder="请输入问题关键词"
        clearable
        @input="handleSearch"
      >
        <template #suffix>
          <el-icon class="search-icon">
            <Search />
          </el-icon>
        </template>
      </el-input>
    </div>
    <!-- 遍历FAQ数据，保留原索引和key -->
    <div v-for="(item, index) in faqData" :key="index" class="faq-item">
      <!-- 问题标题栏 - 优化点击区域和视觉层次 -->
      <div class="faq-question" @click="toggleExpand(index)">
        <span class="question-text">{{ item.question }}</span>
        <!-- 箭头图标 - 增加旋转动画，替换为更美观的符号 -->
        <span class="arrow-icon" :class="{ active: expandedIndex === index }">
          ∨
        </span>
      </div>
      <!-- 答案内容 - 增加展开/收起过渡动画，优化内容展示 -->
      <transition name="faq-fade">
        <div v-show="expandedIndex === index" class="faq-answer">
          <div class="answer-content">{{ item.answer || "暂无解答内容" }}</div>
          <!-- 新增创建时间展示，弱化样式不抢焦点 -->
          <div class="create-time">{{ item.createTime }}</div>
        </div>
      </transition>
    </div>
    <!-- 空数据兜底 - 接口无数据时友好提示 -->
    <div v-if="faqData.length === 0" class="empty-tip">暂无FAQ问答数据</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { Search } from "@element-plus/icons-vue";
// 保留你原有的接口引入，无需修改
import { fqaList, fqaSearch } from "@/api/fac";

// 响应式数据 - 保留原逻辑
const faqData = ref([]);
const expandedIndex = ref(-1); // -1 表示全部收起
const searchKeyword = ref(""); // 搜索关键词

// 切换展开/收起 - 保留原核心逻辑
const toggleExpand = (index) => {
  expandedIndex.value = expandedIndex.value === index ? -1 : index;
};

// 搜索FAQ
const handleSearch = () => {
  const keyword = searchKeyword.value.trim();
  if (!keyword) {
    // 如果搜索框为空，调用列表接口获取所有数据
    fqaList()
      .then((res) => {
        faqData.value = res.data || [];
      })
      .catch((err) => {
        console.error("FAQ数据获取失败：", err);
        faqData.value = [];
      });
  } else {
    // 如果有关键词，调用搜索接口
    fqaSearch({ question: keyword })
      .then((res) => {
        faqData.value = res.data || [];
      })
      .catch((err) => {
        console.error("FAQ搜索失败：", err);
        faqData.value = [];
      });
  }
};

// 组件挂载后获取数据 - 保留原接口调用，增加错误捕获
onMounted(() => {
  handleSearch();
});
</script>

<style scoped>
/* 容器样式 - 优化间距、阴影，适配不同布局 */
.faq-container {
  width: 100%;
  /* max-width: 1200px; */
  margin: 24px auto;
  padding: 0 16px;
  box-sizing: border-box;
}

/* 搜索框容器 */
.search-wrapper {
  margin-bottom: 20px;
}

.search-icon {
  color: #909399;
}

/* 空数据提示 - 友好占位，居中展示 */
.empty-tip {
  text-align: center;
  padding: 48px 0;
  color: #909399;
  font-size: 14px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}

/* 单个问答项 - 优化圆角、间距，取消底部边框的硬分隔 */
.faq-item {
  margin-bottom: 8px;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  transition: all 0.3s ease;
}
/* 项悬浮效果 - 轻微上浮+阴影加深，提升交互感知 */
.faq-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  transform: translateY(-2px);
}

/* 问题标题栏 - 优化内边距、字体，增加边框底部分隔 */
.faq-question {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  border-bottom: 1px solid #ebeef5;
  border-radius: 8px 8px 0 0;
  box-sizing: border-box;
  transition: background-color 0.3s ease;
}
/* 标题栏点击/悬浮背景 - 柔和浅灰，不刺眼 */
.faq-question:hover {
  background-color: #f8f9fa;
}

/* 问题文本 - 限制换行，避免标题过长变形 */
.question-text {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 16px;
}

/* 箭头图标 - 优化大小、颜色，增加旋转动画 */
.arrow-icon {
  font-size: 18px;
  color: #c0c4cc;
  transition: all 0.3s ease;
  user-select: none; /* 禁止选中图标 */
}
/* 箭头激活状态 - 旋转+深色，明确展开标识 */
.arrow-icon.active {
  transform: rotate(180deg);
  color: #409eff; /* 主色调，适配主流后台系统 */
}

/* 答案内容容器 - 优化内边距，取消顶部多余间距 */
.faq-answer {
  padding: 20px 24px;
  background-color: #fafafa;
  border-radius: 0 0 8px 8px;
  box-sizing: border-box;
}

/* 答案文本 - 优化行高、字体、颜色，提升可读性 */
.answer-content {
  font-size: 14px;
  color: #606266;
  line-height: 1.8;
  margin-bottom: 12px;
  word-wrap: break-word;
}

/* 创建时间 - 弱化样式，作为辅助信息 */
.create-time {
  font-size: 12px;
  color: #909399;
  text-align: right;
}

/* 展开/收起过渡动画 - 淡入淡出+高度平滑变化，无卡顿 */
.faq-fade-enter-from,
.faq-fade-leave-to {
  opacity: 0;
  height: 0;
  overflow: hidden;
}
.faq-fade-enter-active,
.faq-fade-leave-active {
  transition: all 0.3s ease;
}
</style>
