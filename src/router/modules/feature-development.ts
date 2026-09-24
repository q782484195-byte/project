const Layout = () => import("@/layout/index.vue");

export default {
  path: "/feature-development",
  name: "FeatureDevelopment",
  component: Layout,
  redirect: "/feature-development/index",
  meta: {
    icon: "ri:code-s-slash-line",
    title: "功能开发",
    rank: 3.5
  },
  children: [
    {
      path: "/feature-development/index",
      name: "FeatureDevelopmentIndex",
      component: () => import("@/views/projects/index.vue"),
      meta: {
        icon: "ri:code-box-line",
        title: "功能开发",
        showLink: true,
        showParent: false,
        defaultProjectType: "功能开发",
        roles: ["Admin", "ProjectManager", "Member", "DepartmentManager", 'ProjectDirector', 'BusinessDepartmentMembers']
      }
    },
    {
      path: "/feature-development/detail/:id/:state",
      name: "FeatureDevelopmentDetail",
      component: () => import("@/views/projects/detail.vue"),
      meta: {
        icon: "ri:file-info-line",
        title: "功能开发详情",
        showLink: false,
        defaultProjectType: "功能开发",
        activePath: "/feature-development/index",
        roles: ["Admin", "ProjectManager", "DepartmentManager", "Member", 'ProjectDirector', 'BusinessDepartmentMembers']
      }
    }
  ]
} satisfies RouteConfigsTable;
