import { onBeforeUnmount, onMounted } from 'vue'
import { setupMonacoEnvironment } from '../monaco/environment.js'

/**
 * Monaco editor 生命週期 composable（spec 第 8 節）：
 * - 每個元件 instance 建立自己的 editor，不使用檔案層級共用變數。
 * - 卸載時 dispose editor（連同隱含建立的 model）與事件監聽。
 * - setValue 只在內容不同時更新，並抑制回音事件，避免雙向同步迴圈。
 */
export function useMonacoEditor(containerRef, { value = '', language = 'plaintext', readOnly = false, onChange, onReady } = {}) {
  let editor = null
  let changeListener = null
  let applyingExternalValue = false

  onMounted(() => {
    const monaco = setupMonacoEnvironment()
    editor = monaco.editor.create(containerRef.value, {
      value,
      language,
      readOnly,
      automaticLayout: true,
      minimap: { enabled: false },
    })
    if (onChange) {
      changeListener = editor.onDidChangeModelContent(() => {
        if (!applyingExternalValue) {
          onChange(editor.getValue())
        }
      })
    }
    if (onReady) {
      onReady(editor)
    }
  })

  onBeforeUnmount(() => {
    if (changeListener) {
      changeListener.dispose()
      changeListener = null
    }
    if (editor) {
      const model = editor.getModel()
      editor.dispose()
      if (model) {
        model.dispose()
      }
      editor = null
    }
  })

  function setValue(newValue) {
    if (!editor || editor.getValue() === newValue) {
      return
    }
    applyingExternalValue = true
    editor.setValue(newValue)
    applyingExternalValue = false
  }

  function getValue() {
    return editor ? editor.getValue() : ''
  }

  return { setValue, getValue }
}
