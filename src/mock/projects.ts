import type { Project } from "@/types";
import { mockUsers } from "./users";

export const mockProjects: Project[] = [
  {
    id: "1",
    name: "项目管理系统",
    description: "企业级项目管理系统开发",
    status: "active",
    progress: 75,
    startDate: "2024-01-01",
    endDate: "2024-06-30",
    managerId: "1",
    manager: mockUsers[0],
    members: [
      { id: "1", name: mockUsers[0].name, role: "project_manager" },
      { id: "2", name: mockUsers[1].name, role: "frontend_developer" },
      { id: "3", name: mockUsers[2].name, role: "backend_developer" }
    ],
    budget: 500000,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z"
  },
  {
    id: "2",
    name: "移动端应用",
    description: "iOS和Android移动应用开发",
    status: "active",
    progress: 45,
    startDate: "2024-02-01",
    endDate: "2024-08-31",
    managerId: "2",
    manager: mockUsers[1],
    members: [
      { id: "2", name: mockUsers[1].name, role: "project_manager" },
      { id: "3", name: mockUsers[2].name, role: "frontend_developer" },
      { id: "4", name: mockUsers[3].name, role: "ui_designer" }
    ],
    budget: 800000,
    createdAt: "2024-02-01T00:00:00Z",
    updatedAt: "2024-02-15T00:00:00Z"
  },
  {
    id: "3",
    name: "数据分析平台",
    description: "大数据分析和可视化平台",
    status: "active",
    progress: 30,
    startDate: "2024-03-01",
    endDate: "2024-09-30",
    managerId: "1",
    manager: mockUsers[0],
    members: [
      { id: "1", name: mockUsers[0].name, role: "project_manager" },
      { id: "3", name: mockUsers[2].name, role: "backend_developer" }
    ],
    budget: 600000,
    createdAt: "2024-03-01T00:00:00Z",
    updatedAt: "2024-03-10T00:00:00Z"
  },
  {
    id: "4",
    name: "API网关",
    description: "微服务API网关开发",
    status: "completed",
    progress: 100,
    startDate: "2023-10-01",
    endDate: "2023-12-31",
    managerId: "2",
    manager: mockUsers[1],
    members: [
      { id: "2", name: mockUsers[1].name, role: "project_manager" },
      { id: "3", name: mockUsers[2].name, role: "backend_developer" }
    ],
    budget: 300000,
    createdAt: "2023-10-01T00:00:00Z",
    updatedAt: "2023-12-31T00:00:00Z"
  }
];
