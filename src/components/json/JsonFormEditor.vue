<template>
  <div class="json-form-editor">
    <el-tabs v-model="activeTab" type="card">
      <el-tab-pane label="分辨率相关配置" name="resolution">
        <div class="form-container">
          <!-- 分辨率 -->
          <div class="basic-info">
            <el-form-item label="分辨率" class="single-form-item">
              <el-input v-model="resolutionData.分辨率" placeholder="请输入分辨率" />
            </el-form-item>
          </div>

          <!-- 语言库 -->
          <div class="section">
            <div class="section-header">
              <h3>语言库</h3>
              <el-button 
                type="text" 
                @click="toggleCollapse('languageLib')"
                class="collapse-button"
              >
                <el-icon>
                  <ArrowDown v-if="collapseStates.languageLib" />
                  <ArrowRight v-else />
                </el-icon>
                {{ collapseStates.languageLib ? '收起' : '展开' }}
              </el-button>
            </div>
            <div v-show="collapseStates.languageLib" class="section-content">
            <div class="language-tips">
              <el-alert 
                title="支持的语言" 
                type="info" 
                :closable="false"
                show-icon>
                <template #default>
                  <div class="language-list">
                    <el-tag 
                      v-for="lang in supportedLanguages" 
                      :key="lang" 
                      size="small" 
                      class="language-tag"
                      @click="copyLanguage(lang)">
                      {{ lang }}
                    </el-tag>
                  </div>
                </template>
              </el-alert>
            </div>
            <div v-for="(lib, index) in resolutionData.语言库" :key="`lang-${index}`" class="form-item-group">
              <el-card>
                <template #header>
                  <div class="card-header">
                    <span>语言库 {{ index + 1 }}</span>
                    <el-button type="danger" size="small" @click="removeLanguageLib(index)">删除</el-button>
                  </div>
                </template>
                <div class="form-grid">
                  <el-form-item label="库名">
                    <el-input v-model="lib.库名" placeholder="请输入库名" />
                  </el-form-item>
                  <el-form-item label="支持语言">
                    <el-input v-model="lib.支持语言" placeholder="请输入支持语言" />
                  </el-form-item>
                  <el-form-item label="Size">
                    <el-input v-model="lib.size" placeholder="请输入大小">
                      <template #suffix></template>
                    </el-input>
                  </el-form-item>
                </div>
              </el-card>
              </div>
              <div class="section-add-button">
                <el-button type="primary" @click="addLanguageLib">添加语言库</el-button>
              </div>
            </div>
          </div>

          <!-- 开关机logo -->
          <div class="section">
            <div class="section-header">
              <h3>开关机Logo</h3>
              <el-button 
                type="text" 
                @click="toggleCollapse('bootLogo')"
                class="collapse-button"
              >
                <el-icon>
                  <ArrowDown v-if="collapseStates.bootLogo" />
                  <ArrowRight v-else />
                </el-icon>
                {{ collapseStates.bootLogo ? '收起' : '展开' }}
              </el-button>
            </div>
            <div v-show="collapseStates.bootLogo" class="section-content">
            <div v-for="(logo, index) in resolutionData.开关机logo" :key="`logo-${index}`" class="form-item-group">
              <el-card>
                <template #header>
                  <div class="card-header">
                    <span>Logo {{ index + 1 }}</span>
                    <el-button type="danger" size="small" @click="removeBootLogo(index)">删除</el-button>
                  </div>
                </template>
                <div class="form-grid">
                  <el-form-item label="图片名">
                    <el-input v-model="logo.图片名" placeholder="请输入图片名" />
                  </el-form-item>
                  <el-form-item label="图片类型">
                    <el-select v-model="logo.图片类型" placeholder="请选择图片类型">
                      <el-option label="jpg" value="jpg" />
                      <el-option label="png" value="png" />
                      <el-option label="bmp" value="bmp" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="Size">
                    <el-input v-model="logo.size" placeholder="请输入大小">
                      <template #suffix></template>
                    </el-input>
                  </el-form-item>
                </div>
              </el-card>
              </div>
              <div class="section-add-button">
                <el-button type="primary" @click="addBootLogo">添加Logo</el-button>
              </div>
            </div>
          </div>

          <!-- 主菜单 -->
          <div class="section">
            <div class="section-header">
              <h3>主菜单</h3>
              <el-button 
                type="text" 
                @click="toggleCollapse('mainMenu')"
                class="collapse-button"
              >
                <el-icon>
                  <ArrowDown v-if="collapseStates.mainMenu" />
                  <ArrowRight v-else />
                </el-icon>
                {{ collapseStates.mainMenu ? '收起' : '展开' }}
              </el-button>
            </div>
            <div v-show="collapseStates.mainMenu" class="section-content">
            <div v-for="(menu, index) in resolutionData.主菜单" :key="`menu-${index}`" class="form-item-group">
              <el-card>
                <template #header>
                  <div class="card-header">
                    <span>主菜单 {{ index + 1 }}</span>
                    <el-button type="danger" size="small" @click="removeMainMenu(index)">删除</el-button>
                  </div>
                </template>
                <div class="form-grid">
                  <el-form-item label="主菜单类型">
                    <el-input v-model="menu.主菜单类型" placeholder="请输入主菜单类型" />
                  </el-form-item>
                  <el-form-item label="图片类型">
                    <el-select v-model="menu.图片类型" placeholder="请选择图片类型">
                      <el-option label="jpg" value="jpg" />
                      <el-option label="png" value="png" />
                      <el-option label="bmp" value="bmp" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="Size">
                    <el-input v-model="menu.size" placeholder="请输入大小">
                      <template #suffix>KB</template>
                    </el-input>
                  </el-form-item>
                </div>
              </el-card>
              </div>
              <div class="section-add-button">
                <el-button type="primary" @click="addMainMenu">添加主菜单</el-button>
              </div>
            </div>
          </div>

          <!-- 表盘 -->
          <div class="section">
            <div class="section-header">
              <h3>表盘</h3>
              <el-button 
                type="text" 
                @click="toggleCollapse('watchFace')"
                class="collapse-button"
              >
                <el-icon>
                  <ArrowDown v-if="collapseStates.watchFace" />
                  <ArrowRight v-else />
                </el-icon>
                {{ collapseStates.watchFace ? '收起' : '展开' }}
              </el-button>
            </div>
            <div v-show="collapseStates.watchFace" class="section-content">
            <div v-for="(face, index) in resolutionData.表盘" :key="`face-${index}`" class="form-item-group">
              <el-card>
                <template #header>
                  <div class="card-header">
                    <span>表盘 {{ index + 1 }}</span>
                    <el-button type="danger" size="small" @click="removeWatchFace(index)">删除</el-button>
                  </div>
                </template>
                <div class="form-grid form-grid-4">
                  <el-form-item label="表盘名">
                    <el-input v-model="face.表盘名" placeholder="请输入表盘名" />
                  </el-form-item>
                  <el-form-item label="图片类型">
                    <el-select v-model="face.图片类型" placeholder="请选择图片类型">
                      <el-option label="jpg" value="jpg" />
                      <el-option label="png" value="png" />
                      <el-option label="bmp" value="bmp" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="图片Size">
                    <el-input v-model="face.imgSize" placeholder="请输入图片大小">
                      <template #suffix>KB</template>
                    </el-input>
                  </el-form-item>
                  <el-form-item label="代码Size">
                    <el-input v-model="face.codeSize" placeholder="请输入代码大小">
                      <template #suffix>KB</template>
                    </el-input>
                  </el-form-item>
                </div>
              </el-card>
              </div>
              <div class="section-add-button">
                <el-button type="primary" @click="addWatchFace">添加表盘</el-button>
              </div>
            </div>
          </div>

          <!-- 软件 -->
          <div class="section">
            <div class="section-header">
              <h3>软件</h3>
              <el-button 
                type="text" 
                @click="toggleCollapse('software')"
                class="collapse-button"
              >
                <el-icon>
                  <ArrowDown v-if="collapseStates.software" />
                  <ArrowRight v-else />
                </el-icon>
                {{ collapseStates.software ? '收起' : '展开' }}
              </el-button>
            </div>
            <div v-show="collapseStates.software" class="section-content">
            <div v-for="(software, index) in resolutionData.软件" :key="`software-${index}`" class="form-item-group">
              <el-card>
                <template #header>
                  <div class="card-header">
                  </div>
                </template>
                <div class="form-grid form-grid-2">
                  <el-form-item label="">
                    <el-input v-model="software.软件名" placeholder="请输入软件名" />
                  </el-form-item>
                  <el-form-item label="">
                    <el-select v-model="software.图片类型" placeholder="请选择图片类型">
                      <el-option label="jpg" value="jpg" />
                      <el-option label="png" value="png" />
                      <el-option label="bmp" value="bmp" />
                    </el-select>
                  </el-form-item>
                </div>
                <div class="form-grid form-grid-3">
                  <el-form-item label="">
                    <el-input v-model="software.imgSize" placeholder="请输入图片大小">
                      <template #suffix>KB</template>
                    </el-input>
                  </el-form-item>
                  <el-form-item label="">
                    <el-input v-model="software.codeSize" placeholder="请输入代码大小">
                      <template #suffix>KB</template>
                    </el-input>
                  </el-form-item>
                  <el-form-item label="">
                    <el-button type="danger" size="small" @click="removeSoftware(index)">删除</el-button>
                  </el-form-item>
                </div>
              </el-card>
              </div>
              <div class="section-add-button">
                <el-button type="primary" @click="addSoftware">添加软件</el-button>
              </div>
            </div>
          </div>

          <!-- 系统功能 -->
          <div class="section">
            <div class="section-header">
              <h3>系统功能</h3>
              <el-button 
                type="text" 
                @click="toggleCollapse('systemFunction')"
                class="collapse-button"
              >
                <el-icon>
                  <ArrowDown v-if="collapseStates.systemFunction" />
                  <ArrowRight v-else />
                </el-icon>
                {{ collapseStates.systemFunction ? '收起' : '展开' }}
              </el-button>
            </div>
            <div v-show="collapseStates.systemFunction" class="section-content">
            <div v-for="(func, funcIndex) in resolutionData.系统功能" :key="`func-${funcIndex}`" class="form-item-group">
              <el-card>
                <template #header>
                  <div class="card-header">
                  </div>
                </template>
                <div class="form-grid form-grid-3">
                  <el-form-item label="">
                    <el-input v-model="func.功能" placeholder="请输入功能名称" />
                  </el-form-item>
                  <el-form-item label="">
                    <el-input v-model="func.codeSize" placeholder="请输入代码大小">
                      <template #suffix>KB</template>
                    </el-input>
                  </el-form-item>
                  <el-form-item label="">
                    <el-button type="danger" size="small" @click="removeSystemFunction(funcIndex)">删除</el-button>
                  </el-form-item>
                </div>
                
                <!-- 风格字段 - 支持多个风格项 -->
                <div v-for="(style, styleIndex) in func.风格" :key="`style-${funcIndex}-${styleIndex}`" class="style-item">
                  <div class="form-grid form-grid-4">
                    <el-form-item label="">
                      <el-input v-model="style.风格名" placeholder="请输入风格名" />
                    </el-form-item>
                    <el-form-item label="">
                      <el-select v-model="style.图片格式" placeholder="请选择图片格式">
                        <el-option label="jpg" value="jpg" />
                        <el-option label="png" value="png" />
                        <el-option label="bmp" value="bmp" />
                      </el-select>
                    </el-form-item>
                    <el-form-item label="">
                      <el-input v-model="style.size" placeholder="请输入风格大小">
                        <template #suffix>KB</template>
                      </el-input>
                    </el-form-item>
                    <el-form-item label="">
                      <el-button 
                        type="danger" 
                        size="small" 
                        @click="removeStyle(funcIndex, styleIndex)"
                      >
                        删除
                      </el-button>
                    </el-form-item>
                  </div>
                </div>
                <!-- 添加风格按钮 - 与添加系统功能按钮位置一致 -->
                <div class="style-add-button">
                  <el-button type="primary" @click="addStyle(funcIndex)">添加风格</el-button>
                </div>
              </el-card>
              </div>
              <div class="section-add-button">
                <el-button type="primary" @click="addSystemFunction">添加系统功能</el-button>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="平台相关配置" name="platform">
        <div class="form-container">
          <!-- 平台基本信息 -->
          <div class="section">
            <div class="section-header">
              <h3>平台基本信息</h3>
              <el-button 
                type="text" 
                @click="toggleCollapse('platformInfo')"
                class="collapse-button"
              >
                <el-icon>
                  <ArrowDown v-if="collapseStates.platformInfo" />
                  <ArrowRight v-else />
                </el-icon>
                {{ collapseStates.platformInfo ? '收起' : '展开' }}
              </el-button>
            </div>
            <div v-show="collapseStates.platformInfo" class="section-content">
          <div class="basic-info">
            <div class="form-grid form-grid-2">
              <el-form-item label="平台">
                <el-input v-model="platformData.平台" placeholder="请输入平台" />
              </el-form-item>
              <el-form-item label="系统内核">
                    <el-input v-model="platformData.系统内核" placeholder="请输入系统内核">
                      <template #suffix>KB</template>
                    </el-input>
              </el-form-item>
                </div>
              </div>
            </div>
          </div>

          <!-- TP快捷4方向 -->
          <div v-for="(direction, directionKey) in platformData.TP快捷4方向" :key="directionKey" class="section">
            <div class="section-header">
              <h3>TP快捷4方向 - {{ directionKey }}</h3>
              <el-button 
                type="text" 
                @click="toggleCollapse('tpDirections')"
                class="collapse-button"
              >
                <el-icon>
                  <ArrowDown v-if="collapseStates.tpDirections" />
                  <ArrowRight v-else />
                </el-icon>
                {{ collapseStates.tpDirections ? '收起' : '展开' }}
              </el-button>
            </div>
            <div v-show="collapseStates.tpDirections" class="section-content">
            <div v-for="(item, index) in direction" :key="`tp-${directionKey}-${index}`" class="form-item-group">
              <el-card>
                <template #header>
                  <div class="card-header">
                    <span>{{ directionKey }} {{ index + 1 }}</span>
                    <el-button type="danger" size="small" @click="removeTPDirection(directionKey, index)">删除</el-button>
                  </div>
                </template>
                <div class="form-grid">
                  <el-form-item label="宏名">
                    <el-input v-model="item.宏名" placeholder="请输入宏名" />
                  </el-form-item>
                  <el-form-item label="宏功能">
                    <el-input v-model="item.宏功能" placeholder="请输入宏功能" />
                  </el-form-item>
                  <el-form-item label="Size">
                    <el-input v-model="item.size" placeholder="请输入大小">
                      <template #suffix>KB</template>
                    </el-input>
                  </el-form-item>
                </div>
              </el-card>
              </div>
              <div class="section-add-button">
                <el-button type="primary" @click="addTPDirection(directionKey)">添加配置</el-button>
              </div>
            </div>
          </div>

          <!-- 按键 -->
          <div v-for="(keyType, keyTypeName) in platformData.按键" :key="keyTypeName" class="key-type-wrapper">
            <div v-for="(actionType, actionName) in keyType" :key="actionName" class="section">
              <div class="section-header">
                <h3>{{ keyTypeName }} - {{ actionName }}</h3>
                <el-button 
                  type="text" 
                  @click="toggleCollapse('keyActions')"
                  class="collapse-button"
                >
                  <el-icon>
                    <ArrowDown v-if="collapseStates.keyActions" />
                    <ArrowRight v-else />
                  </el-icon>
                  {{ collapseStates.keyActions ? '收起' : '展开' }}
                </el-button>
              </div>
              <div v-show="collapseStates.keyActions" class="section-content">
              <div v-for="(item, index) in actionType" :key="`key-${keyTypeName}-${actionName}-${index}`" class="form-item-group">
                <el-card>
                  <template #header>
                    <div class="card-header">
                      <span>{{ actionName }} {{ index + 1 }}</span>
                      <el-button type="danger" size="small" @click="removeKeyAction(keyTypeName, actionName, index)">删除</el-button>
                    </div>
                  </template>
                  <div class="form-grid">
                    <el-form-item label="宏名">
                      <el-input v-model="item.宏名" placeholder="请输入宏名" />
                    </el-form-item>
                    <el-form-item label="宏功能">
                      <el-input v-model="item.宏功能" placeholder="请输入宏功能" />
                    </el-form-item>
                    <el-form-item label="Size">
                      <el-input v-model="item.size" placeholder="请输入大小" />
                    </el-form-item>
                  </div>
                </el-card>
                </div>
                <div class="section-add-button">
                  <el-button type="primary" @click="addKeyAction(keyTypeName, actionName)">添加配置</el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <el-button type="warning" @click="saveData">保存数据</el-button>
      <el-button type="success" @click="exportData">导出JSON</el-button>
      <el-button type="primary" @click="importData">导入JSON</el-button>
      <el-button @click="resetData">重置数据</el-button>
    </div>

    <!-- 回到顶部按钮 -->
    <el-backtop 
      :right="40" 
      :bottom="40"
      :visibility-height="300"
      class="back-to-top"
    >
      <div class="back-to-top-content">
        <el-icon><Top /></el-icon>
        <span>回到顶部</span>
      </div>
    </el-backtop>

    <!-- 导入对话框 -->
    <el-dialog v-model="importDialogVisible" title="导入JSON数据" width="60%">
      <el-tabs v-model="importTab">
        <el-tab-pane label="文件上传" name="file">
          <div class="import-file-section">
            <el-upload
              class="upload-demo"
              drag
              :auto-upload="false"
              :on-change="handleFileUpload"
              accept=".json"
              :show-file-list="false"
            >
              <el-icon class="el-icon--upload"><upload-filled /></el-icon>
              <div class="el-upload__text">
                将JSON文件拖到此处，或<em>点击上传</em>
              </div>
              <template #tip>
                <div class="el-upload__tip">
                  只能上传JSON文件，且不超过10MB
                </div>
              </template>
            </el-upload>
          </div>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button 
          v-if="importTab === 'manual'" 
          type="primary" 
          @click="confirmImport"
        >
          确认导入
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled, ArrowDown, ArrowRight, Top } from '@element-plus/icons-vue'
import axios from 'axios'

