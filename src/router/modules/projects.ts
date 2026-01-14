const Layout = () => import("@/layout/index.vue");

export default {
  path: "/projects",
  name: "Projects",
  component: Layout,
  redirect: "/projects/index",
  meta: {
    icon: "ri/folder-line",
    title: "项目",
    rank: 1
  },
  children: [
    {
      path: "/projects/index",
      name: "ProjectsIndex",
      component: () => import("@/views/projects/index.vue"),
      meta: {
        title: "项目列表",
        showLink: true,
        showParent: true,
        roles: ["Admin", "ProjectManager", "Member", "DepartmentManager", 'ProjectDirector']
      }
    },
    {
      path: "/projects/detail/:id",
      name: "ProjectDetail",
      component: () => import("@/views/projects/detail.vue"),
      meta: {
        title: "项目详情",
        showLink: false,
        roles: ["Admin", "ProjectManager", "DepartmentManager", "Member", 'ProjectDirector']
      }
    },
    // {
    //   path: "/projects/types",
    //   name: "ProjectTypes",
    //   component: () => import("@/views/projects/types/index.vue"),
    //   meta: {
    //     title: "项目类型",
    //     showLink: true,
    //     roles: ["Admin", "ProjectManager"]
    //   }
    // },
    // {
    //   path: "/projects/templates",
    //   name: "ProjectTemplates",
    //   component: () => import("@/views/projects/templates/index.vue"),
    //   meta: {
    //     title: "项目模板",
    //     showLink: true,
    //     roles: ["Admin", "ProjectManager"]
    //   }
    // }
  ]
} satisfies RouteConfigsTable;
