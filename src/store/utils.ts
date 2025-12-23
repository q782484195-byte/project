export { store } from "./index";
export { routerArrays } from "@/layout/types";
export { getConfig, responsiveStorageNameSpace } from "@/config";
// 不再从 router/utils 导入，避免循环依赖
// 这些函数将在使用时动态导入
export {
  isUrl,
  isEqual,
  isNumber,
  debounce,
  isBoolean,
  getKeyList,
  storageLocal,
  deviceDetection
} from "@pureadmin/utils";
export type {
  setType,
  appType,
  userType,
  multiType,
  cacheType,
  positionType
} from "./types";
