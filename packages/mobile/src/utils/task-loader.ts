import { selectMyTasks } from "@/api/task";
import type { ApiResponse } from "@/api/types";
import { unwrapList } from "@/utils/api";
import { mapTaskToMobile, type MobileTask } from "@/utils/task-mapper";

function getTotalCount(response: ApiResponse<unknown>) {
  return Number(response.total_count ?? response.total ?? 0);
}

/** 拉取当前用户任务列表（自动分页，用于统计） */
export async function loadMyTasksForStats(pageSize = 100, maxPages = 5) {
  const first = await selectMyTasks({ page: 1, page_size: pageSize });
  let rawList = unwrapList(first);
  const total = getTotalCount(first) || rawList.length;

  if (total > rawList.length) {
    const pages = Math.min(Math.ceil(total / pageSize), maxPages);
    for (let page = 2; page <= pages; page += 1) {
      const res = await selectMyTasks({ page, page_size: pageSize });
      rawList = rawList.concat(unwrapList(res));
    }
  }

  return rawList.map(mapTaskToMobile) as MobileTask[];
}
