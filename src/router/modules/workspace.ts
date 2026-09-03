const Layout = () => import("@/layout/index.vue");

export default {
  path: "/workspace",
  name: "WorkspaceRoot",
  component: Layout,
  redirect: "/workspace/index",
  meta: {
    icon: "ri:list-check-2",
    title: "待办任务",
    rank: 1
  },
  children: [
    {
      path: "/workspace/index",
      name: "Workspace",
      component: () => import("@/views/workspace/index.vue"),
      meta: {
        icon: "ri:list-check-2",
        title: "待办任务",
        showLink: true,
        showParent: false,
        roles: ["Admin", "DepartmentManager", "Member"]
      }
    }
  ]
} satisfies RouteConfigsTable;
