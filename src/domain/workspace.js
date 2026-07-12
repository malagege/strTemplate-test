import { load, dump } from 'js-yaml'

// 預設範本與預設 YAML（spec FR-01：至少兩筆可切換的示例資料）
export const DEFAULT_TEMPLATE_TEXT = 'Hello World {{ test1 }}'
export const DEFAULT_YAML_TEXT = [
  'data:',
  '  - test1: test',
  '    test2: test2',
  '  - test1: test3',
  '    test2: test4',
  '',
].join('\n')

function isPlainObjectLike(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function shapeError(message) {
  return { ok: false, error: { kind: 'data-shape', message } }
}

/**
 * 驗證 YAML 解析結果是否符合 Workspace 資料模型（spec 5.1）：
 * 根節點為物件、必須有 data、data 為陣列、每筆資料為物件。
 */
export function validateWorkspaceData(value) {
  if (value === null || value === undefined) {
    return shapeError('YAML 內容是空的，根節點必須是包含 data 的物件')
  }
  if (!isPlainObjectLike(value)) {
    return shapeError('YAML 根節點必須是物件，不能是陣列或純值')
  }
  if (!('data' in value)) {
    return shapeError('YAML 根節點缺少 data 欄位')
  }
  if (!Array.isArray(value.data)) {
    return shapeError('data 必須是陣列')
  }
  for (let i = 0; i < value.data.length; i++) {
    if (!isPlainObjectLike(value.data[i])) {
      return shapeError(`data 第 ${i + 1} 筆必須是物件`)
    }
  }
  return { ok: true, data: value }
}

/**
 * 解析並驗證 YAML 文字。
 * 回傳 { ok: true, data } 或 { ok: false, error: AppError }。
 */
export function parseWorkspaceYaml(text) {
  // js-yaml 5 對空輸入會拋例外；空內容依 spec FR-02 視為無效資料
  if (typeof text !== 'string' || text.trim() === '') {
    return shapeError('YAML 內容是空的，根節點必須是包含 data 的物件')
  }
  let value
  try {
    value = load(text)
  } catch (cause) {
    const error = { kind: 'yaml-parse', message: 'YAML 語法錯誤', cause }
    if (cause && cause.mark && typeof cause.mark.line === 'number') {
      error.line = cause.mark.line + 1
      error.column = cause.mark.column + 1
      error.message = `YAML 語法錯誤（第 ${error.line} 行，第 ${error.column} 欄）`
    }
    return { ok: false, error }
  }
  return validateWorkspaceData(value)
}

export function dumpWorkspaceYaml(value) {
  return dump(value)
}

/**
 * 驗證分享連結還原出來的完整 workspace 物件。
 * 空字串範本是合法內容（spec FR-07）。
 */
export function validateWorkspace(value) {
  if (!isPlainObjectLike(value)) {
    return shapeError('分享內容必須是物件')
  }
  if (typeof value.templateText !== 'string') {
    return shapeError('templateText 必須是字串')
  }
  const dataResult = validateWorkspaceData(value.uData)
  if (!dataResult.ok) {
    return dataResult
  }
  return { ok: true, workspace: { uData: value.uData, templateText: value.templateText } }
}

export function createDefaultWorkspace() {
  const parsed = parseWorkspaceYaml(DEFAULT_YAML_TEXT)
  return {
    uData: parsed.data,
    templateText: DEFAULT_TEMPLATE_TEXT,
  }
}

/**
 * 將 dataPointer 限制在 0..length-1（spec FR-05），空陣列回到 0。
 */
export function clampPointer(pointer, length) {
  if (!Number.isInteger(pointer) || length <= 0) {
    return 0
  }
  return Math.min(Math.max(pointer, 0), length - 1)
}
