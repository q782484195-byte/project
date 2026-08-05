<template>
  <div class="structure-tree">
    <TablePanel :loading="loading" @refresh="$emit('refresh')">
      <template #toolbar-extra>
        <div v-if="internalTree" class="tree-toolbar-extra">
          <span class="toolbar-stats">{{ taskCount }} 项任务</span>
          <el-button size="small" text @click="expandAll">全部展开</el-button>
          <el-button size="small" text @click="collapseAll">全部收起</el-button>
        </div>
      </template>

      <el-skeleton v-if="loading" animated :rows="4" />

      <div v-else-if="internalTree" class="tree-wrapper">
        <TreeNode
          :node="internalTree"
          :level="0"
          :selected-node-ref="selectedNode as any"
          @node-click="handleNodeClick"
        />
      </div>

      <el-empty v-else description="暂无结构数据" />
    </TablePanel>

    <el-dialog
      v-model="nodeDetailVisible"
      :title="getDialogTitle()"
      width="800px"
      :close-on-click-modal="false"
      :close-on-press-escape="true"
    >
      <div v-if="selectedNode" class="selected-info">
        <!-- 需求详情 -->
        <template v-if="selectedNode.type === 'requirement' && selectedNode.rawData">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="需求ID">{{ selectedNode.rawData._id }}</el-descriptions-item>
            <el-descriptions-item label="需求名">{{ selectedNode.rawData.需求名 }}</el-descriptions-item>
            <el-descriptions-item label="状态">{{ selectedNode.rawData.状态 }}</el-descriptions-item>
            <el-descriptions-item label="优先级">{{ selectedNode.rawData.优先级 }}</el-descriptions-item>
            <el-descriptions-item label="项目名称">{{ selectedNode.rawData.project_name }}</el-descriptions-item>
            <el-descriptions-item label="项目ID">{{ selectedNode.rawData.project_id }}</el-descriptions-item>
            <el-descriptions-item label="创建人">{{ selectedNode.rawData.creator }}</el-descriptions-item>
            <el-descriptions-item label="当前处理人">{{ selectedNode.rawData.当前处理人 || "-" }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ selectedNode.rawData.create_time }}</el-descriptions-item>
            <el-descriptions-item v-if="selectedNode.rawData.进度 !== undefined" label="进度">
              <el-progress :percentage="selectedNode.rawData.进度" :stroke-width="8" />
            </el-descriptions-item>
            <el-descriptions-item v-if="selectedNode.rawData.describe && selectedNode.rawData.describe.length > 0"
              label="描述">
              <div class="describe-content">
                <template v-for="(item, index) in selectedNode.rawData.describe" :key="index">
                  <p v-if="item.type === 'text'">{{ item.content }}</p>
                  <el-image v-else-if="item.type === 'image' || item.type === 'url'" :src="item.url || item.content"
                    style="max-width: 200px; max-height: 200px; margin-top: 8px;" fit="contain" />
                </template>
              </div>
            </el-descriptions-item>
            <el-descriptions-item v-if="selectedNode.rawData.attachment && selectedNode.rawData.attachment.length > 0"
              label="附件">
              <div v-for="(att, index) in selectedNode.rawData.attachment" :key="index" class="attachment-item">
                <a :href="att" target="_blank">{{ att }}</a>
              </div>
            </el-descriptions-item>
          </el-descriptions>
        </template>

        <!-- 任务详情 -->
        <template v-else-if="selectedNode.type === 'task' && selectedNode.rawData">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="任务名">{{ selectedNode.rawData.任务名 }}</el-descriptions-item>
            <el-descriptions-item label="状态">{{ selectedNode.rawData.状态 }}</el-descriptions-item>
            <el-descriptions-item label="优先级">{{ selectedNode.rawData.优先级 }}</el-descriptions-item>
            <el-descriptions-item label="层级名称">{{ selectedNode.rawData.requirement_name }}</el-descriptions-item>
            <el-descriptions-item label="需求ID">{{ selectedNode.rawData.requirement_id }}</el-descriptions-item>
            <el-descriptions-item label="创建人">{{ selectedNode.rawData.creator }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ selectedNode.rawData.create_time }}</el-descriptions-item>
            <el-descriptions-item label="当前处理人">{{ selectedNode.rawData.当前处理人 || "-" }}</el-descriptions-item>
            <el-descriptions-item label="指派人">{{ selectedNode.rawData.指派人 || "-" }}</el-descriptions-item>
            <el-descriptions-item label="指派给">{{ selectedNode.rawData.指派给 || "-" }}</el-descriptions-item>
            <el-descriptions-item label="审阅人">{{ selectedNode.rawData.审阅人 || "-" }}</el-descriptions-item>
            <el-descriptions-item label="测试人">{{ selectedNode.rawData.测试人 || "-" }}</el-descriptions-item>
            <el-descriptions-item label="进度">
              <el-progress :percentage="selectedNode.rawData.进度 || 0" :stroke-width="8" />
            </el-descriptions-item>
            <el-descriptions-item label="计划工时">{{ selectedNode.rawData.计划工时 || 0 }} 天</el-descriptions-item>
            <el-descriptions-item label="已用工时">{{ selectedNode.rawData.已用工时 || 0 }} 天</el-descriptions-item>
            <el-descriptions-item v-if="selectedNode.rawData.备注" label="备注">{{ selectedNode.rawData.备注 }}</el-descriptions-item>
            <el-descriptions-item v-if="selectedNode.rawData.describe && selectedNode.rawData.describe.length > 0"
              label="描述">
              <div class="describe-content">
                <template v-for="(item, index) in selectedNode.rawData.describe" :key="index">
                  <p v-if="item.type === 'text'">{{ item.content }}</p>
                  <el-image v-else-if="item.type === 'image' || item.type === 'url'" :src="item.url || item.content"
                    style="max-width: 200px; max-height: 200px; margin-top: 8px;" fit="contain" />
                </template>
              </div>
            </el-descriptions-item>
            <el-descriptions-item v-if="selectedNode.rawData.attachment && selectedNode.rawData.attachment.length > 0"
              label="附件">
              <div v-for="(att, index) in selectedNode.rawData.attachment" :key="index" class="attachment-item">
                <a :href="att" target="_blank">{{ att }}</a>
              </div>
            </el-descriptions-item>
            <el-descriptions-item v-if="selectedNode.rawData.历史记录 && selectedNode.rawData.历史记录.length > 0" label="历史记录">
              <div class="history-list">
                <div v-for="(record, index) in selectedNode.rawData.历史记录" :key="index" class="history-item">
                  {{ record }}
                </div>
              </div>
            </el-descriptions-item>
          </el-descriptions>
        </template>

        <!-- 项目详情 -->
        <template v-else>
          <p><strong>名称：</strong>{{ selectedNode.name }}</p>
          <p><strong>类型：</strong>{{ getTypeText(selectedNode.type) }}</p>
          <p v-if="selectedNode.type !== 'project'"><strong>状态：</strong>{{ getStatusText(selectedNode.status) }}</p>
          <p v-if="selectedNode.assignee"><strong>负责人：</strong>{{ selectedNode.assignee }}</p>
          <p v-if="selectedNode.estimate"><strong>预计时间：</strong>{{ selectedNode.estimate }}</p>
        </template>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref, watch, type Ref } from "vue";