// 活动标签页
const activeTab = ref('resolution')

// 收缩展开状态管理
const collapseStates = reactive({
  // 分辨率相关模块
  languageLib: true,      // 语言库
  bootLogo: true,         // 开关机logo
  mainMenu: true,         // 主菜单
  watchFace: true,        // 表盘
  software: true,         // 软件
  systemFunction: true,   // 系统功能
  
  // 平台相关模块
  platformInfo: true,     // 平台基本信息
  tpDirections: true,     // TP快捷4方向
  keyActions: true        // 按键操作
})

// 切换收缩展开状态
const toggleCollapse = (moduleName) => {
  collapseStates[moduleName] = !collapseStates[moduleName]
}

// 支持的语言列表
const supportedLanguages = [
  '英语', '简体中文', '繁体中文', '法语', '西班牙语', '波兰语', '葡萄牙语', 
  '意大利语', '德语', '荷兰语', '土耳其语', '俄语', '捷克语', '波斯语', 
  '匈牙利语', '希腊语', '阿拉伯语', '菲律宾语', '马来语', '印度尼西亚语', 
  '越南语', '泰语', '缅甸语', '印地语', '韩语', '日语', '瑞典语', 
  '希伯来语', '芬兰语', '乌克兰语', '克罗地亚语', '柬埔寨语', '保加利亚语', 
  '罗马尼亚语', '斯洛文尼亚语', '丹麦语'
]

