import { Base64 } from 'js-base64'
import { validateWorkspace } from '../domain/workspace.js'

/**
 * 分享連結 adapter（spec FR-07）：
 * hash 格式為 #${Base64.encode(JSON.stringify({ uData, templateText }))}，
 * 與舊版相容，支援 UTF-8／中文內容。
 * hash 的讀寫集中在此，不與 Monaco 或範本引擎耦合。
 */

export function encodeWorkspaceHash(workspace) {
  const payload = {
    uData: workspace.uData,
    templateText: workspace.templateText,
  }
  return Base64.encode(JSON.stringify(payload))
}

export function decodeWorkspaceHash(hash) {
  let parsed
  try {
    parsed = JSON.parse(Base64.decode(hash))
  } catch (cause) {
    return {
      ok: false,
      error: { kind: 'share-decode', message: '分享連結無法解讀，已載入預設內容', cause },
    }
  }
  const result = validateWorkspace(parsed)
  if (!result.ok) {
    return {
      ok: false,
      error: { kind: 'share-decode', message: '分享連結的內容格式不正確，已載入預設內容', cause: result.error },
    }
  }
  return { ok: true, workspace: result.workspace }
}

/**
 * 從目前網址讀取 workspace。沒有 hash 時回傳 { ok: false, empty: true }。
 */
export function readWorkspaceFromLocation(win = window) {
  const hash = win.location.hash
  if (!hash || hash === '#') {
    return { ok: false, empty: true }
  }
  return decodeWorkspaceHash(hash.slice(1))
}

/**
 * 以 history.replaceState 更新 hash，不新增瀏覽器歷史紀錄。
 */
export function writeWorkspaceToLocation(workspace, win = window) {
  const hash = encodeWorkspaceHash(workspace)
  win.history.replaceState(null, '', `#${hash}`)
}
