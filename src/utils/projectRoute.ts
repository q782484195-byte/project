/** 功能开发项目类型标识 */
export const FEATURE_DEVELOPMENT_TYPE = "功能开发";

/** APP功能开发项目类型标识 */
export const APP_FEATURE_DEVELOPMENT_TYPE = "APP功能开发";

/** 是否为功能开发项目类型 */
export function isFeatureDevelopmentType(projectType?: string) {
  return projectType === FEATURE_DEVELOPMENT_TYPE;
}

/** 是否为 APP 功能开发项目类型 */
export function isAppFeatureDevelopmentType(projectType?: string) {
  return projectType === APP_FEATURE_DEVELOPMENT_TYPE;
}

/** 列表页共用简化展示的项目类型（隐藏主板等字段） */
export function isSimplifiedProjectListType(projectType?: string) {
  return (
    isFeatureDevelopmentType(projectType) ||
    isAppFeatureDevelopmentType(projectType)
  );
}

const DETAIL_ROUTE_BY_TYPE: Record<string, string> = {
  [FEATURE_DEVELOPMENT_TYPE]: "FeatureDevelopmentDetail",
  [APP_FEATURE_DEVELOPMENT_TYPE]: "AppFeatureDevelopmentDetail"
};

const INDEX_ROUTE_BY_TYPE: Record<string, string> = {
  [FEATURE_DEVELOPMENT_TYPE]: "FeatureDevelopmentIndex",
  [APP_FEATURE_DEVELOPMENT_TYPE]: "AppFeatureDevelopmentIndex"
};

/** 根据项目类型解析详情页路由名 */
export function getProjectDetailRouteName(projectType?: string) {
  return DETAIL_ROUTE_BY_TYPE[projectType ?? ""] ?? "ProjectDetail";
}

/** 根据项目类型解析列表页路由名 */
export function getProjectsIndexRouteName(projectType?: string) {
  return INDEX_ROUTE_BY_TYPE[projectType ?? ""] ?? "ProjectsIndex";
}
