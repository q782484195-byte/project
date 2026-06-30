const Layout = () => import("@/layout/index.vue");

export default {
  path: "/personal-task",
  name: "PersonalTask",
  component: Layout,
  redirect: "/personal-task/list",
  meta: {
    icon: "ri:task-line",
    title: "个人任务",
    rank: 5,
    /** 不在侧边栏展示「任务」模块，仍保留路由供项目卡片等跳转 */
    showLink: true
  },
  children: [
    {
      path: "/personal-task/list",
      name: "PersonalTaskList",
      component: () => import("@/views/personal-task/index.vue"),
      meta: {
        title: "日常任务",
        showLink: true,
        showParent: false,
        roles: ["Admin", "ProjectManager", 'ProjectDirector']
      }
    },
    // {
    //   path: "/tasks/detail/:id",
    //   name: "TaskDetail",
    //   component: () => import("@/views/tasks/detail.vue"),
    //   meta: {
    //     title: "任务详情",
    //     showLink: false,
    //     /** 侧边栏高亮任务列表 */
    //     activePath: "/tasks/list",
    //     /** 允许在标签栏同时打开多个任务详情（超出后关闭最早打开的） */
    //     dynamicLevel: 15,
    //     roles: ["Admin", "ProjectManager", "Member", "DepartmentManager", 'ProjectDirector', 'BusinessDepartmentMembers']
    //   }
    // }
  ]
} satisfies RouteConfigsTable;