import TablePanel from "@/components/TablePanel/index.vue";

export type StructureTreeNode = {
  id: string | number;
  name: string;
  type: "project" | "requirement" | "task" | "category";
  status: string;
  assignee?: string;
  estimate?: string;
  progress?: number;
  children?: StructureTreeNode[];
  expanded?: boolean;
  rawData?: any;
};

const props = withDefaults(
  defineProps<{
    treeData: StructureTreeNode | Record<string, any> | null;
    loading?: boolean;
    rootTitle?: string;
  }>(),
  {
    loading: false,
    rootTitle: "项目结构"
  }
);

const emit = defineEmits<{
  (e: "node-click", node: StructureTreeNode): void;
  (e: "refresh"): void;
}>();

const selectedNode = ref<StructureTreeNode | null>(null);
const nodeDetailVisible = ref(false);
const internalTree = ref<StructureTreeNode | null>(null);

const typeTextMap: Record<StructureTreeNode["type"], string> = {
  project: "项目",
  requirement: "需求",
  task: "任务",
  category: "分类"
};

const getTypeText = (type: StructureTreeNode["type"]) => typeTextMap[type] || type;
const getStatusText = (status: string) => status || "未知";

const DONE_STATUSES = new Set(["已完成", "完成", "审阅完毕", "测试完毕", "completed", "COMPLETED"]);
const CANCELLED_STATUSES = new Set(["已取消", "cancelled", "CANCELLED"]);

