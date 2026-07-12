/**
 * Clipboard adapter（spec FR-06）：
 * 包裝 Clipboard API，把「API 不存在」與「權限被拒」轉成結構化錯誤，
 * 不拋出未處理的 Promise rejection。
 */
export async function copyTextToClipboard(text, clipboard = globalThis.navigator?.clipboard) {
  if (!clipboard || typeof clipboard.writeText !== 'function') {
    return {
      ok: false,
      error: { kind: 'clipboard', message: '此瀏覽器不支援剪貼簿功能' },
    }
  }
  try {
    await clipboard.writeText(text)
    return { ok: true }
  } catch (cause) {
    return {
      ok: false,
      error: { kind: 'clipboard', message: '複製失敗，請確認剪貼簿權限', cause },
    }
  }
}