// 分辨率相关数据
const resolutionData = reactive({
  "分辨率": "360X360",
  "语言库": [
    {
      "库名": "24",
      "支持语言": "简体中文,英语",
      "size": ""
    }
  ],
  "开关机logo": [
    {
      "图片名": "hello",
      "图片类型": "jpg",
      "size": ""
    }
  ],
  "主菜单": [
    {
      "主菜单类型": "",
      "图片类型": "jpg",
      "size": "5-9"
    }
  ],
  "表盘": [
    {
      "表盘名": "满天星",
      "图片类型": "jpg",
      "imgSize": "",
      "codeSize": ""
    }
  ],
  "软件": [
    {
      "软件名": "心率",
      "codeSize": "",
      "图片类型": "",
      "imgSize": ""
    }
  ],
  "系统功能": [
    {
      "功能": "拨号",
      "codeSize": "",
      "风格": [
        {
          "风格名": "拨号1",
          "图片格式": "",
          "size": ""
        }
      ]
    },
    {
      "功能": "电话簿",
      "codeSize": "",
      "风格": [
        {
          "风格名": "电话簿1",
          "图片格式": "jpg",
          "size": ""
        }
      ]
    }
  ]
})

// 平台相关数据
const platformData = reactive({
  "平台": "AB5682B",
  "系统内核": "",
  "TP快捷4方向": {
    "上拉": [
      {
        "宏名": "",
        "宏功能": "",
        "size": ""
      }
    ],
    "下拉": [
      {
        "宏名": "",
        "宏功能": "",
        "size": ""
      }
    ],
    "从上往下拉": [
      {
        "宏名": "",
        "宏功能": "",
        "size": ""
      }
    ],
    "从下往上拉": [
      {
        "宏名": "",
        "宏功能": "",
        "size": ""
      }
    ],
    "左右滑": [
      {
        "宏名": "",
        "宏功能": "",
        "size": ""
      }
    ],
    "左滑": [
      {
        "宏名": "",
        "宏功能": "",
        "size": ""
      }
    ],
    "右滑": [
      {
        "宏名": "",
        "宏功能": "",
        "size": ""
      }
    ],
    "从左侧边拉": [
      {
        "宏名": "",
        "宏功能": "",
        "size": ""
      }
    ],
    "侧边左滑": [
      {
        "宏名": "",
        "宏功能": "",
        "size": ""
      }
    ],
    "侧边右滑": [
      {
        "宏名": "",
        "宏功能": "",
        "size": ""
      }
    ],
    "表盘预览": [
      {
        "宏名": "",
        "宏功能": "",
        "size": ""
      }
    ],
    "设置": [
      {
        "宏名": "",
        "宏功能": "",
        "size": ""
      }
    ]
  },
  "按键": {
    "Power按键": {
      "单击": [
        {
          "宏名": "",
          "宏功能": "",
          "size": ""
        }
      ],
      "双击": [
        {
          "宏名": "",
          "宏功能": "",
          "size": ""
        }
      ],
      "长按": [
        {
          "宏名": "",
          "宏功能": "",
          "size": ""
        }
      ]
    },
    "编码器按键": {
      "单击": [
        {
          "宏名": "",
          "宏功能": "",
          "size": ""
        }
      ],
      "双击": [
        {
          "宏名": "",
          "宏功能": "",
          "size": ""
        }
      ],
      "长按": [
        {
          "宏名": "",
          "宏功能": "",
          "size": ""
        }
      ],
      "编码器": [
        {
          "宏名": "",
          "宏功能": "",
          "size": ""
        }
      ]
    },
    "功能键": {
      "单击": [
        {
          "宏名": "",
          "宏功能": "",
          "size": ""
        }
      ],
      "双击": [
        {
          "宏名": "",
          "宏功能": "",
          "size": ""
        }
      ],
      "长按": [
        {
          "宏名": "",
          "宏功能": "",
          "size": ""
        }
      ]
    },
    "侧键": {
      "单击": [
        {
          "宏名": "",
          "宏功能": "",
          "size": ""
        }
      ],
      "双击": [
        {
          "宏名": "",
          "宏功能": "",
          "size": ""
        }
      ],
      "长按": [
        {
          "宏名": "",
          "宏功能": "",
          "size": ""
        }
      ]
    },
    "运动侧键": {
      "单击": [
        {
          "宏名": "",
          "宏功能": "",
          "size": ""
        }
      ],
      "双击": [
        {
          "宏名": "",
          "宏功能": "",
          "size": ""
        }
      ],
      "长按": [
        {
          "宏名": "",
          "宏功能": "",
          "size": ""
        }
      ]
    }
  }
})

