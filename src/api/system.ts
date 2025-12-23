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
  role?: string;
  workchat_username?: string;
  status?: number;
  createTime?: string;
  updateTime?: string;
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

/** 获取部门列表（用于下拉选择） */
export const getDepartmentNameList = () => {
  return http.request<{
    code: number;
    result: DepartmentListItem[];
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

/** 查询所有部门人员 */
export const selectAllUsers = () => {
  return http.request<{
    code: number;
    result: DepartmentUserMap[];
  }>("get", "department/select_all_users ");
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
