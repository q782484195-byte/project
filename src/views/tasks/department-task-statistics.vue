<template>
  <div class="tasks-page" ref="pageRef">
    <!-- 任务列表 -->
    <el-card v-loading="loading">
      <div class="tasks-table-container" ref="containerRef">
        <!-- 第一层Tab：部门 -->
        <el-tabs v-model="activeDepartmentTab" v-if="Object.keys(tasks).length > 0"
          @tab-change="handleDepartmentTabChange">
          <el-tab-pane v-for="(departmentUsers, departmentName) in tasks" :key="departmentName"
            :label="`${departmentName} (${getDepartmentTaskCount(departmentName)})`" :name="departmentName">
            <!-- 第二层Tab：人员 -->
            <el-tabs v-model="activeUserTab[departmentName]" v-if="Object.keys(departmentUsers).length > 0">
              <el-tab-pane v-for="(userData, username) in departmentUsers" :key="username"
                :label="getUserTabLabel(username, userData)" :name="username">
                <el-table :data="getFilteredTasks(departmentName, username)" :style="{ width: '100%' }"
                  :height="tableHeight" row-key="rowKey">
                  <el-table-column prop="任务名" label="任务名称" width="140">
                    <template #default="{ row }">
                      {{ row.任务名 || row.task_name || row.title || "-" }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="requirement_name" label="关联层级" />
                  <el-table-column prop="当前处理人" label="当前处理人/部门">
                    <template #default="{ row }">
                      <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                        <el-tag type="success" size="small">
                          <span class="assignee-text-dept" style="color: #67C23A;">{{ row.部门 || "-" }}</span>
                        </el-tag>
                        <el-tag type="primary" size="small">
                          <span class="assignee-text">{{ row.当前处理人 || row.assignee || "-" }}</span>
                        </el-tag>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column prop="状态" label="状态">
                    <template #default="{ row }">
                      <el-tag :type="getStatusType(row.状态 || row.status) || undefined" size="small" effect="light">
                        {{ row.状态 || row.status || "-" }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="优先级" label="优先级">
                    <template #default="{ row }">
                      <el-tag :type="getPriorityType(row.优先级 || row.priority) || undefined" size="small">
                        {{ row.优先级 || row.priority || "-" }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="进度" label="进度">
                    <template #default="{ row }">
                      <el-progress :percentage="row.进度 || 0" :status="row.进度 === 100 ? 'success' : undefined" />
                    </template>
                  </el-table-column>
                  <el-table-column prop="task_deadline" label="任务截至日期" />
                  <el-table-column prop="create_time" label="创建时间" />
                </el-table>
              </el-tab-pane>
            </el-tabs>
            <el-empty v-else description="该部门暂无人员数据" :image-size="100" />
          </el-tab-pane>
        </el-tabs>
        <el-empty v-else description="暂无任务数据" :image-size="100" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { ElMessage } from "element-plus";
import { getTaskStatistics } from "@/api/system";
import { TaskStatus } from "@/types";

const loading = ref(false);
// 数据结构：Record<部门名, Record<用户名, { taskList: 任务列表, role: 角色 }>>
const tasks = ref<Record<string, Record<string, { taskList: any[], role: string[] }>>>({});
const activeDepartmentTab = ref<string>("");
const activeUserTab = ref<Record<string, string>>({});
const pageRef = ref<HTMLElement>();
const containerRef = ref<HTMLElement>();
const tableHeight = ref<number>(800);

// 角色映射
const roleMap: Record<string, string> = {
  "Admin": "管理员",
  "ProjectManager": "项目经理",
  "ProjectDirector": "项目总监",
  "DepartmentManager": "部门负责人",
  "Member": "普通成员",
  "BusinessDepartmentMembers": "业务部门成员"
};

// 格式化角色显示
const formatRole = (roles: string[]): string => {
  if (!roles || roles.length === 0) return "";
  return roles.map(role => roleMap[role] || role).join("、");
};

// 获取用户Tab标签（包含角色信息）
const getUserTabLabel = (username: string, userData: { taskList: any[], role: string[] }): string => {
  const roleText = formatRole(userData.role);
  const taskCount = userData.taskList.length;
  if (roleText) {
    return `${username} [${roleText}] (${taskCount})`;
  }
  return `${username} (${taskCount})`;
};

// 获取部门任务总数
const getDepartmentTaskCount = (departmentName: string): number => {
  const departmentUsers = tasks.value[departmentName];
  if (!departmentUsers) return 0;
  return Object.values(departmentUsers).reduce((total, userData) => total + userData.taskList.length, 0);
};

// 获取过滤后的任务列表（根据选中的部门和用户）
const getFilteredTasks = (departmentName: string, username: string): any[] => {
  const departmentUsers = tasks.value[departmentName];
  if (!departmentUsers || !departmentUsers[username]) {
    return [];
  }
  return departmentUsers[username].taskList.map((task: any, index: number) => {
    const taskId = task._id || task.id;
    const rowKey = taskId ? String(taskId) : `task_${index}_${Date.now()}`;
    return {
      ...task,
      rowKey: rowKey
    };
  });
};

// 处理部门Tab切换
const handleDepartmentTabChange = (departmentName: string) => {
  // 当切换部门时，自动选中该部门的第一个用户
  const departmentUsers = tasks.value[departmentName];
  if (departmentUsers && Object.keys(departmentUsers).length > 0) {
    const firstUser = Object.keys(departmentUsers)[0];
    activeUserTab.value[departmentName] = firstUser;
  }
};

// 获取状态类型
const getStatusType = (
  status: string
): "success" | "info" | "warning" | "danger" | "" => {
  if (!status) return "";
  const map: Record<string, "success" | "info" | "warning" | "danger" | ""> = {
    [TaskStatus.PENDING_ASSIGN_TO_DEPT_LEADER]: "warning", // 待分配给部门负责人 - 黄色
    [TaskStatus.PENDING_ASSIGN_TO_MEMBER]: "warning", // 待指派给成员 - 黄色
    [TaskStatus.NOT_STARTED]: "info", // 任务未开始 - 蓝色
    [TaskStatus.IN_PROGRESS]: "warning", // 任务进行中 - 黄色
    [TaskStatus.PENDING_TEST]: "info", // 待测试 - 蓝色
    [TaskStatus.TESTING]: "warning", // 测试中 - 黄色
    [TaskStatus.TEST_COMPLETED]: "success", // 测试完毕 - 绿色
    [TaskStatus.PENDING_REVIEW]: "info", // 待审阅 - 蓝色
    [TaskStatus.REVIEWING]: "warning", // 审阅中 - 黄色
    [TaskStatus.REVIEW_COMPLETED]: "success", // 审阅完毕 - 绿色
    [TaskStatus.CANCELLED]: "danger", // 已取消 - 红色
    [TaskStatus.COMPLETED]: "success" // 已完成 - 绿色
  };
  return map[status] || "info";
};

// 获取优先级类型
const getPriorityType = (
  priority: string
): "success" | "info" | "warning" | "danger" | "" => {
  const map: Record<string, "success" | "info" | "warning" | "danger" | ""> = {
    低: "info", // 蓝色
    中: "warning", // 黄色
    高: "danger", // 红色
    紧急: "danger"
  };
  return map[priority] || "";
};

// 计算表格高度
const calculateTableHeight = () => {
  nextTick(() => {
    if (!containerRef.value) return;

    const viewportHeight = window.innerHeight;
    const containerRect = containerRef.value.getBoundingClientRect();

    // 计算从容器顶部到视口底部的距离
    const containerTopToViewportBottom = viewportHeight - containerRect.top;

    // tabs header 高度（两层Tab，约80px）
    const tabsHeaderHeight = 100;

    // 底部预留空间（约20px）
    const bottomPadding = 20;

    // card 内部 padding（上下各约20px）
    const cardPadding = 40;

    // 计算表格可用高度：视口高度 - 容器顶部到视口顶部的距离 - tabs header - card padding - 底部padding
    const availableHeight = containerTopToViewportBottom - tabsHeaderHeight - cardPadding - bottomPadding;

    // 设置最小高度为400px
    tableHeight.value = Math.max(400, availableHeight);
  });
};

// 窗口大小改变时重新计算
const handleResize = () => {
  calculateTableHeight();
};

// 加载任务统计数据
const getTaskStatisticsData = async () => {
  loading.value = true;
  try {
    const res = await getTaskStatistics();
    if (res.code === 200 && res.result) {
      // 处理新的数据格式：对象，键是部门名，值是用户数组，每个用户有task_list
      if (typeof res.result === 'object' && !Array.isArray(res.result)) {
        const processedTasks: Record<string, Record<string, { taskList: any[], role: string[] }>> = {};

        // 遍历所有部门
        Object.keys(res.result).forEach((departmentName) => {
          const users = res.result[departmentName];
          processedTasks[departmentName] = {};

          // 如果部门下有用户数据
          if (Array.isArray(users) && users.length > 0) {
            // 遍历每个用户
            users.forEach((user: any) => {
              const username = user?.username || "未知用户";
              const userTasks: any[] = [];

              // 收集该用户的所有任务
              if (user && user.task_list && Array.isArray(user.task_list)) {
                user.task_list.forEach((task: any) => {
                  userTasks.push({
                    ...task,
                    部门: departmentName,
                    用户名: username,
                    角色: user.role || []
                  });
                });
              }

              // 无论是否有任务，都添加到结果中（空数组也要显示）
              processedTasks[departmentName][username] = {
                taskList: userTasks,
                role: user.role || []
              };
            });
          }
        });

        tasks.value = processedTasks;

        // 设置默认选中的部门和用户
        const departmentNames = Object.keys(tasks.value);
        if (departmentNames.length > 0 && !activeDepartmentTab.value) {
          activeDepartmentTab.value = departmentNames[0];
          // 设置该部门的第一个用户
          const firstDepartment = departmentNames[0];
          const firstDepartmentUsers = tasks.value[firstDepartment];
          if (firstDepartmentUsers && Object.keys(firstDepartmentUsers).length > 0) {
            activeUserTab.value[firstDepartment] = Object.keys(firstDepartmentUsers)[0];
          }
        }
      } else {
        // 兼容旧的数据格式（数组或旧的对象格式）
        if (Array.isArray(res.result)) {
          tasks.value = {
            "全部任务": {
              "全部": {
                taskList: res.result,
                role: []
              }
            }
          };
          activeDepartmentTab.value = "全部任务";
          activeUserTab.value["全部任务"] = "全部";
        } else {
          // 旧的对象格式（键是任务类型，值是任务数组）
          const oldTasks: Record<string, Record<string, { taskList: any[], role: string[] }>> = {};
          Object.keys(res.result).forEach(key => {
            oldTasks[key] = {
              "全部": {
                taskList: res.result[key],
                role: []
              }
            };
          });
          tasks.value = oldTasks;
          const taskTypes = Object.keys(tasks.value);
          if (taskTypes.length > 0 && !activeDepartmentTab.value) {
            activeDepartmentTab.value = taskTypes[0];
            activeUserTab.value[taskTypes[0]] = "全部";
          }
        }
      }
      // 数据加载完成后重新计算表格高度
      calculateTableHeight();
    } else {
      ElMessage.error("加载数据失败");
      tasks.value = {};
      activeDepartmentTab.value = "";
      activeUserTab.value = {};
    }
  } catch (error: any) {
    console.error("加载数据失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "加载数据失败"
    );
    tasks.value = {};
    activeDepartmentTab.value = "";
    activeUserTab.value = {};
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  getTaskStatisticsData();
  calculateTableHeight();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped lang="scss">
.tasks-page {
  .tasks-table-container {
    min-height: 800px;
    display: flex;
    flex-direction: column;
  }

  .assignee-text {
    color: #409eff;
  }

  .assignee-text-dept {
    color: #67C23A;
  }
}
</style>
