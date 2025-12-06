const { VITE_HIDE_HOME } = import.meta.env;
const Layout = () => import("@/layout/index.vue");

export default {
  path: "/",
  name: "Home",
  component: Layout,
  redirect: "/workspace",
  meta: {
    icon: "ep/home-filled",
    title: "工作台",
    rank: 0
  },
  children: [
    {
      path: "/workspace",
      name: "Workspace",
      component: () => import("@/views/workspace/index.vue"),
      meta: {
        title: "工作台",
        showLink: VITE_HIDE_HOME === "true" ? false : true,
        roles: ["Admin", "DepartmentManager", "Member"]
      }
    }
  ]
} satisfies RouteConfigsTable;
