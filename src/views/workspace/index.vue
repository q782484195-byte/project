<template>
  <div class="workspace-page" ref="pageRef">
    <!-- Tab 切换：工作台-任务-需求-项目 -->
    <el-tabs v-model="activeTab" @tab-change="handleTabChange" class="workspace-tabs">
      <!-- 工作台 Tab -->
      <el-tab-pane label="待办任务" name="workspace">
        <el-row :gutter="20" class="workspace-dashboard-row">
          <!-- 左侧：占2/3 -->
          <el-col :span="24" :xs="24" class="workspace-dashboard-left-col">
            <!-- 待办事项 -->
            <el-card ref="todoTasksCardRef">
              <template #header>
                <div class="card-header">
                  <span>待办事项</span>
                  <el-button type="primary" plain size="small" @click="activityDialogVisible = true">
                    查看任务动态
                  </el-button>
                </div>
              </template>
              <template v-if="!isMobile">
                <el-table :data="todoTasks" v-loading="tasksLoading" :style="{ width: '100%' }"
                  :height="todoTasksTableHeight" :cell-style="getTaskCellStyle">
                  <el-table-column prop="项目名称" label="项目名称">
                    <template #default="{ row }">
                      <el-tooltip :content="row.项目名称 || row.project_name || '-'" placement="top"
                        :disabled="!row.项目名称 && !row.project_name">
                        <div class="text-ellipsis">{{ row.项目名称 || row.project_name || "-" }}</div>
                      </el-tooltip>
                    </template>
                  </el-table-column>
                  <el-table-column prop="任务名" label="任务名称">
                    <template #default="{ row }">
                      <el-tooltip :content="row.任务名 || row.task_name || row.title || '-'" placement="top"
                        :disabled="!row.任务名 && !row.task_name && !row.title">
                        <div class="text-ellipsis">{{ row.任务名 || row.task_name || row.title || "-" }}</div>
                      </el-tooltip>
                    </template>
                  </el-table-column>
                  <el-table-column prop="指派人" label="负责人">
                    <template #default="{ row }">
                      <el-tooltip :content="row.指派人 || row.assignee || '-'" placement="top"
                        :disabled="!row.指派人 && !row.assignee">
                        <div class="assignee-text text-ellipsis">{{ row.指派人 || row.assignee || "-" }}</div>
                      </el-tooltip>
                    </template>
                  </el-table-column>
                  <el-table-column prop="状态" label="状态">
                    <template #default="{ row }">
                      <el-tooltip :content="row.状态 || row.status || '-'" placement="top"
                        :disabled="!row.状态 && !row.status">
                        <div class="status-text text-ellipsis">{{ row.状态 || row.status || "-" }}</div>
                      </el-tooltip>
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
                      {{ (row.进度 || 0) + '%' }}
                      <!-- <el-progress :percentage="row.进度 || 0" :status="row.进度 === 100 ? 'success' : undefined" /> -->
                    </template>
                  </el-table-column>
                  <el-table-column prop="task_deadline" label="计划完成时间" show-overflow-tooltip />
                  <el-table-column prop="assignment_time" label="任务分配时间" show-overflow-tooltip />
                  <el-table-column label="操作" :min-width="operationColWidth(4)" fixed="right" width="200">
                    <template #default="{ row }">
                      <div class="table-action-btns">
                        <el-button type="primary" link size="small"
                          @click="handleTodoTaskDropdownCommand('view', row)">查看</el-button>
                        <el-button type="primary" link size="small"
                          @click="handleTodoTaskDropdownCommand('assign', row)"
                          v-if="(row.当前处理人 || row.current_handler) === userStore.username && row.next_state && Array.isArray(row.next_state) && row.next_state.length > 0">
                          分配
                        </el-button>
                        <el-button type="primary" link size="small"
                          @click="handleTodoTaskDropdownCommand('report', row)"
                          v-if="(row.当前处理人 || row.current_handler) === userStore.username && canRecordBug(row.状态 || row.status, 'report') && hasPerms(['task:report'])"
                          class="action-success">
                          进度汇报
                        </el-button>
                        <el-button type="primary" link size="small" @click="handleTodoTaskDropdownCommand('bug', row)"
                          v-if="(row.当前处理人 || row.current_handler) === userStore.username && canRecordBug(row.状态 || row.status, 'bug') && hasPerms(['bug:record'])"
                          class="action-warning">
                          记录BUG
                        </el-button>
                      </div>
                    </template>
                  </el-table-column>
                </el-table>
                <div class="table-pagination-wrapper">
                  <el-pagination v-model:current-page="todoTasksPage" v-model:page-size="todoTasksPageSize"
                    :total="todoTasksTotal" :page-sizes="[10, 20, 50, 100]"
                    layout="total, sizes, prev, pager, next, jumper" @size-change="handleTodoTasksSizeChange"
                    @current-change="handleTodoTasksPageChange" />
                </div>
              </template>
              <!-- 移动端：待办事项卡片列表 -->
              <template v-else>
                <div v-loading="tasksLoading" class="workspace-mobile-cards">
                  <template v-if="todoTasks.length">
                    <div v-for="(row, idx) in todoTasks" :key="row._id || row.id || idx" class="workspace-mobile-card"
                      :style="getTaskCardStyle(row)">
                      <div class="workspace-mobile-card__title">{{ row.任务名 || row.task_name || row.title || "-" }}</div>
                      <div class="workspace-mobile-card__meta">
                        <el-tag v-if="row.状态 || row.status" size="small" effect="light">{{ row.状态 || row.status
                          }}</el-tag>
                        <el-tag v-if="row.优先级 || row.priority" :type="getPriorityType(row.优先级 || row.priority)"
                          size="small">{{ row.优先级 || row.priority }}</el-tag>
                      </div>
                      <div class="workspace-mobile-card__row">
                        <span class="workspace-mobile-card__label">项目</span>
                        <span class="workspace-mobile-card__value">{{ row.项目名称 || row.project_name || "-" }}</span>
                      </div>
                      <div class="workspace-mobile-card__row">
                        <span class="workspace-mobile-card__label">负责人</span>
                        <span class="workspace-mobile-card__value">{{ row.指派人 || row.assignee || "-" }}</span>
                      </div>
                      <div class="workspace-mobile-card__row">
                        <span class="workspace-mobile-card__label">进度</span>
                        <span class="workspace-mobile-card__value">{{ (row.进度 ?? 0) + "%" }}</span>
                      </div>
                      <div class="workspace-mobile-card__actions">
                        <el-button type="primary" link size="small"
                          @click="handleTodoTaskDropdownCommand('view', row)">查看</el-button>
                        <el-button type="primary" link size="small"
                          @click="handleTodoTaskDropdownCommand('assign', row)"
                          v-if="(row.当前处理人 || row.current_handler) === userStore.username && row.next_state && Array.isArray(row.next_state) && row.next_state.length > 0">分配</el-button>
                        <el-button type="primary" link size="small"
                          @click="handleTodoTaskDropdownCommand('report', row)"
                          v-if="(row.当前处理人 || row.current_handler) === userStore.username && canRecordBug(row.状态 || row.status, 'report') && hasPerms(['task:report'])"
                          class="action-success">进度汇报</el-button>
                        <el-button type="primary" link size="small" @click="handleTodoTaskDropdownCommand('bug', row)"
                          v-if="(row.当前处理人 || row.current_handler) === userStore.username && canRecordBug(row.状态 || row.status, 'bug') && hasPerms(['bug:record'])"
                          class="action-warning">记录BUG</el-button>
                      </div>
                    </div>
                  </template>
                  <el-empty v-else-if="!tasksLoading" description="暂无待办" :image-size="80" />
                </div>
                <div class="table-pagination-wrapper">
                  <el-pagination v-model:current-page="todoTasksPage" v-model:page-size="todoTasksPageSize"
                    :total="todoTasksTotal" :page-sizes="[10, 20, 50, 100]"
                    layout="total, prev, pager, next" :small="true" @size-change="handleTodoTasksSizeChange"
                    @current-change="handleTodoTasksPageChange" />
                </div>
              </template>

            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <!-- 任务 Tab -->
      <el-tab-pane label="全部任务" name="tasks">
        <!-- 搜索表单 -->
        <!-- <el-card class="mb-20">
          <template #header>
            <div class="card-header">
              <span>任务查询</span>
            </div>
          </template>
          <el-form :model="taskSearchForm" :inline="true" class="search-form">
            <el-form-item label="状态">
              <el-select v-model="taskSearchForm.state" placeholder="全部状态" clearable style="width: 180px"
                @change="handleTaskStateChange">
                <el-option label="待分配给部门负责人" value="待分配给部门负责人" />
                <el-option label="待指派给成员" value="待指派给成员" />
                <el-option label="任务未开始" value="任务未开始" />
                <el-option label="任务进行中" value="任务进行中" />
                <el-option label="待测试" value="待测试" />
                <el-option label="测试中" value="测试中" />
                <el-option label="测试完毕" value="测试完毕" />
                <el-option label="待审阅" value="待审阅" />
                <el-option label="审阅中" value="审阅中" />
                <el-option label="审阅完毕" value="审阅完毕" />
                <el-option label="已取消" value="已取消" />
                <el-option label="已完成" value="已完成" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleTaskSearch">搜索</el-button>
              <el-button @click="handleTaskSearchReset">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card> -->

        <el-card ref="allTasksCardRef">
          <template #header>
            <div class="card-header">
              <span>任务列表</span>
              <!-- <el-button type="primary" size="small" @click="goToMyTasks">查看更多</el-button> -->
            </div>
          </template>
          <template v-if="!isMobile">
            <el-table :data="allTasks" v-loading="allTasksLoading" :style="{ width: '100%' }"
              :height="allTasksTableHeight" :cell-style="getTaskCellStyle">
              <el-table-column prop="project_name" label="项目名称" />
              <el-table-column prop="任务名" label="任务名称" />
              <el-table-column prop="指派人" label="负责人" />
              <el-table-column prop="状态" label="状态" width="140">
                <template #default="{ row }">
                  <el-tag :type="getStatusType(row.状态)" size="small">
                    {{ row.状态 }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="优先级" label="优先级">
                <template #default="{ row }">
                  <el-tag v-if="row.优先级" :type="getPriorityType(row.优先级)" size="small">
                    {{ row.优先级 }}
                  </el-tag>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column prop="progress" label="进度">
                <template #default="{ row }">
                  {{ (row.进度 || 0) + "%" }}
                </template>
              </el-table-column>
              <el-table-column prop="task_deadline" label="计划完成时间">
                <template #default="{ row }">
                  {{ row.task_deadline || "-" }}
                </template>
              </el-table-column>
              <el-table-column prop="assignment_time" label="任务分配时间">
                <template #default="{ row }">
                  {{ row.create_time || "-" }}
                </template>
              </el-table-column>
              <el-table-column label="操作" :min-width="operationColWidth(4)" fixed="right" width="200">
                <template #default="{ row }">
                  <div class="table-action-btns">
                    <el-button type="primary" link size="small"
                      @click="handleAllTaskDropdownCommand('view', row)">查看</el-button>
                    <el-button type="primary" link size="small" @click="handleAllTaskDropdownCommand('assign', row)"
                      v-if="(row.当前处理人 || row.current_handler) === userStore.username && row.next_state && Array.isArray(row.next_state) && row.next_state.length > 0">
                      分配
                    </el-button>
                    <el-button type="primary" link size="small" @click="handleAllTaskDropdownCommand('bug', row)"
                      v-if="(row.当前处理人 || row.current_handler) === userStore.username && canRecordBug(row.状态 || row.status, 'bug')"
                      class="action-warning">
                      记录BUG
                    </el-button>
                    <el-button type="primary" link size="small" @click="handleAllTaskDropdownCommand('report', row)"
                      v-if="(row.当前处理人 || row.current_handler) === userStore.username && canRecordBug(row.状态 || row.status, 'report') && hasPerms(['task:report'])"
                      class="action-success">
                      进度汇报
                    </el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>
            <div class="table-pagination-wrapper">
              <el-pagination v-model:current-page="allTasksPage" v-model:page-size="allTasksPageSize"
                :total="allTasksTotal" :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next, jumper" @size-change="handleAllTasksSizeChange"
                @current-change="handleAllTasksPageChange" />
            </div>
          </template>
          <!-- 移动端：任务列表卡片 -->
          <template v-else>
            <div v-loading="allTasksLoading" class="workspace-mobile-cards">
              <template v-if="allTasks.length">
                <div v-for="(row, idx) in allTasks" :key="row._id || row.id || idx"
                  class="workspace-mobile-card" :style="getTaskCardStyle(row)">
                  <div class="workspace-mobile-card__title">{{ row.任务名 || row.task_name || row.title || "-" }}</div>
                  <div class="workspace-mobile-card__meta">
                    <el-tag v-if="row.状态" :type="getStatusType(row.状态)" size="small">{{ row.状态 }}</el-tag>
                    <el-tag v-if="row.优先级" :type="getPriorityType(row.优先级)" size="small">{{ row.优先级 }}</el-tag>
                  </div>
                  <div class="workspace-mobile-card__row">
                    <span class="workspace-mobile-card__label">当前处理人</span>
                    <span class="workspace-mobile-card__value">{{ row.当前处理人 || row.current_handler || "-" }}</span>
                  </div>
                  <div class="workspace-mobile-card__row">
                    <span class="workspace-mobile-card__label">所属层级</span>
                    <span class="workspace-mobile-card__value">{{ row.requirement_name || "-" }}</span>
                  </div>
                  <div class="workspace-mobile-card__actions">
                    <el-button type="primary" link size="small"
                      @click="handleAllTaskDropdownCommand('view', row)">查看</el-button>
                    <el-button type="primary" link size="small" @click="handleAllTaskDropdownCommand('assign', row)"
                      v-if="(row.当前处理人 || row.current_handler) === userStore.username && row.next_state && Array.isArray(row.next_state) && row.next_state.length > 0">分配</el-button>
                    <el-button type="primary" link size="small" @click="handleAllTaskDropdownCommand('bug', row)"
                      v-if="(row.当前处理人 || row.current_handler) === userStore.username && canRecordBug(row.状态 || row.status, 'bug')"
                      class="action-warning">记录BUG</el-button>
                    <el-button type="primary" link size="small" @click="handleAllTaskDropdownCommand('report', row)"
                      v-if="(row.当前处理人 || row.current_handler) === userStore.username && canRecordBug(row.状态 || row.status, 'report') && hasPerms(['task:report'])"
                      class="action-success">进度汇报</el-button>
                  </div>
                </div>
              </template>
              <el-empty v-else-if="!allTasksLoading" description="暂无任务" :image-size="80" />
            </div>
            <div class="table-pagination-wrapper">
              <el-pagination v-model:current-page="allTasksPage" v-model:page-size="allTasksPageSize"
                :total="allTasksTotal" :page-sizes="[10, 20, 50, 100]"
                layout="total, prev, pager, next" :small="true" @size-change="handleAllTasksSizeChange"
                @current-change="handleAllTasksPageChange" />
            </div>
          </template>
        </el-card>
      </el-tab-pane>
      <!-- 需求 Tab -->

      <!-- <el-tab-pane label="层级" name="requirements">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>层级列表</span>
            </div>
          </template>
          <el-table :data="requirements" v-loading="requirementsLoading" :style="{ width: '100%' }" :height="700">
            <el-table-column prop="需求名" label="层级名称" min-width="200" />
            <el-table-column prop="状态" label="状态" width="140">
              <template #default="{ row }">
                <el-tag :type="getRequirementStatusType(row.状态)" size="small">
                  {{ row.状态 }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="优先级" label="优先级" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.优先级" :type="getPriorityType(row.优先级)" size="small">
                  {{ row.优先级 }}
                </el-tag>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="project_name" label="选择项目" min-width="150" />
            <el-table-column prop="creator" label="创建人" width="100" />
            <el-table-column prop="create_time" label="创建时间" width="160" />
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" link @click="viewRequirement(row)">
                  查看
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane> -->

      <!-- 项目 Tab -->
      <!-- <el-tab-pane label="项目" name="projects">
        <el-card ref="projectsCardRef">
          <template #header>
            <div class="card-header">
              <span>项目列表</span>
            </div>
          </template>
          <template v-if="!isMobile">
            <el-table :data="projects" v-loading="projectsLoading" :style="{ width: '100%' }"
              :height="projectsTableHeight">
              <el-table-column prop="project_name" label="项目名称" min-width="200" />
              <el-table-column prop="state" label="状态" width="140">
                <template #default="{ row }">
                  <el-tag :type="getProjectStatusType(row.state)" size="small">
                    {{ row.state }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="creator" label="创建人" width="100" />
              <el-table-column prop="plant_start_time" label="计划开始时间" width="160" />
              <el-table-column prop="plant_end_time" label="计划计划结束时间" width="160" />
              <el-table-column prop="create_time" label="创建时间" width="160" />
              <el-table-column label="操作" :min-width="operationColWidth(1)" fixed="right">
                <template #default="{ row }">
                  <div class="table-action-btns">
                    <el-button type="primary" link size="small"
                      @click="handleProjectDropdownCommand('view', row)">查看</el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </template>
          <template v-else>
            <div v-loading="projectsLoading" class="workspace-mobile-cards">
              <template v-if="projects.length">
                <div v-for="(row, idx) in projects" :key="row._id ?? idx" class="workspace-mobile-card">
                  <div class="workspace-mobile-card__title">{{ row.project_name || "-" }}</div>
                  <div class="workspace-mobile-card__meta">
                    <el-tag v-if="row.state" :type="getProjectStatusType(row.state)" size="small">{{ row.state
                    }}</el-tag>
                  </div>
                  <div class="workspace-mobile-card__row">
                    <span class="workspace-mobile-card__label">创建人</span>
                    <span class="workspace-mobile-card__value">{{ row.creator || "-" }}</span>
                  </div>
                  <div class="workspace-mobile-card__row">
                    <span class="workspace-mobile-card__label">计划开始</span>
                    <span class="workspace-mobile-card__value">{{ row.plant_start_time || "-" }}</span>
                  </div>
                  <div class="workspace-mobile-card__row">
                    <span class="workspace-mobile-card__label">计划结束</span>
                    <span class="workspace-mobile-card__value">{{ row.plant_end_time || "-" }}</span>
                  </div>
                  <div class="workspace-mobile-card__actions">
                    <el-button type="primary" link size="small"
                      @click="handleProjectDropdownCommand('view', row)">查看</el-button>
                  </div>
                </div>
              </template>
              <el-empty v-else-if="!projectsLoading" description="暂无项目" :image-size="80" />
            </div>
          </template>
        </el-card> 
      </el-tab-pane> -->
    </el-tabs>

    <!-- 任务动态对话框 -->
    <el-dialog v-model="activityDialogVisible" title="任务动态" width="680px" append-to-body class="activity-dialog"
      destroy-on-close>
      <div class="activity-dialog-body">
        <div v-if="activities.length" class="activity-dialog-summary">
          共 <span class="activity-dialog-count">{{ activities.length }}</span> 条动态
        </div>
        <div class="activity-list activity-dialog-list">
          <div v-for="(activity, index) in activities" :key="index" class="activity-item">
            <div class="activity-item__timeline">
              <span class="activity-item__dot" />
              <span v-if="index !== activities.length - 1" class="activity-item__line" />
            </div>
            <div class="activity-item__card">
              <div v-if="activity.time" class="activity-time">{{ activity.time }}</div>
              <div class="activity-content">
                <span class="activity-text">{{ activity.content }}</span>
              </div>
            </div>
          </div>
          <el-empty v-if="activities.length === 0" description="暂无动态" class="activity-dialog-empty" />
        </div>
      </div>
    </el-dialog>

    <!-- 任务状态分配对话框 -->
    <TaskStatusFlowDialog v-model:visible="statusFlowDialogVisible" :task="statusFlowTask"
      @success="handleStatusFlowSuccess" @flow-start="handleStatusFlowStart" @flow-end="handleStatusFlowEnd" />

    <!-- BUG记录对话框 -->
    <el-dialog v-model="bugDialogVisible" title="记录BUG" width="600px" append-to-body>
      <el-form ref="bugFormRef" :model="bugForm" :rules="bugFormRules" label-width="100px">
        <el-form-item label="BUG名称" prop="bug_name">
          <el-input v-model="bugForm.bug_name" placeholder="请输入BUG名称" />
        </el-form-item>
        <el-form-item label="BUG描述" prop="describe">
          <el-input v-model="bugForm.describe" type="textarea" :rows="4" placeholder="请输入BUG描述" />
        </el-form-item>

        <el-form-item label="关联任务">
          <el-input v-model="bugForm.task_name" disabled />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="bugDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="bugSubmitting" @click="submitBug">提交</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 进度汇报对话框 -->
    <el-dialog v-model="reportDialogVisible" title="进度汇报" width="480px" append-to-body :close-on-click-modal="false">
      <el-form ref="reportFormRef" :model="reportForm" :rules="reportRules" label-width="90px">
        <el-form-item label="任务名称">
          <span>{{ reportForm.task_name || "-" }}</span>
        </el-form-item>
        <el-form-item label="接收人" prop="recipient">
          <span>{{ reportForm.recipient || "-" }}</span>
        </el-form-item>
        <el-form-item label="当前进度" prop="progress">
          <div style="display: flex; align-items: center; width: 100%;">
            <el-input-number v-model="reportForm.progress" :min="0" :max="100" :step="1" :precision="0"
              controls-position="right" style="flex: 1;" />
            <span style="margin-left: 8px; color: #606266;">%</span>
          </div>
        </el-form-item>
        <!-- <el-form-item label="今日用时" prop="use_time">
          <div style="display: flex; align-items: center; width: 100%;">
            <el-input-number v-model="reportForm.use_time" :min="0" controls-position="right" style="flex: 1;"
              placeholder="请输入当前用时" />
            <span style="margin-left: 8px; color: #606266;">时</span>
          </div>
        </el-form-item> -->
        <el-form-item label="汇报内容" prop="message">
          <el-input v-model="reportForm.message" type="textarea" :rows="4" placeholder="请输入汇报内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="reportDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="reportSubmitting" @click="handleReportSubmit">提交</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 填写预计工时对话框 -->
    <el-dialog v-model="developmentTimeDialogVisible" title="填写预计工时" width="500px" append-to-body
      :close-on-click-modal="false">
      <el-form ref="developmentTimeFormRef" :model="developmentTimeForm" :rules="developmentTimeRules"
        label-width="120px">
        <el-form-item label="任务名称">
          <span>{{ developmentTimeForm.task_name || "-" }}</span>
        </el-form-item>
        <el-form-item label="研发开始时间" prop="development_start_time">
          <el-date-picker v-model="developmentTimeForm.development_start_time" type="date" placeholder="请选择研发开始时间"
            format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="研发结束时间" prop="development_end_time">
          <el-date-picker v-model="developmentTimeForm.development_end_time" type="date" placeholder="请选择研发结束时间"
            format="YYYY-MM-DD" value-format="YYYY-MM-DD" :disabled-date="(time: Date) => {
              if (developmentTimeForm.task_deadline) {
                const deadline = new Date(developmentTimeForm.task_deadline);
                deadline.setHours(23, 59, 59, 999);
                return time.getTime() > deadline.getTime();
              }
              return false;
            }" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="developmentTimeDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="developmentTimeSubmitting"
            @click="handleDevelopmentTimeSubmit">提交</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onBeforeUnmount, onUnmounted, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useUserStoreHook } from "@/store/modules/user";
import { hasPerms } from "@/utils/auth";
import { selectMyTasks, selectRequirements, selectProjects, getTaskStatistics, selectPendingTasks, selectUserRequirements, flattenRequirementData, reportTaskProgress, updateDevelopmentTime } from "@/api/project";
import { createBug } from "@/api/bug";
import { type DepartmentUserItem } from "@/api/system";
import { selectSelfReports, selectReports, type ReportRecord } from "@/api/report";
import { ElMessage } from "element-plus";
import { User, Clock, Document, DataLine, OfficeBuilding } from "@element-plus/icons-vue";
import type { TaskListItem, RequirementListItem, ProjectListItem } from "@/api/project";
import { TaskStatus } from "@/types";
import TaskStatusFlowDialog from "@/components/TaskStatusFlowDialog.vue";
import type { FormInstance, FormRules } from "element-plus";

defineOptions({
  name: "Workspace"
});

const router = useRouter();
const route = useRoute();
const userStore = useUserStoreHook();

// 角色代码 -> 显示名称
const roleNameMap: Record<string, string> = {
  Admin: "管理员",
  ProjectManager: "项目经理",
  DepartmentManager: "部门主管",
  Member: "普通成员",
  ProjectDirector: "项目总监",
  BusinessDepartmentMembers: "业务部门成员"
};
const getRoleName = (role: string) => roleNameMap[role] || role;
const displayRoleNames = computed(() => {
  const roles = userStore.roles || [];
  return roles.length ? roles.map(getRoleName).join("、") : "";
});

// 当前时间
const currentTime = ref("");
let timeInterval: number | null = null;

// 当前激活的 Tab
const activeTab = ref("workspace");

// 表格高度相关
const pageRef = ref<HTMLElement>();
const todoTasksCardRef = ref<HTMLElement>();
const allTasksCardRef = ref<HTMLElement>();
const projectsCardRef = ref<HTMLElement>();
const todoTasksTableHeight = ref<number>(480);
const allTasksTableHeight = ref<number>(700);
const projectsTableHeight = ref<number>(700);

// 工作台统计数据（直接使用接口返回的字段）
const stats = ref({
  已完成任务: 0,
  未完成任务: 0,
  取消的任务: 0
});

// 任务tab统计数据（所有任务）
const allTaskStats = ref({
  total: 0,
  pending: 0,
  completed: 0
});

// 需求统计数据
const requirementStats = ref({
  total: 0,
  pending: 0,
  completed: 0
});

// 项目统计数据
const projectStats = ref({
  total: 0,
  inProgress: 0,
  completed: 0
});

// 待办任务（工作台显示）
const todoTasks = ref<TaskListItem[]>([]);
const tasksLoading = ref(false);
const todoTasksPage = ref(1);
const todoTasksPageSize = ref(20);
const todoTasksTotal = ref(0);

// 所有任务（任务tab显示）
const allTasks = ref<TaskListItem[]>([]);
const allTasksLoading = ref(false);
const allTasksPage = ref(1);
const allTasksPageSize = ref(20);
const allTasksTotal = ref(0);

// 任务搜索表单
const taskSearchForm = ref({
  state: ""
});

// 层级列表
const requirements = ref<RequirementListItem[]>([]);
const requirementsLoading = ref(false);

// 项目列表
const projects = ref<ProjectListItem[]>([]);
const projectsLoading = ref(false);

// 最新动态
const activities = ref<Array<{ time: string; content: string; icon: string }>>([]); // 工作台动态
const activityDialogVisible = ref(false);
const taskActivities = ref<Array<{ time: string; content: string; icon: string }>>([]); // 任务动态
const requirementActivities = ref<Array<{ time: string; content: string; icon: string }>>([]);
const projectActivities = ref<Array<{ time: string; content: string; icon: string }>>([]);
const activityTab = ref("activities"); // 动态tab切换
const myReports = ref<Array<{ time: string; content: string; icon: string; taskName?: string; progress?: number; state?: string; creator?: string }>>([]); // 我汇报的
const receivedReports = ref<Array<{ time: string; content: string; icon: string; taskName?: string; progress?: number; state?: string; creator?: string }>>([]); // 收到的汇报
const receivedReportsProjectId = ref("");
const receivedReportsLoading = ref(false);

const getReceivedReportsProjectFilter = () => {
  if (!receivedReportsProjectId.value) {
    return { project_name: "" };
  }
  const project = projects.value.find(item => item._id === receivedReportsProjectId.value);
  return {
    project_id: receivedReportsProjectId.value,
    project_name: project?.project_name || ""
  };
};

// 检查是否可以查看收到的汇报（只有admin和部门主管可以查看）
const canViewReceivedReports = computed(() => {
  const roles = userStore.roles || [];
  return roles.includes("Admin") || roles.includes("DepartmentManager");
});

const convertDynamicToActivities = (dynamicList: Array<{ task_name?: string; history?: string }>) => {
  if (!Array.isArray(dynamicList)) {
    return [];
  }
  return dynamicList.map(item => {
    if (!item || !item.history) {
      return { time: "", content: "", icon: "Document" };
    }

    const history = item.history;
    const taskName = item.task_name || "";

    // 尝试从 history 中提取时间（格式：YYYY-MM-DD HH:mm:ss）
    const potentialTime = history.slice(0, 19);
    const timeRegex = /^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/;

    if (timeRegex.test(potentialTime)) {
      // 提取时间后的内容
      const content = history.slice(19).trim();
      // 如果有任务名，可以增强显示内容
      const displayContent = taskName ? `任务 "${taskName}" ${content}` : content;

      return {
        time: potentialTime,
        content: displayContent || history,
        icon: "Document"
      };
    }

    // 如果没有匹配到时间格式，使用整个 history 作为内容
    const displayContent = taskName ? `任务 "${taskName}" ${history}` : history;
    return {
      time: "",
      content: displayContent,
      icon: "Document"
    };
  });
};

// 更新当前时间
const updateTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  currentTime.value = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// 获取状态类型
const getStatusType = (status: string) => {
  const statusMap: Record<string, "success" | "info" | "warning" | "danger" | undefined> = {
    草稿: "info",
    进行中: "warning",
    已完成: "success",
    已取消: "danger",
    待分配给部门负责人: "info",
    待指派给成员: "info",
    任务未开始: "info",
    任务进行中: "warning",
    待测试: "info",
    测试中: "warning",
    测试完毕: "success",
    待审阅: "info",
    审阅中: "warning",
    审阅完毕: "success"
  };
  return statusMap[status] || undefined;
};

// 获取优先级类型
const getPriorityType = (priority: string) => {
  const priorityMap: Record<string, "success" | "info" | "warning" | "danger" | undefined> = {
    低: "info",
    中: "warning",
    高: "danger",
    low: "info",
    medium: "warning",
    high: "danger"
  };
  return priorityMap[priority] || undefined;
};

/** 接口 show_color 对应浅色行背景 */
const TASK_SHOW_COLOR_MAP: Record<string, string> = {
  red: "#fef0f0",
  green: "#f0f9eb",
  blue: "#ecf5ff",
  yellow: "#fdfce6",
  orange: "#fdf6ec",
  purple: "#f5f0ff",
  gray: "#f4f4f5",
  grey: "#f4f4f5",
  pink: "#fef0f5",
  cyan: "#e8f8f8"
};

const getTaskShowColorBackground = (showColor?: string) => {
  if (!showColor) return undefined;
  return TASK_SHOW_COLOR_MAP[showColor.trim().toLowerCase()];
};

const getTaskCellStyle = ({ row }: { row: TaskListItem }) => {
  const bg = getTaskShowColorBackground(row.show_color);
  return bg ? { backgroundColor: bg } : {};
};

const getTaskCardStyle = (row: TaskListItem) => {
  const bg = getTaskShowColorBackground(row.show_color);
  return bg ? { backgroundColor: bg } : {};
};

// 加载待办任务
const loadTodoTasks = async (page: number = todoTasksPage.value) => {
  try {
    tasksLoading.value = true;

    // 并行加载统计数据和待办任务列表
    const [statisticsResponse, tasksResponse] = await Promise.all([
      getTaskStatistics(),
      selectPendingTasks({
        page: page,
        page_size: todoTasksPageSize.value
      })
    ]);

    // 更新统计数据（直接使用接口返回的字段）
    if (statisticsResponse.code === 0) {
      stats.value.已完成任务 = statisticsResponse.已完成任务 || 0;
      stats.value.未完成任务 = statisticsResponse.未完成任务 || 0;
      stats.value.取消的任务 = statisticsResponse.取消的任务 || 0;
    }

    // 更新待办任务列表
    if (tasksResponse.code === 200 && tasksResponse.result) {
      todoTasks.value = tasksResponse.result;
      todoTasksTotal.value = tasksResponse.total_count || 0;
      todoTasksPage.value = page;

      // 生成最新动态（基于待办任务数据）
      if (Array.isArray(tasksResponse.dynamic) && tasksResponse.dynamic.length > 0) {
        activities.value = convertDynamicToActivities(tasksResponse.dynamic as Array<{ task_name?: string; history?: string }>);
      } else {
        generateActivities(tasksResponse.result);
      }
    }
  } catch (error) {
    ElMessage.error("加载待办任务失败");
    console.error(error);
  } finally {
    tasksLoading.value = false;
  }
};

// 处理待办任务分页改变
const handleTodoTasksPageChange = (page: number) => {
  loadTodoTasks(page);
};

// 处理待办任务每页数量改变
const handleTodoTasksSizeChange = () => {
  loadTodoTasks(1);
};

// 生成工作台最新动态（待办任务）
const generateActivities = (tasks: TaskListItem[]) => {
  const newActivities: Array<{ time: string; content: string; icon: string }> = [];

  // 取最近的任务作为动态
  const recentTasks = tasks.slice(0, 10);
  recentTasks.forEach((task) => {
    newActivities.push({
      time: task.create_time || "",
      content: `任务 "${task.任务名}" 状态更新为 ${task.状态}`,
      icon: "Document"
    });
  });

  activities.value = newActivities.sort((a, b) => {
    return new Date(b.time).getTime() - new Date(a.time).getTime();
  }).slice(0, 10);
};

// 生成任务tab最新动态（所有任务）
const generateTaskActivities = (tasks: TaskListItem[]) => {
  const newActivities: Array<{ time: string; content: string; icon: string }> = [];

  const recentTasks = tasks.slice(0, 10);
  recentTasks.forEach((task) => {
    newActivities.push({
      time: task.create_time || "",
      content: `任务 "${task.任务名}" 状态更新为 ${task.状态}`,
      icon: "Document"
    });
  });

  taskActivities.value = newActivities.sort((a, b) => {
    return new Date(b.time).getTime() - new Date(a.time).getTime();
  }).slice(0, 10);
};

// 生成需求最新动态
const generateRequirementActivities = (reqs: RequirementListItem[]) => {
  const newActivities: Array<{ time: string; content: string; icon: string }> = [];

  const recentReqs = reqs.slice(0, 10);
  recentReqs.forEach((req) => {
    newActivities.push({
      time: req.create_time || "",
      content: `需求 "${req.需求名}" 状态更新为 ${req.状态}`,
      icon: "Document"
    });
  });

  requirementActivities.value = newActivities.sort((a, b) => {
    return new Date(b.time).getTime() - new Date(a.time).getTime();
  }).slice(0, 10);
};

// 生成项目最新动态
const generateProjectActivities = (projs: ProjectListItem[]) => {
  const newActivities: Array<{ time: string; content: string; icon: string }> = [];

  const recentProjs = projs.slice(0, 10);
  recentProjs.forEach((proj) => {
    newActivities.push({
      time: proj.create_time || "",
      content: `项目 "${proj.project_name}" 状态更新为 ${proj.state}`,
      icon: "Document"
    });
  });

  projectActivities.value = newActivities.sort((a, b) => {
    return new Date(b.time).getTime() - new Date(a.time).getTime();
  }).slice(0, 10);
};

// 根据操作按钮数量计算操作列宽度（约 56px 基础 + 每按钮 52px）
const operationColWidth = (buttonCount: number): number => {
  return Math.max(80, 50 + buttonCount * 35);
};

// 查看任务
// 处理待办任务表格下拉菜单命令
const handleTodoTaskDropdownCommand = (command: string, row: any) => {
  switch (command) {
    case 'view':
      viewTask(row);
      break;
    case 'assign':
      openStatusFlowDialog(row);
      break;
    case 'report':
      openReportDialog(row);
      break;
    case 'bug':
      openBugDialog(row);
      break;
  }
};

// 处理所有任务表格下拉菜单命令
const handleAllTaskDropdownCommand = (command: string, row: any) => {
  switch (command) {
    case 'view':
      viewTask(row);
      break;
    case 'assign':
      openStatusFlowDialog(row);
      break;
    case 'bug':
      openBugDialog(row);
      break;
    case 'report':
      openReportDialog(row);
      break;
  }
};

// 处理项目表格下拉菜单命令
const handleProjectDropdownCommand = (command: string, row: any) => {
  switch (command) {
    case 'view':
      viewProject(row);
      break;
  }
};

const viewTask = (task: TaskListItem) => {
  // 使用 sessionStorage 临时存储任务数据
  const taskId = task._id || task.id;
  if (!taskId) {
    ElMessage.error("任务ID不存在");
    return;
  }
  sessionStorage.setItem(`task_${taskId}`, JSON.stringify(task));
  router.push({
    name: "TaskDetail",
    params: { id: taskId },
    query: {
      from: "workspace"
    }
  });
};

// 处理动态tab切换
const handleActivityTabChange = (tabName: string) => {
  if (tabName === "myReports" && myReports.value.length === 0) {
    loadMyReports();
  } else if (tabName === "receivedReports") {
    if (projects.value.length === 0) {
      loadProjects();
    }
    if (receivedReports.value.length === 0) {
      loadReceivedReports();
    }
  }
};

// 将汇报记录转换为活动格式
const convertReportsToActivities = (reports: ReportRecord[]): Array<{ time: string; content: string; icon: string; taskName?: string; progress?: number; state?: string; creator?: string }> => {
  return reports.map(report => {
    const time = report.create_time || report.createdAt || "";
    const projectName = report.project_name || "";
    const message = report.message || "";
    const taskName = report.task_name || report.任务名 || "";
    const progress = report.progress !== undefined ? report.progress : (report.进度 !== undefined ? report.进度 : undefined);
    const state = report.state || "";
    const creator = report.creator || report.创建人 || "";

    // 构建内容，包含任务名和进度信息
    let content = message;
    if (projectName) {
      // 如果有任务名，格式为：项目 【项目名-任务-任务名】 的汇报: 内容
      if (taskName) {
        content = `项目 【${projectName}】-【任务-${taskName}】 的汇报: ${message}`;
      } else {
        // 如果只有项目名，格式为：项目 【项目名】 的汇报: 内容
        content = `项目 【${projectName}】 的汇报: ${message}`;
      }
    } else if (taskName) {
      // 如果没有项目名但有任务名，格式为：任务 【任务名】 的汇报: 内容
      content = `任务 【${taskName}】 的汇报: ${message}`;
    }

    // 如果有进度，添加到内容中
    if (progress !== undefined && progress !== null) {
      content += ` [进度: ${progress}%]`;
    }

    return {
      time,
      content,
      icon: "Document",
      taskName: taskName || undefined,
      progress: progress !== undefined && progress !== null ? progress : undefined,
      state: state || undefined,
      creator: creator || undefined
    };
  });
};

// 加载我汇报的记录
const loadMyReports = async () => {
  try {
    const response = await selectSelfReports({
      page: 1,
      page_size: 50
    });

    if (response.code === 200) {
      const reports = response.result || response.data || [];
      myReports.value = convertReportsToActivities(reports);
    } else {
      ElMessage.error(response.message || "加载我汇报的记录失败");
      myReports.value = [];
    }
  } catch (error: any) {
    console.error("加载我汇报的记录失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "加载我汇报的记录失败"
    );
    myReports.value = [];
  }
};

// 加载收到的汇报记录
const loadReceivedReports = async () => {
  receivedReportsLoading.value = true;
  try {
    const projectFilter = getReceivedReportsProjectFilter();
    const response = await selectReports({
      username: userStore.username || "",
      project_name: projectFilter.project_name,
      project_id: '',
      page: 1,
      page_size: 50
    });

    if (response.code === 200) {
      const reports = response.result || response.data || [];
      receivedReports.value = convertReportsToActivities(reports);
    } else {
      ElMessage.error(response.message || "加载收到的汇报记录失败");
      receivedReports.value = [];
    }
  } catch (error: any) {
    console.error("加载收到的汇报记录失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "加载收到的汇报记录失败"
    );
    receivedReports.value = [];
  } finally {
    receivedReportsLoading.value = false;
  }
};

const handleReceivedReportsProjectChange = () => {
  loadReceivedReports();
};

// Tab 切换处理
const handleTabChange = (tabName: string) => {
  if (tabName === "workspace") {
    if (todoTasks.value.length === 0) {
      loadTodoTasks();
    }
  } else if (tabName === "tasks") {
    if (allTasks.value.length === 0) {
      loadAllTasks();
    }
  } else if (tabName === "requirements") {
    if (requirements.value.length === 0) {
      loadRequirements();
    }
  } else if (tabName === "projects") {
    if (projects.value.length === 0) {
      loadProjects();
    }
  }
};

// 加载层级列表
const loadRequirements = async () => {
  try {
    requirementsLoading.value = true;
    const response = await selectUserRequirements({ page: 1, page_size: 20 });

    if (response.code === 200 && response.result) {
      // 扁平化嵌套对象结构为数组
      const flattenedResult = flattenRequirementData(response.result);
      requirements.value = flattenedResult;

      // 统计需求数据
      requirementStats.value.total = response.total_count ?? flattenedResult.length;
      requirementStats.value.pending = requirements.value.filter(
        (req) => req.状态 === "进行中"
      ).length;
      requirementStats.value.completed = requirements.value.filter(
        (req) => req.状态 === "已完成"
      ).length;

      // 生成需求动态
      generateRequirementActivities(requirements.value);
    }
  } catch (error) {
    ElMessage.error("加载层级列表失败");
    console.error(error);
  } finally {
    requirementsLoading.value = false;
  }
};

// 加载项目列表
const loadProjects = async () => {
  try {
    projectsLoading.value = true;
    const response = await selectProjects({
      page: 1,
      page_size: 100
    });

    if (response.code === 200 && response.result) {
      projects.value = response.result;

      // 统计项目数据
      projectStats.value.total = projects.value.length;
      projectStats.value.inProgress = projects.value.filter(
        (proj) => proj.state === "进行中"
      ).length;
      projectStats.value.completed = projects.value.filter(
        (proj) => proj.state === "已完成"
      ).length;

      // 生成项目动态
      generateProjectActivities(projects.value);
    }
  } catch (error) {
    ElMessage.error("加载项目列表失败");
    console.error(error);
  } finally {
    projectsLoading.value = false;
  }
};

// 获取需求状态类型
const getRequirementStatusType = (status: string) => {
  const statusMap: Record<string, "success" | "info" | "warning" | "danger" | undefined> = {
    草稿: "info",
    进行中: "warning",
    已完成: "success",
    已取消: "danger"
  };
  return statusMap[status] || undefined;
};

// 获取项目状态类型
const getProjectStatusType = (status: string) => {
  const statusMap: Record<string, "success" | "info" | "warning" | "danger" | undefined> = {
    未开始: "info",
    进行中: "warning",
    已完成: "success"
  };
  return statusMap[status] || undefined;
};

// 查看需求
const viewRequirement = (requirement: RequirementListItem) => {
  router.push({
    name: "RequirementDetail",
    params: { id: requirement._id },
    query: {
      project_id: requirement.project_id,
      project_name: requirement.project_name || "",
      from: "workspace"
    }
  });
};

// 查看项目
const viewProject = (project: ProjectListItem) => {
  router.push({
    name: "ProjectDetail",
    params: { id: project._id }
  });
};

// 跳转到我的任务
const goToMyTasks = () => {
  router.push({ name: "MyTasks" });
};

// 跳转到层级列表
const goToRequirements = () => {
  router.push({ name: "RequirementsList" });
};

// 跳转到项目列表
const goToProjects = () => {
  router.push({ name: "ProjectsIndex" });
};

// 任务状态分配相关
const statusFlowDialogVisible = ref(false);
const statusFlowTask = ref<any>(null);
const statusFlowButtonLoadingTaskId = ref<string>("");

// BUG记录对话框
const bugDialogVisible = ref(false);
const bugFormRef = ref<FormInstance>();
const bugSubmitting = ref(false);
const bugButtonLoadingTaskId = ref<string>("");
const bugForm = ref({
  bug_name: "",
  describe: "",
  project_id: "",
  task_id: "",
  task_name: "",
  project_name: ""
});

const bugFormRules: FormRules = {
  bug_name: [
    { required: true, message: "请输入BUG名称", trigger: "blur" }
  ],
  describe: [
    { required: true, message: "请输入BUG描述", trigger: "blur" }
  ]
};

// 进度汇报对话框
const reportDialogVisible = ref(false);
const reportSubmitting = ref(false);
const reportFormRef = ref<FormInstance>();
const departmentUsers = ref<DepartmentUserItem[]>([]);
const departmentUsersLoading = ref(false);
const reportForm = reactive({
  recipient: "",
  cc_person: "",
  task_id: "",
  task_name: "",
  progress: 0,
  use_time: 0,
  message: "",
  state: ""
});
const reportRules: FormRules = {
  recipient: [{ required: true, message: "请输入接收人", trigger: "blur" }],
  progress: [
    { required: true, message: "请输入进度", trigger: "change" },
    {
      type: "number",
      min: 0,
      max: 100,
      message: "进度需在 0-100 之间",
      trigger: "change"
    }
  ],
  use_time: [
    { required: true, message: "请输入当前用时", trigger: "blur" },
    {
      type: "number",
      min: 0,
      message: "当前用时需大于 0",
      trigger: "change"
    }
  ],
  message: [{ required: true, message: "请输入汇报内容", trigger: "blur" }]
};

// 状态分配顺序
const statusFlowOrder: TaskStatus[] = [
  TaskStatus.PENDING_ASSIGN_TO_DEPT_LEADER,
  TaskStatus.PENDING_ASSIGN_TO_MEMBER,
  TaskStatus.NOT_STARTED,
  TaskStatus.IN_PROGRESS,
  TaskStatus.PENDING_TEST,
  TaskStatus.TESTING,
  TaskStatus.TEST_COMPLETED,
  TaskStatus.PENDING_REVIEW,
  TaskStatus.REVIEWING,
  TaskStatus.REVIEW_COMPLETED,
  TaskStatus.CANCELLED,
  TaskStatus.COMPLETED,
  TaskStatus.PENDING_ASSIGN_TO_DEPT_LEADER,
  TaskStatus.PENDING_ASSIGN_TO_MEMBER
];

const statusAliasMap: Record<string, TaskStatus> = {
  待分配给部门主管: TaskStatus.PENDING_ASSIGN_TO_DEPT_LEADER,
  待分配给部门负责人: TaskStatus.PENDING_ASSIGN_TO_DEPT_LEADER,
  待指派给成员: TaskStatus.PENDING_ASSIGN_TO_MEMBER,
  待开始: TaskStatus.NOT_STARTED,
  任务未开始: TaskStatus.NOT_STARTED,
  进行中: TaskStatus.IN_PROGRESS,
  任务进行中: TaskStatus.IN_PROGRESS,
  待测试: TaskStatus.PENDING_TEST,
  测试中: TaskStatus.TESTING,
  测试完毕: TaskStatus.TEST_COMPLETED,
  待审阅: TaskStatus.PENDING_REVIEW,
  审阅中: TaskStatus.REVIEWING,
  审阅完毕: TaskStatus.REVIEW_COMPLETED,
  已取消: TaskStatus.CANCELLED,
  取消: TaskStatus.CANCELLED,
  已完成: TaskStatus.COMPLETED
};

const normalizeStatus = (status: string): TaskStatus | "" => {
  if (!status) return "";
  if (Object.values(TaskStatus).includes(status as TaskStatus)) {
    return status as TaskStatus;
  }
  return statusAliasMap[status] || "";
};

// 获取下一个状态
const getNextStatus = (currentStatus: string): TaskStatus | "" => {
  const normalizedStatus = normalizeStatus(currentStatus);
  if (!normalizedStatus) return "";
  const index = statusFlowOrder.indexOf(normalizedStatus);
  if (index === -1 || index === statusFlowOrder.length - 1) {
    return "";
  }
  return statusFlowOrder[index + 1];
};

// 判断是否可以记录BUG或进度汇报（测试或审阅状态，report时包含进行中状态）
const canRecordBug = (status: string, type?: 'bug' | 'report'): boolean => {
  if (!status) return false;
  // 如果无法标准化，检查中文状态
  const testReviewStatuses = [
    "测试中"
  ];
  // 如果是进度汇报，添加进行中状态
  if (type === 'report') {
    testReviewStatuses.push("任务进行中", "第1轮测试", "第2轮测试", "第3轮测试", "第4轮测试", "第5轮测试", "第6轮测试", "第7轮测试", "第8轮测试", "测试任务进行中");
  }
  return testReviewStatuses.includes(status);

};

// 填写预计工时对话框
const developmentTimeDialogVisible = ref(false);
const developmentTimeFormRef = ref<FormInstance>();
const developmentTimeSubmitting = ref(false);
const developmentTimeForm = reactive({
  task_id: "",
  task_name: "",
  task_deadline: "",
  development_start_time: "",
  development_end_time: ""
});
const developmentTimeRules: FormRules = {
  development_start_time: [
    { required: true, message: "请选择研发开始时间", trigger: "change" }
  ],
  development_end_time: [
    { required: true, message: "请选择研发结束时间", trigger: "change" },
    {
      validator: (rule, value, callback) => {
        if (!value) {
          callback();
          return;
        }

        const endTime = new Date(value).getTime();

        // 检查是否晚于开始时间
        if (developmentTimeForm.development_start_time) {
          const startTime = new Date(developmentTimeForm.development_start_time).getTime();
          if (endTime < startTime) {
            callback(new Error("研发结束时间必须晚于开始时间"));
            return;
          }
        }

        // 检查是否超过任务完成期限
        if (developmentTimeForm.task_deadline) {
          const deadline = new Date(developmentTimeForm.task_deadline).getTime();
          // 只比较日期部分，忽略时分秒
          const endDate = new Date(value);
          endDate.setHours(0, 0, 0, 0);
          const deadlineDate = new Date(developmentTimeForm.task_deadline);
          deadlineDate.setHours(0, 0, 0, 0);

          if (endDate.getTime() > deadlineDate.getTime()) {
            callback(new Error("开发结束日期不能超过任务完成期限"));
            return;
          }
        }

        callback();
      },
      trigger: "change"
    }
  ]
};

// 打开填写预计工时对话框
const openDevelopmentTimeDialog = (task: any) => {
  const taskId = task._id || task.id || "";
  developmentTimeForm.task_id = taskId;
  developmentTimeForm.task_name = task.任务名 || task.task_name || task.title || "";
  // 获取任务完成期限，可能是 task_deadline 或 task_dead_line
  developmentTimeForm.task_deadline = task.task_deadline || task.task_dead_line || "";
  developmentTimeForm.development_start_time = "";
  developmentTimeForm.development_end_time = "";
  developmentTimeDialogVisible.value = true;
  nextTick(() => {
    developmentTimeFormRef.value?.clearValidate();
  });
};

// 提交预计工时
const handleDevelopmentTimeSubmit = () => {
  developmentTimeFormRef.value?.validate(async (valid) => {
    if (!valid) return;
    if (!developmentTimeForm.task_id) {
      ElMessage.error("任务信息缺失");
      return;
    }
    developmentTimeSubmitting.value = true;
    try {
      const response = await updateDevelopmentTime({
        task_id: developmentTimeForm.task_id,
        development_start_time: developmentTimeForm.development_start_time,
        development_end_time: developmentTimeForm.development_end_time
      });
      if (response.code === 200) {
        ElMessage.success("预计工时填写成功");
        developmentTimeDialogVisible.value = false;
        // 刷新工作台的待办事项列表
        loadTodoTasks(todoTasksPage.value);
        // 刷新任务tab的列表
        loadAllTasks(allTasksPage.value);
      } else {
        ElMessage.error(response.message || "预计工时填写失败");
      }
    } catch (error: any) {
      console.error("填写预计工时失败:", error);
      ElMessage.error(
        error?.response?.data?.message || error?.message || "预计工时填写失败"
      );
    } finally {
      developmentTimeSubmitting.value = false;
    }
  });
};

// 打开状态分配对话框
const openStatusFlowDialog = (task: any) => {
  // 检查状态是否为"填写预计工时"
  const taskStatus = task.状态 || task.status || "";
  if (taskStatus === "填写预计工时") {
    openDevelopmentTimeDialog(task);
    return;
  }
  // 检查 next_state 是否存在且有值
  if (!task.next_state || !Array.isArray(task.next_state) || task.next_state.length === 0) {
    ElMessage.warning("当前状态无法继续分配");
    return;
  }
  statusFlowTask.value = task;
  statusFlowDialogVisible.value = true;
};

// 打开BUG记录对话框
const openBugDialog = (task: any) => {
  const taskId = task._id || task.id || "";
  bugButtonLoadingTaskId.value = taskId;
  bugForm.value = {
    bug_name: "",
    describe: "",
    project_id: task.project_id || "",
    task_id: taskId,
    task_name: task.任务名 || task.task_name || task.title || "",
    project_name: task.project_name || ""
  };
  bugDialogVisible.value = true;
  nextTick(() => {
    bugFormRef.value?.clearValidate();
    bugButtonLoadingTaskId.value = "";
  });
};

// 提交BUG记录
const submitBug = async () => {
  if (!bugFormRef.value) return;

  await bugFormRef.value.validate(async (valid) => {
    if (!valid) return;

    const taskId = bugForm.value.task_id;
    bugButtonLoadingTaskId.value = taskId;
    bugSubmitting.value = true;
    try {
      const response = await createBug({
        bug_name: bugForm.value.bug_name,
        describe: bugForm.value.describe,
        project_id: bugForm.value.project_id,
        task_id: bugForm.value.task_id,
        task_name: bugForm.value.task_name
      });

      if (response.code === 200) {
        ElMessage.success("BUG记录成功");
        bugDialogVisible.value = false;
        bugForm.value = {
          bug_name: "",
          describe: "",
          project_id: "",
          task_id: "",
          task_name: "",
          project_name: ""
        };
        // 刷新任务列表
        loadTodoTasks();
      } else {
        ElMessage.error(response.message || "BUG记录失败");
      }
    } catch (error: any) {
      console.error("提交BUG失败:", error);
      ElMessage.error(
        error?.response?.data?.message || error?.message || "BUG记录失败"
      );
    } finally {
      bugSubmitting.value = false;
      bugButtonLoadingTaskId.value = "";
    }
  });
};

// 加载部门用户列表
const loadDepartmentUsers = async () => {
  departmentUsersLoading.value = true;
  try {
    const list = await userStore.fetchDepartmentUsers();
    departmentUsers.value =
      list.filter(user =>
        Array.isArray(user.role)
          ? user.role.includes("DepartmentManager")
          : false
      ) || [];
    if (!list.length) {
      ElMessage.error("加载接收人列表失败");
    }
  } catch (error: any) {
    console.error("加载接收人列表失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "加载接收人列表失败"
    );
    departmentUsers.value = [];
  } finally {
    departmentUsersLoading.value = false;
  }
};

// 打开进度汇报对话框
const openReportDialog = (task: any) => {
  reportForm.task_id = task._id || task.id || "";
  reportForm.task_name = task.任务名 || task.task_name || task.title || "";
  reportForm.progress = Number(task.进度) || 0;
  reportForm.use_time = Number(task.已用工时 || task.actualHours || 0);
  reportForm.recipient = task.creator || "";
  reportForm.cc_person = task.指派人 || task.assignee || "";
  reportForm.message = "";
  reportForm.state = task.状态 || task.status || "";
  reportDialogVisible.value = true;
  if (!departmentUsers.value.length) {
    loadDepartmentUsers();
  }
  nextTick(() => {
    reportFormRef.value?.clearValidate();
  });
};

// 提交进度汇报
const handleReportSubmit = () => {
  reportFormRef.value?.validate(async valid => {
    if (!valid) return;
    if (!reportForm.task_id) {
      ElMessage.error("任务信息缺失");
      return;
    }
    reportSubmitting.value = true;
    try {
      const response = await reportTaskProgress({
        recipient: reportForm.recipient,
        cc_person: reportForm.cc_person,
        task_id: reportForm.task_id,
        task_name: reportForm.task_name,
        progress: reportForm.progress,
        message: reportForm.message,
        use_time: 1,
        state: reportForm.state
      });
      if (response.code === 200) {
        ElMessage.success("汇报成功");
        reportDialogVisible.value = false;
        // 刷新工作台的待办事项列表
        loadTodoTasks(todoTasksPage.value);
        // 刷新任务tab的列表
        loadAllTasks(allTasksPage.value);
      } else {
        ElMessage.error(response.message || "汇报失败");
      }
    } catch (error: any) {
      console.error("进度汇报失败:", error);
      ElMessage.error(
        error?.response?.data?.message || error?.message || "汇报失败"
      );
    } finally {
      reportSubmitting.value = false;
    }
  });
};

// 状态分配成功回调
const handleStatusFlowSuccess = (nextState: string, personName: string) => {
  if (!statusFlowTask.value) return;

  // 更新任务状态
  statusFlowTask.value.状态 = nextState;
  statusFlowTask.value.status = nextState;

  // 刷新工作台的待办任务列表
  loadTodoTasks(todoTasksPage.value);
  // 刷新任务tab的列表
  loadAllTasks(allTasksPage.value);
};

// 状态分配开始
const handleStatusFlowStart = (taskId: string) => {
  statusFlowButtonLoadingTaskId.value = taskId;
};

// 状态分配结束
const handleStatusFlowEnd = () => {
  statusFlowButtonLoadingTaskId.value = "";
};

// 加载所有任务（任务tab）
const loadAllTasks = async (page: number = allTasksPage.value) => {
  try {
    allTasksLoading.value = true;
    const response = await selectMyTasks({
      state: taskSearchForm.value.state || "",
      page: page,
      page_size: allTasksPageSize.value
    });

    if (response.code === 200 && response.result) {
      allTasks.value = response.result;
      allTasksTotal.value = response.total_count || 0;
      allTasksPage.value = page;

      // 统计所有任务数据
      allTaskStats.value.total = response.total_count || 0;
      const completedStatuses = ["已完成", "已取消", "审阅完毕", "测试完毕"];
      allTaskStats.value.completed = allTasks.value.filter((task) =>
        completedStatuses.includes(task.状态)
      ).length;
      allTaskStats.value.pending = allTasks.value.filter(
        (task) => !completedStatuses.includes(task.状态)
      ).length;

      // 生成任务动态
      generateTaskActivities(allTasks.value);
    }
  } catch (error) {
    ElMessage.error("加载任务列表失败");
    console.error(error);
  } finally {
    allTasksLoading.value = false;
  }
};

// 处理全部任务分页改变
const handleAllTasksPageChange = (page: number) => {
  loadAllTasks(page);
};

// 处理全部任务每页数量改变
const handleAllTasksSizeChange = () => {
  loadAllTasks(1);
};

// 处理任务状态变化
const handleTaskStateChange = () => {
  loadAllTasks(1);
};

// 处理任务搜索
const handleTaskSearch = () => {
  loadAllTasks(1);
};

// 重置任务搜索
const handleTaskSearchReset = () => {
  taskSearchForm.value.state = "";
  loadAllTasks(1);
};

// 获取组件的 DOM 元素
const getElementFromRef = (ref: any): HTMLElement | null => {
  if (!ref) return null;
  // 如果是 DOM 元素，直接返回
  if (ref instanceof HTMLElement) return ref;
  // 如果是组件实例，尝试获取 $el
  if (ref.$el && ref.$el instanceof HTMLElement) return ref.$el;
  // 尝试获取 el 属性
  if (ref.el && ref.el instanceof HTMLElement) return ref.el;
  return null;
};

// 计算表格高度
const calculateTableHeights = () => {
  nextTick(() => {
    const viewportHeight = window.innerHeight;

    // 计算待办任务表格高度
    const todoCardEl = getElementFromRef(todoTasksCardRef.value);
    if (todoCardEl) {
      const cardRect = todoCardEl.getBoundingClientRect();
      const cardTopToViewportBottom = viewportHeight - cardRect.top;
      const cardHeaderHeight = 50; // card header高度
      const cardPadding = 40; // card内部padding
      const paginationHeight = 56; // 分页高度
      const bottomPadding = 20;
      todoTasksTableHeight.value = Math.max(300, cardTopToViewportBottom - cardHeaderHeight - cardPadding - paginationHeight - bottomPadding);
    }

    // 计算所有任务表格高度
    const allTasksCardEl = getElementFromRef(allTasksCardRef.value);
    if (allTasksCardEl) {
      const cardRect = allTasksCardEl.getBoundingClientRect();
      const cardTopToViewportBottom = viewportHeight - cardRect.top;
      const cardHeaderHeight = 50;
      const cardPadding = 40;
      const paginationHeight = 56;
      const bottomPadding = 20;
      allTasksTableHeight.value = Math.max(400, cardTopToViewportBottom - cardHeaderHeight - cardPadding - paginationHeight - bottomPadding);
    }

    // 计算项目表格高度
    const projectsCardEl = getElementFromRef(projectsCardRef.value);
    if (projectsCardEl) {
      const cardRect = projectsCardEl.getBoundingClientRect();
      const cardTopToViewportBottom = viewportHeight - cardRect.top;
      const cardHeaderHeight = 50;
      const cardPadding = 40;
      const bottomPadding = 20;
      projectsTableHeight.value = Math.max(400, cardTopToViewportBottom - cardHeaderHeight - cardPadding - bottomPadding);
    }
  });
};

// 窗口大小改变时重新计算（768px 及以下视为移动端：表格改为卡片、分页简化）
const MOBILE_BREAKPOINT = 768;
const windowWidth = ref(typeof window !== "undefined" ? window.innerWidth : 1024);
const isMobile = computed(() => windowWidth.value <= MOBILE_BREAKPOINT);

const handleResize = () => {
  windowWidth.value = window.innerWidth;
  calculateTableHeights();
};

onMounted(() => {
  updateTime();
  timeInterval = window.setInterval(updateTime, 1000);

  // 检查query参数，如果有tab参数就激活对应的TAB
  const tab = route.query.tab as string;
  if (tab && ["workspace", "tasks", "requirements", "projects"].includes(tab)) {
    activeTab.value = tab;
    handleTabChange(tab);
  } else {
    // 默认加载工作台的待办任务
    loadTodoTasks();
  }

  // 计算表格高度
  calculateTableHeights();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  if (timeInterval) {
    clearInterval(timeInterval);
  }
});
</script>

<style scoped lang="scss">
.workspace-page {
  .mb-20 {
    margin-bottom: 20px;
  }

  /* 工作台左右同高：空数据或未达最大高度时也保持最小高度与左侧对齐 */
  .workspace-dashboard-row {
    align-items: stretch;
    min-height: 560px;
  }

  .workspace-dashboard-left-col {
    display: flex;
    flex-direction: column;
    min-height: 560px;

    >.user-info-card {
      flex-shrink: 0;
    }

    >.el-card:not(.user-info-card) {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;

      :deep(.el-card__body) {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
      }
    }
  }

  .workspace-dashboard-right-col {
    display: flex;
    flex-direction: column;
    min-height: 560px;
  }

  .workspace-activity-card {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 400px;

    :deep(.el-card__body) {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
    }

    .activity-tabs {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 300px;

      :deep(.el-tabs__content) {
        flex: 1;
        overflow: auto;
        min-height: 0;
      }

      :deep(.el-tab-pane) {
        height: 100%;
        min-height: 280px;
      }
    }

    .activity-list {
      min-height: 260px;
      flex: 1;
    }

    .received-reports-toolbar {
      margin-bottom: 12px;
    }

    .received-reports-project-select {
      width: 100%;
      max-width: 280px;
    }
  }

  .user-info-card {
    border: 1px solid #ebeef5;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

    :deep(.el-card__body) {
      padding: 18px;
    }

    .user-info {
      .user-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 20px;
        border-bottom: 1px solid #ebeef5;

        .welcome-section {
          display: flex;
          align-items: center;
          gap: 16px;

          .user-avatar {
            flex-shrink: 0;
            border: 3px solid #f0f2f5;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          .user-info-text {
            display: flex;
            flex-direction: column;
            gap: 4px;

            .welcome-text {
              font-size: 14px;
              color: #909399;
              font-weight: 400;
            }

            .user-name {
              font-size: 24px;
              font-weight: 600;
              color: #303133;
            }

            .user-meta {
              display: flex;
              flex-wrap: wrap;
              gap: 16px;
              margin-top: 6px;
              font-size: 13px;
              color: #606266;

              .meta-item {
                display: inline-flex;
                align-items: center;
                gap: 4px;

                .el-icon {
                  font-size: 14px;
                  color: #909399;
                }
              }
            }
          }
        }

        .current-time {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #606266;
          background: #f5f7fa;
          padding: 8px 16px;
          border-radius: 20px;

          .el-icon {
            font-size: 16px;
            color: #909399;
          }
        }
      }

      .stats-container {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;

        .stat-item {
          display: flex;
          align-items: center;
          gap: 16px;
          background: #ffffff;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #ebeef5;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          transition: all 0.3s ease;

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            border-color: #c0c4cc;
          }

          .stat-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);

            .el-icon {
              font-size: 24px;
              color: #606266;
            }
          }

          .stat-content {
            flex: 1;

            .stat-number {
              font-size: 28px;
              font-weight: 700;
              margin-bottom: 4px;
              line-height: 1;
            }

            .stat-label {
              font-size: 13px;
              color: #909399;
              font-weight: 500;
            }
          }
        }
      }
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 16px;
    font-weight: 600;
  }

  .tab-content {
    .tab-footer {
      margin-top: 16px;
      text-align: right;

    }
  }

  .workspace-tabs {
    background: #f5f7fa;
    padding: 0 16px;
    border-radius: 8px;

    :deep(.el-tabs__header) {
      background: transparent;
    }

    :deep(.el-tabs__nav-wrap) {
      background: transparent;
    }

    :deep(.el-tabs__item) {
      font-size: 16px;
      font-weight: 500;
      padding: 0 24px;
      height: 48px;
      line-height: 48px;
      background: transparent;
      border-radius: 6px 6px 0 0;
      transition: all 0.3s ease;

      &:hover {
        background: rgba(64, 158, 255, 0.08);
        color: #409eff;
      }

      &.is-active {
        background: rgba(64, 158, 255, 0.1);
        color: #409eff;
        font-weight: 600;
      }
    }

    :deep(.el-tabs__active-bar) {
      height: 3px;
    }
  }

  .workflow-diagram {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 500px;
    overflow-y: auto;
    padding-right: 4px;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 3px;

      &:hover {
        background: #a8a8a8;
      }
    }

    .workflow-role {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px;
      background: #f8f9fa;
      border-radius: 8px;
      transition: all 0.3s ease;

      &:hover {
        background: #f0f2f5;
        transform: translateX(4px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      }

      .role-box {
        min-width: 75px;
        padding: 6px 10px;
        border-radius: 6px;
        text-align: center;
        font-weight: 600;
        font-size: 12px;
        color: #fff;
        flex-shrink: 0;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

        .role-title {
          white-space: nowrap;
        }

        &.role-admin {
          background: #667eea;
        }

        &.role-manager {
          background: #667eea;
        }

        &.role-product {
          background: #667eea;
        }

        &.role-developer {
          background: #667eea;
        }

        &.role-tester {
          background: #667eea;
        }
      }

      .role-tasks {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
        flex: 1;

        .task-item {
          padding: 5px 10px;
          background: #ffffff;
          border: 1px solid #e4e7ed;
          border-radius: 4px;
          font-size: 11px;
          color: #606266;
          white-space: nowrap;
          transition: all 0.2s ease;
          cursor: default;

          &:hover {
            background: #ecf5ff;
            border-color: #409eff;
            color: #409eff;
            transform: translateY(-2px);
            box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
          }
        }

        .task-arrow {
          color: #909399;
          font-size: 12px;
          font-weight: bold;
          flex-shrink: 0;
        }
      }
    }
  }

  :deep(.el-tabs) {
    .el-tabs__content {
      padding: 0;
    }
  }

  .activity-tabs {
    :deep(.el-tabs__content) {
      max-height: 67vh;
      min-height: 67vh;
      overflow-y: auto;
      overflow-x: hidden;
    }
  }

  .activity-list {
    overflow-x: hidden;

    .activity-item {
      padding: 12px 0;
      border-bottom: 1px solid #ebeef5;

      &:last-child {
        border-bottom: none;
      }

      .activity-time {
        font-size: 12px;
        color: #909399;
        margin-bottom: 8px;
      }

      .activity-content {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        font-size: 14px;
        color: #606266;
        line-height: 1.5;

        .activity-icon {
          margin-top: 2px;
          color: #409eff;
          font-size: 16px;
          flex-shrink: 0;
        }

        .activity-text {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;

          .activity-main-content {
            line-height: 1.5;
            color: #606266;
          }

          .activity-details {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 12px;
            margin-top: 4px;

            .report-creator {
              font-size: 12px;
              color: #909399;
            }

            .activity-detail-item {
              display: inline-flex;
              align-items: center;
              gap: 4px;
              font-size: 12px;
              color: #909399;

              .detail-icon {
                font-size: 14px;
                color: #409eff;
              }
            }
          }
        }
      }
    }
  }

  .assignee-text {
    color: #409eff;
  }

  .table-pagination-wrapper {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;

    :deep(.el-pagination) {
      flex-wrap: wrap;
      gap: 4px;
    }
  }

  .text-ellipsis {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 100%;
  }

  // 操作列按钮组
  .table-action-btns {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 8px;

    .el-button {
      padding: 0 4px;
      margin: 0;
    }

    .action-success {
      color: var(--el-color-success);

      &:hover {
        color: var(--el-color-success);
        opacity: 0.8;
      }
    }

    .action-warning {
      color: var(--el-color-warning);

      &:hover {
        color: var(--el-color-warning);
        opacity: 0.8;
      }
    }
  }

  /* 移动端：待办/任务/项目卡片列表（768px 及以下显示） */
  .workspace-mobile-cards {
    min-height: 200px;
    padding-top: 8px;
  }

  .workspace-mobile-card {
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
    margin-bottom: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    transition: box-shadow 0.2s;

    &:last-child {
      margin-bottom: 0;
    }

    &:active {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
  }

  .workspace-mobile-card__title {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 10px;
    line-height: 1.4;
    word-break: break-all;
    padding: 14px 12px 0;
  }

  .workspace-mobile-card__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 10px;
    padding: 0 12px;
  }

  .workspace-mobile-card__row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
    padding: 8px 12px;
    font-size: 13px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    &:last-of-type {
      border-bottom: none;
    }
  }

  .workspace-mobile-card__label {
    flex-shrink: 0;
    color: var(--el-text-color-secondary);
    min-width: 80px;
  }

  .workspace-mobile-card__value {
    flex: 1;
    text-align: right;
    word-break: break-all;
    color: var(--el-text-color-primary);
  }

  .workspace-mobile-card__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 8px;
    margin-top: 8px;
    padding: 12px 12px 14px;
    border-top: 1px solid var(--el-border-color-lighter);

    .el-button {
      padding: 2px 8px;
      font-size: 12px;
    }

    .action-success {
      color: var(--el-color-success);
    }

    .action-warning {
      color: var(--el-color-warning);
    }
  }
}

