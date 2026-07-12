import { describe, it, expect } from 'vitest'
import { copyTextToClipboard } from '../src/adapters/clipboard.js'

describe('clipboard adapter', () => {
  it('成功複製回傳 ok', async () => {
    const written = []
    const result = await copyTextToClipboard('hello', {
      writeText: async (text) => written.push(text),
    })
    expect(result.ok).toBe(true)
    expect(written).toEqual(['hello'])
  })

  it('Clipboard API 不存在時回報 clipboard 錯誤，不拋例外', async () => {
    const result = await copyTextToClipboard('hello', undefined)
    expect(result.ok).toBe(false)
    expect(result.error.kind).toBe('clipboard')
  })

  it('權限被拒時回報 clipboard 錯誤，不產生未處理 rejection', async () => {
    const result = await copyTextToClipboard('hello', {
      writeText: async () => {
        throw new DOMException('Not allowed', 'NotAllowedError')
      },
    })
    expect(result.ok).toBe(false)
    expect(result.error.kind).toBe('clipboard')
    expect(result.error.cause).toBeInstanceOf(DOMException)
  })
})
