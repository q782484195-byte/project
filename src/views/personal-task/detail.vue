<template>
  <div class="daily-task-detail-page">
    <div class="page-header">
      <el-button type="text" class="back-button" @click="goBack">
        <el-icon>
          <ArrowLeft />
        </el-icon>
        返回
      </el-button>
      <h2 class="page-title">{{ pageTitle }}</h2>
      <div class="page-header-actions">
        <el-button
          v-if="canCompleteTask"
          type="success"
          :loading="completing"
          @click="handleCompleteTask"
        >
          完成任务
        </el-button>
        <el-button
          v-if="canDelete"
          type="danger"
          plain
          :loading="deleting"
          @click="handleDelete"
        >
          删除任务
        </el-button>
      </div>
    </div>

    <div v-loading="loading" class="detail-content">
      <el-card v-if="task" class="main-card task-info-card" shadow="never">
        <template #header>
          <div class="card-header-row">
            <span>任务基本信息</span>
            <el-button
              v-if="canEditTask"
              type="primary"
              class="save-btn"
              :loading="basicSaving"
              @click="saveBasicInfo"
            >
              <el-icon>
                <Check />
              </el-icon>
              保存
            </el-button>
          </div>
        </template>

        <div class="project-info-grid">
          <div class="project-info-row">
            <span class="info-label">任务名称</span>
            <span class="info-value" :class="{ 'info-value--editable': canEditTask }">
              <el-input
                v-if="canEditTask"
                v-model="basicForm.title"
                maxlength="100"
                show-word-limit
                placeholder="请输入任务名称"
                clearable
              />
              <span v-else>{{ pageTitle }}</span>
            </span>
          </div>
          <div class="project-info-row">
            <span class="info-label">创建人</span>
            <span class="info-value">{{ task.creator || "-" }}</span>
          </div>
          <div class="project-info-row">
            <span class="info-label">指派人</span>
            <span class="info-value">
              <DailyTaskAssigneeTags :task="task" />
            </span>
          </div>
          <div class="project-info-row">
            <span class="info-label">状态</span>
            <span class="info-value" :class="{ 'info-value--editable': canEditTask }">
              <template v-if="canEditTask">
                <el-tag size="small" class="current-state-tag">{{ currentState || "-" }}</el-tag>
                <el-select
                  v-model="basicForm.state"
                  placeholder="不修改"
                  clearable
                  style="width: 200px"
                >
                  <el-option label="已完成" value="已完成" />
                  <el-option label="已取消" value="已取消" />
                </el-select>
                <span class="form-item-tip">留空表示不修改状态</span>
              </template>
              <el-tag v-else size="small">{{ currentState || "-" }}</el-tag>
            </span>
          </div>
          <div class="project-info-row">
            <span class="info-label">优先级</span>
            <span class="info-value" :class="{ 'info-value--editable': canEditTask }">
              <el-select
                v-if="canEditTask"
                v-model="basicForm.priority"
                style="width: 200px"
              >
                <el-option label="正常" value="正常" />
                <el-option label="紧急" value="紧急" />
              </el-select>
              <el-tag
                v-else
                :type="currentPriority === '紧急' ? 'danger' : 'warning'"
                size="small"
              >
                {{ currentPriority || "-" }}
              </el-tag>
            </span>
          </div>
          <div class="project-info-row">
            <span class="info-label">进度</span>
            <span class="info-value">{{ currentProgress }}%</span>
          </div>
          <div class="project-info-row project-info-row--time">
            <span class="info-label">完成期限</span>
            <span class="info-value" :class="{ 'info-value--editable': canEditTask }">
              <el-date-picker
                v-if="canEditTask"
                v-model="basicForm.task_deadline"
                type="date"
                placeholder="请选择完成期限"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                clearable
                class="time-field-picker"
              />
              <span v-else>{{ task.task_deadline || "-" }}</span>
            </span>
          </div>
          <div class="project-info-row">
            <span class="info-label">指派时间</span>
            <span class="info-value">{{ task.assignment_time || "-" }}</span>
          </div>
          <div class="project-info-row">
            <span class="info-label">创建时间</span>
            <span class="info-value">{{ task.create_time || "-" }}</span>
          </div>
        </div>

        <div class="task-desc-section">
          <div class="header-actions section-label">
            <span>任务描述</span>
            <template v-if="canEditContent">
              <el-button
                v-if="!describeEditMode"
                type="primary"
                size="small"
                @click="startDescribeEdit"
              >
                编辑
              </el-button>
              <template v-else>
                <el-button
                  type="primary"
                  class="save-btn"
                  :loading="describeSaving"
                  @click="saveDescribe"
                >
                  <el-icon>
                    <Check />
                  </el-icon>
                  保存
                </el-button>
                <el-button class="cancel-btn" @click="cancelDescribeEdit">取消</el-button>
              </template>
            </template>
          </div>

          <div v-if="describeEditMode" class="task-description-edit">
            <RichTextEditor
              ref="describeEditorRef"
              v-model="describeEditForm"
            />
          </div>
          <div
            v-else-if="normalizedDescribe.length > 0"
            class="task-description"
          >
            <template v-for="(item, index) in normalizedDescribe" :key="index">
              <p
                v-if="item.type === 'text' && !isDescribeHtml(item.content)"
                class="description-text"
              >
                {{ item.content }}
              </p>
              <div
                v-else-if="item.type === 'text'"
                class="description-text"
                v-html="item.content"
              />
              <div
                v-else-if="item.type === 'url' || item.type === 'file'"
                class="description-image"
              >
                <el-image
                  :src="getImageUrl(item.content)"
                  :alt="`图片 ${Number(index) + 1}`"
                  :preview-src-list="previewImageList"
                  :initial-index="getImageIndex(Number(index))"
                  preview-teleported
                  fit="contain"
                  class="description-image-el"
                />
              </div>
            </template>
          </div>
          <el-empty v-else description="暂无任务描述" :image-size="80" />
        </div>

        <div class="task-desc-section">
          <div class="header-actions section-label">
            <span>任务附件</span>
            <el-upload
              v-if="canEditContent"
              :show-file-list="false"
              :before-upload="handleBeforeUploadAttachment"
              :disabled="attachmentUploading"
            >
              <el-button type="primary" size="small" :loading="attachmentUploading">
                <el-icon>
                  <Upload />
                </el-icon>
                上传附件
              </el-button>
            </el-upload>
          </div>

          <div v-if="attachmentList.length > 0" class="attachment-list">
            <div
              v-for="(attachment, index) in attachmentList"
              :key="index"
              class="attachment-item"
            >
              <el-icon class="attachment-icon">
                <DocumentIcon />
              </el-icon>
              <span class="attachment-link">{{ getFileNameFromPath(attachment) }}</span>
              <el-button
                type="primary"
                link
                size="small"
                @click="downloadAttachment(attachment)"
              >
                <el-icon>
                  <Download />
                </el-icon>
                下载/查看
              </el-button>
              <el-button
                v-if="canEditContent"
                type="danger"
                link
                size="small"
                @click="handleDeleteAttachment(Number(index))"
              >
                <el-icon>
                  <Delete />
                </el-icon>
                删除
              </el-button>
            </div>
          </div>
          <p v-else class="empty-tip">暂无附件</p>
        </div>

        <div v-if="historyList.length" class="task-desc-section">
          <div class="section-label">历史记录</div>
          <div class="history-list">
            <div
              v-for="(record, index) in historyList"
              :key="index"
              class="history-item"
            >
              {{ record }}
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  ArrowLeft,
  Check,
  Document as DocumentIcon,
  Download,
  Upload,
  Delete
} from "@element-plus/icons-vue";
import { isEqual } from "@pureadmin/utils";
import RichTextEditor from "@/components/RichTextEditor.vue";
import DailyTaskAssigneeTags from "@/components/DailyTaskAssigneeTags.vue";
import type { DescribeContent } from "@/api/project";
import { uploadFile } from "@/api/project";
import { useMultiTagsStoreHook } from "@/store/modules/multiTags";
import { useUserStoreHook } from "@/store/modules/user";
import {
  normalizeDailyTaskDescribeToContent,
  buildCreatorUpdateDailyTaskParams,
  buildAssignerUpdateDailyTaskParams,
  getAttachmentUrl,
  getFileNameFromPath,
  isBlankDailyTaskContent
} from "@/utils/dailyTaskContent";
import {
  assignerFinishDailyTask,
  assignerUpdateDailyTask,
  creatorUpdateDailyTask,
  deleteDailyTask,
  getDailyTaskInfo,
  getDailyTaskName,
  getDailyTaskState,
  getDailyTaskPriority,
  getDailyTaskProgress,
  hasAssignerFinishedDailyTask,
  isDailyTaskCreator,
  isDailyTaskAssigner,
  canEditDailyTask,
  unwrapDailyTaskInfo,
  type DailyTaskItem
} from "@/api/daily-task";

