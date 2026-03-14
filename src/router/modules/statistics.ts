const Layout = () => import("@/layout/index.vue");

export default {
  path: "/statistics",
  name: "Statistics",
  component: Layout,
  redirect: "/statistics/list",
  meta: {
    icon: "ri:pie-chart-line",
    title: "统计",
    rank: 1
  },
  children: [
    {
      path: "/statistics/list",
      name: "StatisticsList",
      component: () => import("@/views/statistics/index.vue"),
      meta: {
        title: "部门任务统计",
        showLink: true,
        showParent: true,
        roles: ["Admin", "ProjectManager"]
      }
    },
    {
      path: "/statistics/gantt",
      name: "Gantt",
      component: () => import("@/views/statistics/gantt.vue"),
      meta: {
        title: "甘特图",
        showLink: true,
        showParent: true,
        roles: ["Admin", "ProjectManager"]
      }
    }
  ]
} satisfies RouteConfigsTable;
