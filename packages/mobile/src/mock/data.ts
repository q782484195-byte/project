/** 移动端模拟数据（App / 小程序共用） */
import { getPriorityTone, getStatusTone } from "@/utils/status";
import type { StatusTone } from "@/utils/status";

/** 演示登录账号（不调真实接口） */
export const MOCK_LOGIN = {
  username: "admin",
  password: "123456",
  token: "mock-token-demo",
  user: {
    id: "1",
    username: "admin",
    name: "张三",
    nickname: "张三",
    department: "研发一部",
    roles: ["user"],
    permissions: [] as string[]
  }
};

export function validateMockLogin(username: string, password: string) {
  return (
    username.trim() === MOCK_LOGIN.username &&
    password === MOCK_LOGIN.password
  );
}

export interface MockTag {
  label: string;
  tone: StatusTone;
}

export interface MockTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  project: string;
  projectId: string;
  progress: number;
  dueDate: string;
  assignee: string;
  collaborators?: string;
  description: string;
  overdue?: boolean;
  tags: MockTag[];
  meta: string;
}

export interface MockProject {
  id: string;
  name: string;
  progress: number;
  doingCount: number;
  dueDate: string;
}

export interface MockFeed {
  id: string;
  name: string;
  avatar: string;
  text: string;
  time: string;
}

export interface MockMessage {
  id: string;
  type: "assign" | "due" | "mention" | "report" | "status";
  title: string;
  content: string;
  time: string;
  read: boolean;
  category: "all" | "task" | "system" | "mention";
}

export interface MockAttach {
  id: string;
  name: string;
  size: string;
  ext: string;
}

export interface MockTimeline {
  id: string;
  text: string;
  time: string;
  active?: boolean;
}

export const mockStats = [
  { key: "overdue", label: "逾期", value: 2, warn: true },
  { key: "todo", label: "待办", value: 12 },
  { key: "doing", label: "进行中", value: 8 },
  { key: "done", label: "已完成", value: 156 }
];

export const mockProjects: MockProject[] = [
  {
    id: "p1",
    name: "智能硬件 V2.0",
    progress: 72,
    doingCount: 5,
    dueDate: "07-31"
  },
  {
    id: "p2",
    name: "项目管理系统",
    progress: 48,
    doingCount: 3,
    dueDate: "08-15"
  }
];

export const mockTasks: MockTask[] = [
  {
    id: "1",
    title: "联调日报导出接口",
    status: "逾期",
    priority: "高",
    project: "智能硬件 V2.0",
    projectId: "p1",
    progress: 40,
    dueDate: "07-08",
    assignee: "张三",
    collaborators: "李四",
    description: "完成日报导出 PDF/Excel 联调，处理中文乱码与分页问题。",
    overdue: true,
    tags: [
      { label: "逾期", tone: getStatusTone("逾期") },
      { label: "高", tone: getPriorityTone("高") }
    ],
    meta: "40% · 07-08"
  },
  {
    id: "2",
    title: "优化登录页表单校验逻辑",
    status: "任务进行中",
    priority: "高",
    project: "智能硬件 V2.0",
    projectId: "p1",
    progress: 65,
    dueDate: "07-15",
    assignee: "张三",
    collaborators: "李四、王五",
    description:
      "完善前端表单校验与错误提示，覆盖账号、密码、验证码场景。保证空值、格式错误与网络异常时提示清晰，并与后端错误码对齐。",
    tags: [
      { label: "进行中", tone: getStatusTone("进行中") },
      { label: "高", tone: getPriorityTone("高") }
    ],
    meta: "65% · 07-15"
  },
  {
    id: "3",
    title: "修复任务列表分页异常",
    status: "待测试",
    priority: "中",
    project: "项目管理系统",
    projectId: "p2",
    progress: 90,
    dueDate: "07-10",
    assignee: "李四",
    collaborators: "张三",
    description: "修复翻页后数据重复与空页问题，补充边界用例。",
    tags: [
      { label: "待测试", tone: getStatusTone("待测试") },
      { label: "中", tone: getPriorityTone("中") }
    ],
    meta: "90% · 07-10"
  },
  {
    id: "4",
    title: "补充移动端消息推送文案",
    status: "待办",
    priority: "中",
    project: "项目管理系统",
    projectId: "p2",
    progress: 0,
    dueDate: "07-12",
    assignee: "张三",
    description: "整理任务分配、逾期、@提醒等推送文案模板。",
    tags: [
      { label: "待办", tone: getStatusTone("待办") },
      { label: "中", tone: getPriorityTone("中") }
    ],
    meta: "0% · 07-12"
  },
  {
    id: "5",
    title: "整理本周日报模板",
    status: "已完成",
    priority: "低",
    project: "运营后台",
    projectId: "p3",
    progress: 100,
    dueDate: "07-08",
    assignee: "张三",
    description: "统一日报字段与导出格式。",
    tags: [{ label: "已完成", tone: getStatusTone("已完成") }],
    meta: "100% · 07-08"
  }
];

export const mockFeeds: MockFeed[] = [
  {
    id: "f1",
    name: "李四",
    avatar: "李",
    text: "汇报了「修复任务列表分页异常」进度至 90%",
    time: "10 分钟前"
  },
  {
    id: "f2",
    name: "王五",
    avatar: "王",
    text: "将「补充消息推送文案」分配给你",
    time: "1 小时前"
  },
  {
    id: "f3",
    name: "赵六",
    avatar: "赵",
    text: "提交了 BUG：导出 PDF 中文乱码",
    time: "昨天 18:20"
  }
];

export const mockMessages: MockMessage[] = [
  {
    id: "m1",
    type: "assign",
    title: "任务分配提醒",
    content: "张三将任务「优化登录页表单校验逻辑」分配给你",
    time: "10:30",
    read: false,
    category: "task"
  },
  {
    id: "m2",
    type: "due",
    title: "截止日期临近",
    content: "「联调日报导出接口」已逾期 1 天，请及时更新进度",
    time: "09:12",
    read: false,
    category: "task"
  },
  {
    id: "m3",
    type: "mention",
    title: "有人提到了你",
    content: "李四在「登录校验」评论中 @了你：验证码超时也要覆盖",
    time: "08:55",
    read: false,
    category: "mention"
  },
  {
    id: "m4",
    type: "report",
    title: "进度汇报",
    content: "李四提交了任务进度汇报，当前进度 90%",
    time: "昨天",
    read: true,
    category: "task"
  },
  {
    id: "m5",
    type: "status",
    title: "状态变更",
    content: "「整理本周日报模板」已标记为已完成",
    time: "周一",
    read: true,
    category: "system"
  }
];

export const mockAttachments: MockAttach[] = [
  { id: "a1", name: "登录校验需求说明.pdf", size: "1.2 MB", ext: "PDF" },
  { id: "a2", name: "错误提示示意.png", size: "340 KB", ext: "PNG" }
];

export const mockTimeline: MockTimeline[] = [
  { id: "t1", text: "张三 更新进度至 65%", time: "今天 09:20", active: true },
  { id: "t2", text: "李四 评论：验证码场景也要覆盖超时", time: "昨天 16:42" },
  { id: "t3", text: "王五 将任务分配给 张三", time: "07-07 11:05" }
];

export const MSG_ICON_MAP: Record<MockMessage["type"], string> = {
  assign: "msg-assign",
  due: "msg-due",
  mention: "msg-mention",
  report: "msg-report",
  status: "msg-status"
};

export function findTaskById(id?: string) {
  return mockTasks.find((t) => t.id === id) || mockTasks[1];
}
