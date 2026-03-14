const Layout = () => import("@/layout/index.vue");

export default {
  path: "/tasks",
  name: "Tasks",
  component: Layout,
  redirect: "/tasks/list",
  meta: {
    icon: "ri:task-line",
    title: "任务",
    rank: 3
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
        roles: ["Admin", "ProjectManager", "Member", "DepartmentManager", 'ProjectDirector', 'BusinessDepartmentMembers']
      }
    }
  ]
} satisfies RouteConfigsTable;
