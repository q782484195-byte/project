export default {
  path: "/error",
  redirect: "/error/403",
  meta: {
    icon: "ri/information-line",
    showLink: false,
    title: "异常页面",
    rank: 9
  },
  children: [
    {
      path: "/error/403",
      name: "403",
      component: () => import("@/views/error/403.vue"),
      meta: {
        icon: "ri:shield-keyhole-line",
        title: "403"
      }
    },
    {
      path: "/error/404",
      name: "404",
      component: () => import("@/views/error/404.vue"),
      meta: {
        icon: "ri:file-search-line",
        title: "404"
      }
    },
    {
      path: "/error/500",
      name: "500",
      component: () => import("@/views/error/500.vue"),
      meta: {
        icon: "ri:server-line",
        title: "500"
      }
    }
  ]
} satisfies RouteConfigsTable;
