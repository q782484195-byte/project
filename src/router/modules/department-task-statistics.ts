const Layout = () => import("@/layout/index.vue");

export default {
  path: "/department-task-statistics",
  name: "DepartmentTaskStatisticsRoot",
  component: Layout,
  redirect: "/department-task-statistics/index",
  meta: {
    icon: "ri:bar-chart-horizontal-line",
    title: "任务统计",
    rank: 4
  },
  children: [
    {
      path: "/department-task-statistics/index",
      name: "StatisticsList",
      component: () => import("@/views/statistics/index.vue"),
      meta: {
        title: "任务统计",
        showLink: true,
        showParent: false,
        roles: ["Admin", "ProjectManager", "ProjectDirector", "DepartmentManager", "BusinessDepartmentMembers"]
      }
    }
  ]
} satisfies RouteConfigsTable;
