const { VITE_HIDE_HOME } = import.meta.env;
const Layout = () => import("@/layout/index.vue");

export default {
  path: "/dashboard",
  name: "Dashboard",
  component: Layout,
  redirect: "/dashboard/index",
  meta: {
    icon: "ri:bar-chart-line",
    title: "数据统计",
    rank: 1
  },
  children: [
    {
      path: "/dashboard/index",
      name: "DashboardIndex",
      component: () => import("@/views/dashboard/index.vue"),
      meta: {
        title: "数据统计",
        showLink: VITE_HIDE_HOME === "true" ? false : true
      }
    }
  ]
} satisfies RouteConfigsTable;