// 导入对话框
const importDialogVisible = ref(false)
const importTab = ref('file')
const manualImportTab = ref('resolution')
const importResolutionText = ref('')
const importPlatformText = ref('')

// 数据预览对话框


// 分辨率相关操作方法
const addLanguageLib = () => {
  resolutionData.语言库.push({
    "库名": "",
    "支持语言": "",
    "size": ""
  })
}

const removeLanguageLib = (index) => {
  resolutionData.语言库.splice(index, 1)
}

const addBootLogo = () => {
  resolutionData.开关机logo.push({
    "图片名": "",
    "图片类型": "jpg",
    "size": ""
  })
}

const removeBootLogo = (index) => {
  resolutionData.开关机logo.splice(index, 1)
}

const addMainMenu = () => {
  resolutionData.主菜单.push({
    "主菜单类型": "",
    "图片类型": "jpg",
    "size": ""
  })
}

const removeMainMenu = (index) => {
  resolutionData.主菜单.splice(index, 1)
}

const addWatchFace = () => {
  resolutionData.表盘.push({
    "表盘名": "",
    "图片类型": "jpg",
    "imgSize": "",
    "codeSize": ""
  })
}

const removeWatchFace = (index) => {
  resolutionData.表盘.splice(index, 1)
}

const addSoftware = () => {
  resolutionData.软件.push({
    "软件名": "",
    "codeSize": "",
    "图片类型": "",
    "imgSize": ""
  })
}

