/** 定制项目类型标识 */
export const CUSTOM_PROJECT_TYPE = "定制项目";

/** 公模项目类型标识 */
export const PUBLIC_MODEL_PROJECT_TYPE = "公模项目";

/** 功能开发项目类型标识 */
export const FEATURE_DEVELOPMENT_TYPE = "功能开发";

/** APP功能开发项目类型标识 */
export const APP_FEATURE_DEVELOPMENT_TYPE = "APP功能开发";

/** 整改优化项目类型标识 */
export const RECTIFICATION_OPTIMIZATION_TYPE = "整改优化";

/** 是否为功能开发项目类型 */
export function isFeatureDevelopmentType(projectType?: string) {
  return projectType === FEATURE_DEVELOPMENT_TYPE;
}

/** 是否为 APP 功能开发项目类型 */
export function isAppFeatureDevelopmentType(projectType?: string) {
  return projectType === APP_FEATURE_DEVELOPMENT_TYPE;
}

/** 是否为整改优化项目类型 */
export function isRectificationOptimizationType(projectType?: string) {
  return projectType === RECTIFICATION_OPTIMIZATION_TYPE;
}

/** 项目概览、统计筛选等页面的项目类型 Tab 列表 */
export const PROJECT_OVERVIEW_TYPE_TABS = [
  CUSTOM_PROJECT_TYPE,
  PUBLIC_MODEL_PROJECT_TYPE,
  FEATURE_DEVELOPMENT_TYPE,
  APP_FEATURE_DEVELOPMENT_TYPE,
  RECTIFICATION_OPTIMIZATION_TYPE
] as const;

export type ProjectOverviewTypeTab = (typeof PROJECT_OVERVIEW_TYPE_TABS)[number];

export function isProjectOverviewTypeTab(
  value?: string
): value is ProjectOverviewTypeTab {
  return (
    value !== undefined &&
    (PROJECT_OVERVIEW_TYPE_TABS as readonly string[]).includes(value)
  );
}

/** 列表页共用简化展示的项目类型（隐藏主板等字段） */
export function isSimplifiedProjectListType(projectType?: string) {
  return (
    isFeatureDevelopmentType(projectType) ||
    isAppFeatureDevelopmentType(projectType) ||
    isRectificationOptimizationType(projectType)
  );
}

const DETAIL_ROUTE_BY_TYPE: Record<string, string> = {
  [FEATURE_DEVELOPMENT_TYPE]: "FeatureDevelopmentDetail",
  [APP_FEATURE_DEVELOPMENT_TYPE]: "AppFeatureDevelopmentDetail",
  [RECTIFICATION_OPTIMIZATION_TYPE]: "RectificationOptimizationDetail"
};

const INDEX_ROUTE_BY_TYPE: Record<string, string> = {
  [FEATURE_DEVELOPMENT_TYPE]: "FeatureDevelopmentIndex",
  [APP_FEATURE_DEVELOPMENT_TYPE]: "AppFeatureDevelopmentIndex",
  [RECTIFICATION_OPTIMIZATION_TYPE]: "RectificationOptimizationIndex"
};

/** 根据项目类型解析详情页路由名 */
export function getProjectDetailRouteName(projectType?: string) {
  return DETAIL_ROUTE_BY_TYPE[projectType ?? ""] ?? "ProjectDetail";
}

/** 根据项目类型解析列表页路由名 */
export function getProjectsIndexRouteName(projectType?: string) {
  return INDEX_ROUTE_BY_TYPE[projectType ?? ""] ?? "ProjectsIndex";
}
