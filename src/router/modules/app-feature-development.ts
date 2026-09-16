const Layout = () => import("@/layout/index.vue");

export default {
  path: "/app-feature-development",
  name: "AppFeatureDevelopment",
  component: Layout,
  redirect: "/app-feature-development/index",
  meta: {
    icon: "ri:smartphone-line",
    title: "APP功能开发",
    rank: 3.6
  },
  children: [
    {
      path: "/app-feature-development/index",
      name: "AppFeatureDevelopmentIndex",
      component: () => import("@/views/projects/index.vue"),
      meta: {
        icon: "ri:apps-line",
        title: "APP功能开发列表",
        showLink: true,
        showParent: false,
        defaultProjectType: "APP功能开发",
        roles: ["Admin", "ProjectManager", "Member", "DepartmentManager", 'ProjectDirector', 'BusinessDepartmentMembers']
      }
    },
    {
      path: "/app-feature-development/detail/:id/:state",
      name: "AppFeatureDevelopmentDetail",
      component: () => import("@/views/projects/detail.vue"),
      meta: {
        icon: "ri:file-info-line",
        title: "APP功能开发详情",
        showLink: false,
        defaultProjectType: "APP功能开发",
        activePath: "/app-feature-development/index",
        roles: ["Admin", "ProjectManager", "DepartmentManager", "Member", 'ProjectDirector', 'BusinessDepartmentMembers']
      }
    }
  ]
} satisfies RouteConfigsTable;