const isCompletedStatus = (status: string) => DONE_STATUSES.has((status || "").trim());
const isCancelledStatus = (status: string) => CANCELLED_STATUSES.has((status || "").trim());

const getCompletionClass = (node: StructureTreeNode) => {
  if (node.type !== "requirement" && node.type !== "task") return "";
  if (isCancelledStatus(node.status)) return "node-card--cancelled";
  return isCompletedStatus(node.status) ? "node-card--done" : "node-card--pending";
};

const getDialogTitle = () => {
  if (!selectedNode.value) return "节点详情";
  if (selectedNode.value.type === "requirement") return "需求详情";
  if (selectedNode.value.type === "task") return "任务详情";
  return "项目详情";
};

const taskCount = computed(() => {
  let count = 0;
  const walk = (node: StructureTreeNode) => {
    if (node.type === "task") count++;
    node.children?.forEach(walk);
  };
  if (internalTree.value) walk(internalTree.value);
  return count;
});

const isStructureTreeNode = (data: unknown): data is StructureTreeNode =>
  !!data && typeof data === "object" && "type" in (data as any) && "name" in (data as any);

const isRequirementPayload = (obj: any) =>
  obj && typeof obj === "object" && "_id" in obj && "需求名" in obj;

const transformNestedData = (data: Record<string, any>): StructureTreeNode | null => {
  if (!data || typeof data !== "object") return null;

  const convertNode = (key: string, value: any, path: string[] = []): StructureTreeNode | null => {
    if (isRequirementPayload(value)) {
      const tasks = Array.isArray(value.task_list)
        ? value.task_list.map((task: any, index: number) => ({
          id: task._id || `${value._id}_task_${index}`,
          name: task.任务名 || task.task_name || task.title || `任务${index + 1}`,
          type: "task" as const,
          status: task.状态 || task.status || "未知状态",
          assignee: task.当前处理人 || task.指派人 || task.assignee || task.指派给,
          progress: typeof task.进度 === "number" ? task.进度 : undefined,
          estimate: task.预计工时 ? `${task.预计工时} 天` : undefined,
          rawData: task,
          children: []
        }))
        : [];

      const hasProgress = typeof value.进度 === "number";
      const hasStatus = value.状态 && value.状态.trim() !== "";
      const hasAssignee = value.creator && value.creator.trim() !== "";
      const nodeType: StructureTreeNode["type"] =
        (hasProgress || hasStatus || hasAssignee) ? "requirement" : "category";

      return {
        id: value._id,
        name: key,
        type: nodeType,
        status: value.状态 || "",
        assignee: value.creator,
        progress: typeof value.进度 === "number" ? value.进度 : undefined,
        rawData: value,
        children: tasks
      };
    }

    if (value && typeof value === "object") {
      const children = Object.keys(value)
        .map(childKey => convertNode(childKey, value[childKey], path.concat(key)))
        .filter(Boolean) as StructureTreeNode[];

      if (children.length === 0) return null;

      return {
        id: path.concat(key).join("/") || key,
        name: key,
        type: "category",
        status: "",
        children,
        rawData: value
      };
    }

    return null;
  };

  const rootChildren = Object.keys(data)
    .map(key => convertNode(key, data[key], []))
    .filter(Boolean) as StructureTreeNode[];

  return {
    id: "project_overview_root",
    name: props.rootTitle || "项目结构",
    type: "project",
    status: "",
    children: rootChildren
  };
};

const cloneNode = (node: StructureTreeNode): StructureTreeNode => ({
  ...node,
  expanded: true,
  rawData: node.rawData,
  children: node.children?.map(cloneNode) ?? []
});

watch(
  () => props.treeData,
  newVal => {
    if (!newVal) {
      internalTree.value = null;
      selectedNode.value = null;
      nodeDetailVisible.value = false;
      return;
    }

    const treeNode = isStructureTreeNode(newVal) ? newVal : transformNestedData(newVal as Record<string, any>);
    internalTree.value = treeNode ? cloneNode(treeNode) : null;
    selectedNode.value = null;
    nodeDetailVisible.value = false;
  },
  { immediate: true }
);

