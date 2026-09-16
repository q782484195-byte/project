<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { configRef } from "@/config";
import { useUserStoreHook } from "@/store/modules/user";
import { isOneOfArray } from "@/router/utils";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import ListCheck from "~icons/ri/list-check-2";
import FolderLine from "~icons/ri/folder-line";
import CodeBoxLine from "~icons/ri/code-box-line";
import CalendarCheck from "~icons/ri/calendar-check-line";
import DashboardLine from "~icons/ri/dashboard-line";
import ArrowRight from "~icons/ri/arrow-right-s-line";

defineOptions({
  name: "Welcome"
});

const router = useRouter();
const userStore = useUserStoreHook();

const displayName = computed(() => userStore.nickname || userStore.username || "用户");
const systemTitle = computed(() => configRef.Title || "项目管理系统");

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 6) return "夜深了";
  if (hour < 12) return "早上好";
  if (hour < 14) return "中午好";
  if (hour < 18) return "下午好";
  return "晚上好";
});

const todayText = computed(() => {
  const now = new Date();
  const weekDays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  return `${now.getFullYear()} 年 ${now.getMonth() + 1} 月 ${now.getDate()} 日，${weekDays[now.getDay()]}`;
});

interface QuickLink {
  title: string;
  desc: string;
  path: string;
  icon: typeof FolderLine;
  color: string;
  roles: string[];
}

const allQuickLinks: QuickLink[] = [
  {
    title: "待办任务",
    desc: "查看和处理当前待办工作",
    path: "/workspace/index",
    icon: ListCheck,
    color: "#409eff",
    roles: ["Admin", "DepartmentManager", "Member"]
  },
  {
    title: "项目概览",
    desc: "了解项目整体运行状况",
    path: "/project-overview/index",
    icon: DashboardLine,
    color: "#909399",
    roles: ["Admin", "ProjectDirector", "ProjectManager", "BusinessDepartmentMembers"]
  },
  {
    title: "项目列表",
    desc: "浏览与管理所有项目",
    path: "/projects/index",
    icon: FolderLine,
    color: "#67c23a",
    roles: ["Admin", "ProjectManager", "Member", "DepartmentManager", "ProjectDirector", "BusinessDepartmentMembers"]
  },
  {
    title: "功能开发",
    desc: "管理功能开发类项目",
    path: "/feature-development/index",
    icon: CodeBoxLine,
    color: "#409eff",
    roles: ["Admin", "ProjectManager", "Member", "DepartmentManager", "ProjectDirector", "BusinessDepartmentMembers"]
  },
  {
    title: "APP功能开发",
    desc: "管理 APP 功能开发类项目",
    path: "/app-feature-development/index",
    icon: CodeBoxLine,
    color: "#626aef",
    roles: ["Admin", "ProjectManager", "Member", "DepartmentManager", "ProjectDirector", "BusinessDepartmentMembers"]
  },
  {
    title: "日常任务",
    desc: "记录与跟进日常工作",
    path: "/personal-task/list",
    icon: CalendarCheck,
    color: "#e6a23c",
    roles: ["Admin", "ProjectManager", "ProjectDirector"]
  }
];

const quickLinks = computed(() => {
  const userRoles = userStore.roles || [];
  return allQuickLinks.filter(link => isOneOfArray(link.roles, userRoles));
});

const welcomeTip = computed(() => {
  const titles = quickLinks.value.map(item => `「${item.title}」`);
  if (!titles.length) {
    return "请从左侧菜单进入你有权限的功能模块。";
  }
  if (titles.length === 1) {
    return `建议从 ${titles[0]} 开始，快速进入当前工作。`;
  }
  return `建议从 ${titles.slice(0, 2).join("或")} 开始，查看当前需要跟进的工作。`;
});

const features = [
  "统一管理项目、任务与需求，让协作信息集中可见",
  "支持待办工作台，快速定位需要处理的事项",
  "提供项目概览与统计视图，辅助进度跟踪与决策",
  "覆盖日常任务、工时记录等常见项目管理场景"
];

function goTo(path: string) {
  router.push(path);
}
</script>