// 移动端适配 (768px / 640px)
@media (max-width: 768px) {
  .workspace-page {
    .workspace-mobile-cards .el-empty {
      padding: 32px 0;
    }
  }
}

@media (max-width: 640px) {
  .workspace-page {
    :deep(.el-card__body) {
      padding: 10px !important;
    }

    .workspace-tabs {
      padding: 0;

      :deep(.el-tabs__header) {
        overflow-x: auto;
        overflow-y: hidden;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        -ms-overflow-style: none;

        &::-webkit-scrollbar {
          display: none;
        }
      }

      :deep(.el-tabs__nav) {
        white-space: nowrap;
      }

      :deep(.el-tabs__item) {
        padding: 8px 12px;
        font-size: 13px;
        white-space: nowrap;
      }
    }

    .user-info-card {
      margin-bottom: 12px;

      .user-info {
        .user-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;

          .welcome-section {
            width: 100%;
          }

          .current-time {
            width: 100%;
            justify-content: flex-start;
          }
        }
      }
    }

    .el-row {
      .el-col {
        margin-bottom: 12px;
      }
    }

    /* 移动端不强制动态卡片与左侧同高，取消最小高度 */
    .workspace-dashboard-row {
      min-height: 0;
    }

    .workspace-dashboard-left-col {
      min-height: 0;
      display: block;

      >.el-card:not(.user-info-card) {
        display: block;
      }
    }

    .workspace-dashboard-right-col {
      display: block;
      min-height: 0;
    }

    .workspace-activity-card {
      flex: none;
      display: block;
      min-height: 0;

      .activity-tabs :deep(.el-tab-pane) {
        min-height: 0;
      }

      .activity-list {
        min-height: 0;
      }
    }

    /* 工作流程移动端适配 */
    .workflow-diagram {
      gap: 8px;
      max-height: none;
      padding: 4px 0;
      -webkit-overflow-scrolling: touch;

      &::-webkit-scrollbar {
        width: 4px;
      }

      .workflow-role {
        flex-direction: column;
        align-items: stretch;
        gap: 8px;
        padding: 8px;

        &:hover {
          transform: none;
        }

        .role-box {
          min-width: 0;
          padding: 6px 8px;
          font-size: 11px;
        }

        .role-tasks {
          gap: 4px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          padding-bottom: 2px;

          &::-webkit-scrollbar {
            display: none;
          }

          .task-item {
            padding: 4px 8px;
            font-size: 10px;
            white-space: nowrap;
            flex-shrink: 0;
          }

          .task-arrow {
            font-size: 10px;
            flex-shrink: 0;
          }
        }
      }
    }

    :deep(.el-table) {
      .el-table__body-wrapper {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }

      .el-table__header-wrapper {
        overflow-x: auto;
      }

      .el-table__cell {
        padding: 8px 4px;
        font-size: 12px;
      }
    }

    /* 表格分页移动端适配 */
    .table-pagination-wrapper {
      justify-content: center;
      margin-top: 12px;
      padding: 0 4px;

      :deep(.el-pagination) {
        justify-content: center;
        gap: 2px;

        .el-pagination__total,
        .el-pagination__jump {
          margin: 0 4px 4px 0;
        }

        .el-pagination__sizes {
          margin: 0 4px 4px 0;
        }

        .el-pagination__prev,
        .el-pagination__next,
        .el-pagination .btn-quicknext,
        .el-pagination .btn-quickprev,
        .el-pager li {
          min-width: 28px;
          height: 28px;
          line-height: 28px;
          margin: 0 2px;
          font-size: 12px;
        }
      }
    }
  }
}
</style>