const expandAll = () => {
  const expand = (node: StructureTreeNode) => {
    node.expanded = true;
    node.children?.forEach(expand);
  };
  if (internalTree.value) expand(internalTree.value);
};

const collapseAll = () => {
  const collapse = (node: StructureTreeNode) => {
    node.expanded = node.type === "project";
    node.children?.forEach(collapse);
  };
  if (internalTree.value) collapse(internalTree.value);
};

const handleNodeClick = (node: StructureTreeNode) => {
  selectedNode.value = node;
  nodeDetailVisible.value = true;
  emit("node-click", node);
};

const TreeNode = defineComponent({
  name: "StructureTreeNode",
  props: {
    node: { type: Object as () => StructureTreeNode, required: true },
    level: { type: Number, required: true },
    selectedNodeRef: { type: Object as () => Ref<StructureTreeNode | null>, required: false }
  },
  emits: ["node-click"],
  setup(nodeProps, { emit: nodeEmit }) {
    const toggleExpand = (event: MouseEvent) => {
      event.stopPropagation();
      nodeProps.node.expanded = !nodeProps.node.expanded;
    };

    const onClick = () => nodeEmit("node-click", nodeProps.node);

    const isSelected = computed(() => {
      if (!nodeProps.selectedNodeRef) return false;
      return (nodeProps.selectedNodeRef as any)?.value === nodeProps.node;
    });

    return () =>
      h("div", {
        class: [
          "tree-node",
          {
            "tree-node--root": nodeProps.level === 0,
            "tree-node--has-children":
              !!nodeProps.node.children?.length && !!nodeProps.node.expanded
          }
        ]
      }, [
        h(
          "div",
          {
            class: [
              "node-card",
              `node-card--${nodeProps.node.type}`,
              getCompletionClass(nodeProps.node),
              { "is-selected": isSelected.value }
            ],
            onClick
          },
          [
            h("div", { class: "node-card__head" }, [
              h("span", { class: "node-card__title", title: nodeProps.node.name }, nodeProps.node.name),
              nodeProps.node.children?.length
                ? h(
                  "button",
                  {
                    type: "button",
                    class: "node-card__toggle",
                    onClick: toggleExpand
                  },
                  nodeProps.node.expanded ? "−" : "+"
                )
                : null
            ]),
            nodeProps.node.type !== "project" && nodeProps.node.type !== "category"
              ? h("div", { class: "node-card__meta" }, [
                nodeProps.node.status
                  ? h("span", {
                    class: "node-card__status",
                    "data-status": nodeProps.node.status
                  }, getStatusText(nodeProps.node.status))
                  : null
              ])
              : null,
            nodeProps.node.assignee && nodeProps.node.type === "task"
              ? h("div", { class: "node-card__assignee" }, nodeProps.node.assignee)
              : null
          ]
        ),
        nodeProps.node.children?.length && nodeProps.node.expanded
          ? h(
            "div",
            { class: "tree-children" },
            nodeProps.node.children.map(child =>
              h(TreeNode, {
                node: child,
                level: nodeProps.level + 1,
                selectedNodeRef: nodeProps.selectedNodeRef,
                onNodeClick: (n: StructureTreeNode) => nodeEmit("node-click", n)
              })
            )
          )
          : null
      ]);
  }
});
</script>

