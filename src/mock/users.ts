import type { User } from "@/types";

export const mockUsers: (User & { role?: string })[] = [
  {
    id: "1",
    name: "张三",
    email: "zhangsan@example.com",
    avatar: "",
    role: "project_manager"
  },
  {
    id: "2",
    name: "李四",
    email: "lisi@example.com",
    avatar: "",
    role: "project_manager"
  },
  {
    id: "3",
    name: "王五",
    email: "wangwu@example.com",
    avatar: "",
    role: "backend_developer"
  },
  {
    id: "4",
    name: "赵六",
    email: "zhaoliu@example.com",
    avatar: "",
    role: "ui_designer"
  }
];
