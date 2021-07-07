<template>
  <div class="container">
    <div class="monaco" ref="monaco"></div>
  </div>
</template>

<script>
// import {editor} from 'monaco-editor'
import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') {
      return new jsonWorker()
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new cssWorker()
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new htmlWorker()
    }
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker()
    }
    return new editorWorker()
  }
}
export default {
  mounted(){
    let pageEditor = monaco.editor.create(this.$refs.monaco, {
      value: "function hello() {\n\talert('Hello world!');\n}",
      language: "javascript"
    });
  }
}
</script>

<style scoped>
.monaco{
  border: 1px solid black;
  height: 400px;
}
</style>