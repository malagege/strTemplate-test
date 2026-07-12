/**
 * 回傳 debounced 函式，附 cancel() 供元件卸載時清除待執行的計時器。
 */
export function debounce(fn, wait) {
  let timer = null
  function debounced(...args) {
    if (timer !== null) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      timer = null
      fn(...args)
    }, wait)
  }
  debounced.cancel = () => {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }
  return debounced
}