defineOptions({
  name: "PersonalTaskDetail"
});

const route = useRoute();
const router = useRouter();
const userStore = useUserStoreHook();

const taskId = computed(() => String(route.params.id || ""));
const from = computed(() => String(route.query.from || ""));
const currentUsername = computed(() => (userStore.username || "").trim());
const userRoles = computed(() => userStore.roles || []);

const loading = ref(false);
const deleting = ref(false);
const completing = ref(false);
const basicSaving = ref(false);
const describeSaving = ref(false);
const attachmentUploading = ref(false);
const describeEditMode = ref(false);
const task = ref<DailyTaskItem | null>(null);
const describeEditForm = ref<DescribeContent[]>([]);
const describeEditorRef = ref<InstanceType<typeof RichTextEditor>>();

const basicForm = ref({
  title: "",
  priority: "正常",
  task_deadline: "",
  state: ""
});

const pageTitle = computed(() =>
  task.value ? getDailyTaskName(task.value) : "任务详情"
);
const currentState = computed(() =>
  task.value ? getDailyTaskState(task.value) : ""
);
const currentPriority = computed(() =>
  task.value ? getDailyTaskPriority(task.value) : ""
);
const currentProgress = computed(() =>
  task.value ? getDailyTaskProgress(task.value) : 0
);
const normalizedDescribe = computed(() =>
  normalizeDailyTaskDescribeToContent(task.value?.describe)
);
const attachmentList = computed(() => {
  const list = task.value?.attachment;
  return Array.isArray(list)
    ? list.map(item => String(item).trim()).filter(Boolean)
    : [];
});
const historyList = computed(() => {
  const records = task.value?.历史记录;
  return Array.isArray(records)
    ? records.map(item => String(item).trim()).filter(Boolean)
    : [];
});

