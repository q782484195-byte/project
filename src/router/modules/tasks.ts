const Layout = () => import("@/layout/index.vue");

export default {
  path: "/tasks",
  name: "Tasks",
  component: Layout,
  redirect: "/tasks/list",
  meta: {
    icon: "ri:task-line",
    title: "任务",
    rank: 5,
    /** 不在侧边栏展示「任务」模块，仍保留路由供项目卡片等跳转 */
    showLink: false
  },
  children: [
    {
      path: "/tasks/list",
      name: "TasksList",
      component: () => import("@/views/tasks/index.vue"),
      meta: {
        title: "任务列表",
        showLink: true,
        showParent: true,
        roles: ["Admin", "ProjectManager", "Member", "DepartmentManager", 'ProjectDirector', 'BusinessDepartmentMembers']
      }
    },
    {
      path: "/tasks/time-tracking",
      name: "TimeTracking",
      component: () => import("@/views/tasks/time-tracking.vue"),
      meta: {
        title: "工时统计",
        showLink: true,
        roles: ["Admin", "ProjectManager", "DepartmentManager", 'ProjectDirector', 'BusinessDepartmentMembers']
      }
    },
    // {
    //   path: "/tasks/department-task",
    //   name: "DepartmentTask",
    //   component: () => import("@/views/tasks/department-task-statistics.vue"),
    //   meta: {
    //     title: "部门任务统计",
    //     showLink: true,
    //     roles: ["Admin", "ProjectManager", 'ProjectDirector', 'BusinessDepartmentMembers']
    //   }
    // },
    {
      path: "/tasks/detail/:id",
      name: "TaskDetail",
      component: () => import("@/views/tasks/detail.vue"),
      meta: {
        title: "任务详情",
        showLink: false,
        /** 侧边栏高亮任务列表 */
        activePath: "/tasks/list",
        /** 允许在标签栏同时打开多个任务详情（超出后关闭最早打开的） */
        dynamicLevel: 15,
        roles: ["Admin", "ProjectManager", "Member", "DepartmentManager", 'ProjectDirector', 'BusinessDepartmentMembers']
      }
    }
  ]
} satisfies RouteConfigsTable;
