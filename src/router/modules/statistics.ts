// const Layout = () => import("@/layout/index.vue");

// export default {
//   path: "/statistics",
//   name: "Statistics",
//   component: Layout,
//   redirect: "/statistics/gantt",
//   meta: {
//     icon: "ri:pie-chart-line",
//     title: "统计",
//     rank: 4
//   },
//   children: [
//     {
//       path: "/statistics/gantt",
//       name: "Gantt",
//       component: () => import("@/views/statistics/gantt.vue"),
//       meta: {
//         title: "甘特图",
//         showLink: true,
//         showParent: true,
//         roles: ["Admin", "ProjectManager", "ProjectDirector"]
//       }
//     }
//   ]
// } satisfies RouteConfigsTable;
