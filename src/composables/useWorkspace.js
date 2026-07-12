import { computed, reactive, watch } from 'vue'
import { clampPointer, parseWorkspaceYaml } from '../domain/workspace.js'
import { renderAll, renderOne } from '../domain/template-engine.js'

export const MODE_EDIT = 'edit'
export const MODE_SINGLE = 'result'
export const MODE_COMBINED = 'combined'

/**
 * Workspace reactive 狀態與衍生狀態（spec 第 8 節）。
 * computed 只計算值，不操作 editor、URL 或其他 state；
 * hash 保存透過 onPersist callback 由外部 adapter 處理。
 */
export function useWorkspace(initialWorkspace, { onPersist } = {}) {
  const state = reactive({
    uData: initialWorkspace.uData,
    templateText: initialWorkspace.templateText,
    dataPointer: 0,
    mode: MODE_EDIT,
    yamlError: null,
  })

  const records = computed(() => state.uData.data)

  // 資料縮短時 pointer 自動落在有效範圍（spec FR-05）：
  // 所有讀取與導覽都經過 safePointer，raw dataPointer 不直接使用
  const safePointer = computed(() => clampPointer(state.dataPointer, records.value.length))

  const singleResult = computed(() => {
    if (records.value.length === 0) {
      return { ok: true, output: '' }
    }
    return renderOne(state.templateText, records.value[safePointer.value])
  })

  const combinedResult = computed(() => renderAll(state.templateText, records.value))

  const activeResult = computed(() => {
    if (state.mode === MODE_SINGLE) {
      return singleResult.value
    }
    if (state.mode === MODE_COMBINED) {
      return combinedResult.value
    }
    return null
  })

  const resultText = computed(() => {
    const result = activeResult.value
    return result && result.ok ? result.output : ''
  })

  const templateError = computed(() => {
    const result = activeResult.value
    return result && !result.ok ? result.error : null
  })

  const canNavigate = computed(() => state.mode === MODE_SINGLE && records.value.length > 1)

  function setYamlText(text) {
    const result = parseWorkspaceYaml(text)
    if (result.ok) {
      state.yamlError = null
      state.uData = result.data
    } else {
      // 驗證失敗：顯示錯誤、保留最後一份有效資料（spec FR-02）
      state.yamlError = result.error
    }
  }

  function setTemplateText(text) {
    state.templateText = text
  }

  function setMode(mode) {
    state.mode = mode
  }

  function nextRecord() {
    state.dataPointer = clampPointer(safePointer.value + 1, records.value.length)
  }

  function prevRecord() {
    state.dataPointer = clampPointer(safePointer.value - 1, records.value.length)
  }

  // 有效 YAML 或範本變更後自動保存（含空字串範本，spec FR-07 / 決策 4）。
  // debounce 由呼叫端包在 onPersist 內。
  if (onPersist) {
    watch(
      () => [state.uData, state.templateText],
      () => {
        onPersist({ uData: state.uData, templateText: state.templateText })
      },
      { deep: false }
    )
  }

  return {
    state,
    records,
    safePointer,
    singleResult,
    combinedResult,
    resultText,
    templateError,
    canNavigate,
    setYamlText,
    setTemplateText,
    setMode,
    nextRecord,
    prevRecord,
  }
}
