import { describe, it, expect } from 'vitest'
import {
  parseWorkspaceYaml,
  validateWorkspaceData,
  validateWorkspace,
  clampPointer,
  createDefaultWorkspace,
  dumpWorkspaceYaml,
  DEFAULT_TEMPLATE_TEXT,
} from '../src/domain/workspace.js'

describe('parseWorkspaceYaml', () => {
  it('解析有效資料', () => {
    const result = parseWorkspaceYaml('data:\n  - test1: a\n  - test1: b\n')
    expect(result.ok).toBe(true)
    expect(result.data.data).toEqual([{ test1: 'a' }, { test1: 'b' }])
  })

  it('允許 data 以外的根欄位', () => {
    const result = parseWorkspaceYaml('title: x\ndata:\n  - a: 1\n')
    expect(result.ok).toBe(true)
  })

  it('空內容視為無效資料而非例外', () => {
    const result = parseWorkspaceYaml('')
    expect(result.ok).toBe(false)
    expect(result.error.kind).toBe('data-shape')
  })

  it('語法錯誤回報 yaml-parse 錯誤與行列資訊', () => {
    const result = parseWorkspaceYaml('data:\n  - a: 1\n bad-indent: [')
    expect(result.ok).toBe(false)
    expect(result.error.kind).toBe('yaml-parse')
    expect(result.error.line).toBeGreaterThan(0)
  })

  it('缺少 data 視為無效', () => {
    const result = parseWorkspaceYaml('other: 1\n')
    expect(result.ok).toBe(false)
    expect(result.error.kind).toBe('data-shape')
  })

  it('data 不是陣列視為無效', () => {
    const result = parseWorkspaceYaml('data: hello\n')
    expect(result.ok).toBe(false)
    expect(result.error.kind).toBe('data-shape')
  })

  it('根節點是陣列視為無效', () => {
    const result = parseWorkspaceYaml('- a: 1\n')
    expect(result.ok).toBe(false)
    expect(result.error.kind).toBe('data-shape')
  })

  it('空陣列是有效的', () => {
    const result = parseWorkspaceYaml('data: []\n')
    expect(result.ok).toBe(true)
    expect(result.data.data).toEqual([])
  })

  it('資料列不是物件視為無效並指出第幾筆', () => {
    const result = parseWorkspaceYaml('data:\n  - a: 1\n  - 123\n')
    expect(result.ok).toBe(false)
    expect(result.error.message).toContain('第 2 筆')
  })
})

describe('validateWorkspace（分享內容驗證）', () => {
  it('接受合法 workspace，包含空字串範本', () => {
    const result = validateWorkspace({ uData: { data: [{ a: 1 }] }, templateText: '' })
    expect(result.ok).toBe(true)
    expect(result.workspace.templateText).toBe('')
  })

  it('templateText 不是字串時無效', () => {
    const result = validateWorkspace({ uData: { data: [] }, templateText: 123 })
    expect(result.ok).toBe(false)
  })

  it('uData 結構錯誤時無效', () => {
    const result = validateWorkspace({ uData: { data: 'x' }, templateText: '' })
    expect(result.ok).toBe(false)
  })
})

describe('clampPointer', () => {
  it('正常範圍內不變', () => {
    expect(clampPointer(1, 3)).toBe(1)
  })
  it('超過上界時回到最後一筆', () => {
    expect(clampPointer(5, 3)).toBe(2)
  })
  it('低於下界時回到 0', () => {
    expect(clampPointer(-1, 3)).toBe(0)
  })
  it('空陣列回到 0', () => {
    expect(clampPointer(2, 0)).toBe(0)
  })
  it('非整數回到 0', () => {
    expect(clampPointer(undefined, 3)).toBe(0)
  })
})

describe('createDefaultWorkspace', () => {
  it('預設範本符合 spec，預設資料至少兩筆', () => {
    const ws = createDefaultWorkspace()
    expect(ws.templateText).toBe(DEFAULT_TEMPLATE_TEXT)
    expect(ws.templateText).toBe('Hello World {{ test1 }}')
    expect(ws.uData.data.length).toBeGreaterThanOrEqual(2)
  })

  it('dump 後可以再次解析（round-trip）', () => {
    const ws = createDefaultWorkspace()
    const reparsed = parseWorkspaceYaml(dumpWorkspaceYaml(ws.uData))
    expect(reparsed.ok).toBe(true)
    expect(reparsed.data).toEqual(ws.uData)
  })
})
