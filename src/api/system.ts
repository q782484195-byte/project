import { http } from "@/utils/http";

/** 部门相关类型 */
export interface Department {
  department?: string;
}

/** 用户相关类型 */
export interface User {
  id?: number;
  username: string;
  password?: string;
  nickname?: string;
  email?: string;
  phone?: string;
  departmentId?: number;
  department?: string;
  group?: string;
  company?: string;
  role?: string;
  workchat_username?: string;
  status?: number;
  createTime?: string;
  updateTime?: string;
}

/** 上传Excel文件导入用户参数 */
export interface LoadUserFromExcelParams {
  file: File;
}

/** API响应类型 */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

/** 分页响应类型 */
export interface PageResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ========== 公司列表（新增用户/部门时下拉） ==========

/** company/list 响应：result 为公司名称字符串数组 */
export interface CompanyListResponse {
  code: number;
  message?: string;
  result: string[];
}

/** 解析 company/list 返回为公司名称列表（result 如 ["联合助力","沃其达"]） */
export const parseCompanyList = (payload: CompanyListResponse | unknown): string[] => {
  let list: unknown = payload;
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const obj = payload as Record<string, unknown>;
    if ("result" in obj) list = obj.result;
    else if ("data" in obj) list = obj.data;
  }
  if (!Array.isArray(list)) return [];
  return list
    .map(item => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") {
        const o = item as Record<string, unknown>;
        const name = o.company ?? o.公司 ?? o.公司名 ?? o.name;
        if (typeof name === "string") return name.trim();
      }
      return "";
    })
    .filter(Boolean);
};

/** 查询公司列表 */
export const getCompanyList = () => {
  return http.request<CompanyListResponse>("get", "/company/list");
};

// ========== 部门管理接口 ==========

/** 部门列表项类型 */
export interface DepartmentListItem {
  部门名: string;
  负责人: string[];
  company?: string;
}

/** 部门 select 接口中的用户项 */
export interface DepartmentSelectUser {
  _id?: string;
  username: string;
  password?: string;
  role?: string[];
  department?: string;
  group?: string;
  company?: string;
  workchat_username?: string;
  button_permissions?: string[];
  email_address?: string;
}

/** 默认部门分组标识 */
export const DEFAULT_DEPARTMENT_GROUP = "#ungroup";

/** 部门 select 接口 result 类型（兼容旧扁平数组与新嵌套结构） */
export type DepartmentSelectResult =
  | DepartmentListItem[]
  | Record<string, Record<string, DepartmentSelectUser[]>>;

const isLegacyDepartmentListItem = (
  item: unknown
): item is DepartmentListItem => {
  return Boolean(
    item &&
    typeof item === "object" &&
    "部门名" in item &&
    typeof (item as DepartmentListItem).部门名 === "string" &&
    !("username" in item)
  );
};

const isLegacyDepartmentSelectResult = (
  result: unknown
): result is DepartmentListItem[] => {
  return (
    Array.isArray(result) &&
    (result.length === 0 || isLegacyDepartmentListItem(result[0]))
  );
};

const isDepartmentGroupMap = (
  value: unknown
): value is Record<string, DepartmentSelectUser[]> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const entries = Object.entries(value);
  if (entries.length === 0) return true;
  return entries.every(([, users]) => isDepartmentUserArray(users));
};

const isDepartmentToGroupsMap = (
  value: unknown
): value is Record<string, Record<string, DepartmentSelectUser[]>> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const entries = Object.entries(value);
  if (entries.length === 0) return true;
  return entries.every(([, groups]) => isDepartmentGroupMap(groups));
};

/** select_all_users：公司 -> 部门 -> 分组 -> 用户 */
export type SelectAllUsersCompanyMap = Record<
  string,
  Record<string, Record<string, DepartmentSelectUser[]>>
>;

export const isSelectAllUsersCompanyWrapped = (
  result: unknown
): result is SelectAllUsersCompanyMap => {
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    return false;
  }
  const entries = Object.entries(result);
  if (entries.length === 0) return true;
  return entries.every(([, deptMap]) => isDepartmentToGroupsMap(deptMap));
};

const mergeCompanyWrappedDepartmentMap = (
  companyMap: SelectAllUsersCompanyMap
): Record<string, Record<string, DepartmentSelectUser[]>> => {
  const merged: Record<string, Record<string, DepartmentSelectUser[]>> = {};
  Object.values(companyMap).forEach(deptMap => {
    Object.entries(deptMap).forEach(([department, groups]) => {
      if (!merged[department]) merged[department] = {};
      Object.entries(groups).forEach(([groupKey, users]) => {
        if (!isDepartmentUserArray(users)) return;
        if (!merged[department][groupKey]) {
          merged[department][groupKey] = [];
        }
        merged[department][groupKey].push(...users);
      });
    });
  });
  return merged;
};

