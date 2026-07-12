import { describe, it, expect } from 'vitest'
import { Base64 } from 'js-base64'
import {
  encodeWorkspaceHash,
  decodeWorkspaceHash,
  readWorkspaceFromLocation,
  writeWorkspaceToLocation,
} from '../src/adapters/share-hash.js'

const sampleWorkspace = {
  uData: { data: [{ test1: 'test', test2: 'test2' }, { test1: 'test3' }] },
  templateText: 'Hello World {{ test1 }}',
}

describe('encode / decode round-trip', () => {
  it('編碼後可還原相同內容', () => {
    const hash = encodeWorkspaceHash(sampleWorkspace)
    const result = decodeWorkspaceHash(hash)
    expect(result.ok).toBe(true)
    expect(result.workspace).toEqual(sampleWorkspace)
  })

  it('中文內容可正確 round-trip', () => {
    const ws = {
      uData: { data: [{ 名稱: '測試資料' }] },
      templateText: '你好 {{ 名稱 }}',
    }
    const result = decodeWorkspaceHash(encodeWorkspaceHash(ws))
    expect(result.ok).toBe(true)
    expect(result.workspace).toEqual(ws)
  })

  it('空字串範本必須可保存與還原', () => {
    const ws = { uData: { data: [] }, templateText: '' }
    const result = decodeWorkspaceHash(encodeWorkspaceHash(ws))
    expect(result.ok).toBe(true)
    expect(result.workspace.templateText).toBe('')
  })

  it('可讀取舊版格式（直接以 Base64 編碼的 JSON）', () => {
    // 模擬舊版程式產生的 hash：Base64.encode(JSON.stringify({uData, templateText}))
    const legacyHash = Base64.encode(JSON.stringify(sampleWorkspace))
    const result = decodeWorkspaceHash(legacyHash)
    expect(result.ok).toBe(true)
    expect(result.workspace).toEqual(sampleWorkspace)
  })
})

describe('無效 hash 的錯誤處理', () => {
  it('損壞的 Base64 回報 share-decode', () => {
    const result = decodeWorkspaceHash('!!!not-base64!!!')
    expect(result.ok).toBe(false)
    expect(result.error.kind).toBe('share-decode')
  })

  it('損壞的 JSON 回報 share-decode', () => {
    const result = decodeWorkspaceHash(Base64.encode('{ not json'))
    expect(result.ok).toBe(false)
    expect(result.error.kind).toBe('share-decode')
  })

  it('schema 錯誤（缺 templateText）回報 share-decode', () => {
    const result = decodeWorkspaceHash(Base64.encode(JSON.stringify({ uData: { data: [] } })))
    expect(result.ok).toBe(false)
    expect(result.error.kind).toBe('share-decode')
  })

  it('schema 錯誤（data 不是陣列）回報 share-decode', () => {
    const result = decodeWorkspaceHash(
      Base64.encode(JSON.stringify({ uData: { data: 'x' }, templateText: '' }))
    )
    expect(result.ok).toBe(false)
    expect(result.error.kind).toBe('share-decode')
  })
})

describe('location 讀寫（注入假 window）', () => {
  it('沒有 hash 時回報 empty', () => {
    const win = { location: { hash: '' } }
    expect(readWorkspaceFromLocation(win)).toEqual({ ok: false, empty: true })
  })

  it('寫入時使用 replaceState 且格式為 #<base64>', () => {
    const calls = []
    const win = {
      history: {
        replaceState: (...args) => calls.push(args),
      },
    }
    writeWorkspaceToLocation(sampleWorkspace, win)
    expect(calls.length).toBe(1)
    const [, , url] = calls[0]
    expect(url.startsWith('#')).toBe(true)
    expect(decodeWorkspaceHash(url.slice(1)).ok).toBe(true)
  })

  it('讀取有效 hash 還原 workspace', () => {
    const win = { location: { hash: `#${encodeWorkspaceHash(sampleWorkspace)}` } }
    const result = readWorkspaceFromLocation(win)
    expect(result.ok).toBe(true)
    expect(result.workspace).toEqual(sampleWorkspace)
  })
})
