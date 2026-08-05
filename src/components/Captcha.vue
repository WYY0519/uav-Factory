<template>
  <div class="captcha-container" @click="generateCaptcha">
    <!-- 显示验证码图片 -->
    <canvas
        ref="captchaCanvas"
        :width="width"
        :height="height"
        class="captcha-canvas"
    ></canvas>
    <!-- 刷新按钮 -->
    <!--    <button @click="generateCaptcha" class="refresh-button">-->
    <!--      换一张-->
    <!--    </button>-->
  </div>
</template>

<script>
export default {
  name: "Captcha",
  props: {
    width: {
      type: Number,
      default: 150,
    },
    height: {
      type: Number,
      default: 50,
    },
    modelValue: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      captchaText: 'INIT', // 保存验证码内容
    };
  },
  emits: ["update:modelValue"],
  mounted() {
    this.generateCaptcha(); // 初次加载生成验证码
  },
  methods: {
    // 生成随机字符串
    generateRandomText(length = 5) {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"; // 去掉容易混淆的字符
      let text = "";
      for (let i = 0; i < length; i++) {
        text += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return text;

    },

    // 生成验证码图片
    generateCaptcha() {
      const canvas = this.$refs.captchaCanvas;
      const ctx = canvas.getContext("2d");

      // 清空画布
      ctx.clearRect(0, 0, this.width, this.height);

      // 背景颜色
      ctx.fillStyle = this.generateRandomColor(180, 230);
      ctx.fillRect(0, 0, this.width, this.height);

      // 生成随机验证码文本
      this.captchaText = this.generateRandomText(4);
      this.$emit("update:modelValue", this.captchaText);
      //console.log('Generated Captcha:', this.captchaText);
      // 绘制验证码文本
      ctx.font = "30px Arial";
      ctx.textBaseline = "middle";
      for (let i = 0; i < this.captchaText.length; i++) {
        const char = this.captchaText[i];
        const x = (this.width / 5) * i + 10;
        const y = this.height / 2;
        ctx.fillStyle = this.generateRandomColor(50, 160);
        const angle = Math.random() * Math.PI / 4 * (Math.random() > 0.5 ? 1 : -1); // 随机角度
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillText(char, 0, 0);
        ctx.restore();
      }

      // 添加干扰线
      for (let i = 0; i < 5; i++) {
        ctx.strokeStyle = this.generateRandomColor(50, 160);
        ctx.beginPath();
        ctx.moveTo(
            Math.random() * this.width,
            Math.random() * this.height
        );
        ctx.lineTo(
            Math.random() * this.width,
            Math.random() * this.height
        );
        ctx.stroke();
      }

      // 添加干扰点
      for (let i = 0; i < 50; i++) {
        ctx.fillStyle = this.generateRandomColor(0, 255);
        ctx.beginPath();
        ctx.arc(
            Math.random() * this.width,
            Math.random() * this.height,
            1,
            0,
            2 * Math.PI
        );
        ctx.fill();
      }
    },

    // 生成随机颜色
    generateRandomColor(min, max) {
      const r = Math.floor(Math.random() * (max - min) + min);
      const g = Math.floor(Math.random() * (max - min) + min);
      const b = Math.floor(Math.random() * (max - min) + min);
      return `rgb(${r}, ${g}, ${b})`;
    },
  },
};
</script>

<style scoped>
.captcha-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.captcha-canvas {
  border: 1px solid #ccc;
  cursor: pointer;
}

.refresh-button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 5px 10px;
  font-size: 14px;
  cursor: pointer;
  border-radius: 4px;
}

.refresh-button:hover {
  background-color: #0056b3;
}
</style>
