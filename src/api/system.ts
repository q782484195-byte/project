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

// ========== 部门管理接口 ==========

/** 部门列表项类型 */
export interface DepartmentListItem {
  部门名: string;
  负责人: string[];
}

/** 部门 select 接口中的用户项 */
export interface DepartmentSelectUser {
  _id?: string;
  username: string;
  password?: string;
  role?: string[];
  department?: string;
  group?: string;
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

const isNewDepartmentSelectResult = (
  result: unknown
): result is Record<string, Record<string, DepartmentSelectUser[]>> => {
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    return false;
  }
  const entries = Object.entries(result);
  if (entries.length === 0) return true;
  const [, groupMap] = entries[0];
  return Boolean(groupMap && typeof groupMap === "object" && !Array.isArray(groupMap));
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

/** 合并 select_all_users 返回的 [{ 部门: 成员[] }, ...] 数组 */
const mergeDepartmentUserMapArray = (
  result: unknown[]
): Record<string, DepartmentSelectUser[]> => {
  const merged: Record<string, DepartmentSelectUser[]> = {};
  result.forEach(entry => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return;
    Object.entries(entry as Record<string, DepartmentSelectUser[]>).forEach(
      ([department, users]) => {
        if (isDepartmentUserArray(users)) {
          merged[department] = users;
        }
      }
    );
  });
  return merged;
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

  let normalized: unknown = result;
  if (Array.isArray(result) && result.length > 0) {
    normalized = mergeDepartmentUserMapArray(result);
  }

  if (isFlatDepartmentUsersMap(normalized)) {
    const map: Record<string, Record<string, DepartmentSelectUser[]>> = {};
    Object.entries(normalized).forEach(([department, users]) => {
      map[department] = { [DEFAULT_DEPARTMENT_GROUP]: users };
    });
    return map;
  }

  if (isNewDepartmentSelectResult(normalized)) {
    return normalized;
  }

  return {};
};

/** 从部门 select result 提取部门名称列表 */
export const getDepartmentNames = (result: unknown): string[] => {
  return Object.keys(parseDepartmentSelectMap(result));
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
export const addDepartment = (department: string) => {
  return http.request<ApiResponse<any>>("post", "/department/add", {
    data: { department }
  });
};
/** 部门用户映射类型 */
export interface DepartmentUserMap {
  [department: string]: Array<{
    username: string;
    password: string;
    role: string[];
    department: string;
    button_permissions: string[];
  }>;
}

/** 查询所有部门人员（result 多为 [{ 部门名: 成员[] }, ...]） */
export const selectAllUsers = () => {
  return http.request<{
    code: number;
    result: DepartmentUserMap[] | DepartmentUserMap;
    data?: DepartmentUserMap[] | DepartmentUserMap;
  }>("get", "/department/select_all_users");
};

export interface DepartmentUserItem {
  username?: string;
  nickname?: string;
  department?: string;
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
    group?: string;
    button_permissions: string[];
    workchat_username?: string;
  }>;
}

/** 获取用户列表 */
export const getUserList = (data: { username: string; department: string }) => {
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


