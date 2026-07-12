<template>
  <div class="container-fluid editor-container">
    <div class="row g-3 editor-row">
      <section class="col-lg-6 d-flex flex-column" aria-label="YAML 資料編輯區">
        <div v-if="shareError" class="alert alert-warning alert-dismissible" role="alert">
          <strong>分享連結無效：</strong>{{ shareError.message }}
          <button type="button" class="btn-close" aria-label="關閉" @click="shareError = null"></button>
        </div>
        <div v-if="workspace.state.yamlError" class="alert alert-danger" role="alert">
          <strong>YAML 錯誤：</strong>{{ workspace.state.yamlError.message }}
        </div>
        <div ref="yamlEditorEl" class="monaco flex-grow-1"></div>
      </section>
      <section class="col-lg-6 d-flex flex-column" aria-label="範本與結果區">
        <ul class="nav nav-tabs" role="tablist">
          <li v-for="tab in tabs" :key="tab.value" class="nav-item" role="presentation">
            <button
              type="button"
              class="nav-link"
              :class="{ active: workspace.state.mode === tab.value }"
              role="tab"
              :aria-selected="workspace.state.mode === tab.value"
              @click="workspace.setMode(tab.value)"
            >{{ tab.label }}</button>
          </li>
        </ul>
        <div v-if="workspace.canNavigate.value" class="row g-2 my-1">
          <div class="col-5">
            <button
              type="button"
              class="btn btn-primary w-100"
              :disabled="workspace.safePointer.value === 0"
              @click="workspace.prevRecord()"
            >前一筆</button>
          </div>
          <div class="col-2 text-center align-self-center" aria-live="polite">
            第 {{ workspace.safePointer.value + 1 }} / {{ workspace.records.value.length }} 筆
          </div>
          <div class="col-5">
            <button
              type="button"
              class="btn btn-primary w-100"
              :disabled="workspace.safePointer.value >= workspace.records.value.length - 1"
              @click="workspace.nextRecord()"
            >後一筆</button>
          </div>
        </div>
        <div
          v-if="workspace.templateError.value && workspace.state.mode !== MODE_EDIT"
          class="alert alert-danger my-1"
          role="alert"
        >
          <strong>範本錯誤：</strong>{{ workspace.templateError.value.message }}
        </div>
        <div class="editor-stack flex-grow-1">
          <div v-show="workspace.state.mode === MODE_EDIT" ref="templateEditorEl" class="monaco h-100"></div>
          <div v-show="workspace.state.mode !== MODE_EDIT" ref="resultEditorEl" class="monaco h-100"></div>
        </div>
        <div class="row g-2 mt-1 align-items-center">
          <div class="col">
            <button
              type="button"
              class="btn btn-success w-100"
              :disabled="workspace.state.mode === MODE_EDIT || !!workspace.templateError.value"
              @click="copyResult"
            >複製</button>
          </div>
          <div v-if="copyFeedback" class="col-auto" aria-live="polite">
            <span :class="copyFeedback.ok ? 'text-success' : 'text-danger'">
              {{ copyFeedback.ok ? '✓' : '✗' }} {{ copyFeedback.text }}
            </span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import { useWorkspace, MODE_EDIT, MODE_SINGLE, MODE_COMBINED } from '../composables/useWorkspace.js'
import { useMonacoEditor } from '../composables/useMonacoEditor.js'
import { createDefaultWorkspace, dumpWorkspaceYaml, DEFAULT_YAML_TEXT } from '../domain/workspace.js'
import { readWorkspaceFromLocation, writeWorkspaceToLocation } from '../adapters/share-hash.js'
import { copyTextToClipboard } from '../adapters/clipboard.js'
import { debounce } from '../utils/debounce.js'

const tabs = [
  { value: MODE_EDIT, label: '編輯' },
  { value: MODE_SINGLE, label: '結果' },
  { value: MODE_COMBINED, label: '總和' },
]

// 初始化：有有效分享 hash 就還原，否則載入預設 workspace（spec FR-01）
const restored = readWorkspaceFromLocation()
const shareError = ref(restored.ok || restored.empty ? null : restored.error)
const initialWorkspace = restored.ok ? restored.workspace : createDefaultWorkspace()
const initialYamlText = restored.ok ? dumpWorkspaceYaml(initialWorkspace.uData) : DEFAULT_YAML_TEXT

// 有效變更後 debounced 自動保存到 URL hash（spec FR-07）
const persistToHash = debounce((snapshot) => {
  writeWorkspaceToLocation(JSON.parse(JSON.stringify(snapshot)))
}, 400)

const workspace = useWorkspace(initialWorkspace, { onPersist: persistToHash })

const yamlEditorEl = ref(null)
const templateEditorEl = ref(null)
const resultEditorEl = ref(null)

useMonacoEditor(yamlEditorEl, {
  value: initialYamlText,
  language: 'yaml',
  onChange: (text) => workspace.setYamlText(text),
})

useMonacoEditor(templateEditorEl, {
  value: initialWorkspace.templateText,
  language: 'handlebars',
  onChange: (text) => workspace.setTemplateText(text),
})

const resultEditor = useMonacoEditor(resultEditorEl, {
  value: workspace.resultText.value,
  language: 'plaintext',
  readOnly: true,
  onReady: (editor) => {
    // 點擊結果內容時全選（spec FR-06 既有便利行為）
    editor.onMouseDown(() => {
      const model = editor.getModel()
      if (model) {
        editor.setSelection(model.getFullModelRange())
      }
    })
  },
})

watch(workspace.resultText, (text) => resultEditor.setValue(text))

const copyFeedback = ref(null)
let copyFeedbackTimer = null

async function copyResult() {
  const result = await copyTextToClipboard(workspace.resultText.value)
  copyFeedback.value = result.ok
    ? { ok: true, text: '已複製到剪貼簿' }
    : { ok: false, text: result.error.message }
  if (copyFeedbackTimer) {
    clearTimeout(copyFeedbackTimer)
  }
  copyFeedbackTimer = setTimeout(() => {
    copyFeedback.value = null
    copyFeedbackTimer = null
  }, 3000)
}

onBeforeUnmount(() => {
  persistToHash.cancel()
  if (copyFeedbackTimer) {
    clearTimeout(copyFeedbackTimer)
  }
})
</script>

<style scoped>
.editor-container {
  padding-top: 1rem;
  padding-bottom: 1rem;
  min-height: 0;
}
.editor-row {
  min-height: 100%;
}
.editor-stack {
  min-height: 0;
}
.monaco {
  border: 1px solid #495057;
  min-height: 400px;
  height: 100%;
}
</style>