const isNewDepartmentSelectResult = (
  result: unknown
): result is Record<string, Record<string, DepartmentSelectUser[]>> => {
  return isDepartmentToGroupsMap(result);
};

/** 部门分组展示名称，#ungroup 显示为默认分组 */
export const formatDepartmentGroupLabel = (group: string): string => {
  if (!group || group === DEFAULT_DEPARTMENT_GROUP) {
    return "默认分组";
  }
  return group;
};

const isDepartmentUserArray = (
  value: unknown
): value is DepartmentSelectUser[] => {
  return (
    Array.isArray(value) &&
    (value.length === 0 ||
      Boolean(
        value[0] &&
        typeof value[0] === "object" &&
        "username" in (value[0] as DepartmentSelectUser)
      ))
  );
};

const isFlatDepartmentUsersMap = (
  result: unknown
): result is Record<string, DepartmentSelectUser[]> => {
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    return false;
  }
  const entries = Object.entries(result);
  if (entries.length === 0) return true;
  return isDepartmentUserArray(entries[0][1]);
};

/** 合并 select_all_users 返回的 [{ 部门: 成员[] }, ...] 数组（兼容项内为分组结构） */
const mergeDepartmentUserMapArray = (
  result: unknown[]
): Record<string, DepartmentSelectUser[]> => {
  const merged: Record<string, DepartmentSelectUser[]> = {};
  result.forEach(entry => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return;
    Object.entries(entry as Record<string, unknown>).forEach(
      ([department, value]) => {
        if (isDepartmentUserArray(value)) {
          merged[department] = value;
          return;
        }
        if (isDepartmentGroupMap(value)) {
          merged[department] = Object.values(value).flat();
        }
      }
    );
  });
  return merged;
};

/** 将可能为数组的 select_all_users / select result 规范为对象再解析 */
const normalizeDepartmentSelectPayload = (result: unknown): unknown => {
  if (!Array.isArray(result) || result.length === 0) {
    return result;
  }
  const mergedFlat = mergeDepartmentUserMapArray(result);
  if (Object.keys(mergedFlat).length > 0) {
    return mergedFlat;
  }
  if (
    result.length === 1 &&
    result[0] &&
    typeof result[0] === "object" &&
    !Array.isArray(result[0])
  ) {
    return result[0];
  }
  return mergedFlat;
};

/** 解析部门 select 接口 result 为 部门 -> 分组 -> 用户 结构 */
export const parseDepartmentSelectMap = (
  result: unknown
): Record<string, Record<string, DepartmentSelectUser[]>> => {
  if (!result) return {};

  if (isLegacyDepartmentSelectResult(result)) {
    const map: Record<string, Record<string, DepartmentSelectUser[]>> = {};
    result.forEach(item => {
      const department = item["部门名"];
      map[department] = {
        [DEFAULT_DEPARTMENT_GROUP]: (item["负责人"] || []).map(username => ({
          username,
          department,
          role: ["DepartmentManager"]
        }))
      };
    });
    return map;
  }

  const normalized = normalizeDepartmentSelectPayload(result);

  if (isFlatDepartmentUsersMap(normalized)) {
    const map: Record<string, Record<string, DepartmentSelectUser[]>> = {};
    Object.entries(normalized).forEach(([department, users]) => {
      map[department] = { [DEFAULT_DEPARTMENT_GROUP]: users };
    });
    return map;
  }

  if (isSelectAllUsersCompanyWrapped(normalized)) {
    return mergeCompanyWrappedDepartmentMap(normalized);
  }

  if (isNewDepartmentSelectResult(normalized)) {
    return normalized;
  }

  return {};
};

/** 解析 select_all_users 的 result（保留公司层级，非公司包裹时返回 null） */
export const parseSelectAllUsersCompanyMap = (
  result: unknown
): SelectAllUsersCompanyMap | null => {
  if (!result) return null;
  const normalized = normalizeDepartmentSelectPayload(result);
  if (isSelectAllUsersCompanyWrapped(normalized)) {
    return normalized;
  }
  return null;
};

/**
 * 将 select_all_users result 转为 [{ 部门名: 成员[] }, ...]（兼容批量分配等旧消费方式）
 */
export const selectAllUsersToDepartmentMaps = (
  result: unknown
): Array<Record<string, DepartmentSelectUser[]>> => {
  const deptMap = parseDepartmentSelectMap(result);
  return Object.entries(deptMap).map(([department, groups]) => ({
    [department]: Object.values(groups).flat()
  }));
};