const removeSoftware = (index) => {
  resolutionData.软件.splice(index, 1)
}

const addSystemFunction = () => {
  resolutionData.系统功能.push({
    "功能": "",
    "codeSize": "",
    "风格": [
      {
        "风格名": "",
        "图片格式": "",
        "size": ""
      }
    ]
  })
}

const removeSystemFunction = (index) => {
  resolutionData.系统功能.splice(index, 1)
}

const addStyle = (funcIndex) => {
  resolutionData.系统功能[funcIndex].风格.push({
    "风格名": "",
    "图片格式": "",
    "size": ""
  })
}

const removeStyle = (funcIndex, styleIndex) => {
  resolutionData.系统功能[funcIndex].风格.splice(styleIndex, 1)
}

// 平台相关操作方法
const addTPDirection = (directionKey) => {
  platformData.TP快捷4方向[directionKey].push({
    "宏名": "",
    "宏功能": "",
    "size": ""
  })
}

const removeTPDirection = (directionKey, index) => {
  platformData.TP快捷4方向[directionKey].splice(index, 1)
}

const addKeyAction = (keyTypeName, actionName) => {
  platformData.按键[keyTypeName][actionName].push({
    "宏名": "",
    "宏功能": "",
    "size": ""
  })
}

const removeKeyAction = (keyTypeName, actionName, index) => {
  platformData.按键[keyTypeName][actionName].splice(index, 1)
}
// API 基础地址 - 使用代理路径避免CORS问题
const baseApiUrl = '/api/upload_data'

// 为size字段添加KB后缀的函数
const addKBSuffix = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj
  
  const processed = Array.isArray(obj) ? [] : {}
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (key === 'size' || key === 'imgSize' || key === 'codeSize' || key === '系统内核') {
        // 为size相关字段和系统内核添加KB后缀
        processed[key] = obj[key] ? `${obj[key]}KB` : ''
      } else if (typeof obj[key] === 'object') {
        // 递归处理嵌套对象
        processed[key] = addKBSuffix(obj[key])
      } else {
        processed[key] = obj[key]
      }
    }
  }
  
  return processed
}

// 清空所有表单数据的函数
const clearAllData = () => {
  // 重置分辨率相关数据
  Object.assign(resolutionData, {
    "分辨率": "360X360",
    "语言库": [
      {
        "库名": "",
        "支持语言": "",
        "size": ""
      }
    ],
    "开关机logo": [
      {
        "图片名": "",
        "图片类型": "jpg",
        "size": ""
      }
    ],
    "主菜单": [
      {
        "主菜单类型": "",
        "图片类型": "jpg",
        "size": ""
      }
    ],
    "表盘": [
      {
        "表盘名": "",
        "图片类型": "jpg",
        "imgSize": "",
        "codeSize": ""
      }
    ],
    "软件": [
      {
        "软件名": "",
        "codeSize": "",
        "图片类型": "",
        "imgSize": ""
      }
    ],
    "系统功能": [
      {
        "功能": "",
        "codeSize": "",
        "风格": [
          {
            "风格名": "",
            "图片格式": "",
            "size": ""
          }
        ]
      }
    ]
  })

  // 重置平台相关数据
  Object.assign(platformData, {
    "平台": "AB5682B",
    "系统内核": "",
    "TP快捷4方向": {
      "上拉": [{"宏名": "", "宏功能": "", "size": ""}],
      "下拉": [{"宏名": "", "宏功能": "", "size": ""}],
      "从上往下拉": [{"宏名": "", "宏功能": "", "size": ""}],
      "从下往上拉": [{"宏名": "", "宏功能": "", "size": ""}],
      "左右滑": [{"宏名": "", "宏功能": "", "size": ""}],
      "左滑": [{"宏名": "", "宏功能": "", "size": ""}],
      "右滑": [{"宏名": "", "宏功能": "", "size": ""}],
      "从左侧边拉": [{"宏名": "", "宏功能": "", "size": ""}],
      "侧边左滑": [{"宏名": "", "宏功能": "", "size": ""}],
      "侧边右滑": [{"宏名": "", "宏功能": "", "size": ""}],
      "表盘预览": [{"宏名": "", "宏功能": "", "size": ""}],
      "设置": [{"宏名": "", "宏功能": "", "size": ""}]
    },
    "按键": {
      "Power按键": {
        "单击": [{"宏名": "", "宏功能": "", "size": ""}],
        "双击": [{"宏名": "", "宏功能": "", "size": ""}],
        "长按": [{"宏名": "", "宏功能": "", "size": ""}]
      },
      "编码器按键": {
        "单击": [{"宏名": "", "宏功能": "", "size": ""}],
        "双击": [{"宏名": "", "宏功能": "", "size": ""}],
        "长按": [{"宏名": "", "宏功能": "", "size": ""}],
        "编码器": [{"宏名": "", "宏功能": "", "size": ""}]
      },
      "功能键": {
        "单击": [{"宏名": "", "宏功能": "", "size": ""}],
        "双击": [{"宏名": "", "宏功能": "", "size": ""}],
        "长按": [{"宏名": "", "宏功能": "", "size": ""}]
      },
      "侧键": {
        "单击": [{"宏名": "", "宏功能": "", "size": ""}],
        "双击": [{"宏名": "", "宏功能": "", "size": ""}],
        "长按": [{"宏名": "", "宏功能": "", "size": ""}]
      },
      "运动侧键": {
        "单击": [{"宏名": "", "宏功能": "", "size": ""}],
        "双击": [{"宏名": "", "宏功能": "", "size": ""}],
        "长按": [{"宏名": "", "宏功能": "", "size": ""}]
      }
    }
  })
}

