import { defineStore } from "pinia";
import type { TaskListFilter } from "@/utils/task-filter";

export const useTaskNavStore = defineStore("taskNav", {
  state: () => ({
    pendingFilter: null as TaskListFilter | null
  }),
  actions: {
    navigateToTasks(filter: TaskListFilter) {
      this.pendingFilter = filter;
      uni.switchTab({ url: "/pages/tasks/index" });
    },
    consumeFilter() {
      const filter = this.pendingFilter;
      this.pendingFilter = null;
      return filter;
    }
  }
});
