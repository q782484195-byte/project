<script setup lang="ts">
import { onLaunch } from "@dcloudio/uni-app";
import { useUserStore } from "@/stores/user";

onLaunch(() => {
  const userStore = useUserStore();
  userStore.restoreToken();
});
</script>

<style lang="scss">
@import "@/styles/global.scss";
</style>
