const Layout = () => import("@/layout/index.vue");

export default {
  path: "/system",
  name: "System",
  component: Layout,
  redirect: "/system/user",
  meta: {
    icon: "ri:settings-3-line",
    title: "系统",
    rank: 10
  },
  children: [
    {
      path: "/system/department",
      name: "SystemDepartment",
      component: () => import("@/views/system/department/index.vue"),
      meta: {
        title: "部门",
        showParent: true,
        roles: ["Admin"] // 只有 Admin 角色可以访
      }
    },
    {
      path: "/system/user",
      name: "SystemUser",
      component: () => import("@/views/system/user/index.vue"),
      meta: {
        title: "用户",
        showParent: true,
        roles: ["Admin", "DepartmentManager"] // Admin 和 DepartmentManager 角色可以访问
      }
    }
  ]
} satisfies RouteConfigsTable;