<template>
  <div class="welcome-page">
    <section class="welcome-hero">
      <div class="welcome-hero__content">
        <p class="welcome-hero__date">{{ todayText }}</p>
        <h1 class="welcome-hero__title">
          {{ greeting }}，{{ displayName }}
        </h1>
        <p class="welcome-hero__subtitle">
          欢迎使用 {{ systemTitle }}。在这里你可以高效地管理项目进度、处理待办任务，并与团队保持同步。
        </p>
      </div>
      <div class="welcome-hero__badge">
        <span class="welcome-hero__badge-label">系统版本</span>
        <span class="welcome-hero__badge-value">{{ configRef.Version || "6.x" }}</span>
      </div>
    </section>

    <section v-if="quickLinks.length" class="welcome-section">
      <h2 class="welcome-section__title">快捷入口</h2>
      <el-row :gutter="16">
        <el-col v-for="item in quickLinks" :key="item.path" :xs="24" :sm="12" :lg="6">
          <button type="button" class="quick-card" @click="goTo(item.path)">
            <span class="quick-card__icon" :style="{ backgroundColor: `${item.color}18`, color: item.color }">
              <component :is="useRenderIcon(item.icon)" />
            </span>
            <span class="quick-card__body">
              <span class="quick-card__title">{{ item.title }}</span>
              <span class="quick-card__desc">{{ item.desc }}</span>
            </span>
            <component :is="useRenderIcon(ArrowRight)" class="quick-card__arrow" />
          </button>
        </el-col>
      </el-row>
    </section>

    <el-row :gutter="16" class="welcome-bottom">
      <el-col :xs="24" :lg="14">
        <el-card shadow="never" class="welcome-card">
          <template #header>
            <span class="welcome-card__header">关于本系统</span>
          </template>
          <p class="welcome-card__intro">
            {{ systemTitle }} 面向团队日常项目管理，帮助你将分散在项目、任务与需求中的信息整合到同一平台，
            减少切换成本，让进度跟踪与协作沟通更加顺畅。
          </p>
          <ul class="welcome-card__list">
            <li v-for="(text, index) in features" :key="index">{{ text }}</li>
          </ul>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="10">
        <el-card shadow="never" class="welcome-card welcome-card--tip">
          <template #header>
            <span class="welcome-card__header">开始使用</span>
          </template>
          <p class="welcome-card__tip">
            {{ welcomeTip }}
          </p>
          <div v-if="quickLinks.length" class="welcome-card__actions">
            <el-button v-for="item in quickLinks.slice(0, 3)" :key="item.path" @click="goTo(item.path)">
              {{ item.title }}
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.welcome-page {
  min-height: 100%;
  padding: 4px 2px 24px;
}

.welcome-hero {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 28px 32px;
  margin-bottom: 20px;
  overflow: hidden;
  border-radius: 12px;
  background: linear-gradient(135deg, #ecf5ff 0%, #f0f9ff 45%, #fafcff 100%);
  border: 1px solid var(--el-border-color-lighter);

  &::before {
    content: "";
    position: absolute;
    top: -40px;
    right: -20px;
    width: 180px;
    height: 180px;
    border-radius: 50%;
    background: radial-gradient(circle, rgb(64 158 255 / 12%) 0%, transparent 70%);
    pointer-events: none;
  }
}

.welcome-hero__content {
  position: relative;
  z-index: 1;
  max-width: 720px;
}

.welcome-hero__date {
  margin: 0 0 8px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.welcome-hero__title {
  margin: 0 0 12px;
  font-size: 28px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--el-text-color-primary);
}

.welcome-hero__subtitle {
  margin: 0;
  font-size: 15px;
  line-height: 1.7;
  color: var(--el-text-color-regular);
}

.welcome-hero__badge {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 88px;
  padding: 12px 16px;
  border-radius: 10px;
  background: rgb(255 255 255 / 72%);
  border: 1px solid rgb(64 158 255 / 18%);
}

.welcome-hero__badge-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.welcome-hero__badge-value {
  margin-top: 4px;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-color-primary);
}

.welcome-section {
  margin-bottom: 20px;
}

.welcome-section__title {
  margin: 0 0 14px;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.quick-card {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  margin-bottom: 16px;
  padding: 18px 16px;
  text-align: left;
  cursor: pointer;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-bg-color);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;

  &:hover {
    border-color: var(--el-color-primary-light-5);
    box-shadow: 0 6px 18px rgb(64 158 255 / 10%);
    transform: translateY(-1px);
  }
}

.quick-card__icon {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  font-size: 22px;
}

.quick-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.quick-card__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.quick-card__desc {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.quick-card__arrow {
  flex-shrink: 0;
  font-size: 18px;
  color: var(--el-text-color-placeholder);
}

.welcome-bottom {
  align-items: stretch;
}

.welcome-card {
  height: 100%;
  margin-bottom: 16px;
  border-radius: 10px;

  :deep(.el-card__header) {
    padding: 16px 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  :deep(.el-card__body) {
    padding: 20px;
  }
}

.welcome-card__header {
  font-size: 15px;
  font-weight: 600;
}

.welcome-card__intro {
  margin: 0 0 16px;
  font-size: 14px;
  line-height: 1.8;
  color: var(--el-text-color-regular);
}

.welcome-card__list {
  margin: 0;
  padding-left: 18px;
  font-size: 14px;
  line-height: 1.9;
  color: var(--el-text-color-regular);
}

.welcome-card__tip {
  margin: 0 0 20px;
  font-size: 14px;
  line-height: 1.8;
  color: var(--el-text-color-regular);
}

.welcome-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

@media (width <=768px) {
  .welcome-hero {
    flex-direction: column;
    padding: 20px 18px;
  }

  .welcome-hero__title {
    font-size: 22px;
  }

  .welcome-hero__badge {
    align-self: flex-start;
    flex-direction: row;
    gap: 8px;
    min-width: auto;
  }

  .welcome-hero__badge-value {
    margin-top: 0;
  }
}
</style>
