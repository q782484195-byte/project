/**
 * 仅存放 router 实例，禁止在此文件 import store / auth / router/index，
 * 避免循环依赖导致 utils 尚未完成初始化时调用 setRouterInstance 触发 TDZ。
 */
let routerInstance: any = null;

export function setRouterInstance(router: any) {
  routerInstance = router;
}

export function getRouterInstanceOrNull(): any {
  return routerInstance;
}