const canEditTask = computed(() => {
  if (!task.value) return false;
  return canEditDailyTask(task.value, currentUsername.value, userRoles.value);
});

const canEditAsAssigner = computed(() => {
  if (!task.value) return false;
  return isDailyTaskAssigner(task.value, currentUsername.value);
});

const canEditContent = computed(
  () => canEditTask.value || canEditAsAssigner.value
);

const canDelete = computed(() => {
  if (!task.value) return false;
  return isDailyTaskCreator(task.value, currentUsername.value);
});

const canCompleteTask = computed(() => {
  if (!task.value || from.value !== "workspace") return false;
  if (!isDailyTaskAssigner(task.value, currentUsername.value)) return false;
  if (hasAssignerFinishedDailyTask(task.value, currentUsername.value)) {
    return false;
  }
  const state = getDailyTaskState(task.value);
  return state !== "已完成" && state !== "已取消";
});

const getImageUrl = (filePath: string) => getAttachmentUrl(filePath);

const isDescribeHtml = (content: string) => /<[a-z][\s\S]*>/i.test(content);

const previewImageList = computed(() =>
  normalizedDescribe.value
    .filter(item => item.type === "url" || item.type === "file")
    .map(item => getImageUrl(item.content))
);

const getImageIndex = (index: number): number => {
  let imageIndex = 0;
  for (let i = 0; i < index; i++) {
    const item = normalizedDescribe.value[i];
    if (item?.type === "url" || item?.type === "file") {
      imageIndex++;
    }
  }
  return imageIndex;
};