// 数据操作方法
const saveData = async () => {
  const data = {
    resolution: resolutionData,
    platform: platformData,
    timestamp: new Date().toLocaleString('zh-CN'),
    activeTab: activeTab.value
  }
  
  // 根据当前tab决定API和数据格式
  let apiUrl = ''
  let requestData = {}
  
  if (activeTab.value === 'resolution') {
    // 分辨率相关配置
    apiUrl = `${baseApiUrl}` // API 1 用于分辨率配置
    requestData = {
      "json_type": "Resolution",
      "data": addKBSuffix(data.resolution)
    }
  } else {
    // 平台相关配置
    apiUrl = `${baseApiUrl}` // API 2 用于平台配置
    requestData = {
      "json_type": "MCU", 
      "data": addKBSuffix(data.platform)
    }
  }
  
  
  try {
    const response = await axios.post(apiUrl, requestData, {
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
    ElMessage.success(`${activeTab.value === 'resolution' ? '分辨率' : '平台'}相关配置保存成功！`)
    
    // 保存成功后清空所有表单数据
    clearAllData()
  } catch (error) {
    ElMessage.error('数据保存失败：' + (error.response?.data?.message || error.message))
  }
}

const exportData = () => {
  const data = {
    resolution: resolutionData,
    platform: platformData
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'config-data.json'
  a.click()
  URL.revokeObjectURL(url)
  
  ElMessage.success('数据导出成功！')
}

const importData = () => {
  importDialogVisible.value = true
}

// 处理文件上传的函数
const handleFileUpload = (file) => {
  if (!file) return
  
  if (file.raw && file.raw.type !== 'application/json') {
    ElMessage.error('请选择JSON文件！')
    return
  }
  
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const jsonData = JSON.parse(e.target.result)
      parseAndFillForm(jsonData)
      ElMessage.success('JSON文件导入成功！')
    } catch (error) {
      console.error('JSON解析错误:', error)
      ElMessage.error('JSON文件格式错误，请检查文件内容！')
    }
  }
  reader.readAsText(file.raw || file)
}

// 解析JSON数据并填充表单的函数
const parseAndFillForm = (jsonData) => {
  try {
    // 判断是分辨率相关还是平台相关数据
    if (jsonData.分辨率 || jsonData.语言库 || jsonData.开关机logo) {
      // 分辨率相关数据
      fillResolutionData(jsonData)
      activeTab.value = 'resolution'
    } else if (jsonData.平台 || jsonData.TP快捷4方向 || jsonData.按键) {
      // 平台相关数据
      fillPlatformData(jsonData)
      activeTab.value = 'platform'
    } else {
      ElMessage.error('无法识别JSON数据类型，请检查文件格式！')
      return
    }
    
    importDialogVisible.value = false
  } catch (error) {
    console.error('数据填充错误:', error)
    ElMessage.error('数据填充失败：' + error.message)
  }
}

// 填充分辨率相关数据
const fillResolutionData = (data) => {
  // 清空现有数据
  clearResolutionData()
  
  // 填充基本字段
  if (data.分辨率) resolutionData.分辨率 = data.分辨率
  
  // 填充语言库
  if (data.语言库 && Array.isArray(data.语言库)) {
    resolutionData.语言库 = data.语言库.map(lib => ({
      "库名": lib.库名 || "",
      "支持语言": lib.支持语言 || "",
      "size": lib.size || ""
    }))
  }
  
  // 填充开关机logo
  if (data.开关机logo && Array.isArray(data.开关机logo)) {
    resolutionData.开关机logo = data.开关机logo.map(logo => ({
      "图片名": logo.图片名 || "",
      "图片类型": logo.图片类型 || "jpg",
      "size": logo.size || ""
    }))
  }
  
  // 填充主菜单
  if (data.主菜单 && Array.isArray(data.主菜单)) {
    resolutionData.主菜单 = data.主菜单.map(menu => ({
      "主菜单类型": menu.主菜单类型 || "",
      "图片类型": menu.图片类型 || "jpg",
      "size": menu.size || ""
    }))
  }
  
  // 填充表盘
  if (data.表盘 && Array.isArray(data.表盘)) {
    resolutionData.表盘 = data.表盘.map(face => ({
      "表盘名": face.表盘名 || "",
      "图片类型": face.图片类型 || "jpg",
      "imgSize": face.imgSize || "",
      "codeSize": face.codeSize || ""
    }))
  }
  
  // 填充软件
  if (data.软件 && Array.isArray(data.软件)) {
    resolutionData.软件 = data.软件.map(software => ({
      "软件名": software.软件名 || "",
      "size": software.size || ""
    }))
  }
  
  // 填充系统功能
  if (data.系统功能 && Array.isArray(data.系统功能)) {
    resolutionData.系统功能 = data.系统功能.map(func => ({
      "功能": func.功能 || "",
      "codeSize": func.codeSize || "",
      "风格": func.风格 && Array.isArray(func.风格) ? func.风格.map(style => ({
        "风格名": style.风格名 || "",
        "图片格式": style.图片格式 || "",
        "size": style.size || ""
      })) : []
    }))
  }
}

// 填充平台相关数据
const fillPlatformData = (data) => {
  // 清空现有数据
  clearPlatformData()
  
  // 填充基本字段
  if (data.平台) platformData.平台 = data.平台
  if (data.系统内核) platformData.系统内核 = data.系统内核
  
  // 填充TP快捷4方向
  if (data.TP快捷4方向 && typeof data.TP快捷4方向 === 'object') {
    Object.keys(data.TP快捷4方向).forEach(direction => {
      if (Array.isArray(data.TP快捷4方向[direction])) {
        platformData.TP快捷4方向[direction] = data.TP快捷4方向[direction].map(item => ({
          "宏名": item.宏名 || "",
          "宏功能": item.宏功能 || "",
          "size": item.size || ""
        }))
      }
    })
  }
  
  // 填充按键
  if (data.按键 && typeof data.按键 === 'object') {
    Object.keys(data.按键).forEach(keyType => {
      if (typeof data.按键[keyType] === 'object') {
        Object.keys(data.按键[keyType]).forEach(action => {
          if (Array.isArray(data.按键[keyType][action])) {
            platformData.按键[keyType][action] = data.按键[keyType][action].map(item => ({
              "宏名": item.宏名 || "",
              "宏功能": item.宏功能 || "",
              "size": item.size || ""
            }))
          }
        })
      }
    })
  }
}

// 清空分辨率相关数据
const clearResolutionData = () => {
  Object.assign(resolutionData, {
    "分辨率": "360X360",
    "语言库": [],
    "开关机logo": [],
    "主菜单": [],
    "表盘": [],
    "软件": [],
    "系统功能": []
  })
}

// 清空平台相关数据
const clearPlatformData = () => {
  Object.assign(platformData, {
    "平台": "AB5682B",
    "系统内核": "",
    "TP快捷4方向": {
      "上拉": [], "下拉": [], "从上往下拉": [], "从下往上拉": [],
      "左右滑": [], "左滑": [], "右滑": [], "从左侧边拉": [],
      "侧边左滑": [], "侧边右滑": [], "表盘预览": [], "设置": []
    },
    "按键": {
      "Power按键": { "单击": [], "双击": [], "长按": [] },
      "编码器按键": { "单击": [], "双击": [], "长按": [], "编码器": [] },
      "功能键": { "单击": [], "双击": [], "长按": [] },
      "侧键": { "单击": [], "双击": [], "长按": [] },
      "运动侧键": { "单击": [], "双击": [], "长按": [] }
    }
  })
}

// 复制语言到剪贴板
const copyLanguage = async (language) => {
  try {
    await navigator.clipboard.writeText(language)
    // 使用简单的成功提示
    ElMessage.success(`已复制 "${language}" 到剪贴板`)
  } catch (error) {
    // 降级方案：使用传统方法
    const textArea = document.createElement('textarea')
    textArea.value = language
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    try {
      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      if (successful) {
        ElMessage.success(`已复制 "${language}" 到剪贴板`)
      } else {
        throw new Error('复制失败')
      }
    } catch (fallbackError) {
      ElMessage.error('复制失败，请手动复制')
    }
  }
}

const confirmImport = () => {
  try {
    if (importTab.value === 'resolution' && importResolutionText.value) {
      const data = JSON.parse(importResolutionText.value)
      Object.assign(resolutionData, data)
      ElMessage.success('分辨率相关数据导入成功！')
    }
    
    if (importTab.value === 'platform' && importPlatformText.value) {
      const data = JSON.parse(importPlatformText.value)
      Object.assign(platformData, data)
      ElMessage.success('平台相关数据导入成功！')
    }
    
    importDialogVisible.value = false
    importResolutionText.value = ''
    importPlatformText.value = ''
  } catch (error) {
    ElMessage.error('JSON格式错误，请检查数据格式！')
  }
}

const resetData = () => {
  ElMessageBox.confirm('确定要重置所有数据吗？此操作不可撤销。', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 重置为初始数据
    location.reload()
  })
}
</script>

