/** 功能开发项目类型标识 */
export const FEATURE_DEVELOPMENT_TYPE = "功能开发";

/** 是否为功能开发项目类型 */
export function isFeatureDevelopmentType(projectType?: string) {
  return projectType === FEATURE_DEVELOPMENT_TYPE;
}

/** 根据项目类型解析详情页路由名 */
export function getProjectDetailRouteName(projectType?: string) {
  return projectType === FEATURE_DEVELOPMENT_TYPE
    ? "FeatureDevelopmentDetail"
    : "ProjectDetail";
}

/** 根据项目类型解析列表页路由名 */
export function getProjectsIndexRouteName(projectType?: string) {
  return projectType === FEATURE_DEVELOPMENT_TYPE
    ? "FeatureDevelopmentIndex"
    : "ProjectsIndex";
}
