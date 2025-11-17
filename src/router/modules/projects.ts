const Layout = () => import("@/layout/index.vue");

export default {
  path: "/projects",
  name: "Projects",
  component: Layout,
  redirect: "/projects/index",
  meta: {
    icon: "ri/folder-line",
    title: "项目管理",
    rank: 1
  },
  children: [
    {
      path: "/projects/index",
      name: "ProjectsIndex",
      component: () => import("@/views/projects/index.vue"),
      meta: {
        title: "项目管理",
        showLink: true
      }
    },
    {
      path: "/projects/detail/:id",
      name: "ProjectDetail",
      component: () => import("@/views/projects/detail.vue"),
      meta: {
        title: "项目详情",
        showLink: false
      }
    },
    {
      path: "/projects/types",
      name: "ProjectTypes",
      component: () => import("@/views/projects/types/index.vue"),
      meta: {
        title: "项目类型管理",
        showLink: true
      }
    },
    {
      path: "/projects/templates",
      name: "ProjectTemplates",
      component: () => import("@/views/projects/templates/index.vue"),
      meta: {
        title: "项目模板管理",
        showLink: true
      }
    }
  ]
} satisfies RouteConfigsTable;