/** 从部门 select result 提取部门名称列表 */
export const getDepartmentNames = (result: unknown): string[] => {
  return Object.keys(parseDepartmentSelectMap(result));
};

/** 从 select_all_users result 提取指定公司下的部门名称（无该公司或无部门则 []） */
export const getDepartmentNamesByCompany = (
  result: unknown,
  company?: string
): string[] => {
  const companyName = company?.trim();
  if (!companyName || !result) return [];
  const companyMap = parseSelectAllUsersCompanyMap(result);
  if (companyMap) {
    const deptMap = companyMap[companyName];
    if (!deptMap) return [];
    return Object.keys(deptMap);
  }
  return getDepartmentNames(result);
};

/** 获取指定公司、部门下的分组下拉选项（基于 select_all_users 结构） */
export const getDepartmentGroupOptionsByCompany = (
  result: unknown,
  company?: string,
  department?: string
): Array<{ value: string; label: string }> => {
  const deptName = department?.trim();
  if (!deptName) return [];
  const companyName = company?.trim();
  const companyMap = parseSelectAllUsersCompanyMap(result);
  if (companyMap && companyName) {
    const groups = companyMap[companyName]?.[deptName];
    if (!groups) return [];
    return Object.keys(groups).map(value => ({
      value,
      label: formatDepartmentGroupLabel(value)
    }));
  }
  return getDepartmentGroupOptions(result, department);
};

/** 提取部门负责人（DepartmentManager） */
const extractDepartmentManagers = (
  users: DepartmentSelectUser[]
): string[] => {
  return users
    .filter(user => {
      const roles = Array.isArray(user.role)
        ? user.role
        : user.role
          ? [user.role]
          : [];
      return roles.includes("DepartmentManager");
    })
    .map(user => user.username);
};

/** 扁平化部门列表（兼容旧格式，供树形选择等使用） */
export const flattenDepartmentList = (result: unknown): DepartmentListItem[] => {
  const deptMap = parseDepartmentSelectMap(result);
  return Object.entries(deptMap).map(([部门名, groups]) => {
    const allUsers = Object.values(groups).flat();
    return {
      部门名,
      负责人: extractDepartmentManagers(allUsers)
    };
  });
};

/** 扁平化所有部门用户（兼容 select_all_users 新格式） */
export const flattenDepartmentSelectUsers = (
  result: unknown
): DepartmentSelectUser[] => {
  const deptMap = parseDepartmentSelectMap(result);
  const users: DepartmentSelectUser[] = [];
  Object.entries(deptMap).forEach(([department, groups]) => {
    Object.entries(groups).forEach(([groupKey, groupUsers]) => {
      groupUsers.forEach(user => {
        users.push({
          ...user,
          department: user.department || department,
          group:
            user.group ||
            (groupKey === DEFAULT_DEPARTMENT_GROUP ? undefined : groupKey)
        });
      });
    });
  });
  return users;
};

/** 是否为业务部门（部门名称包含「业务」） */
export const isBusinessDepartmentName = (department?: string): boolean => {
  const name = department?.trim();
  return !!name && name.includes("业务");
};

/** 从 select_all_users result 提取所有公司下业务部门的成员（username 去重） */
export const flattenBusinessDepartmentSelectUsers = (
  result: unknown
): DepartmentSelectUser[] => {
  const seen = new Set<string>();
  const users: DepartmentSelectUser[] = [];
  flattenDepartmentSelectUsers(result).forEach(user => {
    if (!isBusinessDepartmentName(user.department)) return;
    const username = user.username?.trim();
    if (!username || seen.has(username)) return;
    seen.add(username);
    users.push(user);
  });
  users.sort((a, b) =>
    (a.username || "").localeCompare(b.username || "", "zh-CN")
  );
  return users;
};

/** 获取指定部门下的分组下拉选项 */
export const getDepartmentGroupOptions = (
  result: unknown,
  department?: string
): Array<{ value: string; label: string }> => {
  if (!department) return [];
  const groups = parseDepartmentSelectMap(result)[department];
  if (!groups) return [];
  return Object.keys(groups).map(value => ({
    value,
    label: formatDepartmentGroupLabel(value)
  }));
};

/** @deprecated 请使用 parseDepartmentSelectMap */
export const parseDepartmentGroupMap = parseDepartmentSelectMap;

/** 获取部门列表（用于下拉选择） */
export const getDepartmentNameList = () => {
  return http.request<{
    code: number;
    result: DepartmentSelectResult;
  }>("get", "/department/select");
};


