import { http } from "@/utils/http";

/** 通用 API 响应 */
export interface ApiResponse<T = unknown> {
  code: number;
  message?: string;
  result?: T;
  data?: T;
  total_count?: number;
  total?: number;
}

/** APP 版本列表项 */
export interface AppVersionListItem {
  _id: string;
  file_path: string;
  version: string;
  description?: string;
  force_update: boolean;
  feature_code: number;
  upload_date: string;
}

/** 分页查询 APP 版本列表参数 */
export interface SelectAppVersionsParams {
  version_id?: string;
  feature_code?: string;
  page: number;
  page_size: number;
}

/** APP 版本列表响应 */
export type AppVersionListResponse = ApiResponse<
  AppVersionListItem[] | { list?: AppVersionListItem[]; records?: AppVersionListItem[] }
>;

/** 分页查询 APP 版本列表 */
export const selectAppVersions = (params: SelectAppVersionsParams) => {
  const query: Record<string, string | number> = {
    page: params.page,
    page_size: params.page_size
  };

  const versionId = params.version_id?.trim();
  if (versionId) {
    query.version_id = versionId;
  }

  const featureCode = params.feature_code?.trim();
  if (featureCode) {
    query.feature_code = Number(featureCode);
  }

  return http.request<AppVersionListResponse>("get", "/app/select", {
    params: query
  });
};

/** 上传 APP 版本参数 */
export interface UploadAppVersionParams {
  file: File;
  version: string;
  feature_code: string;
  description?: string;
  force_update?: boolean;
}

/** 上传 APP 版本（multipart 直传安装包） */
export const uploadAppVersion = (params: UploadAppVersionParams) => {
  const formData = new FormData();
  formData.append("file", params.file);
  formData.append("version", params.version);
  formData.append("feature_code", params.feature_code);
  formData.append("description", params.description ?? "");
  formData.append("force_update", String(params.force_update ?? false));

  return http.request<ApiResponse>("post", "/app/upload", {
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
};

/** 更新 APP 版本参数 */
export interface UpdateAppVersionParams {
  version_id: string;
  version: string;
  feature_code: string;
  description?: string;
  force_update?: boolean;
  /** 不传则保留原安装包 */
  file?: File;
}

/** 更新 APP 版本 */
export const updateAppVersion = (params: UpdateAppVersionParams) => {
  const formData = new FormData();
  formData.append("version_id", params.version_id);
  formData.append("version", params.version);
  formData.append("feature_code", params.feature_code);
  formData.append("description", params.description ?? "");
  formData.append("force_update", String(params.force_update ?? false));
  if (params.file) {
    formData.append("file", params.file);
  }

  return http.request<ApiResponse>("post", "/app/update", {
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
};

/** 删除 APP 版本参数 */
export interface DeleteAppVersionParams {
  version_id: string;
}

/** 删除 APP 版本 */
export const deleteAppVersion = (params: DeleteAppVersionParams) => {
  return http.request<ApiResponse>("post", "/app/delete", {
    data: {
      version_id: params.version_id
    }
  });
};

/** 从列表响应中提取数据与总数 */
export const unwrapAppVersionList = (
  response: AppVersionListResponse
): { list: AppVersionListItem[]; total: number } => {
  let list: AppVersionListItem[] = [];

  if (Array.isArray(response.result)) {
    list = response.result;
  } else if (Array.isArray(response.data)) {
    list = response.data;
  } else if (response.result && typeof response.result === "object") {
    const result = response.result as {
      list?: AppVersionListItem[];
      records?: AppVersionListItem[];
    };
    list = result.list || result.records || [];
  } else if (response.data && typeof response.data === "object") {
    const data = response.data as {
      list?: AppVersionListItem[];
      records?: AppVersionListItem[];
    };
    list = data.list || data.records || [];
  }

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
