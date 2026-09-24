import { http } from "@/utils/http";

/** 项目描述内容类型 */
export interface DescribeContent {
  type: "text" | "url" | "file";
  content: string;
}

/** 上传文件响应 */
export interface UploadFileResponse {
  code: number;
  url: string;
}

/** 上传文件参数 */
export interface UploadFileParams {
  file: File;
}

/** 上传文件 */
export const uploadFile = (params: UploadFileParams) => {
  const formData = new FormData();
  formData.append("file", params.file);

  return http.request<UploadFileResponse>("post", "/upload_file", {
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
};

/** 创建项目参数 */
export interface CreateProjectParams {
  project_type: string; // 项目类型：定制项目 | 公模项目 | 功能开发
  project_name: string;
  customer_name: string; // 客户名称
  product_type: string; // 产品类型
  platform_name: string; // 平台名称
  motherboard_name: string; // 主板名称
  resolution: string; // 分辨率
  business_owner: string; // 业务负责人
  creator?: string; // 项目负责人
  state_description?: string; // 状态描述
  plant_start_time: string;
  plant_end_time: string;
  describe: string[]; // URL 字符串数组
  attachment: string[]; // URL 字符串数组
  project_proposal?: string[]; // 立项文件 URL 字符串数组
  project_initiation_date?: string; // 立项日期
}

/** 编辑项目参数 */
export interface UpdateProjectParams extends CreateProjectParams {
  project_id: string;
}

/** API响应类型 */
export interface ApiResponse<T> {
  code: number;
  message?: string;
  data?: T;
  result?: T; // 某些接口返回 result 而不是 data
}

/** 项目列表查询参数 */
export interface SelectProjectParams {
  project_id?: string;
  project_name?: string;
  project_type?: string; // 项目类型：定制项目 | 公模项目 | 功能开发
  creator?: string;
  state?: string; // "未开始,进行中,已完成"
  page?: number;
  page_size?: number;
}

/** 项目列表项 */
export interface ProjectListItem {
  _id: string;
  project_name: string;
  plant_start_time: string;
  plant_end_time: string;
  start_time?: string;
  completion_time?: string;
  creator: string;
  state: string;
  project_type?: string;
  describe: DescribeContent[];
  attachment: any[];
  create_time: string;
  motherboard_name: string;
}

/** 创建 APP 功能开发项目参数（project_type 固定为 APP功能开发） */
export interface CreateAppProjectParams {
  /** 项目类型，固定值：APP功能开发 */
  project_type: string;
  /** 项目名 */
  project_name: string;
  /** 客户名 */
  customer_name: string;
  /** 产品类型 */
  product_type: string;
  /** 平台名称 */
  platform_name: string;
  /** 分辨率 */
  resolution: string;
  /** APP协议 */
  app_protocol: string;
  /** 马甲包名称 */
  shadow_app: string;
  /** 业务负责人 */
  business_owner: string;
  /** 立项时间 */
  project_initiation_date: string;
  /** 计划开始时间 */
  plant_start_time: string;
  /** 计划结束时间 */
  plant_end_time: string;
  /** 描述 */
  describe: string[];
  /** 附件 */
  attachment: string[];
  /** 合同（APP 功能开发不需要） */
  project_proposal?: string[];
}

/** 创建 APP 功能开发项目 */
export const createAppProject = (params: CreateAppProjectParams) => {
  return http.request<ApiResponse<any>>("post", "/project/add_app_project", {
    data: {
      project_type: params.project_type || "APP功能开发",
      project_name: params.project_name,
      customer_name: params.customer_name || "",
      product_type: params.product_type || "",
      platform_name: params.platform_name || "",
      resolution: params.resolution || "",
      app_protocol: params.app_protocol || "",
      shadow_app: params.shadow_app || "",
      business_owner: params.business_owner || "",
      project_initiation_date: params.project_initiation_date || "",
      plant_start_time: params.plant_start_time,
      plant_end_time: params.plant_end_time,
      describe: params.describe,
      attachment: params.attachment,
      ...(params.project_proposal?.length
        ? { project_proposal: params.project_proposal }
        : {})
    }
  });
};

/** 创建项目 */
export const createProject = (params: CreateProjectParams) => {
  // 使用 JSON 格式发送数据
  return http.request<ApiResponse<any>>("post", "/project/add", {
    data: {
      project_type: params.project_type || "",
      project_name: params.project_name,
      customer_name: params.customer_name || "",
      product_type: params.product_type || "",
      platform_name: params.platform_name || "",
      motherboard_name: params.motherboard_name || "",
      resolution: params.resolution || "",
      business_owner: params.business_owner || "",
      creator: params.creator || "",
      plant_start_time: params.plant_start_time,
      plant_end_time: params.plant_end_time,
      describe: params.describe,
      attachment: params.attachment,
      project_proposal: params.project_proposal || [],
      project_initiation_date: params.project_initiation_date || "",
    }
  });
};

/** 编辑项目 */
export const updateProject = (params: UpdateProjectParams) => {
  // 使用 JSON 格式发送数据
  return http.request<ApiResponse<any>>("post", "/project/update", {
    data: {
      project_id: params.project_id,
      project_type: params.project_type || "",
      project_name: params.project_name,
      customer_name: params.customer_name || "",
      product_type: params.product_type || "",
      platform_name: params.platform_name || "",
      motherboard_name: params.motherboard_name || "",
      resolution: params.resolution || "",
      business_owner: params.business_owner || "",
      creator: params.creator || "",
      plant_start_time: params.plant_start_time,
      plant_end_time: params.plant_end_time,
      describe: params.describe,
      attachment: params.attachment,
      project_proposal: params.project_proposal || [],
      project_initiation_date: params.project_initiation_date || "",
      state_description: params.state_description || ""
    }
  });
};

/** 项目列表状态统计 */
export interface ProjectStateCount {
  _id?: string | null;
  总项目数?: number;
  进行中?: number;
  延期?: number;
  已完成?: number;
  [key: string]: string | number | null | undefined;
}

/** 项目列表查询响应（部分场景 result 为需求任务嵌套树） */
export interface ProjectSelectResponse {
  code: number;
  message?: string;
  result?: ProjectListItem[] | Record<string, unknown>;
  data?: ProjectListItem[] | Record<string, unknown>;
  total_count?: number;
  state_count?: ProjectStateCount;
}

/** 查询项目列表 */
export const selectProjects = (params: SelectProjectParams) => {
  return http.request<ProjectSelectResponse>(
    "post",
    "/project/select",
    {
      data: {
        project_id: params.project_id || "",
        project_name: params.project_name || "",
        project_type: params.project_type || "",
        creator: params.creator || "",
        state: params.state || "",
        page: params.page,
        page_size: params.page_size
      }
    }
  );
};



/** 查询项目下所有需求和任务参数 */
export interface SelectAllRequirementsAndTasksParams {
  project_id: string;
  project_type?: string;
}

/** 需求项（包含任务列表） */
export interface RequirementWithTasksItem {
  _id: string;
  需求名: string;
  describe: DescribeContent[];
  当前处理人?: string;
  状态: string;
  优先级: string;
  进度?: number; // 需求进度
  project_name: string;
  project_id: string;
  creator: string;
  attachment: any[];
  create_time: string;
  task_list: TaskWithDetailItem[];
}

/** 任务项（详细信息） */
export interface TaskWithDetailItem {
  _id?: string; // 任务ID（如果后端返回）
  任务名: string;
  describe: DescribeContent[];
  状态: string;
  优先级: string;
  requirement_name: string;
  requirement_id: string;
  creator: string;
  create_time: string;
  当前处理人?: string;
  department?: string;
  指派人?: string;
  指派给?: string;
  审阅人?: string;
  测试人?: string;
  进度?: number;
  预计工时?: number;
  已用工时?: number;
  attachment?: any[];
  备注?: string;
  历史记录?: string[];
}

/** 查询项目下所有需求和任务 */
export const selectAllRequirementsAndTasks = (params: SelectAllRequirementsAndTasksParams) => {
  return http.request<ApiResponse<RequirementWithTasksItem[]>>(
    "post",
    "/project/select_all",
    {
      data: params
    }
  );
};

/** 查询项目下所有需求和任务 */
export const selectAllRequirementsAndTasksTwo = (params: SelectAllRequirementsAndTasksParams) => {
  return http.request<ApiResponse<RequirementWithTasksItem[]>>(
    "post",
    "/project/select_all_two",
    {
      data: params
    }
  );
};
/** 上传项目附件参数 */
export interface UploadAttachmentParams {
  project_id: string;
  files: File[];
}

/** 上传项目附件 */
export const uploadAttachment = (params: UploadAttachmentParams) => {
  const formData = new FormData();

  // 添加项目ID
  formData.append("project_id", params.project_id);

  // 添加文件
  if (params.files && params.files.length > 0) {
    params.files.forEach(file => {
      formData.append("files", file);
    });
  }

  return http.request<ApiResponse<any>>("post", "/project/upload_attachment", {
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
};

/** 更新项目状态参数 */
export interface UpdateStateParams {
  project_id: string;
  project_type?: string;
}

/** 更新项目状态 */
export const updateProjectState = (params: UpdateStateParams) => {
  return http.request<ApiResponse<any>>("post", "/project/update_state", {
    data: params
  });
};

/** 删除项目参数 */
export interface DeleteProjectParams {
  project_id: string;
}

/** 删除项目 */
export const deleteProject = (params: DeleteProjectParams) => {
  return http.request<ApiResponse<any>>("post", "/project/delete_project", {
    data: params
  });
};

/** 查询需求参数 */
export interface SelectRequirementParams {
  project_id?: string; // 可选，支持查询所有需求
  project_type?: string;
  page?: number;
  page_size?: number;
}

/** API 返回的需求项 */
export interface RequirementListItem {
  _id: string;
  需求名: string;
  describe: DescribeContent[];
  状态: string;
  优先级: string;
  project_id: string;
  project_name?: string; // API 返回的项目名称
  creator: string;
  attachment: string[];
  create_time: string;
}

/** 需求项数据（可能是嵌套对象或需求项） */
export type RequirementItemData = RequirementListItem | { [key: string]: RequirementItemData };

/** 层级列表响应（支持嵌套对象结构） */
export interface RequirementListResponse {
  code: number;
  result: RequirementListItem[] | { [key: string]: RequirementItemData };
  total_count?: number;
  message?: string;
}

/** 判断是否为需求项（包含 _id 字段） */
export const isRequirementItem = (obj: any): obj is RequirementListItem => {
  return obj && typeof obj === "object" && "_id" in obj && "需求名" in obj;
};

/** 将嵌套对象结构扁平化为需求项数组 */
export const flattenRequirementData = (
  data: RequirementListItem[] | { [key: string]: RequirementItemData }
): RequirementListItem[] => {
  // 如果已经是数组，直接返回
  if (Array.isArray(data)) {
    return data;
  }

  // 如果是嵌套对象，递归扁平化
  const result: RequirementListItem[] = [];

  const flatten = (obj: RequirementItemData) => {
    if (isRequirementItem(obj)) {
      // 如果是需求项，直接添加到结果中
      result.push(obj);
    } else if (obj && typeof obj === "object" && !Array.isArray(obj)) {
      // 如果是嵌套对象，遍历其属性
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          flatten(obj[key]);
        }
      }
    }
  };

  flatten(data);
  return result;
};

/** 查询项目需求 */
export const selectRequirements = (params: SelectRequirementParams) => {
  return http.request<RequirementListResponse>(
    "post",
    "/project/select_requirement",
    {
      data: params
    }
  );
};

export const selectUserRequirements = (params: SelectRequirementParams) => {
  return http.request<RequirementListResponse>(
    "post",
    "/requirement/user_select",
    {
      data: params
    }
  );
};

/** 创建需求参数 */
export interface CreateRequirementParams {
  requirement_name: string;
  priority: string;
  project_name: string;
  project_id: string;
  describe: string[]; // URL 字符串数组
  attachment: string[]; // URL 字符串数组
}

/** 创建需求 */
export const createRequirement = (params: CreateRequirementParams) => {
  // 使用 JSON 格式发送数据
  return http.request<ApiResponse<any>>("post", "/requirement/add", {
    data: {
      requirement_name: params.requirement_name,
      priority: params.priority,
      project_name: params.project_name,
      project_id: params.project_id,
      describe: params.describe,
      attachment: params.attachment
    }
  });
};

/** 更新需求参数 */
export interface UpdateRequirementParams {
  requirement_id: string;
  requirement_name: string;
  priority: string;
  describe: string[]; // URL 字符串数组
  attachment: string[]; // URL 字符串数组
}

/** 更新需求 */
export const updateRequirement = (params: UpdateRequirementParams) => {
  // 使用 JSON 格式发送数据
  return http.request<ApiResponse<any>>("post", "/requirement/update", {
    data: {
      requirement_id: params.requirement_id,
      requirement_name: params.requirement_name,
      priority: params.priority,
      describe: params.describe,
      attachment: params.attachment
    }
  });
};

/** 更新需求状态参数 */
export interface UpdateRequirementStateParams {
  requirement_id: string;
  state: string;
}

/** 更新需求状态 */
export const updateRequirementState = (
  params: UpdateRequirementStateParams
) => {
  return http.request<ApiResponse<any>>("post", "/requirement/update_state", {
    data: {
      requirement_id: params.requirement_id,
      state: params.state
    }
  });
};

/** 导入JSON生成需求参数 */
export interface LoadRequirementFromJsonParams {
  project_id: string;
  project_name: string;
  json_data: Record<string, any>;
}

/** 导入JSON生成需求 */
export const loadRequirementFromJson = (
  params: LoadRequirementFromJsonParams
) => {
  return http.request<ApiResponse<any>>("post", "/requirement/load", {
    data: {
      project_id: params.project_id,
      project_name: params.project_name,
      json_data: params.json_data
    }
  });
};

/** 导入Excel生成需求参数 */
export interface LoadRequirementFromExcelParams {
  file: File;
  project_id: string;
  project_name: string;
  project_type?: string;
}

/** 导入Excel生成需求 */
export const loadRequirementFromExcel = (
  params: LoadRequirementFromExcelParams
) => {
  const formData = new FormData();
  formData.append("file", params.file);
  formData.append("project_id", params.project_id);
  formData.append("project_name", params.project_name);
  if (params.project_type) {
    formData.append("project_type", params.project_type);
  }

  return http.request<ApiResponse<any>>("post", "/requirement/load_excel", {
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
};

/** 项目统计数据响应 */
export interface ProjectStatisticsResponse {
  code: number;
  进行中: number;
  测试验收中: number;
  已完成: number;
  已取消: number;
  总进度: number;
}

/** 获取项目统计数据参数 */
export interface GetProjectStatisticsParams {
  project_id: string;
  project_type?: string;
}

/** 获取项目统计数据 */
export const getProjectStatistics = (params: GetProjectStatisticsParams) => {
  return http.request<ProjectStatisticsResponse>(
    "post",
    "/project/statistics",
    {
      data: {
        project_id: params.project_id,
        ...(params.project_type ? { project_type: params.project_type } : {})
      }
    }
  );
};

/** 根据需求ID查询任务参数 */
export interface SelectTasksByRequirementParams {
  requirement_id: string;
  task_name?: string;
  page?: number;
  page_size?: number;
}

/** 任务列表项（API返回格式） */
export interface TaskListItem {
  _id: string;
  title?: string;
  任务名?: string;
  status?: string;
  状态?: string;
  priority?: string;
  优先级?: string;
  assigneeId?: string;
  assignee?: string;
  projectId?: string;
  requirementId?: string;
  startDate?: string;
  endDate?: string;
  create_time?: string;
  /** 是否为日常任务（待办列表 task/pending 可能混入） */
  daily_task?: boolean;
  /** 行背景色标识，如 red、green */
  show_color?: string;
  [key: string]: any;
}

/** 任务列表响应 */
export interface TaskListResponse {
  code: number;
  result: TaskListItem[];
  total_count: number;
  message?: string;
  dynamic?: Array<{ task_name?: string; history?: string }>;
}

/** 根据需求ID查询任务列表 */
export const selectTasksByRequirement = (
  params: SelectTasksByRequirementParams
) => {
  return http.request<TaskListResponse>("post", "/task/requirement_select", {
    data: {
      requirement_id: params.requirement_id,
      page: params.page || 1,
      page_size: params.page_size || 20
    }
  });
};

/** 查询任务列表参数 */
export interface SelectTasksParams {
  requirement_id?: string;
  task_name?: string;
  page?: number;
  page_size?: number;
}

/** 查询任务列表 */
export const selectTasks = (params: SelectTasksParams) => {
  return http.request<TaskListResponse>("post", "/task/requirement_select", {
    data: {
      requirement_id: params.requirement_id,
      task_name: params.task_name,
      page: params.page || 1,
      page_size: params.page_size || 20
    }
  });
};

/** 查询项目任务参数 */
export interface SelectProjectTasksParams {
  project_id: string;
  requirement_name?: string;
}

/** 查询项目所有任务 */
export const selectProjectTasks = (params: SelectProjectTasksParams) => {
  return http.request<TaskListResponse>("post", "/project/select_task", {
    data: {
      project_id: params.project_id,
      requirement_name: params.requirement_name || ""
    }
  });
};

/** 创建任务参数 */
export interface CreateTaskParams {
  task_name: string;
  describe: DescribeContent[];
  requirement_id: string;
  requirement_name: string;
  priority: string;
  default_person?: string;
  department?: string;
  attachment?: string[];
  task_deadline: string;
}

/** 创建任务 */
export const createTask = (params: CreateTaskParams) => {
  return http.request<ApiResponse<any>>("post", "/task/add", {
    data: {
      task_name: params.task_name,
      describe: params.describe,
      requirement_id: params.requirement_id,
      requirement_name: params.requirement_name,
      priority: params.priority,
      task_deadline: params.task_deadline,
      default_person: params.default_person,
      department: params.department,
      attachment: params.attachment || []
    }
  });
};

/** 更新任务参数 */
export interface UpdateTaskParams {
  task_id: string;
  task_name: string;
  describe: DescribeContent[];
  priority: string;
  task_deadline?: string;
  default_person?: string;
  department?: string;
  attachment?: string[];
  estimated_time?: number;
  development_start_time?: string;
  development_end_time?: string;
}

/** 更新任务 */
export const updateTask = (params: UpdateTaskParams) => {
  return http.request<ApiResponse<any>>("post", "/task/update", {
    data: {
      task_id: params.task_id,
      task_name: params.task_name,
      describe: params.describe,
      priority: params.priority,
      task_deadline: params.task_deadline,
      default_person: params.default_person,
      department: params.department,
      attachment: params.attachment || [],
      estimated_time: params.estimated_time,
      development_start_time: params.development_start_time,
      development_end_time: params.development_end_time
    }
  });
};

/** 更新任务状态参数 */
export interface UpdateTaskStateParams {
  task_id: string;
  current_state: string;
  next_state: string;
  person_name: string;
  rejection_reason?: string;
  test_rounds?: number;
}

/** 更新任务状态 */
export const updateTaskState = (params: UpdateTaskStateParams) => {
  const requestData: any = {
    task_id: params.task_id,
    current_state: params.current_state,
    next_state: params.next_state,
    person_name: params.person_name,
    rejection_reason: params.rejection_reason || ""
  };

  // 如果提供了测试轮数，添加到请求数据中
  if (params.test_rounds !== undefined && params.test_rounds !== null) {
    requestData.test_rounds = params.test_rounds;
  }

  return http.request<ApiResponse<any>>("post", "/task/update_state", {
    data: requestData
  });
};

/** 批量分配任务参数 */
export interface BulkAssignmentParams {
  hour?: number;
  task_json: Record<string, {
    task_name: string;
    state: string;
    current_assignee: string;
  }>;
  task_deadline: string;
}

/** 批量分配任务 */
export const bulkAssignment = (params: BulkAssignmentParams) => {
  return http.request<ApiResponse<any>>("post", "/task/bulk_assignment", {
    data: {
      task_json: params.task_json,
      hour: params.hour || 1,
      task_deadline: params.task_deadline
    }
  });
};


/** 分配任务 */
export const updateTaskDeadline = (params: any) => {
  return http.request<ApiResponse<any>>("post", "/task/update_task_deadline", {
    data: {
      task_id: params.task_id,
      task_deadline: params.task_deadline
    }
  });
};

/** 更新任务备注 */
export const updateTaskRemark = (params: { task_id: string; remark?: string }) => {
  return http.request<ApiResponse<any>>("post", "/task/update_remark", {
    data: {
      task_id: params.task_id,
      remark: params.remark ?? ""
    }
  });
};

/** 更新任务当前负责人参数 */
export interface UpdateCurrentAssigneeParams {
  task_id: string;
  current_assignee: string;
}

/** 更新任务当前负责人 */
export const updateCurrentAssignee = (params: UpdateCurrentAssigneeParams) => {
  return http.request<ApiResponse<any>>("post", "/task/update_current_assignee", {
    data: {
      task_id: params.task_id,
      current_assignee: params.current_assignee
    }
  });
};

/** 通过JSON更新任务参数 */
export interface UpdateTaskByJsonParams {
  json_data: any; // JSON对象
}

/** 通过JSON更新任务 */
export const updateTaskByJson = (params: UpdateTaskByJsonParams) => {
  return http.request<ApiResponse<any>>("post", "/project/update_task_by_json", {
    data: {
      json_data: params.json_data
    }
  });
};

/** 查询我的任务列表参数 */
export interface SelectMyTasksParams {
  state?: string;
  page?: number;
  page_size?: number;
}

/** 查询我的任务列表 */
export const selectMyTasks = (params: SelectMyTasksParams) => {
  return http.request<TaskListResponse>("post", "/task/user_select", {
    data: {
      state: params.state || "",
      page: params.page || 1,
      page_size: params.page_size || 20
    }
  });
};

/** 汇报任务进度参数 */
export interface ReportTaskProgressParams {
  recipient: string;
  cc_person: string;
  task_id: string;
  task_name: string;
  progress: number;
  message: string;
  use_time: number;
  state: string;
}

/** 汇报任务进度 */
export const reportTaskProgress = (params: ReportTaskProgressParams) => {
  return http.request<ApiResponse<any>>("post", "/task/report", {
    data: {
      recipient: params.recipient,
      cc_person: params.cc_person,
      task_id: params.task_id,
      task_name: params.task_name,
      progress: params.progress,
      message: params.message,
      use_time: params.use_time,
      state: params.state
    }
  });
};

/** 任务统计响应 */
export interface TaskStatisticsResponse {
  code: number;
  取消的任务: number; // 取消的任务数
  已完成任务: number; // 已完成任务数
  未完成任务: number; // 未完成任务数
}

/** 获取任务统计 */
export const getTaskStatistics = () => {
  return http.request<TaskStatisticsResponse>("get", "/task/statistics");
};

/** 查询待办任务参数 */
export interface SelectPendingTasksParams {
  page?: number;
  page_size?: number;
}

/** 查询待办任务列表 */
export const selectPendingTasks = (params: SelectPendingTasksParams) => {
  return http.request<TaskListResponse>("post", "/task/pending", {
    data: {
      page: params.page || 1,
      page_size: params.page_size || 20
    }
  });
};


/** 查询任务详情 */
export const selectTaskInfo = (params: any) => {
  return http.request<ApiResponse<any>>("post", "/task/info", {
    data: params
  });
};


/** 查询待办任务列表 */
export const selectStatisticsTaskState = () => {
  return http.request<ApiResponse<any>>("get", "/project/statistics_task_state");
};



export const selectProjectSelectAll = (params: any) => {
  return http.request<ApiResponse<any>>("post", "bug/project_select_all", {
    data: {
      project_id: params.project_id
    }
  });
};


/** 项目时间追踪参数 */
export interface TimeTrackingParams {
  project_id: string;
  day: number;
}

/** 项目时间追踪 */
export const timeTracking = (params: TimeTrackingParams) => {
  return http.request<ApiResponse<any>>("post", "/project/time_tracking", {
    data: {
      project_id: params.project_id,
      day: params.day
    }
  });
};


/** 更新任务开发时间参数 */
export interface UpdateDevelopmentTimeParams {
  task_id: string;
  development_start_time: string;
  development_end_time: string;
}

/** 更新任务开发时间 */
export const updateDevelopmentTime = (params: UpdateDevelopmentTimeParams) => {
  return http.request<ApiResponse<any>>("post", "/task/update_development_time", {
    data: {
      task_id: params.task_id,
      development_start_time: params.development_start_time,
      development_end_time: params.development_end_time
    }
  });
};

/** 查询任务汇报列表参数 */
export interface SelectReportListParams {
  page?: number;
  page_size?: number;
  task_id?: string;
}

/** 查询任务汇报列表 */
export const selectReportList = (params: SelectReportListParams) => {
  return http.request<ApiResponse<any>>("post", "/task/select_report", {
    data: {
      page: params.page || 1,
      page_size: params.page_size || 20,
      task_id: params.task_id || ""
    }
  });
};

/** 更新任务延期原因 */
export const updateTaskDelayReason = (params: {
  task_id: string;
  message?: string;
}) => {
  return http.request<ApiResponse<any>>("post", "/task/update_delay_message", {
    data: {
      task_id: params.task_id,
      message: params.message ?? "",
    }
  });
};

/** 查询需求类型 */
export const selectRequirementType = (params: any) => {
  return http.request<ApiResponse<any>>("post", "/project/select_requirement_type", {
    data: {
      project_id: params.project_id
    }
  });
};


/** 查询项目概览数据 */
export const selectProjectOverview = (params?: { project_type?: string }) => {
  return http.request<ApiResponse<any[]>>("get", "/project/overview", {
    params: params?.project_type ? { project_type: params.project_type } : undefined
  });
};



/** 查询项目记录数据 */
export const selectProjectRecord = (params: { day: string; project_type?: string }) => {
  return http.request<ApiResponse<any[]>>("post", "/project/record/select", {
    data: {
      day: params.day,
      ...(params.project_type ? { project_type: params.project_type } : {})
    }
  });
};

/** 暂停项目 */
export const updateProjectPause = (params: {
  project_id: string;
  project_type?: string;
}) => {
  return http.request<ApiResponse<any[]>>("post", "/project/pause", {
    data: {
      project_id: params.project_id,
      ...(params.project_type ? { project_type: params.project_type } : {})
    }
  });
};

/** 任务更换负责人 */
export const updateTaskTransfer = (params: any) => {
  return http.request<ApiResponse<any[]>>("post", "/task/transfer", {
    data: {
      task_id: params.task_id,
      person_name: params.person_name
    }
  });
};


/**更新任务延期原因 */
export const updateTaskDelayMessage = (params: any) => {
  return http.request<ApiResponse<any[]>>("post", "/task/task_delay_message", {
    data: {
      task_id: params.task_id,
      message: params.message
    }
  });
};

/** 查询任务统计 */
export const selectTaskStatistics = (params: {
  department?: string;
  user_name?: string;
  project_type?: string;
  project_name?: string;
  /** 任务完成期限倒序；默认 false 为正序 */
  reverse?: boolean;
}) => {
  return http.request<ApiResponse<Record<string, any[]> | any[]>>(
    "post",
    "department/task_select",
    {
      data: {
        department: params.department || "",
        user_name: params.user_name || "",
        project_type: params.project_type || "",
        project_name: params.project_name || "",
        reverse: params.reverse ?? false
      }
    }
  );
};