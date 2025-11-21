<template>
  <div class="structure-tree">
    <el-skeleton v-if="loading" animated :rows="4" />
    <div v-else>
      <div v-if="internalTree" class="tree-wrapper">
        <TreeNode :node="internalTree" :level="0" :selected-node-ref="selectedNode as any"
          @node-click="handleNodeClick" />
      </div>
      <el-empty v-else description="暂无结构数据" />
    </div>

    <el-dialog v-model="nodeDetailVisible" :title="getDialogTitle()" width="800px" :close-on-click-modal="false"
      :close-on-press-escape="true">
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
            <el-descriptions-item label="需求名称">{{ selectedNode.rawData.requirement_name }}</el-descriptions-item>
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
            <el-descriptions-item label="预计工时">{{ selectedNode.rawData.预计工时 || 0 }} 小时</el-descriptions-item>
            <el-descriptions-item label="已用工时">{{ selectedNode.rawData.已用工时 || 0 }} 小时</el-descriptions-item>
            <el-descriptions-item v-if="selectedNode.rawData.备注" label="备注">{{ selectedNode.rawData.备注
            }}</el-descriptions-item>
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

        <!-- 项目详情（保持原有显示） -->
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
import { computed, defineComponent, h, ref, watch, resolveComponent, type Ref } from "vue";
import { ElProgress } from "element-plus";

export type StructureTreeNode = {
  id: string | number;
  name: string;
  type: "project" | "requirement" | "task";
  status: string; // 使用原始状态字符串，不再限制为固定值
  assignee?: string;
  estimate?: string;
  progress?: number; // 进度（0-100）
  children?: StructureTreeNode[];
  expanded?: boolean;
  rawData?: any; // 保存完整的原始数据（需求或任务）
};

const props = withDefaults(
  defineProps<{
    treeData: StructureTreeNode | null;
    loading?: boolean;
  }>(),
  {
    loading: false
  }
);

const emit = defineEmits<{
  (e: "node-click", node: StructureTreeNode): void;
}>();

const selectedNode = ref<StructureTreeNode | null>(null);
const nodeDetailVisible = ref(false);
const internalTree = ref<StructureTreeNode | null>(null);

const cloneNode = (node: StructureTreeNode, level: number = 0): StructureTreeNode => {
  // level 0: 项目节点 - 默认展开（显示需求）
  // level 1: 需求节点 - 默认折叠（不显示任务，用户手动展开）
  // level 2: 任务节点 - 默认折叠（任务节点不应该有子节点，但为了安全起见）
  // 只有项目节点默认展开
  const shouldExpand = node.type === "project";

  return {
    ...node,
    expanded: node.expanded ?? shouldExpand,
    rawData: node.rawData, // 保留原始数据
    children: node.children?.map(child => cloneNode(child, level + 1)) ?? []
  };
};

watch(
  () => props.treeData,
  newVal => {
    internalTree.value = newVal ? cloneNode(newVal, 0) : null;
    selectedNode.value = null;
    nodeDetailVisible.value = false;
  },
  { immediate: true }
);

const statusTextMap: Record<StructureTreeNode["status"], string> = {
  completed: "已完成",
  "in-progress": "进行中",
  pending: "待开始"
};

const typeTextMap: Record<StructureTreeNode["type"], string> = {
  project: "项目",
  requirement: "需求",
  task: "任务"
};

const getStatusText = (status: StructureTreeNode["status"]) => {
  // 直接返回状态字符串，不再进行映射
  return status || "未知状态";
};

const getTypeText = (type: StructureTreeNode["type"]) =>
  typeTextMap[type] || type;

const getDialogTitle = () => {
  if (!selectedNode.value) return "节点详情";
  if (selectedNode.value.type === "requirement") return "需求详情";
  if (selectedNode.value.type === "task") return "任务详情";
  return "项目详情";
};

const expandAll = () => {
  const expand = (node: StructureTreeNode) => {
    node.expanded = true;
    node.children?.forEach(child => expand(child));
  };
  if (internalTree.value) expand(internalTree.value);
};

