/**
 * 教學已讀狀態 adapter（spec FR-08）：
 * - 使用版本化 key，解析布林語意。
 * - 舊 key `openUseHelper` 存在即代表舊版已讀，第一次讀取時遷移。
 * - localStorage 無法使用時安全降級（最壞情況是下次再顯示教學）。
 */

export const TUTORIAL_SEEN_KEY = 'strTemplate:tutorialSeen:v1'
export const LEGACY_TUTORIAL_KEY = 'openUseHelper'

function defaultStorage() {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

export function createTutorialStorage(storage = defaultStorage()) {
  return {
    isSeen() {
      if (!storage) {
        return false
      }
      try {
        const value = storage.getItem(TUTORIAL_SEEN_KEY)
        if (value !== null) {
          return value === 'true'
        }
        if (storage.getItem(LEGACY_TUTORIAL_KEY) !== null) {
          try {
            storage.setItem(TUTORIAL_SEEN_KEY, 'true')
            storage.removeItem(LEGACY_TUTORIAL_KEY)
          } catch {
            // 遷移失敗不影響已讀判定
          }
          return true
        }
        return false
      } catch {
        return false
      }
    },
    markSeen() {
      if (!storage) {
        return
      }
      try {
        storage.setItem(TUTORIAL_SEEN_KEY, 'true')
      } catch {
        // quota 或權限失敗時忽略，下次造訪會再顯示教學
      }
    },
  }
}
