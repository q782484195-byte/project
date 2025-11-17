const Layout = () => import("@/layout/index.vue");

export default {
  path: "/requirements",
  name: "Requirements",
  component: Layout,
  redirect: "/requirements/index",
  meta: {
    icon: "ri:file-list-line",
    title: "需求管理",
    rank: 2
  },
  children: [
    {
      path: "/requirements/index",
      name: "RequirementsIndex",
      component: () => import("@/views/requirements/index.vue"),
      meta: {
        title: "需求管理",
        showLink: true
      }
    },
    {
      path: "/requirements/detail/:id",
      name: "RequirementDetail",
      component: () => import("@/views/requirements/detail.vue"),
      meta: {
        title: "需求详情",
        showLink: false
      }
    }
  ]
} satisfies RouteConfigsTable;
