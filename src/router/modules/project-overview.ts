const Layout = () => import("@/layout/index.vue");
const { VITE_HIDE_HOME } = import.meta.env;
export default {
  path: "/project-overview",
  name: "ProjectOverviewRoot",
  component: Layout,
  redirect: "/project-overview/index",
  meta: {
    icon: "ri:dashboard-line",
    title: "项目概览",
    rank: 2
  },
  children: [
    {
      path: "/project-overview/index",
      name: "ProjectsOverview",
      component: () => import("@/views/projects/overview.vue"),
      meta: {
        icon: "ri:table-line",
        title: "项目概览表",
        showLink: true,
        showParent: true,
        roles: ["Admin", "ProjectDirector", "ProjectManager", "BusinessDepartmentMembers"]
      },
    },
    {
      path: "/project-overview/dashboard",
      name: "ProjectOverviewDashboard",
      component: () => import("@/views/dashboard/index.vue"),
      meta: {
        icon: "ri:pie-chart-line",
        title: "项目汇总",
        showLink: VITE_HIDE_HOME === "true" ? false : true,
        roles: ["Admin", "ProjectManager"]
      }
    }
  ]
} satisfies RouteConfigsTable;
