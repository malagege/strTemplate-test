<template>
  <div class="container">
    <div class="row h-90">
      <div class="col-lg-6">
        <div class="alert alert-danger" role="alert">
          This is a danger alert—check it out!
        </div>
        <div class="monaco" ref="monaco"></div>
      </div>
      <div class="col-lg-6">
          <div class="row">
            <div class="rol-12">
              <ul class="nav nav-tabs">
                <li class="nav-item">
                  <a class="nav-link active" aria-current="page" href="#">編輯</a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" href="javascript:;">結果</a>
                </li>
              </ul>
            </div>
          </div>
          <div class="row">
            <div class="col-12">
              <button class="btn btn-default btn-primary col-6">前一筆</button>
              <button class="btn btn-default btn-primary col-6">後一筆</button>
            </div>
          </div>
          <div class="row h-90">
            <div class="col-12">
              <div class="monaco" ref="monaco2"></div>
            </div>
          </div>
      </div>
    </div>
  </div>
</template>

<script>
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
      language: "javascript",
      automaticLayout: true,
    });
    let pageEditor2 = monaco.editor.create(this.$refs.monaco2, {
      value: "function hello() {\n\talert('Hello world!');\n}",
      language: "javascript",
      automaticLayout: true,
    });
  }
}
</script>

<style scoped>
.monaco{
  border: 1px solid black;
  height: 90%;
}
.container{
  padding-top: 30px;
  padding-bottom: 30px;
}
.h-90{
  height: 90%;
}
</style>