export const MSG_ICON_MAP = {
  assign: "msg-assign",
  due: "msg-due",
  mention: "msg-mention",
  report: "msg-report",
  status: "msg-status"
} as const;

export type MessageType = keyof typeof MSG_ICON_MAP;

export interface MobileMessage {
  id: string;
  type: MessageType;
  title: string;
  content: string;
  time: string;
  read: boolean;
  category: "all" | "task" | "system" | "mention";
  taskId?: string;
}
