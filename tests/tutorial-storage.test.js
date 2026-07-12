import { describe, it, expect } from 'vitest'
import {
  createTutorialStorage,
  TUTORIAL_SEEN_KEY,
  LEGACY_TUTORIAL_KEY,
} from '../src/adapters/tutorial-storage.js'

function createFakeStorage(initial = {}) {
  const map = new Map(Object.entries(initial))
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    dump: () => Object.fromEntries(map),
  }
}

describe('tutorial-storage', () => {
  it('第一次造訪視為未讀', () => {
    const storage = createTutorialStorage(createFakeStorage())
    expect(storage.isSeen()).toBe(false)
  })

  it('markSeen 後為已讀，使用版本化 key', () => {
    const fake = createFakeStorage()
    const storage = createTutorialStorage(fake)
    storage.markSeen()
    expect(storage.isSeen()).toBe(true)
    expect(fake.getItem(TUTORIAL_SEEN_KEY)).toBe('true')
  })

  it('只解析布林語意，任意字串不當作 true', () => {
    const fake = createFakeStorage({ [TUTORIAL_SEEN_KEY]: 'yes' })
    expect(createTutorialStorage(fake).isSeen()).toBe(false)
  })

  it('舊 key 存在即代表已讀，且遷移到新 key', () => {
    // 舊版關閉教學時會寫入 setItem('openUseHelper', false) → 字串 'false'
    const fake = createFakeStorage({ [LEGACY_TUTORIAL_KEY]: 'false' })
    const storage = createTutorialStorage(fake)
    expect(storage.isSeen()).toBe(true)
    expect(fake.getItem(TUTORIAL_SEEN_KEY)).toBe('true')
    expect(fake.getItem(LEGACY_TUTORIAL_KEY)).toBe(null)
  })

  it('storage 不存在時安全降級', () => {
    const storage = createTutorialStorage(null)
    expect(storage.isSeen()).toBe(false)
    expect(() => storage.markSeen()).not.toThrow()
  })

  it('getItem 拋例外時視為未讀', () => {
    const storage = createTutorialStorage({
      getItem: () => {
        throw new Error('SecurityError')
      },
      setItem: () => {},
    })
    expect(storage.isSeen()).toBe(false)
  })

  it('setItem 因 quota 失敗時不拋例外', () => {
    const storage = createTutorialStorage({
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
    })
    expect(() => storage.markSeen()).not.toThrow()
  })
})
