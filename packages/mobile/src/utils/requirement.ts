import type { RequirementItem } from "@/api/requirement";

function isRequirementItem(obj: unknown): obj is RequirementItem {
  return (
    !!obj &&
    typeof obj === "object" &&
    "_id" in obj &&
    "需求名" in obj
  );
}

export function flattenRequirementData(
  data: RequirementItem[] | Record<string, unknown> | undefined | null
): RequirementItem[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;

  const result: RequirementItem[] = [];
  const flatten = (obj: unknown) => {
    if (isRequirementItem(obj)) {
      result.push(obj);
      return;
    }
    if (obj && typeof obj === "object" && !Array.isArray(obj)) {
      Object.values(obj).forEach(flatten);
    }
  };
  flatten(data);
  return result;
}

export function mapRequirementOptions(items: RequirementItem[]) {
  return items.map((item) => ({
    id: item._id,
    name: item.需求名,
    state: item.状态 || "-",
    priority: item.优先级 || "-",
    projectId: item.project_id || "",
    projectName: item.project_name || ""
  }));
}