const collapseAll = () => {
  const collapse = (node: StructureTreeNode) => {
    node.expanded = false;
    node.children?.forEach(child => collapse(child));
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
    node: {
      type: Object as () => StructureTreeNode,
      required: true
    },
    level: {
      type: Number,
      required: true
    },
    selectedNodeRef: {
      type: Object as () => Ref<StructureTreeNode | null>,
      required: false
    }
  },
  emits: ["node-click"],
  setup(nodeProps, { emit: nodeEmit }) {
    const toggleExpand = () => {
      nodeProps.node.expanded = !nodeProps.node.expanded;
    };

    const onClick = () => {
      nodeEmit("node-click", nodeProps.node);
    };

    const isSelected = computed(() => {
      if (!nodeProps.selectedNodeRef) return false;
      const refValue = nodeProps.selectedNodeRef as any;
      return refValue?.value === nodeProps.node;
    });

    return () =>
      h("div", {
        class: [
          "tree-node",
          {
            "tree-node-level-0": nodeProps.level === 0,
            "tree-node-level-1": nodeProps.level === 1
          }
        ]
      }, [
        nodeProps.level > 0
          ? h("div", { class: "node-connector" })
          : null,
        h(
          "div",
          {
            class: ["node-content", { selected: isSelected.value }],
            "data-level": String(nodeProps.level), // 确保是字符串类型
            onClick
          },
          [
            h("div", { class: "node-title" }, [
              nodeProps.node.name,
              h("span", { class: "node-type" }, getTypeText(nodeProps.node.type))
            ]),
            h("div", { class: "node-details" }, [
              // 项目节点不显示状态
              nodeProps.node.type !== "project"
                ? h("span", {
                  class: ["status", `status-${encodeURIComponent(nodeProps.node.status).replace(/%/g, '')}`],
                  "data-status": nodeProps.node.status
                }, getStatusText(nodeProps.node.status))
                : null,
              // 显示进度（任务和需求）
              nodeProps.node.type !== "project" && nodeProps.node.progress !== undefined
                ? h("div", { class: "progress-wrapper" }, [
                  h("span", { class: "progress-label" }, "进度: "),
                  h(ElProgress, {
                    percentage: nodeProps.node.progress,
                    strokeWidth: 6,
                    showText: true,
                    format: (percentage: number) => `${percentage}%`,
                    style: { flex: 1, marginLeft: "8px" }
                  })
                ])
                : null,
              nodeProps.node.assignee
                ? h("span", { class: "assignee" }, `负责人: ${nodeProps.node.assignee}`)
                : null
            ]),
            nodeProps.node.children && nodeProps.node.children.length
              ? h(
                "div",
                {
                  class: "node-expand",
                  onClick: (event: MouseEvent) => {
                    event.stopPropagation();
                    toggleExpand();
                  }
                },
                nodeProps.node.expanded ? "−" : "+"
              )
              : null
          ]
        ),
        nodeProps.node.children &&
          nodeProps.node.children.length &&
          nodeProps.node.expanded
          ? h(
            "div",
            { class: "children" },
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

const treeNodeComponent = TreeNode;
</script>

<style lang="scss">
.structure-tree {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden; // 防止超出父容器

  .tree-wrapper {
    padding: 20px;
    background: #fff;
    border: 1px solid #e1e5e9;
    border-radius: 8px;
    overflow-y: auto;
    overflow-x: auto;
    flex: 1; // 占据剩余空间
    min-height: 200px;
    max-height: 800px; // 设置最大高度，超过时显示滚动条

    &::-webkit-scrollbar {
      width: 6px;
      height: 6px;
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
  }

  .controls {
    display: flex;
    justify-content: center;
    gap: 12px;
    margin-top: 16px;
    padding: 8px 0;
  }

  .selected-info {
    margin-top: 16px;
    padding: 16px;
    border: 1px solid #e1e5e9;
    border-radius: 8px;
    background: #f8fbfe;

    h4 {
      margin: 0 0 12px 0;
      font-size: 16px;
      font-weight: 600;
      color: #2c3e50;
    }

    p {
      margin: 6px 0;
      font-size: 14px;
      color: #606266;
      line-height: 1.6;

      strong {
        color: #303133;
        margin-right: 8px;
      }
    }

    .describe-content {
      max-height: 300px;
      overflow-y: auto;
      padding: 8px;
      background: #fafafa;
      border-radius: 4px;

      p {
        margin: 4px 0;
        white-space: pre-wrap;
        word-wrap: break-word;
      }
    }

    .attachment-item {
      margin: 4px 0;

      a {
        color: #409eff;
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    .history-list {
      max-height: 300px;
      overflow-y: auto;
      padding: 8px;
      background: #fafafa;
      border-radius: 4px;

      .history-item {
        padding: 6px 0;
        border-bottom: 1px solid #e4e7ed;
        font-size: 13px;
        color: #606266;
        line-height: 1.5;

        &:last-child {
          border-bottom: none;
        }
      }
    }
  }
}

.structure-tree {
  .tree-node {
    display: flex;
    align-items: flex-start;
    position: relative;
    margin-bottom: 12px;
    width: 100%;
    max-width: 100%;

    // 项目节点（level 0）需要垂直居中，相对于其子需求节点
    &.tree-node-level-0 {
      align-items: center;
    }

    // 需求节点（level 1）需要垂直居中，相对于其子任务节点
    &.tree-node-level-1 {
      align-items: center;
    }
  }

  .node-connector {
    position: absolute;
    left: -15px;
    top: 50%;
    width: 15px;
    height: 1px;
    background: #d1d8e0;
    z-index: 1;
  }

  .node-content {
    position: relative;
    border: 1px solid #e1e5e9;
    border-radius: 6px;
    padding: 12px 18px;
    background: #fff;
    cursor: pointer;
    transition: all 0.2s ease;
    box-sizing: border-box;
    flex-shrink: 0; // 防止被压缩

    // 根据层级限制宽度 - 使用固定宽度确保各层级一致
    &[data-level="0"] {
      width: 400px !important; // 固定宽度
      min-width: 200px;
      max-width: 400px;
    }

    &[data-level="1"] {
      width: 400px !important; // 固定宽度
      min-width: 200px;
      max-width: 400px;
    }

    &[data-level="2"] {
      width: 400px !important; // 固定宽度
      min-width: 200px;
      max-width: 400px;
    }

    &:hover {
      border-color: #3498db;
      box-shadow: 0 2px 8px rgba(52, 152, 219, 0.1);
      transform: translateY(-1px);
    }

    &.selected {
      border-color: #3498db;
      background: #f8fbfe;
      box-shadow: 0 2px 12px rgba(52, 152, 219, 0.15);
    }
  }

  .node-title {
    font-weight: 600;
    font-size: 15px;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
    color: #303133;
  }

  .node-type {
    display: inline-block;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 3px;
    background: #f1f2f6;
    color: #555;
    font-weight: 500;
  }

  .node-details {
    font-size: 13px;
    color: #666;
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 4px;

    .progress-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 4px;
      width: 100%;

      .progress-label {
        font-size: 12px;
        color: #909399;
        white-space: nowrap;
        flex-shrink: 0;
      }

      // 确保进度条和百分比都能正确显示
      :deep(.el-progress) {
        flex: 1;
        min-width: 0;
      }

      :deep(.el-progress__text) {
        font-size: 12px;
        color: #606266;
        margin-left: 8px;
      }
    }
  }

  .assignee {
    font-size: 12px;
    color: #888;
    margin-top: 4px;
  }

  .children {
    display: flex;
    flex-direction: column;
    margin-left: 40px;
    position: relative;
    padding-left: 15px;
    border-left: 1px dashed #d1d8e0;
  }

  .node-expand {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 20px;
    height: 20px;
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 14px;
    color: #7f8c8d;
    background: #f8f9fa;
    border: 1px solid #e1e5e9;
    transition: all 0.2s ease;
    user-select: none;

    &:hover {
      background: #e9ecef;
      border-color: #c0c4cc;
      color: #409eff;
    }
  }

  .status {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 3px;
    font-size: 11px;
    font-weight: 500;
    margin-right: 8px;
    background: #f8f9fa;
    color: #606266;

    // 根据data-status属性设置样式
    &[data-status*="已完成"],
    &[data-status*="完成"],
    &[data-status*="审阅完毕"],
    &[data-status*="测试完毕"] {
      background: #e8f6ef;
      color: #27ae60;
    }

    &[data-status*="进行中"],
    &[data-status*="测试中"],
    &[data-status*="审阅中"],
    &[data-status*="待测试"],
    &[data-status*="待审阅"] {
      background: #fef9e7;
      color: #f39c12;
    }

    &[data-status*="待指派"],
    &[data-status*="未开始"],
    &[data-status*="已取消"] {
      background: #f8f9fa;
      color: #7f8c8d;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .structure-tree {
    .tree-wrapper {
      padding: 15px;
    }
  }

  .node-content {
    min-width: 160px;
    padding: 10px 14px;
  }

  .children {
    margin-left: 30px;
    padding-left: 10px;
  }

  .node-connector {
    left: -10px;
    width: 10px;
  }
}
</style>
