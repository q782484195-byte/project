<template>
  <div class="task-detail-page">
    <div class="page-header">
      <div class="header-nav">
        <el-button type="text" class="back-button" @click="goBack">
          <el-icon>
            <ArrowLeft />
          </el-icon>
          返回
        </el-button>

      </div>
      <h2 class="page-title">
        {{ task?.任务名 || task?.task_name || task?.title || "任务详情" }}
      </h2>

    </div>

    <div v-loading="loading" class="detail-content">
      <el-card v-if="task" class="main-card">
        <el-tabs v-model="activeTab" class="detail-tabs" :before-leave="handleDetailTabBeforeLeave">
          <!-- 基本信息 Tab -->
          <el-tab-pane label="基本信息" name="info">
            <!-- 基本信息 -->
            <!-- 项目基本信息（info 接口返回的 project） -->
            <el-card class="info-card task-info-card" shadow="never">
              <template #header>
                <span>任务基本信息</span>
                <el-button v-if="canOpenStatusFlow" type="primary" :loading="statusFlowLoading" class="ml-16"
                  @click="openStatusFlowDialog">
                  <el-icon>
                    <Share />
                  </el-icon>
                  分配
                </el-button>
              </template>
              <div class="project-info-grid">
                <div class="project-info-row">
                  <span class="info-label">任务名称</span>
                  <span class="info-value">{{ task.任务名 || task.task_name || task.title || "-" }}</span>
                </div>
                <div class="project-info-row">
                  <span class="info-label">所属项目</span>
                  <span class="info-value">{{ task.project_name || "-" }}</span>
                </div>
                <div class="project-info-row">
                  <span class="info-label">项目负责人</span>
                  <span class="info-value">{{ task.creator || "-" }}</span>
                </div>
                <div class="project-info-row">
                  <span class="info-label">状态</span>
                  <span class="info-value">
                    <el-tag :type="getStatusType(task.状态 || task.status) || undefined" size="small">
                      {{ task.状态 || task.status || "-" }}
                    </el-tag>
                  </span>
                </div>
                <div class="project-info-row">
                  <span class="info-label">当前处理人</span>
                  <span class="info-value">{{ task.当前处理人 || task.assignee || "-" }}</span>
                  <el-button v-if="canShowTransferButton" type="primary" size="small"
                    @click="handleTransfer">转让</el-button>
                  <el-dialog v-model="transferDialogVisible" title="更换负责人" width="500px" append-to-body
                    :close-on-click-modal="false" @opened="loadTransferUserOptions">
                    <el-form :model="transferForm" :rules="transferFormRules" ref="transferFormRef">
                      <el-form-item label="转让人" prop="person_name">
                        <el-select v-model="transferForm.person_name" placeholder="请选择转让人"
                          :loading="transferUserLoading" filterable clearable style="width: 100%">
                          <el-option v-for="opt in transferUserOptions" :key="opt.value" :label="opt.label"
                            :value="opt.value" />
                        </el-select>
                      </el-form-item>
                    </el-form>
                    <template #footer>
                      <span class="dialog-footer">
                        <el-button @click="transferDialogVisible = false">取消</el-button>
                        <el-button type="primary" :loading="transferSubmitting" @click="submitTransfer">确认</el-button>
                      </span>
                    </template>
                  </el-dialog>
                </div>
                <!-- <div class="project-info-row">
                  <span class="info-label">进度</span>
                  <span class="info-value">
                    <el-progress :percentage="task.进度 || task.progress || 0" />
                  </span>
                </div> -->
                <div class="project-info-row">
                  <span class="info-label">优先级</span>
                  <span class="info-value">
                    <el-tag :type="getPriorityType(task.优先级 || task.priority) || undefined" size="small">
                      {{ task.优先级 || task.priority || "-" }}
                    </el-tag>
                  </span>
                </div>
                <div class="project-info-row">
                  <span class="info-label">测试轮数</span>
                  <span class="info-value">
                    <span>{{ task.test_rounds }}</span>
                  </span>
                </div>
                <div class="project-info-row">
                  <span class="info-label">指派时间</span>
                  <span class="info-value">
                    <span>{{ task.assignment_time || "-" }}</span>
                  </span>
                </div>
                <div class="project-info-row">
                  <span class="info-label">备注</span>
                  <span class="info-value">
                    <span>{{ task.remark || "-" }}</span>
                  </span>
                </div>
                <div class="project-info-row project-info-row--time">
                  <span class="info-label">任务完成期限</span>
                  <span class="info-value info-value--editable">
                    <template v-if="task?.creator === userStore.username">
                      <el-date-picker v-model="taskDeadlineForm.task_deadline" type="date" placeholder="请选择任务完成期限"
                        format="YYYY-MM-DD" value-format="YYYY-MM-DD" class="time-field-picker" />
                      <el-button type="primary" size="small" :loading="taskDeadlineSaving" class="time-field-btn"
                        @click="saveTaskDeadline">
                        保存
                      </el-button>
                    </template>
                    <span v-else class="yellow-text">{{ task.task_deadline || task.task_dead_line || "-" }}</span>
                  </span>
                </div>
                <!-- <div class="project-info-row project-info-row--time project-info-row--plan-range">
                  <div class="plan-range-shell">
                    <div class="plan-range-grid">
                      <div class="plan-range-card plan-range-card--start">
                        <div class="plan-range-card__label">计划开始时间</div>
                        <div class="plan-range-card__body">
                          <template v-if="canEditDevelopmentTime">
                            <el-date-picker v-model="devTimeForm.development_start_time" type="date"
                              placeholder="请选择计划开始时间" format="YYYY-MM-DD" value-format="YYYY-MM-DD"
                              class="time-field-picker plan-range-picker" />
                          </template>
                          <span v-else class="yellow-text plan-range-readonly">{{ task.development_start_time || "-"
                            }}</span>
                        </div>
                      </div>
                      <div class="plan-range-bridge" aria-hidden="true">
                        <span class="plan-range-bridge__line" />
                        <span class="plan-range-bridge__text">至</span>
                        <span class="plan-range-bridge__line" />
                      </div>
                      <div class="plan-range-card plan-range-card--end">
                        <div class="plan-range-card__label">计划结束时间</div>
                        <div class="plan-range-card__body">
                          <template v-if="canEditDevelopmentTime">
                            <el-date-picker v-model="devTimeForm.development_end_time" type="date"
                              placeholder="请选择计划结束时间" format="YYYY-MM-DD" value-format="YYYY-MM-DD"
                              class="time-field-picker plan-range-picker" :disabled-date="(time: Date) => {
                                if (!task?.task_deadline) return false;
                                const deadline = new Date(task.task_deadline);
                                deadline.setHours(23, 59, 59, 999);
                                return time.getTime() > deadline.getTime();
                              }" />
                          </template>
                          <span v-else class="yellow-text plan-range-readonly">{{ task.development_end_time || "-"
                            }}</span>
                        </div>
                      </div>
                    </div>
                    <div v-if="canEditDevelopmentTime" class="plan-range-actions">
                      <el-button type="primary" size="small" :loading="devTimeSaving" class="time-field-btn"
                        @click="saveDevelopmentTime">
                        保存
                      </el-button>
                    </div>
                  </div>
                </div> -->
                <!-- <div class="project-info-row project-info-row--time">
                  <span class="info-label">研发状态</span>
                  <span class="info-value">
                    <span class="red-text">{{ task.delay?.development_is_delay ? '延期' : '正常' }}</span>
                    <el-button v-if="canShowDelayReasonButton" style="margin-left: 16px;" type="primary" size="small"
                      @click="openDelayReasonDialog">
                      填写延期原因
                    </el-button>
                  </span>
                </div> -->
                <!-- <div class="project-info-row project-info-row--time" v-if="canShowDelayReasonButton">
                  <span class="info-label">延期原因</span>
                  <span class="info-value">
                    <span class="red-text delay-reason-message">{{
                      task.delay?.development_delay_message || ''
                      }}</span>
                  </span>
                </div> -->
                <!-- <div class="project-info-row project-info-row--time project-info-row--task-delay"
                  v-if="canEditTaskDelayMessage">
                  <span class="info-label">任务延期原因</span>
                  <span class="info-value info-value--editable task-delay-message-editor">
                    <div v-if="taskDelayMessageExistingText" class="task-delay-message-existing">
                      <span class="red-text">{{ taskDelayMessageExistingText }}</span>
                    </div>
                    <div class="task-delay-message-input-row">
                      <el-input v-model="taskDelayMessageForm.message" type="textarea" :rows="3" :placeholder="taskDelayMessageExistingText
                        ? '请填写本次提交内容（保存时仅提交此处，不包含上方已记录文本）'
                        : '请输入任务延期原因（必填）'" />
                        
                      <el-button type="primary" size="small" :loading="taskDelayMessageSaving"
                        @click="saveTaskDelayMessage">
                        保存
                      </el-button>
                    </div>
                  </span>
                </div> -->
                <!-- <div class="project-info-row project-info-row--time" v-else-if="showTaskDelayMessageReadOnly">
                  <span class="info-label">任务延期原因</span>
                  <span class="info-value">
                    <span class="red-text">{{ task.delay?.task_delay_message || '' }}</span>
                  </span>
                </div> -->
                <!-- <div class="project-info-row project-info-row--time">
                  <span class="info-label">驳回原因</span>
                  <span class="info-value">
                    <span class="red-text">{{ task.rejection_reason || '' }}</span>
                  </span>
                </div> -->

              </div>

              <!-- 任务描述 -->
              <div class="task-desc-section">
                <div class="header-actions section-label">
                  <span>任务描述</span>
                  <template v-if="canUploadAttachment">
                    <el-button v-if="!describeEditMode" type="primary" size="small" @click="startDescribeEdit">
                      编辑
                    </el-button>
                    <template v-else>
                      <el-button type="primary" size="small" :loading="describeSaving" @click="saveDescribe">
                        保存
                      </el-button>
                      <el-button size="small" @click="cancelDescribeEdit">取消</el-button>
                    </template>
                  </template>
                </div>
                <div v-if="describeEditMode" class="task-description-edit">
                  <RichTextEditor ref="describeEditorRef" v-model="describeEditForm" :disable-image-upload="false"
                    :readonly="false" />
                </div>
                <div v-else-if="task?.describe && task.describe.length > 0" class="task-description">
                  <template v-for="(item, index) in task.describe" :key="index">
                    <p v-if="typeof item === 'string' && !item.startsWith('/data/')" class="description-text">
                      {{ item }}
                    </p>
                    <div v-else-if="typeof item === 'string' && item.startsWith('/data/')" class="description-image">
                      <el-image :src="getImageUrl(item)" :alt="`图片 ${Number(index) + 1}`"
                        :preview-src-list="previewImageList" :initial-index="getImageIndex(Number(index))"
                        preview-teleported fit="contain" class="description-image-el" @error="handleImageError" />
                    </div>
                    <p v-else-if="item.type === 'text'" class="description-text">
                      {{ item.content }}
                    </p>
                    <div v-else-if="item.type === 'url' || item.type === 'file'" class="description-image">
                      <el-image :src="getImageUrl(item.content)" :alt="`图片 ${Number(index) + 1}`"
                        :preview-src-list="previewImageList" :initial-index="getImageIndex(Number(index))"
                        preview-teleported fit="contain" class="description-image-el" @error="handleImageError" />
                    </div>
                  </template>
                </div>
                <el-empty v-else description="暂无任务描述" :image-size="80" />
              </div>

              <!-- 任务附件 -->
              <div class="task-desc-section">
                <div class="header-actions section-label">
                  <span>任务附件</span>
                  <el-upload v-if="canUploadAttachment" :show-file-list="false"
                    :before-upload="handleBeforeUploadAttachment" :disabled="attachmentUploading">
                    <el-button type="primary" size="small" :loading="attachmentUploading">
                      <el-icon>
                        <Upload />
                      </el-icon>
                      上传附件
                    </el-button>
                  </el-upload>
                </div>
                <div v-if="task.attachment && task.attachment.length > 0" class="attachment-list">
                  <div v-for="(attachment, index) in task.attachment" :key="index" class="attachment-item">
                    <el-icon class="attachment-icon">
                      <DocumentIcon />
                    </el-icon>
                    <span class="attachment-link">{{ getFileNameFromPath(attachment) }}</span>
                    <el-button type="primary" link size="small" @click="downloadAttachment(attachment)">
                      <el-icon>
                        <Download />
                      </el-icon>
                      下载/查看
                    </el-button>
                    <el-button v-if="canUploadAttachment" type="danger" link size="small"
                      @click="handleDeleteAttachment(Number(index))">
                      <el-icon>
                        <Delete />
                      </el-icon>
                      删除
                    </el-button>
                  </div>
                </div>
              </div>
            </el-card>
            <el-card v-if="hasProjectInfo" class="info-card project-info-card" shadow="never">
              <template #header>
                <span>项目基本信息</span>
              </template>
              <div class="project-info-grid">
                <template v-if="isAppFeatureDevelopmentProject">
                  <div class="project-info-row">
                    <span class="info-label">客户名称</span>
                    <span class="info-value">{{ projectInfo.customer_name || "-" }}</span>
                  </div>
                  <div class="project-info-row">
                    <span class="info-label">产品类型</span>
                    <span class="info-value">{{ projectInfo.product_type || "-" }}</span>
                  </div>
                  <div class="project-info-row">
                    <span class="info-label">业务负责人</span>
                    <span class="info-value">{{ projectInfo.business_owner || "-" }}</span>
                  </div>
                  <div class="project-info-row">
                    <span class="info-label">平台名称</span>
                    <span class="info-value">{{ projectInfo.platform_name || "-" }}</span>
                  </div>
                  <div class="project-info-row">
                    <span class="info-label">APP协议</span>
                    <span class="info-value">{{ projectInfo.app_protocol || "-" }}</span>
                  </div>
                  <div class="project-info-row">
                    <span class="info-label">分辨率</span>
                    <span class="info-value">{{ projectInfo.resolution || "-" }}</span>
                  </div>
                  <div class="project-info-row">
                    <span class="info-label">马甲包名称</span>
                    <span class="info-value">{{ projectInfo.shadow_app || "-" }}</span>
                  </div>
                  <div class="project-info-row">
                    <span class="info-label">立项时间</span>
                    <span class="info-value">{{
                      formatProjectInfoDate(projectInfo.project_initiation_date)
                    }}</span>
                  </div>
                  <div class="project-info-row">
                    <span class="info-label">计划开始时间</span>
                    <span class="info-value">{{
                      formatProjectInfoDate(projectInfo.plant_start_time)
                    }}</span>
                  </div>
                  <div class="project-info-row">
                    <span class="info-label">计划结束时间</span>
                    <span class="info-value">{{
                      formatProjectInfoDate(projectInfo.plant_end_time)
                    }}</span>
                  </div>
                </template>
                <template v-else-if="!isRectificationOptimizationProject">
                  <div class="project-info-row">
                    <span class="info-label">产品类型</span>
                    <span class="info-value">{{ projectInfo.product_type || "-" }}</span>
                  </div>
                  <div class="project-info-row">
                    <span class="info-label">平台名称</span>
                    <span class="info-value">{{ projectInfo.platform_name || "-" }}</span>
                  </div>
                  <div
                    v-if="isStandardProjectInfo"
                    class="project-info-row"
                  >
                    <span class="info-label">主板名称</span>
                    <span class="info-value">{{ projectInfo.motherboard_name || "-" }}</span>
                  </div>
                  <div class="project-info-row">
                    <span class="info-label">分辨率</span>
                    <span class="info-value">{{ projectInfo.resolution || "-" }}</span>
                  </div>
                </template>
              </div>
              <div v-if="projectInfo.describe && projectInfo.describe.length > 0" class="project-desc-section">
                <div class="section-label">项目描述</div>
                <div class="project-description">
                  <template v-for="(item, idx) in projectInfo.describe" :key="idx">
                    <p v-if="item.type === 'text'" class="description-text">{{ item.content }}</p>
                    <div v-else-if="(item.type === 'url' || item.type === 'file') && item.content"
                      class="description-image">
                      <el-image :src="getImageUrl(item.content)" :alt="`图片 ${Number(idx) + 1}`"
                        :preview-src-list="projectPreviewImageList" :initial-index="getProjectImageIndex(Number(idx))"
                        preview-teleported fit="contain" class="description-image-el" @error="handleImageError" />
                    </div>
                    <p v-else-if="typeof item === 'string' && !item.startsWith('/data/')" class="description-text">{{
                      item }}</p>
                    <div v-else-if="typeof item === 'string' && item.startsWith('/data/')" class="description-image">
                      <el-image :src="getImageUrl(item)" :alt="`图片 ${Number(idx) + 1}`"
                        :preview-src-list="projectPreviewImageList" :initial-index="getProjectImageIndex(Number(idx))"
                        preview-teleported fit="contain" class="description-image-el" @error="handleImageError" />
                    </div>
                  </template>
                </div>
              </div>
              <div v-if="projectProposalList.length > 0" class="project-desc-section">
                <div class="section-label">立项文件</div>
                <div class="attachment-list">
                  <div v-for="(file, index) in projectProposalList" :key="index" class="attachment-item">
                    <el-icon class="attachment-icon">
                      <DocumentIcon />
                    </el-icon>
                    <a :href="getAttachmentUrl(file)" :download="getFileNameFromPath(file)" class="attachment-link"
                      target="_blank">
                      {{ getFileNameFromPath(file) }}
                    </a>
                    <el-button type="text" size="small" @click="downloadAttachment(file)">
                      <el-icon>
                        <Download />
                      </el-icon>下载/查看
                    </el-button>
                  </div>
                </div>
              </div>
              <div class="project-desc-section">
                <div class="section-label">项目附件</div>
                <div class="attachment-list">
                  <div v-for="(file, index) in projectAttachmentList" :key="index" class="attachment-item">
                    <el-icon class="attachment-icon">
                      <DocumentIcon />
                    </el-icon>
                    <a :href="getAttachmentUrl(file)" :download="getFileNameFromPath(file)" class="attachment-link"
                      target="_blank">
                      {{ getFileNameFromPath(file) }}
                    </a>
                    <el-button type="text" size="small" @click="downloadAttachment(file)">
                      <el-icon>
                        <Download />
                      </el-icon>下载/查看
                    </el-button>
                  </div>
                </div>
              </div>
            </el-card>

            <!-- 汇报记录 -->
            <el-card class="info-card" shadow="never">
              <template #header>
                <span>汇报记录</span>
              </template>
              <div v-loading="reportsLoading" ref="reportTableContainerRef">
                <el-table :data="reportList" :style="{ width: '100%' }" :height="reportTableHeight"
                  v-if="reportList.length > 0">
                  <el-table-column prop="task_name" label="任务名称" />
                  <el-table-column prop="任务进度" label="进度">
                    <template #default="{ row }">
                      <span>{{ row.任务进度 || '-' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="state" label="状态" />
                  <el-table-column prop="message" label="汇报内容" show-overflow-tooltip />
                  <el-table-column label="创建人">
                    <template #default="{ row }">
                      {{ row.creator || row.创建人 || "-" }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="create_time" label="汇报时间" />
                </el-table>
                <el-empty v-else description="暂无汇报记录" :image-size="100" />
                <el-pagination v-if="reportTotal > 0" v-model:current-page="reportPage"
                  v-model:page-size="reportPageSize" :total="reportTotal" :page-sizes="[10, 20, 50, 100]"
                  layout="total, sizes, prev, pager, next, jumper" @size-change="handleReportPageSizeChange"
                  @current-change="handleReportPageChange" style="margin-top: 16px; justify-content: flex-end" />
              </div>
            </el-card>


          </el-tab-pane>

          <!-- 历史记录 Tab -->
          <el-tab-pane label="历史记录" name="history">
            <el-card class="history-card" shadow="never">
              <template #header>
                <span>历史记录</span>
              </template>
              <div v-if="task.历史记录 && task.历史记录.length > 0" class="history-list">
                <div v-for="(record, index) in task.历史记录" :key="index" class="history-item">
                  <div class="history-content">{{ record }}</div>
                </div>
              </div>
              <el-empty v-else description="暂无历史记录" :image-size="100" />
            </el-card>
          </el-tab-pane>

          <!-- 任务节点 Tab -->
          <el-tab-pane label="任务节点" name="nodes">
            <el-card class="nodes-card" shadow="never">
              <template #header>
                <span>任务节点</span>
              </template>
            </el-card>
          </el-tab-pane>
        </el-tabs>
      </el-card>
      <TaskStatusFlowDialog v-model:visible="statusFlowDialogVisible" :task="task"
        @success="handleStatusFlowDialogSuccess" @flow-start="handleStatusFlowStart" @flow-end="handleStatusFlowEnd" />

      <!-- 延期原因对话框 -->
      <el-dialog v-model="delayReasonDialogVisible" title="延期原因" width="500px" append-to-body
        :close-on-click-modal="false">
        <el-form ref="delayReasonFormRef" :model="delayReasonForm" :rules="delayReasonRules" label-width="100px">
          <el-form-item label="延期原因" prop="development_delay_message">
            <el-input v-model="delayReasonForm.development_delay_message" type="textarea" :rows="4"
              placeholder="请输入延期原因（必填）" />
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="delayReasonDialogVisible = false">取消</el-button>
            <el-button type="primary" :loading="delayReasonSubmitting" @click="submitDelayReason">提交</el-button>
          </span>
        </template>
      </el-dialog>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  ArrowLeft,
  Document as DocumentIcon,
  Download,
  Share,
  Upload,
  Delete
} from "@element-plus/icons-vue";
import { isEqual } from "@pureadmin/utils";
import { TaskStatus } from "@/types";
import { useMultiTagsStoreHook } from "@/store/modules/multiTags";
import TaskStatusFlowDialog from "@/components/TaskStatusFlowDialog.vue";
import RichTextEditor from "@/components/RichTextEditor.vue";
import type { DescribeContent } from "@/types";
import {
  selectReportList,
  selectTaskInfo,
  uploadFile,
  updateTask,
  updateTaskDelayMessage,
  updateDevelopmentTime,
  updateTaskDelayReason,
  updateTaskTransfer,
  updateTaskDeadline
} from "@/api/project";
import { getNextStateUserList } from "@/api/system";
import type { FormInstance, FormRules } from "element-plus";
import { useUserStore } from "@/store/modules/user";
import {
  isAppFeatureDevelopmentType,
  isFeatureDevelopmentType,
  isRectificationOptimizationType
} from "@/utils/projectRoute";
const userStore = useUserStore();
const route = useRoute();
const router = useRouter();

const taskId = computed(() => route.params.id as string);
const projectId = computed(() => route.query.project_id as string | undefined);
const projectName = computed(
  () => route.query.project_name as string | undefined
);
const from = computed(() => route.query.from as string | undefined);
const loading = ref(false);
const task = ref<any>(null);
const originalStatus = ref<string>("");
const activeTab = ref("info");
const statusFlowLoading = ref(false);
const statusFlowDialogVisible = ref(false);
const delayReasonDialogVisible = ref(false);
const delayReasonForm = ref({ development_delay_message: "" });
const delayReasonFormRef = ref<FormInstance>();
const delayReasonSubmitting = ref(false);
const taskDelayMessageForm = ref({ message: "" });
const taskDelayMessageSaving = ref(false);
const delayReasonRules: FormRules = {
  development_delay_message: [
    { required: true, message: "请输入延期原因", trigger: ["blur", "change"] }
  ]
};

// 是否可以更换当前处理人：根据 transfer_state_dict，当前状态在映射表中且对应字段值 === 当前用户时显示
const transfer_state_dict: Record<string, { department: string }> = {
  "任务进行中": { department: "指派人" },
  "项目测试任务进行中": { department: "测试部负责人" },
  "测试任务进行中": { department: "测试部负责人" }
};
const canShowTransferButton = computed(() => {
  const t = task.value;
  if (!t) return false;
  const status = t.状态 || t.status || "";
  const config = transfer_state_dict[status];
  if (!config) return false;
  const fieldName = config.department;
  const fieldValue = (t[fieldName] || "").toString().trim();
  const currentUser = userStore.username || userStore.nickname || "";
  return fieldValue && (fieldValue === userStore.username || fieldValue === userStore.nickname);
});

// 更换负责人弹框
const transferDialogVisible = ref(false);
const transferForm = ref({ person_name: "" });
const transferFormRef = ref<FormInstance>();
const transferUserOptions = ref<Array<{ label: string; value: string }>>([]);
const transferUserLoading = ref(false);
const transferSubmitting = ref(false);
const transferFormRules: FormRules = {
  person_name: [{ required: true, message: "请选择负责人", trigger: ["blur", "change"] }]
};

const handleTransfer = () => {
  transferForm.value.person_name = "";
  transferDialogVisible.value = true;
};

const loadTransferUserOptions = async () => {
  const t = task.value;
  if (!t) return;
  const status = t.状态 || t.status || "";
  if (!status) {
    transferUserOptions.value = [];
    return;
  }
  transferUserLoading.value = true;
  try {
    const response = await getNextStateUserList({ next_state: status }) as { code: number; result?: any[]; data?: any[] };
    const list = Array.isArray(response.result) ? response.result : Array.isArray(response.data) ? response.data : [];
    const options: Array<{ label: string; value: string }> = [];
    const seen = new Set<string>();
    list.forEach((item: Record<string, any>) => {
      const [dept, members] = Object.entries(item)[0] || ["", []];
      if (!Array.isArray(members)) return;
      members.forEach((user: any) => {
        const name = user.username || user.nickname || "";
        if (name && !seen.has(name)) {
          seen.add(name);
          options.push({ label: name, value: name });
        }
      });
    });
    transferUserOptions.value = options.sort((a, b) => a.label.localeCompare(b.label));
  } catch (error: any) {
    console.error("加载负责人列表失败:", error);
    ElMessage.error(error?.response?.data?.message || error?.message || "加载负责人列表失败");
    transferUserOptions.value = [];
  } finally {
    transferUserLoading.value = false;
  }
};

const submitTransfer = async () => {
  const valid = await transferFormRef.value?.validate().catch(() => false);
  if (!valid) return;
  const t = task.value;
  if (!t) return;
  const taskIdVal = t._id || t.id;
  if (!taskIdVal) {
    ElMessage.error("任务ID不存在");
    return;
  }
  const personName = (transferForm.value.person_name || "").trim();
  if (!personName) {
    ElMessage.warning("请选择转让人");
    return;
  }
  transferSubmitting.value = true;
  try {
    const res = await updateTaskTransfer({
      task_id: taskIdVal,
      person_name: personName
    });
    if (res.code === 200) {
      ElMessage.success("更换负责人成功");
      transferDialogVisible.value = false;
      await loadTask();
    } else {
      ElMessage.error(res.message || "更换负责人失败");
    }
  } catch (err: any) {
    ElMessage.error(err?.message || "更换负责人失败");
  } finally {
    transferSubmitting.value = false;
  }
};

// 计划时间编辑
const devTimeForm = ref({ development_start_time: "", development_end_time: "" });
const devTimeSaving = ref(false);

// 任务完成期限编辑
const taskDeadlineForm = ref({ task_deadline: "" });
const taskDeadlineSaving = ref(false);

// 移动端检测：基本信息描述列表在移动端一行一个
const windowWidth = ref(typeof window !== "undefined" ? window.innerWidth : 1024);
const isMobile = computed(() => windowWidth.value <= 640);
const infoDescriptionsColumn = computed(() => (isMobile.value ? 1 : 2));

// 项目基本信息（来自 info 接口返回的 project）
const projectInfo = computed(() => task.value?.project || null);
const projectInfoProjectType = computed(
  () =>
    (projectInfo.value as any)?.project_type ||
    (route.query.project_type as string) ||
    (route.meta.defaultProjectType as string) ||
    ""
);
const isAppFeatureDevelopmentProject = computed(() =>
  isAppFeatureDevelopmentType(projectInfoProjectType.value)
);
const isFeatureDevelopmentProject = computed(() =>
  isFeatureDevelopmentType(projectInfoProjectType.value)
);
const isRectificationOptimizationProject = computed(() =>
  isRectificationOptimizationType(projectInfoProjectType.value)
);
const isStandardProjectInfo = computed(
  () =>
    !isFeatureDevelopmentProject.value &&
    !isAppFeatureDevelopmentProject.value &&
    !isRectificationOptimizationProject.value
);
const formatProjectInfoDate = (value?: string) => {
  const text = value != null ? String(value).trim() : "";
  return text || "-";
};

const hasProjectInfo = computed(() => {
  const p = projectInfo.value;
  if (!p) return false;
  if (isAppFeatureDevelopmentType((p as any).project_type)) return true;
  const proposal = p.project_proposal || (p as any).project_proposal;
  const appFields =
    (p as any).app_protocol ||
    (p as any).shadow_app ||
    (p as any).customer_name ||
    (p as any).business_owner;
  return !!(
    p.product_type ||
    p.platform_name ||
    p.motherboard_name ||
    p.resolution ||
    appFields ||
    (p as any).project_initiation_date ||
    (p as any).plant_start_time ||
    (p as any).plant_end_time ||
    (p.describe && p.describe.length > 0) ||
    (Array.isArray(proposal) && proposal.length > 0) ||
    (p.attachment && p.attachment.length > 0)
  );
});
const projectProposalList = computed(() => {
  const p = projectInfo.value;
  if (!p) return [];
  const list = p.project_proposal || (p as any).project_proposal;
  return Array.isArray(list) ? list : [];
});
const projectAttachmentList = computed(() => {
  const p = projectInfo.value;
  if (!p) return [];
  const list = p.attachment;
  return Array.isArray(list) ? list : [];
});
const projectPreviewImageList = computed(() => {
  const p = projectInfo.value;
  if (!p?.describe) return [];
  const images: string[] = [];
  p.describe.forEach((item: any) => {
    if (typeof item === "string" && item.startsWith("/data/")) {
      images.push(getImageUrl(item));
    } else if (item?.type === "url" || item?.type === "file") {
      images.push(getImageUrl(item.content));
    }
  });
  return images;
});
const getProjectImageIndex = (index: number): number => {
  const p = projectInfo.value;
  if (!p?.describe) return 0;
  let imageIndex = 0;
  for (let i = 0; i < index; i++) {
    const item = p.describe[i];
    if (typeof item === "string" && item.startsWith("/data/")) imageIndex++;
    else if (item?.type === "url" || item?.type === "file") imageIndex++;
  }
  return imageIndex;
};

// 汇报记录相关
const reportList = ref<any[]>([]);
const reportsLoading = ref(false);
const reportPage = ref(1);
const reportPageSize = ref(10);
const reportTotal = ref(0);

// 表格高度相关
const reportTableContainerRef = ref<HTMLElement>();
const reportTableHeight = ref<number>(400);

// 计算汇报表格高度
const calculateReportTableHeight = () => {
  nextTick(() => {
    if (!reportTableContainerRef.value) return;

    const viewportHeight = window.innerHeight;
    const containerRect = reportTableContainerRef.value.getBoundingClientRect();
    const containerTopToViewportBottom = viewportHeight - containerRect.top;
    const cardHeaderHeight = 50; // card header高度
    const cardPadding = 40;
    const paginationHeight = 60;
    const bottomPadding = 20;
    const availableHeight = containerTopToViewportBottom - cardHeaderHeight - cardPadding - paginationHeight - bottomPadding;
    reportTableHeight.value = Math.max(300, availableHeight);
  });
};

// 窗口大小改变时重新计算
const handleResize = () => {
  windowWidth.value = window.innerWidth;
  calculateReportTableHeight();
};

// 获取状态类型
const getStatusType = (
  status: string
): "success" | "info" | "warning" | "danger" | undefined => {
  if (!status) return undefined;
  const map: Record<string, "success" | "info" | "warning" | "danger"> = {
    [TaskStatus.PENDING_ASSIGN_TO_DEPT_LEADER]: "warning",
    [TaskStatus.PENDING_ASSIGN_TO_MEMBER]: "warning",
    [TaskStatus.NOT_STARTED]: "info",
    [TaskStatus.IN_PROGRESS]: "warning",
    [TaskStatus.PENDING_TEST]: "info",
    [TaskStatus.TESTING]: "warning",
    [TaskStatus.TEST_COMPLETED]: "success",
    [TaskStatus.PENDING_REVIEW]: "info",
    [TaskStatus.REVIEWING]: "warning",
    [TaskStatus.REVIEW_COMPLETED]: "success",
    [TaskStatus.CANCELLED]: "danger",
    [TaskStatus.COMPLETED]: "success"
  };
  return map[status] || undefined;
};

// 获取优先级类型
const getPriorityType = (
  priority: string
): "success" | "info" | "warning" | "danger" | undefined => {
  const map: Record<string, "success" | "info" | "warning" | "danger"> = {
    低: "info",
    中: "warning",
    高: "danger",
    紧急: "danger"
  };
  return map[priority] || undefined;
};

// 是否允许上传附件（当前处理人是当前用户）
const canUploadAttachment = computed(() => {
  const t = task.value;
  if (!t) return false;
  const currentHandler = t.当前处理人 || t.assignee || "";
  if (!currentHandler) return false;
  return currentHandler === userStore.username;
});

// 是否显示延期原因按钮：状态为进行中、当前处理人是当前用户、且 development_is_delay 为 true
const canShowDelayReasonButton = computed(() => {
  const t = task.value;
  if (!t) return false;
  const status = t.状态 || t.status || "";
  const inProgressStatuses = ["任务进行中", "项目测试任务进行中", "测试任务进行中"];
  if (!inProgressStatuses.includes(status)) return false;
  const currentHandler = t.当前处理人 || t.assignee || "";
  if (currentHandler !== userStore.username) return false;
  return t.delay?.development_is_delay === true;
});

// 任务延期的“完成人”字段（接口可能为 task_delay_completed 全角下划线）
const taskDelayCompletedUser = computed(() => {
  const t = task.value;
  if (!t?.delay) return "";
  return String(
    t.delay.task_delay_completed ?? (t.delay as any)["task_delay_completed"] ?? ""
  ).trim();
});

// 是否允许填写任务延期原因：任务延期且（task_delay_completed 为当前用户 或 当前用户为 task.creator）
const canEditTaskDelayMessage = computed(() => {
  const t = task.value;
  if (!t?.delay) return false;
  if (t.delay.task_is_delay !== true) return false;
  const delayCompletedUser = taskDelayCompletedUser.value;
  const isDelayCompletedByMe =
    !!delayCompletedUser &&
    (delayCompletedUser === userStore.username || delayCompletedUser === userStore.nickname);
  const creator = String(t.creator || "").trim();
  const isCreator =
    !!creator && (creator === userStore.username || creator === userStore.nickname);
  return isDelayCompletedByMe || isCreator;
});

// 是否仅展示任务延期原因：task_delay_message 不为空且当前用户不可编辑（只读显示）
const showTaskDelayMessageReadOnly = computed(() => {
  const t = task.value;
  if (!t?.delay) return false;
  const msg = String(t.delay.task_delay_message ?? "").trim();
  if (!msg) return false;
  if (canEditTaskDelayMessage.value) return false;
  return true;
});

/** 当前已保存的任务延期原因（只读展示）；可编辑时 textarea 不预填，接口只提交 textarea */
const taskDelayMessageExistingText = computed(() => {
  const t = task.value;
  return String(t?.delay?.task_delay_message ?? "").trim();
});

const attachmentUploading = ref(false);

// 任务描述编辑（与附件权限一致）
const describeEditMode = ref(false);
const describeEditForm = ref<DescribeContent[]>([]);
const describeSaving = ref(false);
const describeEditorRef = ref<InstanceType<typeof RichTextEditor>>();
/** 将 task.describe 规范化为 DescribeContent[] */
const normalizeDescribeToContent = (describe: any[]): DescribeContent[] => {
  if (!describe || !Array.isArray(describe)) return [];
  return describe
    .map((item: any) => {
      if (typeof item === "string") {
        if (item.startsWith("/data/") || item.startsWith("http://") || item.startsWith("https://")) {
          return { type: "url" as const, content: item };
        }
        return { type: "text" as const, content: item };
      }
      if (item && typeof item === "object" && item.type && item.content !== undefined) {
        return { type: item.type, content: String(item.content) };
      }
      return null;
    })
    .filter((x): x is DescribeContent => x != null);
};

const startDescribeEdit = async () => {
  describeEditForm.value = normalizeDescribeToContent(task.value?.describe || []);
  describeEditMode.value = true;
  await nextTick();
  if (!describeEditorRef.value?.focusEnd()) {
    await nextTick();
    describeEditorRef.value?.focusEnd();
  }
};

const cancelDescribeEdit = () => {
  describeEditMode.value = false;
};

/** 整理描述内容用于提交；无有效文本或图片时返回 null */
const buildDescribeForSubmit = (describe: DescribeContent[]): DescribeContent[] | null => {
  const result: DescribeContent[] = [];
  const seenUrls = new Set<string>();

  for (const item of describe || []) {
    if (item.type === "text") {
      const text = String(item.content ?? "").trim();
      if (text) {
        result.push({ type: "text", content: text });
      }
    } else if (item.type === "url" || item.type === "file") {
      const path = String(item.content ?? "").trim();
      if (
        path &&
        !path.startsWith("data:") &&
        !path.startsWith("blob:")
      ) {
        if (!seenUrls.has(path)) {
          seenUrls.add(path);
          result.push({ type: item.type, content: path });
        }
      }
    }
  }

  return result.length > 0 ? result : null;
};

const saveDescribe = async () => {
  const t = task.value;
  if (!t) return;
  const taskIdVal = t._id || t.id;
  if (!taskIdVal) {
    ElMessage.error("任务ID不存在");
    return;
  }

  const describeContents = buildDescribeForSubmit(describeEditForm.value);
  if (!describeContents) {
    ElMessage.warning("请输入任务描述");
    return;
  }

  describeSaving.value = true;
  try {
    const res = await updateTask({
      task_id: taskIdVal,
      task_name: t.任务名 || t.task_name || t.title || "",
      describe: describeContents,
      priority: t.优先级 || t.priority || "",
      attachment: t.attachment || []
    });
    if (res.code === 200) {
      ElMessage.success("任务描述已更新");
      describeEditMode.value = false;
      await loadTask();
    } else {
      ElMessage.error(res.message || "更新失败");
    }
  } catch (err: any) {
    ElMessage.error(err?.message || "更新失败");
  } finally {
    describeSaving.value = false;
  }
};

// 获取图片 URL
const getImageUrl = (filePath: string): string => {
  if (!filePath) return "";
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }
  const baseUrl = import.meta.env.VITE_GLOB_API_URL || "";
  if (!baseUrl) {
    return filePath;
  }
  let path = filePath;
  if (!path.startsWith("/")) {
    path = "/" + path;
  }
  const normalizedBaseUrl = baseUrl.endsWith("/")
    ? baseUrl.slice(0, -1)
    : baseUrl;
  return normalizedBaseUrl + path;
};

// 获取附件 URL
const getAttachmentUrl = (path: string): string => {
  return getImageUrl(path);
};

// 从路径中提取文件名
const getFileNameFromPath = (path: string): string => {
  if (!path) return "未知文件";
  const parts = path.split("/");
  return parts[parts.length - 1] || "未知文件";
};

// 下载附件
const downloadAttachment = (path: string) => {
  const url = getAttachmentUrl(path);
  const link = document.createElement("a");
  link.href = url;
  link.download = getFileNameFromPath(path);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 上传附件（在详情页追加附件）
const handleBeforeUploadAttachment = async (file: File) => {
  if (!task.value) {
    ElMessage.error("任务信息不存在，无法上传附件");
    return false;
  }
  const taskIdValue = task.value._id || task.value.id;
  if (!taskIdValue) {
    ElMessage.error("任务ID不存在，无法上传附件");
    return false;
  }
  attachmentUploading.value = true;
  try {
    const uploadRes = await uploadFile({ file });
    if (uploadRes.code !== 200 || !uploadRes.url) {
      ElMessage.error("附件上传失败");
      return false;
    }
    const currentAttachments: string[] = Array.isArray(task.value.attachment)
      ? task.value.attachment
      : [];
    const newAttachments = Array.from(
      new Set([...currentAttachments, uploadRes.url])
    );
    const updateRes = await updateTask({
      task_id: taskIdValue,
      task_name:
        task.value.任务名 || task.value.task_name || task.value.title || "",
      describe: task.value.describe || [],
      priority: task.value.优先级 || task.value.priority || "",
      attachment: newAttachments
    });
    if (updateRes.code === 200) {
      ElMessage.success("附件上传成功");
      await loadTask();
    } else {
      ElMessage.error(updateRes.message || "更新任务附件失败");
      return false;
    }
  } catch (error: any) {
    console.error("上传附件失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "附件上传失败"
    );
    return false;
  } finally {
    attachmentUploading.value = false;
  }
  // 阻止 el-upload 默认上传行为
  return false;
};

// 删除附件（与上传权限一致：当前处理人是当前用户时可删除）
const handleDeleteAttachment = async (index: number) => {
  const t = task.value;
  if (!t) return;
  const taskIdVal = t._id || t.id;
  if (!taskIdVal) {
    ElMessage.error("任务ID不存在");
    return;
  }
  const currentAttachments: string[] = Array.isArray(t.attachment) ? [...t.attachment] : [];
  if (index < 0 || index >= currentAttachments.length) return;

  const fileName = getFileNameFromPath(currentAttachments[index]);
  try {
    await ElMessageBox.confirm(
      `确定要删除附件「${fileName}」吗？删除后无法恢复。`,
      "删除附件",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    );
  } catch {
    return;
  }

  const nextAttachments = [...currentAttachments];
  nextAttachments.splice(index, 1);
  attachmentUploading.value = true;
  try {
    const res = await updateTask({
      task_id: taskIdVal,
      task_name: t.任务名 || t.task_name || t.title || "",
      describe: t.describe || [],
      priority: t.优先级 || t.priority || "",
      attachment: nextAttachments
    });
    if (res.code === 200) {
      ElMessage.success("附件已删除");
      await loadTask();
    } else {
      ElMessage.error(res.message || "删除附件失败");
    }
  } catch (error: any) {
    console.error("删除附件失败:", error);
    ElMessage.error(error?.response?.data?.message || error?.message || "删除附件失败");
  } finally {
    attachmentUploading.value = false;
  }
};

// 预览图片列表
const previewImageList = computed(() => {
  if (!task.value?.describe) return [];
  const images: string[] = [];
  task.value.describe.forEach((item: any) => {
    if (typeof item === "string" && item.startsWith("/data/")) {
      images.push(getImageUrl(item));
    } else if (item.type === "url" || item.type === "file") {
      images.push(getImageUrl(item.content));
    }
  });
  return images;
});

// 获取图片索引
const getImageIndex = (index: number): number => {
  if (!task.value?.describe) return 0;
  let imageIndex = 0;
  for (let i = 0; i < index; i++) {
    const item = task.value.describe[i];
    if (typeof item === "string" && item.startsWith("/data/")) {
      imageIndex++;
    } else if (item.type === "url" || item.type === "file") {
      imageIndex++;
    }
  }
  return imageIndex;
};

// 处理图片加载错误
const handleImageError = () => {
  console.error("图片加载失败");
};

// 获取下一个状态
const getNextStatus = (currentStatus: string): string | null => {
  if (!currentStatus) return null;

  const statusFlow: Record<string, string> = {
    [TaskStatus.PENDING_ASSIGN_TO_DEPT_LEADER]:
      TaskStatus.PENDING_ASSIGN_TO_MEMBER,
    [TaskStatus.PENDING_ASSIGN_TO_MEMBER]: TaskStatus.NOT_STARTED,
    [TaskStatus.NOT_STARTED]: TaskStatus.IN_PROGRESS,
    [TaskStatus.IN_PROGRESS]: TaskStatus.PENDING_TEST,
    [TaskStatus.PENDING_TEST]: TaskStatus.TESTING,
    [TaskStatus.TESTING]: TaskStatus.TEST_COMPLETED,
    [TaskStatus.TEST_COMPLETED]: TaskStatus.PENDING_REVIEW,
    [TaskStatus.PENDING_REVIEW]: TaskStatus.REVIEWING,
    [TaskStatus.REVIEWING]: TaskStatus.REVIEW_COMPLETED,
    [TaskStatus.REVIEW_COMPLETED]: TaskStatus.COMPLETED
  };

  return statusFlow[currentStatus] || null;
};

const handleStatusFlowDialogSuccess = async (
  nextState: string,
  personName: string
) => {
  if (!task.value) return;
  task.value.状态 = nextState;
  task.value.status = nextState;
  originalStatus.value = nextState;
  if (personName) {
    task.value.指派人 = personName;
    task.value.assignee = personName;
  }
  // 分配完成后刷新详情
  await loadTask();
};

const handleStatusFlowStart = () => {
  statusFlowLoading.value = true;
};

const handleStatusFlowEnd = () => {
  statusFlowLoading.value = false;
};

// 状态与对应指派人字段的映射（用于判断当前用户是否有权修改计划时间）
const STATUS_ASSIGNEE_FIELD_MAP: Record<string, string> = {
  "研发任务待指派": "指派人",
  "任务进行中": "指派人",
  "项目测试任务待指派": "测试部负责人",
  "项目测试任务进行中": "测试部负责人",
  "测试任务待指派": "测试部负责人",
  "测试任务进行中": "测试部负责人"
};



// 是否可编辑计划开始/结束时间（当前状态在映射表中且当前用户是对应指派人）
const canEditDevelopmentTime = computed(() => {
  const t = task.value;
  if (!t) return false;
  const status = (t.状态 || t.status || "").trim();
  const assigneeField = STATUS_ASSIGNEE_FIELD_MAP[status];
  if (!assigneeField) return false;
  const assignee = t[assigneeField] || "";
  if (!assignee) return false;
  return assignee === userStore.username || assignee === userStore.nickname;
});

// 是否可进行分配（有下一状态且非终态，且当前处理人为当前用户）
const canOpenStatusFlow = computed(() => {
  const t = task.value;
  if (!t) return false;
  const status = t.状态 || t.status || "";

  if ((status === TaskStatus.CANCELLED || status === "已取消")) {
    return false;
  }
  // 当前处理人不是当前用户时，不能进行分配/状态流转
  const currentHandler = t.当前处理人 || t.assignee || "";
  if (currentHandler && currentHandler !== userStore.username) {
    return false;
  }
  const nextState = t.next_state;
  return Array.isArray(nextState) && nextState.length > 0;
});

// 打开分配/状态流转弹窗
const openStatusFlowDialog = () => {
  if (!task.value) return;
  statusFlowDialogVisible.value = true;
};

// 保存任务完成期限（调用 updateTask 接口）
const saveTaskDeadline = async () => {
  const t = task.value;
  if (!t) return;
  const taskIdVal = t._id || t.id;
  if (!taskIdVal) {
    ElMessage.error("任务ID不存在");
    return;
  }
  const deadline = taskDeadlineForm.value.task_deadline;
  if (!deadline) {
    ElMessage.warning("请选择任务完成期限");
    return;
  }
  taskDeadlineSaving.value = true;
  try {
    const res = await updateTaskDeadline({
      task_id: taskIdVal,
      task_deadline: deadline,
    });
    if (res.code === 200) {
      ElMessage.success("任务完成期限已更新");
      await loadTask();
    } else {
      ElMessage.error(res.message || "更新失败");
    }
  } catch (err: any) {
    ElMessage.error(err?.message || "更新失败");
  } finally {
    taskDeadlineSaving.value = false;
  }
};

// 保存计划时间（逻辑不变，仍使用 updateDevelopmentTime）
const saveDevelopmentTime = async () => {
  const t = task.value;
  if (!t) return;
  const taskIdVal = t._id || t.id;
  if (!taskIdVal) {
    ElMessage.error("任务ID不存在");
    return;
  }
  const startTime = devTimeForm.value.development_start_time;
  const endTime = devTimeForm.value.development_end_time;
  if (!startTime || !endTime) {
    ElMessage.warning("请填写计划开始时间和计划结束时间");
    return;
  }
  devTimeSaving.value = true;
  try {
    const res = await updateDevelopmentTime({
      task_id: taskIdVal,
      development_start_time: startTime,
      development_end_time: endTime
    });
    if (res.code === 200) {
      ElMessage.success("计划时间已更新");
      await loadTask();
    } else {
      ElMessage.error(res.message || "更新失败");
    }
  } catch (err: any) {
    ElMessage.error(err?.message || "更新失败");
  } finally {
    devTimeSaving.value = false;
  }
};

/** 将标签栏中当前任务详情标题更新为任务名 */
const updateTaskDetailTagTitle = () => {
  const taskName =
    task.value?.任务名 || task.value?.task_name || task.value?.title || "";
  if (!taskName || !taskId.value) return;

  const multiTagsStore = useMultiTagsStoreHook();
  const currentParams = { id: String(taskId.value) };
  const tag = multiTagsStore.multiTags.find(
    item => item.name === "TaskDetail" && isEqual(item.params, currentParams)
  );
  if (tag?.meta) {
    tag.meta.title = taskName;
    multiTagsStore.tagsCache(multiTagsStore.multiTags);
  }
};

// 加载任务详情（调用 API）
const loadTask = async () => {
  if (!taskId.value) {
    ElMessage.error("任务ID不存在");
    router.push({ name: "TasksList" });
    return;
  }

  loading.value = true;
  try {
    const response = await selectTaskInfo({
      task_id: taskId.value
    });

    if (response.code === 200) {
      const raw = response.result || response.data || response;
      task.value = raw;

      // 兼容 project 在响应顶层（如 { result: task, project: project }）
      if (task.value && !task.value.project && (response as any).project) {
        task.value.project = (response as any).project;
      }

      if (!task.value) {
        ElMessage.error("未找到任务详情");
        router.push({ name: "TasksList" });
        return;
      }

      // 如果 URL 中有 project_id，且任务数据中没有 project_id，则使用 URL 中的
      if (projectId.value && !task.value.project_id) {
        task.value.project_id = projectId.value;
      }
      // 如果 URL 中有 project_name，且任务数据中没有 project_name，则使用 URL 中的
      if (projectName.value && !task.value.project_name) {
        task.value.project_name = projectName.value;
      }

      // 保存原始状态
      originalStatus.value = task.value.状态 || task.value.status || "";

      // 确保状态字段存在
      if (!task.value.状态) {
        task.value.状态 = task.value.status || "";
      }

      // 加载汇报记录
      loadReports();
      // 同步计划时间表单（供可编辑时使用）
      devTimeForm.value = {
        development_start_time: task.value.development_start_time ? String(task.value.development_start_time).trim() : "",
        development_end_time: task.value.development_end_time ? String(task.value.development_end_time).trim() : ""
      };
      // 同步任务完成期限表单
      taskDeadlineForm.value = {
        task_deadline: task.value.task_deadline || task.value.task_dead_line ? String(task.value.task_deadline || task.value.task_dead_line).trim() : ""
      };
      // 任务延期原因：历史内容仅只读展示，输入框始终为空，保存时只提交输入框内容
      taskDelayMessageForm.value = { message: "" };
      updateTaskDetailTagTitle();
    } else {
      ElMessage.error(response.message || "获取任务详情失败");
      router.push({ name: "TasksList" });
    }
  } catch (error: any) {
    console.error("获取任务详情失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "获取任务详情失败"
    );
    router.push({ name: "TasksList" });
  } finally {
    loading.value = false;
  }
};

// 直接进入任务列表（不依赖浏览器历史，避免从工作台/看板进入后无法回到列表）
const goToTaskList = () => {
  const query: Record<string, string> = {};
  if (projectId.value) {
    query.project_id = projectId.value;
  }
  if (projectName.value) {
    query.project_name = projectName.value;
  }
  if (task.value?.requirement_id) {
    query.requirement_id = task.value.requirement_id;
  }
  if (task.value?.requirement_name) {
    query.requirement_name = task.value.requirement_name;
  }

  router.push({
    name: "TasksList",
    query: Object.keys(query).length > 0 ? query : undefined
  });
};

// 返回
const goBack = () => {
  // 根据来源决定返回到哪里
  if (from.value === "workspace") {
    // 从工作台进入的，返回到工作台
    router.push({ name: "Workspace" });
  } else if (from.value === "dashboard") {
    // 从dashboard进入的，返回到dashboard
    router.push({ name: "Dashboard" });
  } else {
    goToTaskList();
  }
};

const openDelayReasonDialog = () => {
  delayReasonForm.value.development_delay_message = "";
  delayReasonDialogVisible.value = true;
  nextTick(() => {
    delayReasonFormRef.value?.clearValidate();
  });
};

const submitDelayReason = async () => {
  const valid = await delayReasonFormRef.value?.validate().catch(() => false);
  if (!valid) return;
  const t = task.value;
  if (!t) return;
  const taskIdVal = t._id || t.id;
  if (!taskIdVal) {
    ElMessage.error("任务ID不存在");
    return;
  }
  delayReasonSubmitting.value = true;
  try {
    const res = await updateTaskDelayReason({
      task_id: taskIdVal,
      message: delayReasonForm.value.development_delay_message.trim()
    });
    if (res.code === 200) {
      ElMessage.success("延期原因已保存");
      delayReasonDialogVisible.value = false;
      await loadTask();
    } else {
      ElMessage.error(res.message || "保存失败");
    }
  } catch (err: any) {
    ElMessage.error(err?.message || "保存失败");
  } finally {
    delayReasonSubmitting.value = false;
  }
};

const saveTaskDelayMessage = async () => {
  const t = task.value;
  if (!t) return;
  const taskIdVal = t._id || t.id;
  if (!taskIdVal) {
    ElMessage.error("任务ID不存在");
    return;
  }
  const message = taskDelayMessageForm.value.message.trim();
  if (!message) {
    ElMessage.warning("请输入任务延期原因");
    return;
  }
  taskDelayMessageSaving.value = true;
  try {
    const res = await updateTaskDelayMessage({
      task_id: taskIdVal,
      message
    });
    if (res.code === 200) {
      ElMessage.success("任务延期原因已保存");
      await loadTask();
    } else {
      ElMessage.error(res.message || "保存失败");
    }
  } catch (err: any) {
    ElMessage.error(err?.message || "保存失败");
  } finally {
    taskDelayMessageSaving.value = false;
  }
};

// 加载汇报记录
const loadReports = async () => {
  if (!task.value) return;
  const currentTaskId = task.value._id || task.value.id;
  if (!currentTaskId) return;

  reportsLoading.value = true;
  try {
    const response = await selectReportList({
      task_id: currentTaskId,
      page: reportPage.value,
      page_size: reportPageSize.value
    });

    if (response.code === 200) {
      reportList.value = response.result || response.data || [];
      reportTotal.value = (response as any).total_count || (response as any).total || reportList.value.length;
      // 计算表格高度
      nextTick(() => {
        calculateReportTableHeight();
      });
    } else {
      ElMessage.error(response.message || "加载汇报记录失败");
      reportList.value = [];
      reportTotal.value = 0;
    }
  } catch (error: any) {
    console.error("加载汇报记录失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "加载汇报记录失败"
    );
    reportList.value = [];
    reportTotal.value = 0;
  } finally {
    reportsLoading.value = false;
  }
};

// 汇报记录分页处理
const handleReportPageSizeChange = (size: number) => {
  reportPageSize.value = size;
  reportPage.value = 1;
  loadReports();
};

const handleReportPageChange = (page: number) => {
  reportPage.value = page;
  loadReports();
};

const handleDetailTabBeforeLeave = (activeName: string | number) => {
  if (activeName === "nodes") {
    goToTaskList();
    return false;
  }
  return true;
};

watch(
  () => route.params.id,
  () => {
    loadTask();
  }
);

onMounted(() => {
  loadTask();
  calculateReportTableHeight();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped lang="scss">
.task-detail-page {
  .page-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;

    .page-title {
      flex: 1;
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .header-nav,
    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .back-button {
      padding: 0;
    }
  }

  .detail-content {
    .main-card {
      .detail-tabs {
        .info-card {
          margin-bottom: 20px;

          // 基本信息卡片头部：标题在左，分配按钮在右侧靠边
          :deep(.el-card__header) {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
          }

          .header-actions {
            display: flex;
            align-items: center;
            gap: 8px;
          }
        }

        .task-info-card {
          background: linear-gradient(135deg, rgba(64, 158, 255, 0.035) 0%, rgba(64, 158, 255, 0.012) 100%);
          border: 1px solid rgba(64, 158, 255, 0.16);
          border-left: 4px solid var(--el-color-primary);

          :deep(.el-card__header) {
            background: rgba(64, 158, 255, 0.04);
            border-bottom-color: rgba(64, 158, 255, 0.12);
          }

          .project-info-row {
            background: rgba(255, 255, 255, 0.96);
            border: 1px solid rgba(64, 158, 255, 0.06);
          }
        }

        .project-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 12px 24px;
          margin-bottom: 0;
        }

        .project-info-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 8px 12px;
          background: var(--el-fill-color-lighter);
          border-radius: 6px;
        }

        .project-info-row--time {
          grid-column: 1 / -1;
          flex-direction: row;
          align-items: center;
          gap: 12px;
          min-height: 40px;

          &.project-info-row--task-delay {
            align-items: flex-start;
            min-height: auto;

            .info-label {
              text-align: left;
              padding-top: 6px;
            }

            .info-value--editable {
              align-items: flex-start;
            }
          }

          .info-label {
            flex-shrink: 0;
            width: 100px;
          }

          .info-value--editable {
            display: flex;
            align-items: center;
            gap: 12px;
            flex: 1;
            min-width: 0;
          }

          .time-field-picker {
            width: 180px;
          }

          .time-field-btn {
            flex-shrink: 0;
          }
        }

        .project-info-row--plan-range {
          flex-direction: column;
          align-items: stretch;
          gap: 0;
          min-height: auto;
          padding: 12px 14px;

          .plan-range-shell {
            display: flex;
            flex-direction: column;
            gap: 14px;
            width: 100%;
          }

          .plan-range-grid {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            gap: 12px 16px;
            align-items: stretch;
          }

          .plan-range-card {
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 12px 14px;
            border-radius: 8px;
            border: 1px solid var(--el-border-color-lighter);
            background: var(--el-bg-color);
            min-width: 0;
          }

          .plan-range-card--start {
            border-left: 3px solid var(--el-color-primary);
            background: linear-gradient(135deg,
                rgba(64, 158, 255, 0.03) 0%,
                var(--el-bg-color) 48%);
          }

          .plan-range-card--end {
            border-left: 3px solid var(--el-color-success);
            background: linear-gradient(135deg,
                rgba(103, 194, 58, 0.035) 0%,
                var(--el-bg-color) 48%);
          }

          .plan-range-card__label {
            font-size: 12px;
            font-weight: 600;
            color: var(--el-text-color-secondary);
            letter-spacing: 0.02em;
          }

          .plan-range-card__body {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 10px;
            min-height: 32px;
          }

          .plan-range-readonly {
            font-size: 15px;
          }

          .plan-range-picker,
          .plan-range-card__body .time-field-picker {
            width: 100%;
            max-width: 220px;
          }

          .plan-range-bridge {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 0 4px;
            align-self: center;
            min-height: 100%;
          }

          .plan-range-bridge__line {
            flex: 1;
            width: 1px;
            min-height: 18px;
            background: linear-gradient(180deg,
                transparent,
                var(--el-border-color) 20%,
                var(--el-border-color) 80%,
                transparent);
          }

          .plan-range-bridge__text {
            font-size: 12px;
            color: var(--el-text-color-placeholder);
            font-weight: 500;
            white-space: nowrap;
            line-height: 1;
          }

          .plan-range-actions {
            display: flex;
            justify-content: flex-end;
            padding-top: 2px;
            border-top: 1px dashed var(--el-border-color-lighter);
            margin: 0 -2px;
            padding-right: 2px;
          }
        }

        .task-delay-message-editor {
          flex-direction: column;
          align-items: stretch;
          align-self: stretch;
          text-align: left;
          gap: 10px;

          .task-delay-message-existing {
            width: 100%;
            text-align: left;
            white-space: pre-wrap;
            word-break: break-word;
          }

          .task-delay-message-input-row {
            display: flex;
            align-items: flex-start;
            justify-content: flex-start;
            gap: 12px;
            width: 100%;
          }

          :deep(.el-textarea) {
            flex: 1;
            min-width: 0;
          }

          :deep(.el-textarea__inner) {
            text-align: left;
          }
        }

        .info-label {
          font-size: 12px;
          color: var(--el-text-color-secondary);
        }

        .info-value {
          font-size: 14px;
          font-weight: 500;
          color: var(--el-text-color-primary);
        }

        .task-desc-section {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--el-border-color-lighter);

          .section-label {
            font-size: 13px;
            font-weight: 500;
            color: var(--el-text-color-regular);
            margin-bottom: 8px;
          }

          .header-actions.section-label {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .task-description-edit {
            min-height: 120px;

            :deep(.rich-text-editor) {
              border: 1px solid var(--el-border-color);
              border-radius: 4px;
              padding: 8px;
            }
          }
        }

        .project-info-card {
          margin-top: 16px;
          background: linear-gradient(135deg, rgba(103, 194, 58, 0.035) 0%, rgba(103, 194, 58, 0.012) 100%);
          border: 1px solid rgba(103, 194, 58, 0.16);
          border-left: 4px solid var(--el-color-success);

          :deep(.el-card__header) {
            background: rgba(103, 194, 58, 0.04);
            border-bottom-color: rgba(103, 194, 58, 0.12);
          }

          .project-info-row {
            background: rgba(255, 255, 255, 0.96);
            border: 1px solid rgba(103, 194, 58, 0.06);
          }

          .project-desc-section {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid var(--el-border-color-lighter);
          }

          .section-label {
            font-size: 13px;
            font-weight: 500;
            color: var(--el-text-color-regular);
            margin-bottom: 8px;
          }

          .project-description {
            .description-text {
              margin: 0 0 8px;
              font-size: 13px;
              line-height: 1.6;
              color: var(--el-text-color-regular);
            }

            .description-image .description-image-el {
              max-width: 100%;
              max-height: 300px;
            }
          }

          .attachment-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }

          .attachment-item {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 10px;
            background: var(--el-fill-color-lighter);
            border-radius: 6px;
            font-size: 13px;
          }

          .attachment-icon {
            color: var(--el-color-primary);
            font-size: 16px;
          }

          .attachment-link {
            color: var(--el-color-primary);
            text-decoration: none;
            max-width: 180px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .attachment-link:hover {
            text-decoration: underline;
          }
        }

        @media (max-width: 640px) {
          .project-info-grid {
            grid-template-columns: 1fr;
          }

          .project-info-row--time {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;

            .info-label {
              width: auto;
            }

            .info-value--editable {
              width: 100%;
            }

            .time-field-picker {
              width: 100%;
              max-width: 100%;
            }
          }

          .project-info-row--plan-range {
            padding: 10px 12px;

            .plan-range-grid {
              grid-template-columns: 1fr;
              gap: 10px;
            }

            .plan-range-bridge {
              flex-direction: row;
              width: 100%;
              padding: 4px 0;
              min-height: auto;
            }

            .plan-range-bridge__line {
              flex: 1;
              width: auto;
              min-height: 1px;
              height: 1px;
              background: linear-gradient(90deg,
                  transparent,
                  var(--el-border-color) 15%,
                  var(--el-border-color) 85%,
                  transparent);
            }

            .plan-range-picker,
            .plan-range-card__body .time-field-picker {
              width: 100%;
              max-width: 100%;
            }

            .plan-range-actions {
              justify-content: stretch;

              .time-field-btn {
                width: 100%;
              }
            }
          }

          .task-delay-message-editor {
            width: 100%;
          }
        }

        .task-description {
          line-height: 1.8;
          color: #606266;
          font-size: 14px;
          white-space: pre-wrap;
          word-wrap: break-word;
          text-align: left;

          .description-text {
            margin: 8px 0;
            text-align: left;
          }

          .description-image {
            margin: 16px 0;
            text-align: left;

            .description-image-el {
              max-width: 400px;
              max-height: 400px;
              cursor: pointer;
              border-radius: 4px;
              transition: transform 0.3s;

              &:hover {
                transform: scale(1.02);
              }
            }
          }
        }

        .attachment-list {
          .attachment-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px;
            border: 1px solid #e4e7ed;
            border-radius: 4px;
            margin-bottom: 8px;
            transition: background-color 0.3s;

            &:hover {
              background-color: #f5f7fa;
            }

            .attachment-icon {
              font-size: 20px;
              color: #409eff;
            }

            .attachment-link {
              flex: 1;
              color: #606266;
              text-decoration: none;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;

              &:hover {
                color: #409eff;
              }
            }
          }
        }

        .history-card {
          .history-list {
            .history-item {
              padding: 12px;
              border-bottom: 1px solid #e4e7ed;
              transition: background-color 0.3s;

              &:last-child {
                border-bottom: none;
              }

              &:hover {
                background-color: #f5f7fa;
              }

              .history-content {
                color: #606266;
                font-size: 14px;
                line-height: 1.6;
                word-wrap: break-word;
              }
            }
          }
        }

      }
    }
  }

  // 状态选择器样式
  :deep(.status-select-info) {
    .el-input__inner {
      color: #409eff;
      border-color: #409eff;
    }
  }

  :deep(.status-select-warning) {
    .el-input__inner {
      color: #e6a23c;
      border-color: #e6a23c;
    }
  }

  :deep(.status-select-success) {
    .el-input__inner {
      color: #67c23a;
      border-color: #67c23a;
    }
  }

  :deep(.status-select-danger) {
    .el-input__inner {
      color: #f56c6c;
      border-color: #f56c6c;
    }
  }

  // 基本信息颜色样式
  .yellow-text {
    color: #e6a23c;
    font-weight: 500;
  }

  .red-text {
    color: #f56c6c;
    font-weight: 500;
  }

  .delay-reason-message {
    white-space: pre-wrap;
    word-break: break-word;
  }
}

// 全局样式：图片预览器
:global(.el-image-viewer__wrapper) {
  z-index: 3000;
}

// 移动端适配 (640px)
@media (max-width: 640px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 16px;

    h2 {
      font-size: 18px;
      width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .header-nav {
      width: 100%;
    }

    .back-button {
      font-size: 14px;
      padding: 4px 8px;
    }
  }

  .detail-content {
    .main-card {
      :deep(.el-card__body) {
        padding: 12px;
      }
    }

    .detail-tabs {
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

      :deep(.el-tabs__content) {
        padding: 12px 0;
      }
    }

    .info-card {
      margin-bottom: 12px;

      :deep(.el-card__header) {
        padding: 12px 16px;
        font-size: 14px;
      }

      :deep(.el-card__body) {
        padding: 16px 12px;
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

    .task-description {
      .description-image {
        .description-image-el {
          max-width: 100% !important;
          max-height: 300px;
        }
      }
    }
  }
}
</style>
