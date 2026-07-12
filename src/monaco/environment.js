import * as monaco from 'monaco-editor'
import { configureMonacoYaml } from 'monaco-yaml'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import YamlWorker from 'monaco-yaml/yaml.worker?worker'

let configured = false

/**
 * Monaco 環境設定：worker 註冊與 monaco-yaml 啟用，整個應用程式只執行一次。
 * 只註冊實際用到的 worker（yaml、handlebars 所需的 html、預設 editor worker）。
 */
export function setupMonacoEnvironment() {
  if (configured) {
    return monaco
  }
  self.MonacoEnvironment = {
    getWorker(_, label) {
      if (label === 'yaml') {
        return new YamlWorker()
      }
      if (label === 'html' || label === 'handlebars' || label === 'razor') {
        return new HtmlWorker()
      }
      return new EditorWorker()
    },
  }
  configureMonacoYaml(monaco)
  configured = true
  return monaco
}
