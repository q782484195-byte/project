<script setup lang="ts">
import { onLaunch } from "@dcloudio/uni-app";
import { useUserStore } from "@/stores/user";

onLaunch(() => {
  const userStore = useUserStore();
  userStore.restoreToken();

  // 已登录则进入工作台，避免每次冷启动都停在登录页
  if (userStore.isLoggedIn) {
    uni.switchTab({ url: "/pages/workspace/index" });
  }
});
</script>

<style lang="scss">
@import "@/styles/global.scss";
</style>