const syncBasicForm = () => {
  if (!task.value) return;
  basicForm.value = {
    title: getDailyTaskName(task.value),
    priority: getDailyTaskPriority(task.value) || "正常",
    task_deadline: String(task.value.task_deadline || ""),
    state: ""
  };
};

const updateDetailTagTitle = () => {
  const title = pageTitle.value;
  if (!title || title === "任务详情" || !taskId.value) return;

  const multiTagsStore = useMultiTagsStoreHook();
  const currentParams = { id: String(taskId.value) };
  const tag = multiTagsStore.multiTags.find(
    item =>
      item.name === "PersonalTaskDetail" && isEqual(item.params, currentParams)
  );
  if (tag?.meta) {
    tag.meta.title = title;
    multiTagsStore.tagsCache(multiTagsStore.multiTags);
  }
};

const loadTask = async () => {
  if (!taskId.value) {
    ElMessage.error("任务ID不存在");
    router.push({ name: "PersonalTaskList" });
    return;
  }

  loading.value = true;
  try {
    const response = await getDailyTaskInfo({ task_id: taskId.value });
    if (response.code === 200) {
      const item = unwrapDailyTaskInfo(response);
      if (!item) {
        throw new Error("未找到任务详情");
      }
      task.value = item;
      syncBasicForm();
      updateDetailTagTitle();
      return;
    }
    throw new Error(response.message || "获取任务详情失败");
  } catch (error: any) {
    ElMessage.error(error?.message || "获取任务详情失败");
    router.push({ name: "PersonalTaskList" });
  } finally {
    loading.value = false;
  }
};

const getCurrentDescribeContent = () =>
  normalizeDailyTaskDescribeToContent(task.value?.describe);

const getCurrentAttachments = () => attachmentList.value;

const submitTaskUpdate = async (
  describe: DescribeContent[],
  attachments: string[],
  options?: {
    title?: string;
    priority?: string;
    task_deadline?: string;
    state?: string;
  }
) => {
  if (!task.value || !taskId.value) return null;

  if (canEditTask.value) {
    return creatorUpdateDailyTask(
      buildCreatorUpdateDailyTaskParams(
        taskId.value,
        describe,
        attachments,
        options?.title ?? getDailyTaskName(task.value),
        {
          state: options?.state ?? "",
          priority:
            options?.priority ??
            (getDailyTaskPriority(task.value) || "正常"),
          task_deadline:
            options?.task_deadline ?? String(task.value.task_deadline || "")
        }
      )
    );
  }

  if (canEditAsAssigner.value) {
    return assignerUpdateDailyTask(
      buildAssignerUpdateDailyTaskParams(taskId.value, describe, attachments)
    );
  }

  return null;
};

const saveBasicInfo = async () => {
  const title = basicForm.value.title.trim();
  if (!title) {
    ElMessage.warning("请输入任务名称");
    return;
  }

  basicSaving.value = true;
  try {
    const response = await submitTaskUpdate(
      getCurrentDescribeContent(),
      getCurrentAttachments(),
      {
        title,
        priority: basicForm.value.priority,
        task_deadline: basicForm.value.task_deadline,
        state: basicForm.value.state
      }
    );
    if (!response) {
      ElMessage.warning("当前账号无权编辑此任务");
      return;
    }
    if (response.code === 200) {
      ElMessage.success("保存成功");
      basicForm.value.state = "";
      await loadTask();
    } else {
      ElMessage.error(response.message || "保存失败");
    }
  } catch (error: any) {
    ElMessage.error(error?.message || "保存失败");
  } finally {
    basicSaving.value = false;
  }
};

const startDescribeEdit = async () => {
  describeEditForm.value = getCurrentDescribeContent();
  describeEditMode.value = true;
  await nextTick();
  describeEditorRef.value?.focusEnd();
};

const cancelDescribeEdit = () => {
  describeEditMode.value = false;
};

