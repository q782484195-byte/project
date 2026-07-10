export interface UserOption {
  username: string;
  department: string;
}

export function parseNextStateUserList(data: unknown[] = []): UserOption[] {
  const options: UserOption[] = [];
  const seen = new Set<string>();

  data.forEach((item) => {
    if (!item || typeof item !== "object") return;
    const entry = Object.entries(item as Record<string, unknown>)[0];
    if (!entry) return;
    const [department, members] = entry;
    if (!Array.isArray(members)) return;

    members.forEach((user) => {
      let username = "";
      if (typeof user === "string") {
        username = user.trim();
      } else if (user && typeof user === "object") {
        username = String(
          (user as { username?: string; nickname?: string }).username ||
            (user as { nickname?: string }).nickname ||
            ""
        ).trim();
      }
      if (username && !seen.has(username)) {
        seen.add(username);
        options.push({
          username,
          department: String(department || "未分配部门")
        });
      }
    });
  });

  return options.sort((a, b) => a.username.localeCompare(b.username, "zh-CN"));
}

export function groupUsersByDepartment(users: UserOption[]) {
  const map = new Map<string, UserOption[]>();
  users.forEach((user) => {
    const list = map.get(user.department) || [];
    list.push(user);
    map.set(user.department, list);
  });
  return Array.from(map.entries()).map(([department, items]) => ({
    department,
    items
  }));
}
