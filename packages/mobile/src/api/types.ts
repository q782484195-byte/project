export interface ApiResponse<T = unknown> {
  code?: number;
  message?: string;
  msg?: string;
  result?: T;
  data?: T;
  total_count?: number;
  total?: number;
  dynamic?: Array<{ task_name?: string; history?: string }>;
}

export interface LoginResponse {
  code: number;
  message?: string;
  token: string;
  username: string;
  role?: string[];
  button_permissions?: string[];
}

export interface TaskListItem {
  _id?: string;
  id?: string;
  任务名?: string;
  task_name?: string;
  状态?: string;
  status?: string;
  优先级?: string;
  priority?: string;
  project_id?: string;
  project_name?: string;
  requirement_name?: string;
  当前处理人?: string;
  default_person?: string;
  creator?: string;
  进度?: number;
  progress?: number;
  task_deadline?: string;
  task_dead_line?: string;
  create_time?: string;
  describe?: Array<{ type?: string; content?: string }> | string;
  attachment?: unknown[];
  历史记录?: string[];
  show_color?: string;
  [key: string]: unknown;
}

export interface ProjectListItem {
  _id: string;
  project_name: string;
  state?: string;
  creator?: string;
  plant_end_time?: string;
  create_time?: string;
  [key: string]: unknown;
}

export interface TaskStatisticsResponse {
  code: number;
  取消的任务?: number;
  已完成任务?: number;
  未完成任务?: number;
}

export interface ReportListItem {
  _id?: string;
  task_id?: string;
  task_name?: string;
  message?: string;
  progress?: number;
  creator?: string;
  create_time?: string;
  [key: string]: unknown;
}
