const Layout = () => import("@/layout/index.vue");

export default {
  path: "/requirements",
  name: "Requirements",
  component: Layout,
  redirect: "/requirements/list",
  meta: {
    icon: "ri:file-list-line",
    title: "层级",
    rank: 2
  },
  children: [
    {
      path: "/requirements/list",
      name: "RequirementsList",
      component: () => import("@/views/requirements/index.vue"),
      meta: {
        title: "层级列表",
        showLink: true,
        showParent: true,
        roles: ["Admin", "ProjectManager", "ProjectDirector"]
      }
    },
    {
      path: "/requirements/detail/:id",
      name: "RequirementDetail",
      component: () => import("@/views/requirements/detail.vue"),
      meta: {
        title: "需求详情",
        showLink: false,
        roles: ["Admin", "ProjectManager", "ProjectDirector"]
      }
    }
  ]
} satisfies RouteConfigsTable;
