const Layout = () => import("@/layout/index.vue");

export default {
  path: "/personal-task",
  name: "PersonalTask",
  component: Layout,
  redirect: "/personal-task/list",
  meta: {
    icon: "ri:task-line",
    title: "日常任务",
    rank: 5,
    /** 不在侧边栏展示「任务」模块，仍保留路由供项目卡片等跳转 */
    showLink: true
  },
  children: [
    {
      path: "/personal-task/list",
      name: "PersonalTaskList",
      component: () => import("@/views/personal-task/index.vue"),
      meta: {
        icon: "ri:calendar-check-line",
        title: "日常任务",
        showLink: true,
        showParent: false,
        roles: ["Admin", "ProjectManager", 'ProjectDirector']
      }
    },
    {
      path: "/personal-task/detail/:id",
      name: "PersonalTaskDetail",
      component: () => import("@/views/personal-task/detail.vue"),
      meta: {
        icon: "ri:file-info-line",
        title: "任务详情",
        showLink: false,
        activePath: "/personal-task/list",
        roles: ["Admin", "ProjectManager", "ProjectDirector", "DepartmentManager"]
      }
    }
  ]
} satisfies RouteConfigsTable;
