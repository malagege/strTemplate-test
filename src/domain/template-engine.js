import Template7 from 'template7'

/**
 * helper 內部拋出的可顯示錯誤，會被 renderOne 轉成 template-render AppError。
 */
export class HelperError extends Error {}

/**
 * helper 參數正規化（spec FR-04 / 決策 3）：
 * - null / undefined 回傳空字串
 * - 字串、數字、布林值以 String() 轉為字串
 * - 物件、陣列、函式、Symbol 回報錯誤，不做隱性轉換
 */
function toText(value, helperName, argName) {
  if (value === null || value === undefined) {
    return ''
  }
  const type = typeof value
  if (type === 'string') {
    return value
  }
  if (type === 'number' || type === 'boolean') {
    return String(value)
  }
  const typeName = Array.isArray(value) ? 'array' : type
  throw new HelperError(`${helperName} 的${argName}不支援 ${typeName} 型別`)
}

function pascalHelper(text) {
  const str = toText(text, 'pascal', '參數')
  if (str === '') {
    return ''
  }
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function camelHelper(text) {
  const str = toText(text, 'camel', '參數')
  if (str === '') {
    return ''
  }
  return str.charAt(0).toLowerCase() + str.slice(1)
}

function toResultIndex(index) {
  if (typeof index === 'number' && Number.isInteger(index) && index >= 0) {
    return index
  }
  if (typeof index === 'string' && /^\d+$/.test(index)) {
    return Number(index)
  }
  return null
}

function regexMatchHelper(regexStr, text, index) {
  if (regexStr === null || regexStr === undefined) {
    return ''
  }
  const source = toText(regexStr, 'regex_match', '正規表示式')
  const target = toText(text, 'regex_match', '待比對文字')
  if (target === '') {
    return ''
  }
  const resultIndex = toResultIndex(index)
  if (resultIndex === null) {
    return ''
  }
  let regex
  try {
    regex = new RegExp(source, 'gm')
  } catch (cause) {
    throw new HelperError(`regex_match 的正規表示式無效：${cause.message}`)
  }
  const m = regex.exec(target)
  if (!m) {
    return ''
  }
  return m[resultIndex] ?? ''
}

let helpersRegistered = false

/**
 * 集中註冊自訂 helper（spec FR-04），重複呼叫不會重複註冊。
 */
export function registerHelpers(engine = Template7) {
  if (engine === Template7 && helpersRegistered) {
    return
  }
  engine.registerHelper('pascal', pascalHelper)
  engine.registerHelper('camel', camelHelper)
  engine.registerHelper('regex_match', regexMatchHelper)
  if (engine === Template7) {
    helpersRegistered = true
  }
}

function fail(kind, message, cause) {
  return { ok: false, error: { kind, message, cause } }
}

function compileTemplate(templateText) {
  registerHelpers()
  try {
    // 範本原樣送入 Template7，不做反斜線改寫（spec FR-03 / 決策 1）
    return { ok: true, render: Template7.compile(templateText ?? '') }
  } catch (cause) {
    return fail('template-compile', `範本編譯失敗：${cause.message}`, cause)
  }
}

/**
 * 以單筆資料執行範本。回傳 { ok: true, output } 或 { ok: false, error }。
 */
export function renderOne(templateText, record) {
  const compiled = compileTemplate(templateText)
  if (!compiled.ok) {
    return compiled
  }
  try {
    return { ok: true, output: compiled.render(record ?? {}) }
  } catch (cause) {
    const message = cause instanceof HelperError
      ? cause.message
      : `範本執行失敗：${cause.message}`
    return fail('template-render', message, cause)
  }
}

/**
 * 對所有資料列執行範本，維持原始順序並以單一 \n 串接（spec FR-03 / 決策 5）。
 * 空陣列輸出空字串。
 */
export function renderAll(templateText, records) {
  if (!Array.isArray(records) || records.length === 0) {
    return { ok: true, output: '' }
  }
  const compiled = compileTemplate(templateText)
  if (!compiled.ok) {
    return compiled
  }
  const outputs = []
  for (const record of records) {
    try {
      outputs.push(compiled.render(record ?? {}))
    } catch (cause) {
      const message = cause instanceof HelperError
        ? cause.message
        : `範本執行失敗：${cause.message}`
      return fail('template-render', message, cause)
    }
  }
  return { ok: true, output: outputs.join('\n') }
}
