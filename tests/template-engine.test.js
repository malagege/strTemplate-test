import { describe, it, expect } from 'vitest'
import Template7 from 'template7'
import { renderOne, renderAll, registerHelpers } from '../src/domain/template-engine.js'

describe('renderOne', () => {
  it('一般欄位替換', () => {
    const result = renderOne('Hello World {{ test1 }}', { test1: 'abc' })
    expect(result).toEqual({ ok: true, output: 'Hello World abc' })
  })

  it('缺少欄位輸出空字串', () => {
    const result = renderOne('x{{ missing }}y', {})
    expect(result.ok).toBe(true)
    expect(result.output).toBe('xy')
  })

  it('空範本輸出空字串', () => {
    const result = renderOne('', { a: 1 })
    expect(result).toEqual({ ok: true, output: '' })
  })

  it('Unicode／中文內容原樣輸出', () => {
    const result = renderOne('你好 {{ name }}！', { name: '世界' })
    expect(result.output).toBe('你好 世界！')
  })

  it('反斜線原樣送入 Template7（不再自動加倍）', () => {
    registerHelpers()
    const template = 'path {{ a }} \\ end'
    const expected = Template7.compile(template)({ a: 'x' })
    const result = renderOne(template, { a: 'x' })
    expect(result.ok).toBe(true)
    expect(result.output).toBe(expected)
  })

  it('編譯錯誤回報 template-compile，不拋例外', () => {
    const result = renderOne('{{', {})
    expect(result.ok).toBe(false)
    expect(result.error.kind).toBe('template-compile')
  })
})

describe('renderAll（總和模式）', () => {
  it('零筆輸出空字串', () => {
    expect(renderAll('{{ a }}', [])).toEqual({ ok: true, output: '' })
  })

  it('一筆不含換行', () => {
    expect(renderAll('{{ a }}', [{ a: '1' }]).output).toBe('1')
  })

  it('多筆維持原始順序並以 \\n 串接，結尾不加換行', () => {
    const result = renderAll('{{ a }}', [{ a: '1' }, { a: '2' }, { a: '3' }])
    expect(result.output).toBe('1\n2\n3')
  })
})

describe('pascal helper', () => {
  const run = (value) => renderOne('{{pascal v}}', { v: value })

  it('只轉第一個字元為大寫', () => {
    expect(run('helloWorld').output).toBe('HelloWorld')
  })
  it('null 回傳空字串', () => {
    expect(run(null).output).toBe('')
  })
  it('undefined 回傳空字串', () => {
    expect(run(undefined).output).toBe('')
  })
  it('數字轉為字串', () => {
    expect(run(123).output).toBe('123')
  })
  it('布林值轉為字串', () => {
    expect(run(true).output).toBe('True')
  })
  it('Unicode 不受影響', () => {
    expect(run('中文abc').output).toBe('中文abc')
  })
  it('物件回報可顯示錯誤，不輸出 [object Object]', () => {
    const result = run({ x: 1 })
    expect(result.ok).toBe(false)
    expect(result.error.kind).toBe('template-render')
    expect(result.error.message).toContain('pascal')
  })
  it('陣列回報可顯示錯誤', () => {
    expect(run([1, 2]).ok).toBe(false)
  })
})

describe('camel helper', () => {
  const run = (value) => renderOne('{{camel v}}', { v: value })

  it('只轉第一個字元為小寫', () => {
    expect(run('HelloWorld').output).toBe('helloWorld')
  })
  it('null 回傳空字串', () => {
    expect(run(null).output).toBe('')
  })
  it('數字轉為字串', () => {
    expect(run(42).output).toBe('42')
  })
})

describe('regex_match helper', () => {
  const run = (template, data) => renderOne(template, data)

  it('index 0 回傳完整匹配', () => {
    const result = run('{{regex_match "[0-9]+" v 0}}', { v: 'varchar(50)' })
    expect(result.output).toBe('50')
  })

  it('index 1 回傳第一個捕獲群組', () => {
    const result = run('{{regex_match "a(b)c" v 1}}', { v: 'xabcx' })
    expect(result.output).toBe('b')
  })

  it('只取第一次 exec 的結果', () => {
    const result = run('{{regex_match "[0-9]" v 0}}', { v: 'a1b2c3' })
    expect(result.output).toBe('1')
  })

  it('範本中的 \\\\d 經 Template7 字串規則後成為 RegExp 的 \\d', () => {
    // 範本文字為 {{regex_match "\\d+" v 0}}；Template7 產生程式碼時
    // '\\d+' 依 JS 字串規則變成 '\d+'，再交給 RegExp
    const result = run('{{regex_match "\\\\d+" v 0}}', { v: 'abc123' })
    expect(result.output).toBe('123')
  })

  it('未匹配回傳空字串', () => {
    const result = run('{{regex_match "xyz" v 0}}', { v: 'abc' })
    expect(result.output).toBe('')
  })

  it('索引超出捕獲群組數回傳空字串', () => {
    const result = run('{{regex_match "(a)" v 5}}', { v: 'abc' })
    expect(result.output).toBe('')
  })

  it('負數索引回傳空字串（索引由變數傳入）', () => {
    const result = run('{{regex_match "(a)" v idx}}', { v: 'abc', idx: -1 })
    expect(result.output).toBe('')
  })

  it('非整數索引回傳空字串', () => {
    const result = run('{{regex_match "(a)" v idx}}', { v: 'abc', idx: 1.5 })
    expect(result.output).toBe('')
  })

  it('待比對值為 null 回傳空字串', () => {
    const result = run('{{regex_match "a" v 0}}', { v: null })
    expect(result.output).toBe('')
  })

  it('待比對值為數字時先轉字串', () => {
    const result = run('{{regex_match "([0-9]+)" v 1}}', { v: 12345 })
    expect(result.output).toBe('12345')
  })

  it('無效 regex 回報可顯示的範本錯誤', () => {
    const result = run('{{regex_match "([" v 0}}', { v: 'abc' })
    expect(result.ok).toBe(false)
    expect(result.error.kind).toBe('template-render')
    expect(result.error.message).toContain('正規表示式無效')
  })

  it('待比對值為物件時回報型別錯誤', () => {
    const result = run('{{regex_match "a" v 0}}', { v: { a: 1 } })
    expect(result.ok).toBe(false)
    expect(result.error.message).toContain('regex_match')
  })
})
