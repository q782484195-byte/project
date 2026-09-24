const Layout = () => import("@/layout/index.vue");

export default {
  path: "/app-version",
  name: "AppVersionControl",
  component: Layout,
  redirect: "/app-version/index",
  meta: {
    icon: "ri:git-branch-line",
    title: "APP版本控制",
    rank: 3.55
  },
  children: [
    {
      path: "/app-version/index",
      name: "AppVersionControlIndex",
      component: () => import("@/views/app-version/index.vue"),
      meta: {
        icon: "ri:smartphone-line",
        title: "APP版本控制",
        showLink: true,
        showParent: false,
        roles: ["Admin"]
      }
    }
  ]
} satisfies RouteConfigsTable;
