import type { ProjectTemplate, ProjectTemplateNode } from "@/types";
import { mockUsers } from "./users";
import { getAllProjectTypeConfigs } from "./projectTypes";

const createSimpleTemplateNode = (
  id: string,
  name: string,
  type: "phase" | "milestone" | "task",
  order: number
): ProjectTemplateNode => ({
  id,
  templateId: "1",
  name,
  description: `${name}描述`,
  type,
  level: type === "phase" ? 1 : type === "milestone" ? 2 : 3,
  order,
  estimatedDays: type === "phase" ? 10 : type === "milestone" ? 5 : 2,
  assigneeRole:
    type === "phase"
      ? "项目经理"
      : type === "milestone"
        ? "开发工程师"
        : "开发工程师",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z"
});

export const mockProjectTemplates: ProjectTemplate[] = [
  {
    id: "1",
    name: "标准软件开发模板",
    description:
      "适用于标准软件开发项目的模板，包含需求分析、设计、开发、测试、部署等完整阶段",
    typeId: "1",
    type: getAllProjectTypeConfigs().find(t => t.id === "1"),
    rootNode: createSimpleTemplateNode("phase-1", "需求分析阶段", "phase", 1),
    nodes: [
      createSimpleTemplateNode("phase-1", "需求分析阶段", "phase", 1),
      createSimpleTemplateNode("milestone-1-1", "需求调研", "milestone", 1),
      createSimpleTemplateNode("task-1-1-1", "需求收集", "task", 1),
      createSimpleTemplateNode("phase-2", "设计阶段", "phase", 2),
      createSimpleTemplateNode("milestone-2-1", "架构设计", "milestone", 1),
      createSimpleTemplateNode("task-2-1-1", "技术选型", "task", 1)
    ],
    usageCount: 15,
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    createdBy: "1",
    createdByUser: mockUsers[0]
  },
  {
    id: "2",
    name: "硬件研发模板",
    description: "适用于硬件产品研发项目的模板",
    typeId: "2",
    type: getAllProjectTypeConfigs().find(t => t.id === "2"),
    rootNode: createSimpleTemplateNode("phase-1", "设计阶段", "phase", 1),
    nodes: [
      createSimpleTemplateNode("phase-1", "设计阶段", "phase", 1),
      createSimpleTemplateNode("milestone-1-1", "原型制作", "milestone", 1)
    ],
    usageCount: 5,
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    createdBy: "1",
    createdByUser: mockUsers[0]
  }
];

export function getAllProjectTemplates(): ProjectTemplate[] {
  return mockProjectTemplates;
}

export function getProjectTemplateById(
  id: string
): ProjectTemplate | undefined {
  return mockProjectTemplates.find(template => template.id === id);
}

export function getProjectTemplatesByTypeId(typeId: string): ProjectTemplate[] {
  return mockProjectTemplates.filter(template => template.typeId === typeId);
}