const saveDescribe = async () => {
  if (isBlankDailyTaskContent(describeEditForm.value, attachmentList.value.length)) {
    ElMessage.warning("请输入任务描述或保留现有附件");
    return;
  }

  describeSaving.value = true;
  try {
    const response = await submitTaskUpdate(
      describeEditForm.value,
      getCurrentAttachments()
    );
    if (!response) {
      ElMessage.warning("当前账号无权编辑此任务");
      return;
    }
    if (response.code === 200) {
      ElMessage.success("任务描述已更新");
      describeEditMode.value = false;
      await loadTask();
    } else {
      ElMessage.error(response.message || "保存失败");
    }
  } catch (error: any) {
    ElMessage.error(error?.message || "保存失败");
  } finally {
    describeSaving.value = false;
  }
};

const handleBeforeUploadAttachment = async (file: File) => {
  if (!task.value || !canEditContent.value) return false;

  attachmentUploading.value = true;
  try {
    const uploadRes = await uploadFile({ file });
    if (uploadRes.code !== 200 || !uploadRes.url) {
      ElMessage.error("附件上传失败");
      return false;
    }
    const newAttachments = Array.from(
      new Set([...getCurrentAttachments(), uploadRes.url])
    );
    const response = await submitTaskUpdate(
      getCurrentDescribeContent(),
      newAttachments
    );
    if (!response) {
      ElMessage.warning("当前账号无权编辑此任务");
      return false;
    }
    if (response.code === 200) {
      ElMessage.success("附件上传成功");
      await loadTask();
    } else {
      ElMessage.error(response.message || "更新任务附件失败");
    }
  } catch (error: any) {
    ElMessage.error(error?.message || "附件上传失败");
  } finally {
    attachmentUploading.value = false;
  }
  return false;
};

const handleDeleteAttachment = async (index: number) => {
  if (!task.value || !canEditContent.value) return;
  const currentAttachments = [...getCurrentAttachments()];
  if (index < 0 || index >= currentAttachments.length) return;

  const fileName = getFileNameFromPath(currentAttachments[index]);
  try {
    await ElMessageBox.confirm(
      `确定要删除附件「${fileName}」吗？`,
      "删除附件",
      { type: "warning" }
    );
  } catch {
    return;
  }

  attachmentUploading.value = true;
  try {
    currentAttachments.splice(index, 1);
    const response = await submitTaskUpdate(
      getCurrentDescribeContent(),
      currentAttachments
    );
    if (!response) {
      ElMessage.warning("当前账号无权编辑此任务");
      return;
    }
    if (response.code === 200) {
      ElMessage.success("附件已删除");
      await loadTask();
    } else {
      ElMessage.error(response.message || "删除附件失败");
    }
  } catch (error: any) {
    ElMessage.error(error?.message || "删除附件失败");
  } finally {
    attachmentUploading.value = false;
  }
};

const downloadAttachment = (path: string) => {
  const link = document.createElement("a");
  link.href = getAttachmentUrl(path);
  link.download = getFileNameFromPath(path);
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const handleDelete = () => {
  if (!task.value) return;
  ElMessageBox.confirm(`确定删除任务「${pageTitle.value}」吗？`, "提示", {
    type: "warning"
  })
    .then(async () => {
      deleting.value = true;
      try {
        const response = await deleteDailyTask({ task_id: taskId.value });
        if (response.code === 200) {
          ElMessage.success("删除成功");
          goBack();
        } else {
          ElMessage.error(response.message || "删除失败");
        }
      } catch (error: any) {
        ElMessage.error(error?.message || "删除失败");
      } finally {
        deleting.value = false;
      }
    })
    .catch(() => {});
};

const handleCompleteTask = () => {
  if (!taskId.value) return;
  ElMessageBox.confirm("确定将该任务标记为已完成吗？", "提示", {
    type: "warning",
    confirmButtonText: "确定",
    cancelButtonText: "取消"
  })
    .then(async () => {
      completing.value = true;
      try {
        const response = await assignerFinishDailyTask({
          task_id: taskId.value
        });
        if (response.code === 200) {
          ElMessage.success("完成任务成功");
          goBack();
        } else {
          ElMessage.error(response.message || "完成任务失败");
        }
      } catch (error: any) {
        ElMessage.error(
          error?.response?.data?.message || error?.message || "完成任务失败"
        );
      } finally {
        completing.value = false;
      }
    })
    .catch(() => {});
};

const goBack = () => {
  if (from.value === "workspace") {
    router.push({ name: "Workspace" });
    return;
  }
  router.push({ name: "PersonalTaskList" });
};

watch(taskId, () => {
  loadTask();
});

onMounted(() => {
  loadTask();
});
</script>

<style scoped lang="scss">
.daily-task-detail-page {
  background: #f5f7fa;
  min-height: calc(100vh - 130px);
  padding: 16px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;

  .back-button {
    padding-left: 0;
  }

  .page-title {
    flex: 1;
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #303133;
  }

  .page-header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }
}