/** 获取部门列表 */
export const getDepartmentList = (params?: {
  name?: string;
  status?: number;
}) => {
  return http.request<ApiResponse<PageResponse<Department>>>(
    "get",
    "/department/select",
    { params }
  );
};


/** 获取下一状态用户列表 */
export const getNextStateUserList = (params: {
  next_state: string;
}) => {
  return http.request<ApiResponse<any>>(
    "post",
    "/department/next_state_select_user",
    { data: params }
  );
};

/** 新增部门 */
export const addDepartment = (data: { department: string; company: string }) => {
  return http.request<ApiResponse<any>>("post", "/department/add", {
    data
  });
};
/** 部门用户映射类型 */
export interface DepartmentUserMap {
  [department: string]: Array<{
    username: string;
    password: string;
    role: string[];
    department: string;
    company?: string;
    group?: string;
    button_permissions: string[];
  }>;
}

/** 查询所有部门人员（result 为公司 -> 部门 -> 分组 -> 用户，兼容旧格式） */
export const selectAllUsers = () => {
  return http.request<{
    code: number;
    result:
      | SelectAllUsersCompanyMap
      | DepartmentUserMap[]
      | DepartmentUserMap
      | Record<string, Record<string, DepartmentSelectUser[]>>;
    data?:
      | SelectAllUsersCompanyMap
      | DepartmentUserMap[]
      | DepartmentUserMap
      | Record<string, Record<string, DepartmentSelectUser[]>>;
  }>("get", "/department/select_all_users");
};

export interface DepartmentUserItem {
  username?: string;
  nickname?: string;
  department?: string;
  company?: string;
  role?: string[];
}

export const selectDepartmentUsers = () => {
  return http.request<{
    code: number;
    result: DepartmentUserItem[];
  }>("get", "/department/select_users");
};

// /** 编辑部门 */
// export const updateDepartment = (data: Department) => {
//   return http.request<ApiResponse<Department>>("put", "/department/update", {
//     data
//   });
// };

// /** 删除部门 */
// export const deleteDepartment = (id: number) => {
//   return http.request<ApiResponse<void>>("delete", `/department/delete/${id}`);
// };

// ========== 用户管理接口 ==========

/** 获取用户列表响应类型 */
export interface UserListResponse {
  code: number;
  message: string;
  result: Array<{
    username: string;
    password: string;
    role: string[];
    department: string;
    company?: string;
    group?: string;
    button_permissions: string[];
    workchat_username?: string;
  }>;
}

/** 获取用户列表 */
export const getUserList = (data: {
  username: string;
  department: string;
  company: string;
}) => {
  return http.request<UserListResponse>("post", "/admin/select_user", {
    data
  });
};

/** 新增用户参数类型 */
export interface AddUserParams {
  username: string;
  password: string;
  role: string[];
  department: string;
  company: string;
  group?: string;
  workchat_username?: string;
}

/** 新增用户 */
export const addUser = (data: AddUserParams) => {
  return http.request<ApiResponse<User>>("post", "/admin/add_user", { data });
};

/** 编辑用户 */
export const updateUser = (data: User) => {
  return http.request<ApiResponse<User>>("post", "/admin/update_user", {
    data
  });
};

/** 删除用户 */
export const deleteUser = (username: string) => {
  return http.request<ApiResponse<void>>("post", "/admin/delete_user", {
    data: { username }
  });
};

/** 通过文件导入用户 */
export const loadUserFromExcel = (params: LoadUserFromExcelParams) => {
  const formData = new FormData();
  formData.append("file", params.file);

  return http.request<ApiResponse<void>>("post", "/admin/load_user_from_excel", {
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
};

/** 获取部门任务统计 */
export const getTaskStatistics = () => {
  return http.request<{
    code: number;
    result: any;
  }>("get", "/department/task_statistics", {
  });
};

export interface SelectNotificationPersonResponse {
  code: number;
  result: {
    recipient: string[];
  } | null;
}
/** 查询超时消息接收人 */
export const selectNotificationPerson = () => {
  return http.request<SelectNotificationPersonResponse>("get", "/notification/select_person", {
  })
};

/** 更新超时消息接收人 */
export const sendNotification = (data: {
  recipient: string[];
}) => {
  return http.request<ApiResponse<any>>("post", "/notification/update_person", {
    data
  });
};

/** 新增超时消息接收人 */
export const addNotification = (data: {
  task_id: string;
  task_name: string;
  deadline: number;
  recipient: string[];
}) => {
  return http.request<ApiResponse<any>>("post", "/notification/add", {
    data
  });
};


