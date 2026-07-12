import { describe, it, expect, vi } from 'vitest'
import { nextTick } from 'vue'
import { useWorkspace, MODE_SINGLE, MODE_COMBINED } from '../src/composables/useWorkspace.js'
import { createDefaultWorkspace } from '../src/domain/workspace.js'

function createWorkspace(overrides = {}) {
  return useWorkspace({ ...createDefaultWorkspace(), ...overrides.initial }, overrides.options)
}

describe('useWorkspace', () => {
  it('編輯有效 YAML 後結果更新', () => {
    const ws = createWorkspace()
    ws.setMode(MODE_SINGLE)
    ws.setTemplateText('{{ test1 }}')
    ws.setYamlText('data:\n  - test1: updated\n')
    expect(ws.state.yamlError).toBe(null)
    expect(ws.resultText.value).toBe('updated')
  })

  it('編輯無效 YAML 後顯示錯誤並保留上一份有效輸出', () => {
    const ws = createWorkspace()
    ws.setMode(MODE_SINGLE)
    ws.setTemplateText('{{ test1 }}')
    ws.setYamlText('data:\n  - test1: valid\n')
    const before = ws.resultText.value
    ws.setYamlText('data: [broken')
    expect(ws.state.yamlError).not.toBe(null)
    expect(ws.resultText.value).toBe(before)
  })

  it('單筆導覽維持在邊界內', () => {
    const ws = createWorkspace()
    ws.setMode(MODE_SINGLE)
    ws.setYamlText('data:\n  - a: 1\n  - a: 2\n')
    expect(ws.safePointer.value).toBe(0)
    ws.prevRecord()
    expect(ws.safePointer.value).toBe(0)
    ws.nextRecord()
    expect(ws.safePointer.value).toBe(1)
    ws.nextRecord()
    expect(ws.safePointer.value).toBe(1)
  })

  it('資料縮短時 pointer 自動修正，空陣列回到 0', () => {
    const ws = createWorkspace()
    ws.setMode(MODE_SINGLE)
    ws.setTemplateText('{{ a }}')
    ws.setYamlText('data:\n  - a: 1\n  - a: 2\n  - a: 3\n')
    ws.nextRecord()
    ws.nextRecord()
    expect(ws.safePointer.value).toBe(2)
    ws.setYamlText('data:\n  - a: 1\n')
    expect(ws.safePointer.value).toBe(0)
    expect(ws.resultText.value).toBe('1')
    ws.setYamlText('data: []\n')
    expect(ws.safePointer.value).toBe(0)
    expect(ws.resultText.value).toBe('')
  })

  it('空資料陣列時單筆與總和都輸出空字串，並隱藏切換控制', () => {
    const ws = createWorkspace()
    ws.setYamlText('data: []\n')
    ws.setMode(MODE_SINGLE)
    expect(ws.resultText.value).toBe('')
    expect(ws.canNavigate.value).toBe(false)
    ws.setMode(MODE_COMBINED)
    expect(ws.resultText.value).toBe('')
  })

  it('總和模式維持原始順序並以 \\n 串接', () => {
    const ws = createWorkspace()
    ws.setMode(MODE_COMBINED)
    ws.setTemplateText('{{ a }}')
    ws.setYamlText('data:\n  - a: x\n  - a: y\n')
    expect(ws.resultText.value).toBe('x\ny')
  })

  it('範本錯誤時 templateError 有結構化錯誤而不是崩潰', () => {
    const ws = createWorkspace()
    ws.setMode(MODE_SINGLE)
    ws.setTemplateText('{{regex_match "([" v 0}}')
    ws.setYamlText('data:\n  - v: abc\n')
    expect(ws.templateError.value).not.toBe(null)
    expect(ws.templateError.value.kind).toBe('template-render')
    expect(ws.resultText.value).toBe('')
  })

  it('有效 YAML 或範本變更會觸發 onPersist，無效 YAML 不觸發', async () => {
    const onPersist = vi.fn()
    const ws = createWorkspace({ options: { onPersist } })
    ws.setTemplateText('new template')
    await nextTick()
    expect(onPersist).toHaveBeenCalledTimes(1)
    ws.setYamlText('data: [broken')
    await nextTick()
    expect(onPersist).toHaveBeenCalledTimes(1)
    ws.setYamlText('data:\n  - a: 1\n')
    await nextTick()
    expect(onPersist).toHaveBeenCalledTimes(2)
    // 空字串範本也要保存（spec 決策 4）
    ws.setTemplateText('')
    await nextTick()
    expect(onPersist).toHaveBeenCalledTimes(3)
    expect(onPersist.mock.lastCall[0].templateText).toBe('')
  })
})