.detail-content {
  .main-card {
    border: none;
  }

  .task-info-card {
    background: linear-gradient(
      135deg,
      rgba(64, 158, 255, 0.018) 0%,
      rgba(64, 158, 255, 0.006) 100%
    );
    border: 1px solid rgba(64, 158, 255, 0.08);
    border-left: 3px solid rgba(64, 158, 255, 0.28);

    :deep(.el-card__header) {
      background: rgba(64, 158, 255, 0.02);
      border-bottom-color: rgba(64, 158, 255, 0.06);
    }

    .project-info-row {
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.98);
      border: 1px solid rgba(64, 158, 255, 0.04);
      border-radius: 6px;
    }
  }
}

.card-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.save-btn {
  min-width: 96px;
  height: 36px;
  padding: 0 20px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.4);

  .el-icon {
    margin-right: 4px;
  }

  &:hover:not(:disabled) {
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.5);
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
}

.cancel-btn {
  height: 36px;
  padding: 0 16px;
}

.project-info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 24px;
}

.project-info-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-height: 32px;

  .info-label {
    width: 88px;
    flex-shrink: 0;
    color: #909399;
    font-size: 14px;
    line-height: 32px;
  }

  .info-value {
    flex: 1;
    color: #303133;
    font-size: 14px;
    word-break: break-word;
    line-height: 32px;
  }

  .info-value--editable {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    line-height: normal;
  }
}

.current-state-tag {
  flex-shrink: 0;
}

.time-field-picker {
  width: 240px;
  max-width: 100%;
}

.section-label {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.header-actions.section-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;

  .el-button + .el-button {
    margin-left: 8px;
  }
}

.task-desc-section {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.task-description-edit {
  :deep(.rich-text-editor) {
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
    padding: 8px;
    min-height: 200px;
  }
}

.task-description {
  line-height: 1.8;
  color: #606266;
  font-size: 14px;

  .description-text {
    margin: 8px 0;
  }

  .description-image {
    margin: 16px 0;

    .description-image-el {
      max-width: 400px;
      max-height: 400px;
      border-radius: 4px;
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

    .attachment-icon {
      font-size: 20px;
      color: #409eff;
    }

    .attachment-link {
      flex: 1;
      color: #606266;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

.history-list {
  .history-item {
    padding: 10px 0;
    border-bottom: 1px solid #ebeef5;
    color: #606266;
    font-size: 14px;
    line-height: 1.6;

    &:last-child {
      border-bottom: none;
    }
  }
}

.form-item-tip {
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

.empty-tip {
  margin: 0;
  padding: 8px 12px;
  font-size: 13px;
  color: #909399;
  line-height: 1.5;
  background: rgba(64, 158, 255, 0.03);
  border: 1px dashed rgba(64, 158, 255, 0.1);
  border-radius: 6px;
}

@media (max-width: 640px) {
  .project-info-grid {
    grid-template-columns: 1fr;
  }

  .project-info-row--time {
    flex-direction: column;
    align-items: flex-start;

    .info-label {
      line-height: 1.5;
    }

    .info-value--editable {
      width: 100%;
    }

    .time-field-picker {
      width: 100%;
    }
  }

  .page-header {
    flex-wrap: wrap;
  }
}
</style>