<style lang="scss">
.structure-tree {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;

  :deep(.table-panel) {
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  :deep(.table-panel__body) {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .tree-toolbar-extra {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .toolbar-stats {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-right: 4px;
  }

  .tree-wrapper {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: 16px 20px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 6px;
    background: var(--el-bg-color);

    &::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--el-border-color);
      border-radius: 3px;
    }
  }

  /* 左右结构：子节点在右侧纵向排列，父子节点用连线完全贯通 */
  $tree-line-color: var(--el-border-color);
  $tree-line-width: 2px;
  $tree-branch-length: 28px;
  $tree-node-anchor: 20px;
  $tree-node-gap: 12px;
  $tree-spine-left: calc(-#{$tree-branch-length} - #{$tree-line-width});

  .tree-node {
    display: flex;
    align-items: flex-start;
    position: relative;
    margin-bottom: $tree-node-gap;

    &:last-child {
      margin-bottom: 0;
    }

    /* 子节点：从主干到卡片的水平连线（向左延伸 1px 与主干重叠，消除间隙） */
    &:not(.tree-node--root)::before {
      content: "";
      position: absolute;
      left: $tree-spine-left;
      top: $tree-node-anchor;
      width: calc(#{$tree-branch-length} + #{$tree-line-width});
      height: $tree-line-width;
      background: $tree-line-color;
      transform: translateY(-50%);
      z-index: 1;
    }

    /* 兄弟节点之间的垂直主干（逐段连接，精确对齐下一节点锚点） */
    &:not(:last-child)::after {
      content: "";
      position: absolute;
      left: $tree-spine-left;
      top: $tree-node-anchor;
      width: $tree-line-width;
      height: calc(100% + #{$tree-node-gap});
      background: $tree-line-color;
      z-index: 1;
    }

    /* 父节点到子节点主干的水平连线（向右延伸 1px 与主干重叠） */
    &--has-children > .tree-children::before {
      content: "";
      position: absolute;
      left: -$tree-branch-length;
      top: $tree-node-anchor;
      width: calc(#{$tree-branch-length} + #{$tree-line-width});
      height: $tree-line-width;
      background: $tree-line-color;
      transform: translateY(-50%);
      z-index: 1;
    }
  }

  .tree-children {
    display: flex;
    flex-direction: column;
    position: relative;
    margin-left: $tree-branch-length;
    padding-left: $tree-branch-length;
    min-width: 0;
  }

  .node-card {
    position: relative;
    z-index: 2;
    flex-shrink: 0;
    width: 220px;
    padding: 10px 12px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 6px;
    background: var(--el-bg-color);
    cursor: pointer;
    transition: border-color 0.15s;

    &:hover {
      border-color: var(--el-border-color);
    }

    &.is-selected {
      border-color: var(--el-color-primary);
    }

    &--project {
      width: 240px;
      border-color: var(--el-color-primary-light-7);
      background: var(--el-color-primary-light-9);
    }

    &--category {
      border-style: dashed;
      background: var(--el-fill-color-light);
    }

    &--requirement,
    &--task {
      &.node-card--done {
        border-left: 3px solid #67c23a;
        background: #f0f9eb;
      }

      &.node-card--pending {
        border-left: 3px solid #e6a23c;
        background: #fdf6ec;
      }

      &.node-card--cancelled {
        border-left: 3px solid #c0c4cc;
        background: var(--el-fill-color-light);
        opacity: 0.85;
      }
    }

    &__head {
      display: flex;
      align-items: flex-start;
      gap: 6px;
    }

    &__title {
      flex: 1;
      font-size: 13px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      line-height: 1.4;
      word-break: break-word;
    }

    &__toggle {
      flex-shrink: 0;
      width: 18px;
      height: 18px;
      border: 1px solid var(--el-border-color);
      border-radius: 3px;
      background: var(--el-bg-color);
      color: var(--el-text-color-secondary);
      font-size: 12px;
      line-height: 1;
      cursor: pointer;
      padding: 0;

      &:hover {
        color: var(--el-color-primary);
        border-color: var(--el-color-primary-light-5);
      }
    }

    &__meta {
      margin-top: 6px;
    }

    &__status {
      font-size: 11px;
      white-space: nowrap;
    }

    &--done .node-card__status {
      color: #67c23a;
    }

    &--pending .node-card__status {
      color: #e6a23c;
    }

    &--cancelled .node-card__status {
      color: #909399;
    }

    &__assignee {
      margin-top: 4px;
      font-size: 11px;
      color: var(--el-text-color-placeholder);
    }
  }

  .selected-info {
    .describe-content,
    .history-list {
      max-height: 300px;
      overflow-y: auto;
      padding: 8px;
      background: var(--el-fill-color);
      border-radius: 4px;
    }

    .history-item {
      padding: 6px 0;
      border-bottom: 1px solid var(--el-border-color-lighter);
      font-size: 13px;
      line-height: 1.5;

      &:last-child {
        border-bottom: none;
      }
    }

    .attachment-item a {
      color: var(--el-color-primary);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    p {
      margin: 6px 0;
      font-size: 14px;
      line-height: 1.6;
    }
  }
}
</style>
