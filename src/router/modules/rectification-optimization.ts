const Layout = () => import("@/layout/index.vue");

export default {
  path: "/rectification-optimization",
  name: "RectificationOptimization",
  component: Layout,
  redirect: "/rectification-optimization/index",
  meta: {
    icon: "ri:tools-line",
    title: "整改优化",
    rank: 3.55
  },
  children: [
    {
      path: "/rectification-optimization/index",
      name: "RectificationOptimizationIndex",
      component: () => import("@/views/projects/index.vue"),
      meta: {
        icon: "ri:hammer-line",
        title: "整改优化",
        showLink: true,
        showParent: false,
        defaultProjectType: "整改优化",
        roles: ["Admin", "ProjectManager", "Member", "DepartmentManager", 'ProjectDirector', 'BusinessDepartmentMembers']
      }
    },
    {
      path: "/rectification-optimization/detail/:id/:state",
      name: "RectificationOptimizationDetail",
      component: () => import("@/views/projects/detail.vue"),
      meta: {
        icon: "ri:file-info-line",
        title: "整改优化详情",
        showLink: false,
        defaultProjectType: "整改优化",
        activePath: "/rectification-optimization/index",
        roles: ["Admin", "ProjectManager", "DepartmentManager", "Member", 'ProjectDirector', 'BusinessDepartmentMembers']
      }
    }
  ]
} satisfies RouteConfigsTable;