<style lang="scss" scoped>
.json-form-editor {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  min-width:1080px ;
}

.form-container {
  padding: 32px;
  max-height: none;
  overflow-y: visible;
}

.section {
  margin-bottom: 32px;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  background-color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  
  &:last-child {
    margin-bottom: 0;
  }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e4e7ed;
  border-radius: 12px 12px 0 0;
  
  h3 {
    margin: 0;
    color: #303133;
    font-size: 18px;
    font-weight: 600;
  }
}

.subsection {
  margin-bottom: 16px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  background-color: #fafbfc;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.subsection-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f5f6fa;
  border-bottom: 1px solid #e4e7ed;
  border-radius: 6px 6px 0 0;
  
  h4, h5 {
    margin: 0;
    color: #606266;
    font-size: 14px;
    font-weight: 500;
  }
}

.sub-subsection {
  margin-bottom: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background-color: #ffffff;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.form-item-group {
  padding: 24px;
  
  &:not(:last-child) {
    border-bottom: 1px solid #f0f0f0;
  }
}

.sub-form-item {
  padding: 12px 16px;
  
  &:not(:last-child) {
    border-bottom: 1px solid #f5f5f5;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
}

.action-buttons {
  padding: 20px 24px;
  background-color: #f8f9fa;
  border-top: 1px solid #e4e7ed;
  text-align: center;
  
  .el-button {
    margin: 0 8px;
    min-width: 100px;
  }
}

// Element Plus 样式覆盖
:deep(.el-tabs) {
  .el-tabs__header {
    margin: 0;
    background-color: #ffffff;
  }
  
  .el-tabs__nav-wrap {
    padding: 0 24px;
  }
  
  .el-tabs__item {
    padding: 0 24px;
    height: 48px;
    line-height: 48px;
    font-weight: 500;
    
    &.is-active {
      color: #409eff;
    }
  }
  
  .el-tabs__content {
    padding: 0;
  }
}

:deep(.el-card) {
  margin-bottom: 12px;
  box-shadow: none;
  border: none !important;
  
  .el-card__header {
    padding: 12px 16px;
    background-color: #fafbfc;
    border-bottom: none !important;
  }
  
  .el-card__body {
    padding: 16px;
  }
}

:deep(.el-form-item) {
  margin-bottom: 16px;
  
  .el-form-item__label {
    font-weight: 500;
    color: #606266;
  }
}

:deep(.el-input) {
  .el-input__wrapper {
    box-shadow: 0 0 0 1px #dcdfe6 inset;
    
    &:hover {
      box-shadow: 0 0 0 1px #c0c4cc inset;
    }
    
    &.is-focus {
      box-shadow: 0 0 0 1px #409eff inset;
    }
  }
}

:deep(.el-select) {
  .el-select__wrapper {
    box-shadow: 0 0 0 1px #dcdfe6 inset;
    
    &:hover {
      box-shadow: 0 0 0 1px #c0c4cc inset;
    }
    
    &.is-focus {
      box-shadow: 0 0 0 1px #409eff inset;
    }
  }
}

// 表单网格布局
.form-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  
  &.form-grid-2 {
    grid-template-columns: repeat(2, 1fr);
  }
  
  &.form-grid-4 {
    grid-template-columns: repeat(4, 1fr);
  }
  
  &.form-grid-5 {
    grid-template-columns: repeat(5, 1fr);
  }
  
  &.form-grid-1 {
    grid-template-columns: 1fr;
  }
  
  @media (max-width: 1400px) {
    grid-template-columns: repeat(2, 1fr);
    
    &.form-grid-3,
    &.form-grid-4 {
      grid-template-columns: repeat(3, 1fr);
    }
    
    &.form-grid-5 {
      grid-template-columns: repeat(3, 1fr);
    }
  }
  
  @media (max-width: 1000px) {
    grid-template-columns: 1fr;
    
    &.form-grid-2,
    &.form-grid-3,
    &.form-grid-4,
    &.form-grid-5 {
      grid-template-columns: 1fr;
    }
  }
}

