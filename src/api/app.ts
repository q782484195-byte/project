import { http } from "@/utils/http";

/** 公网 multipart 上传安装包超时（默认 axios 为 10s） */
const APP_VERSION_UPLOAD_TIMEOUT_MS = 600_000;

/** 通用 API 响应 */
export interface ApiResponse<T = unknown> {
  code: number;
  message?: string;
  result?: T;
  data?: T;
  total_count?: number;
  total?: number;
}

/** `/app/select` 接口原始列表项 */
export interface AppVersionApiItem {
  id: string;
  version: string;
  path: string;
  remark?: string;
  status?: number;
  vercode: number;
  is_up?: number;
  create_time?: string;
  update_time?: string;
}

/** APP 版本列表项（页面展示用，由接口字段归一化而来） */
export interface AppVersionListItem {
  _id: string;
  file_path: string;
  version: string;
  description?: string;
  force_update: boolean;
  feature_code: number;
  upload_date: string;
  status?: number;
}

/** 分页查询 APP 版本列表参数 */
export interface SelectAppVersionsParams {
  /** 记录 id */
  id?: string;
  /** 版本号整数 vercode */
  vercode?: string;
  page: number;
  page_size: number;
}

/** APP 版本列表响应 */
export type AppVersionListResponse = ApiResponse<
  | AppVersionApiItem[]
  | AppVersionListItem[]
  | { list?: AppVersionApiItem[] | AppVersionListItem[]; records?: AppVersionApiItem[] | AppVersionListItem[] }
>;

const isAppVersionApiItem = (
  item: AppVersionApiItem | AppVersionListItem
): item is AppVersionApiItem => "vercode" in item || ("id" in item && !("_id" in item));

/** 将 select 接口记录转为列表展示结构 */
export const normalizeAppVersionItem = (
  item: AppVersionApiItem | AppVersionListItem
): AppVersionListItem => {
  if (!isAppVersionApiItem(item)) {
    return item;
  }
  return {
    _id: item.id,
    file_path: item.path ?? "",
    version: item.version ?? "",
    description: item.remark,
    force_update: item.is_up === 1,
    feature_code: item.vercode,
    upload_date: item.create_time ?? item.update_time ?? "",
    status: item.status
  };
};

/** 分页查询 APP 版本列表 */
export const selectAppVersions = (params: SelectAppVersionsParams) => {
  const query: Record<string, string | number> = {
    page: params.page,
    page_size: params.page_size
  };

  const recordId = params.id?.trim();
  if (recordId) {
    query.id = recordId;
  }

  const vercode = params.vercode?.trim();
  if (vercode) {
    query.vercode = Number(vercode);
  }

  return http.request<AppVersionListResponse>("post", "/app/select", {
    data: query
  });
};

const appendAppVersionIsUp = (
  formData: FormData,
  isUp?: boolean | number
) => {
  if (typeof isUp === "boolean") {
    formData.append("is_up", String(isUp ? 1 : 0));
    return;
  }
  if (isUp !== undefined) {
    formData.append("is_up", String(isUp));
  }
};

/** 新增 APP 版本参数（POST /app/add） */
export interface AddAppVersionParams {
  file: File;
  version: string;
  vercode: string | number;
  remark?: string;
  status?: number;
  is_up?: boolean | number;
}

/** 新增 APP 版本（multipart 上传 apk） */
export const addAppVersion = (params: AddAppVersionParams) => {
  const formData = new FormData();
  formData.append("file", params.file);
  formData.append("version", params.version);
  formData.append("vercode", String(params.vercode));
  formData.append("remark", params.remark ?? "");
  if (params.status !== undefined) {
    formData.append("status", String(params.status));
  }
  appendAppVersionIsUp(formData, params.is_up);

  return http.request<ApiResponse>("post", "/app/add", {
    data: formData,
    timeout: APP_VERSION_UPLOAD_TIMEOUT_MS,
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
};

/** @deprecated 使用 addAppVersion */
export const uploadAppVersion = addAppVersion;

/** 更新 APP 版本参数 */
export interface UpdateAppVersionParams {
  id: string;
  version: string;
  vercode: string | number;
  remark?: string;
  status?: number;
  is_up?: boolean | number;
  /** 不传则保留原安装包 */
  file?: File;
}

/** 更新 APP 版本 */
export const updateAppVersion = (params: UpdateAppVersionParams) => {
  const formData = new FormData();
  formData.append("id", params.id);
  formData.append("version", params.version);
  formData.append("vercode", String(params.vercode));
  formData.append("remark", params.remark ?? "");
  if (params.status !== undefined) {
    formData.append("status", String(params.status));
  }
  appendAppVersionIsUp(formData, params.is_up);
  if (params.file) {
    formData.append("file", params.file);
  }

  return http.request<ApiResponse>("post", "/app/update", {
    data: formData,
    timeout: APP_VERSION_UPLOAD_TIMEOUT_MS,
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
};

/** 删除 APP 版本参数 */
export interface DeleteAppVersionParams {
  id: string;
}

/** 删除 APP 版本 */
export const deleteAppVersion = (params: DeleteAppVersionParams) => {
  return http.request<ApiResponse>("post", "/app/delete", {
    data: {
      id: params.id
    }
  });
};

const extractRawAppVersionList = (
  response: AppVersionListResponse
): (AppVersionApiItem | AppVersionListItem)[] => {
  const payload = response.result ?? response.data;
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && typeof payload === "object") {
    const wrapped = payload as {
      list?: (AppVersionApiItem | AppVersionListItem)[];
      records?: (AppVersionApiItem | AppVersionListItem)[];
    };
    return wrapped.list || wrapped.records || [];
  }
  return [];
};

/** 从列表响应中提取数据与总数 */
export const unwrapAppVersionList = (
  response: AppVersionListResponse
): { list: AppVersionListItem[]; total: number } => {
  const list = extractRawAppVersionList(response).map(normalizeAppVersionItem);
  const total = response.total_count ?? response.total ?? list.length;

  return { list, total };
};

/** 读取列表项展示文本 */
export const formatAppVersionField = (
  item: AppVersionListItem,
  key: keyof AppVersionListItem,
  fallback = "-"
): string => {
  const value = item[key];
  if (value === undefined || value === null) return fallback;
  if (typeof value === "boolean") return value ? "是" : "否";
  const text = String(value).trim();
  return text === "" ? fallback : text;
};
