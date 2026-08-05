<template>
    <!-- 版本信息弹窗 -->
    <div v-if="show" class="version-content" ref="modalContentRef">
        <div>
            <div style="text-align: center; font-size: 20px; font-weight: 600;">
                What's New
            </div>
            <div class="version-content-presentation" v-for="(item, index) in versionList" :key="index">
                <div style="font-size: 30px; font-weight: 600; padding: 16px 0 0 0">{{ item.version }}</div>

                <!-- 新增内容 -->
                <div style="font-weight: 600; font-size: 24px; padding: 12px 0;" v-show="item?.add">新增</div>
                <ul v-for="(items, indexs) in item.add" :key="indexs" style="padding: 0 0 6px 18px; font-size: 16px;">
                    <li style="padding: 3px 0;">{{ items.conten }}</li>
                </ul>

                <!-- 修复内容 -->
                <div style="font-weight: 600; font-size: 24px; padding: 12px 0;" v-show="item?.repair">修复</div>
                <ul v-for="(items, indexs) in item.repair" :key="indexs"
                    style="padding: 0 0 6px 18px; font-size: 16px;">
                    <li style="padding: 3px 0;">{{ items.conten }}</li>
                </ul>

                <!-- 其他内容 -->
                <div style="font-weight: 600; font-size: 24px; padding: 12px 0;" v-show="item?.other">其他</div>
                <ul v-for="(items, indexs) in item.other" :key="indexs" style="padding: 0 0 6px 18px; font-size: 16px;">
                    <li style="padding: 3px 0;">{{ items.conten }}</li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";

// 接收父组件传入的参数
const props = defineProps({
    show: {
        type: Boolean,
        default: false
    },
    versionList: {
        type: Array,
        default: () => []
    }
});

// 向父组件传递事件（关闭弹窗）
const emit = defineEmits(['close']);

const modalContentRef = ref(null);

// 点击外部关闭弹窗
const handleOutsideClick = (event) => {
    if (props.show && modalContentRef.value && !modalContentRef.value.contains(event.target)) {
        emit('close'); // 通知父组件关闭
    }
};

onMounted(() => {
    document.addEventListener('click', handleOutsideClick);
});

onBeforeUnmount(() => {
    document.removeEventListener('click', handleOutsideClick);
});
</script>

<style scoped>
.version-content {
    z-index: 200;
    position: fixed;
    bottom: 10%;
    left: 50%;
    transform: translateX(-50%);
    background: #fff;
    width: 450px;
    max-width: 90vw;
    height: 70%;
    border-radius: 10px;
    box-shadow: 10px 10px 20px 5px rgba(0, 0, 0, 0.25);
    padding: 16px;
    overflow-y: auto;
    display: block;
    padding-right: 12px;
}

/* 滚动条样式 */
.version-content::-webkit-scrollbar {
    width: 10px;
}

.version-content::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
}

.version-content::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 10px;
    transition: background 0.3s;
    min-height: 200px;
}

.version-content::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}

.version-content::-webkit-scrollbar-track-piece:start {
    border-radius: 10px 10px 0 0;
}

.version-content::-webkit-scrollbar-track-piece:end {
    border-radius: 0 0 10px 10px;
}
</style>