.basic-info {
  margin-bottom: 32px;
  padding: 24px;
  background: #fafbfc;
  border-radius: 12px;
}

.single-form-item {
  max-width: 300px;
}

// 按键类型包装器
.key-type-wrapper {
  margin-bottom: 40px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

// 语言提示样式
.language-tips {
  margin-bottom: 20px;
  padding: 0 24px;
}

.language-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.language-tag {
  margin: 0;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
  
  &:active {
    transform: scale(0.95);
  }
}

// 滚动条样式
.form-container {
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
}

// Size输入框KB后缀样式
:deep(.el-input__suffix) {
  color: #909399;
  font-size: 12px;
  font-weight: 500;
  padding-right: 8px;
}

:deep(.el-input__suffix-inner) {
  color: #909399;
  font-size: 12px;
  font-weight: 500;
}

// 收缩展开按钮样式
.collapse-button {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #606266;
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    color: #409eff;
    background-color: #f0f9ff;
  }
  
  .el-icon {
    font-size: 16px;
    transition: transform 0.2s ease;
  }
}

// 模块内容区域样式
.section-content {
  transition: all 0.3s ease;
}

// 添加按钮右下角样式
.section-add-button {
  display: flex;
  justify-content: flex-end;
  padding: 16px 24px;
  background-color: #f8f9fa;
  border-radius: 0 0 12px 12px;
}

// 风格添加按钮样式 - 与系统功能添加按钮保持一致
.style-add-button {
  display: flex;
  justify-content: flex-end;
  padding: 16px 24px;
  background-color: #f8f9fa;
  border-radius: 0 0 8px 8px;
}

// 软件删除按钮样式 - 与添加按钮位置一致
.software-delete-button {
  display: flex;
  justify-content: flex-end;
  padding: 16px 24px;
  background-color: #f8f9fa;
  border-radius: 0 0 8px 8px;
}

// 系统功能删除按钮样式 - 与添加按钮位置一致
.system-function-delete-button {
  display: flex;
  justify-content: flex-end;
  padding: 16px 24px;
  background-color: #f8f9fa;
  border-radius: 0 0 8px 8px;
}

// 回到顶部按钮样式
:deep(.back-to-top) {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4);
  }
}

.back-to-top-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: white;
  font-size: 12px;
  font-weight: 500;
  
  .el-icon {
    font-size: 20px;
    margin-bottom: 2px;
  }
  
  span {
    font-size: 10px;
    line-height: 1;
  }
}

// 文件上传区域样式
.import-file-section {
  padding: 20px;
  text-align: center;
}

:deep(.el-upload-dragger) {
  width: 100%;
  height: 200px;
  border-radius: 8px;
  background-color: #fafafa;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: #f0f9ff;
  }
}

:deep(.el-upload__text) {
  color: #606266;
  font-size: 14px;
  margin-top: 16px;
  
  em {
    color: #409eff;
    font-style: normal;
  }
}

:deep(.el-upload__tip) {
  color: #909399;
  font-size: 12px;
  margin-top: 8px;
}

// 风格项样式


.style-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
}

.style-title {
  font-weight: 600;
  color: #495057;
  font-size: 14px;
}

.style-actions {
  display: flex;
  gap: 8px;
}

// 输入框与按钮组合样式
.input-with-button {
  display: flex;
  align-items: center;
  gap: 8px;
  
  .el-input {
    flex: 1;
  }
  
  .el-button {
    flex-shrink: 0;
  }
}

// 全局消息提示样式 - 使用更高优先级的选择器
</style>

<style>
/* 强制覆盖 Element Plus 消息样式 */
.el-message {
  position: fixed !important;
  top: 20px !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  z-index: 99999 !important;
  min-width: 300px !important;
  text-align: center !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
  border-radius: 8px !important;
  margin: 0 !important;
  right: auto !important;
  width: auto !important;
}

.el-message--success {
  background-color: #f0f9ff !important;
  border-color: #67c23a !important;
  color: #67c23a !important;
}

.el-message--error {
  background-color: #fef2f2 !important;
  border-color: #f56c6c !important;
  color: #f56c6c !important;
}

.el-message__content {
  text-align: center !important;
}

.el-message__icon {
  margin-right: 8px !important;
}

/* 确保消息容器不影响页面布局 */
.el-message-fade-enter-active,
.el-message-fade-leave-active {
  transition: all 0.3s ease !important;
}

.el-message-fade-enter-from,
.el-message-fade-leave-to {
  opacity: 0 !important;
  transform: translateX(-50%) translateY(-20px) !important;
}
.form-item-group {
  padding: 0 !important;
}
</style>
