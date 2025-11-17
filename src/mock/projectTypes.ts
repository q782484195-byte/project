import type { ProjectTypeConfig, ProjectTypeField } from "@/types";
import { ProjectType } from "@/types";

export const mockProjectTypeFields: ProjectTypeField[] = [
  {
    id: "1",
    name: "budget",
    label: "项目预算",
    type: "number",
    required: true,
    defaultValue: 0,
    order: 1
  },
  {
    id: "2",
    name: "priority",
    label: "项目优先级",
    type: "select",
    required: true,
    defaultValue: "medium",
    options: ["low", "medium", "high", "urgent"],
    order: 2
  },
  {
    id: "3",
    name: "technology",
    label: "技术栈",
    type: "text",
    required: false,
    defaultValue: "",
    order: 3
  }
];

export const mockProjectTypeConfigs: ProjectTypeConfig[] = [
  {
    id: "1",
    name: "软件开发项目",
    code: "SOFTWARE",
    description: "标准软件开发项目，包含需求分析、设计、开发、测试、部署等阶段",
    type: ProjectType.SOFTWARE,
    defaultTemplateId: "1",
    customFields: [
      mockProjectTypeFields[0],
      mockProjectTypeFields[1],
      mockProjectTypeFields[2]
    ],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "2",
    name: "硬件研发项目",
    code: "HARDWARE",
    description: "硬件产品研发项目，包含设计、原型制作、测试、量产等阶段",
    type: ProjectType.HARDWARE,
    defaultTemplateId: "2",
    customFields: [mockProjectTypeFields[0], mockProjectTypeFields[1]],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "3",
    name: "研发项目",
    code: "RESEARCH",
    description: "技术研发和探索项目，包含调研、实验、验证等阶段",
    type: ProjectType.RESEARCH,
    defaultTemplateId: "3",
    customFields: [
      mockProjectTypeFields[0],
      mockProjectTypeFields[1],
      mockProjectTypeFields[2]
    ],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  }
];

export function getAllProjectTypeConfigs(): ProjectTypeConfig[] {
  return mockProjectTypeConfigs;
}

export function getProjectTypeConfigById(
  id: string
): ProjectTypeConfig | undefined {
  return mockProjectTypeConfigs.find(config => config.id === id);
}