<!-- append-to-body 弹框挂载在 body 下，使用独立非 scoped 样式 -->
<style lang="scss">
.activity-dialog {
  border-radius: 12px;
  overflow: hidden;

  .el-dialog__header {
    margin-right: 0;
    padding: 18px 20px 14px;
    border-bottom: 1px solid #ebeef5;
  }

  .el-dialog__title {
    font-size: 17px;
    font-weight: 600;
    color: #303133;
  }

  .el-dialog__body {
    padding: 16px 20px 20px;
    background: linear-gradient(180deg, #fafbfc 0%, #fff 48px);
  }

  .activity-dialog-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .activity-dialog-summary {
    display: flex;
    align-items: center;
    padding: 10px 14px;
    font-size: 13px;
    color: #606266;
    background: #f0f7ff;
    border: 1px solid #d9ecff;
    border-radius: 8px;

    .activity-dialog-count {
      margin: 0 4px;
      font-size: 16px;
      font-weight: 600;
      color: #409eff;
    }
  }

  .activity-list.activity-dialog-list {
    min-height: 50vh;
    max-height: 65vh;
    overflow-x: hidden;
    overflow-y: auto;
    padding: 4px 4px 8px;
    margin: 0 -4px;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background: #dcdfe6;
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb:hover {
      background: #c0c4cc;
    }

    .activity-item {
      display: flex;
      gap: 14px;
      padding: 0 0 16px;
      border-bottom: none;

      &:last-child {
        padding-bottom: 0;
      }
    }

    .activity-item__timeline {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex-shrink: 0;
      width: 12px;
      padding-top: 18px;
    }

    .activity-item__dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
      box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.15);
      flex-shrink: 0;
    }

    .activity-item__line {
      flex: 1;
      width: 2px;
      min-height: 24px;
      margin-top: 6px;
      background: linear-gradient(180deg, #d9ecff 0%, #ebeef5 100%);
      border-radius: 1px;
    }

    .activity-item__card {
      flex: 1;
      min-width: 0;
      padding: 14px 16px;
      background: #f8fafc;
      border: 1px solid #ebeef5;
      border-radius: 10px;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;

      &:hover {
        border-color: #c6e2ff;
        box-shadow: 0 4px 12px rgba(64, 158, 255, 0.08);
      }
    }

    .activity-time {
      display: inline-flex;
      align-items: center;
      margin-bottom: 10px;
      padding: 2px 10px;
      font-size: 12px;
      color: #409eff;
      background: #ecf5ff;
      border-radius: 999px;
    }

    .activity-content {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .activity-text {
      flex: 1;
      min-width: 0;
      font-size: 14px;
      line-height: 1.6;
      color: #303133;
      word-break: break-word;
    }

    .activity-dialog-empty {
      min-height: calc(50vh - 48px);
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}
</style>
