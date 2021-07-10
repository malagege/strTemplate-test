<template>
  <div class="container">
    <div class="row h-90">
      <div class="col-lg-6">
        <div class="alert alert-danger" v-if="error" role="alert">
          解析 Yaml 發生錯誤
        </div>
        <div class="monaco" ref="monaco"></div>
      </div>
      <div class="col-lg-6">
          <div class="row">
            <div class="rol-12">
              <ul class="nav nav-tabs">
                <li class="nav-item">
                  <a class="nav-link" :class="{active: mode === 'edit'}" aria-current="page" href="javascript:;" @click="mode = 'edit'">編輯</a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" :class="{active: mode === 'result'}" href="javascript:;" @click="mode = 'result'">結果</a>
                </li>
              </ul>
            </div>
          </div>
          <div class="row" v-if="isShowControl">
            <div class="col-12">
              <button class="btn btn-default btn-primary col-6" @click="subtractDataPointer">前一筆</button>
              <button class="btn btn-default btn-primary col-6" @click="addDataPointer">後一筆</button>
            </div>
          </div>
          <div class="row h-90">
            <div class="col-12" v-show="mode === 'edit'">
              <div class="monaco" ref="monaco2"></div>
            </div>
            <div class="col-12" v-show="mode === 'result'">
              <div class="monaco" ref="monaco3"></div>
            </div>
          </div>
      </div>
    </div>
    <span v-show="false">
    {{result}}
    </span>
  </div>
</template>

<script>
import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import {parseYaml, strTemplate as testTemplate} from '../strTemplateHelper.js'

let  pageEditor3 = null
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
  data(){
    return {
      dataPointer: 0,
      uData: parseYaml("data: \n  - test1: test \n    test2: test2 \n  - test1: test \n    test2: test2 "),
      error: false,
      templateText: 'Hello World {{ test1 }}',
      mode: 'edit',
    }
  },
  mounted(){
    let pageEditor = monaco.editor.create(this.$refs.monaco, {
      value: "data: \n  - test1: test \n    test2: test2 \n  - test1: test \n    test2: test2 ",
      language: "yaml",
      automaticLayout: true,
    });
    pageEditor.onDidChangeModelContent(e=>{
      try {
        console.log(pageEditor.getValue())
        let str = pageEditor.getValue()
        let tmp = parseYaml(str)
        console.log('tmp',tmp)
        if( tmp ){
          this.error = false
          this.uData = tmp
        }else{
          this.error = true
        }
      } catch (error) {
        this.error = true
      }

      // console.log('uData',this.uData.data[this.dataPointer].test1)
      // console.log(strTemplate('Hello World: {{test1}}', this.uData.data[this.dataPointer]))
    })
    let pageEditor2 = monaco.editor.create(this.$refs.monaco2, {
      value: this.templateText,
      language: "yaml",
      automaticLayout: true,
    })
    pageEditor2.onDidChangeModelContent( e =>{
      console.log('pageEditor2 onDidChangeModelContent')
      let templateText = pageEditor2.getValue()
      this.templateText = templateText
    })
    pageEditor3 = monaco.editor.create(this.$refs.monaco3, {
      value: this.result,
      language: "yaml",
      automaticLayout: true,
      readOnly: true
    });
  },
  computed:{
    result(){
      console.log('this.uData.data',this.uData.data)
      console.log('this.templateText', this.templateText)
      if(!!!this.uData.data[this.dataPointer]){
        this.dataPointer = 0
      }
      console.log('uData',this.uData.data[this.dataPointer].test1)
      let result =  testTemplate(this.templateText, this.uData.data[this.dataPointer])
      console.log('result',result)
      if (pageEditor3){
        pageEditor3.setValue(result)
      }
      return  result
    },
    isShowControl(){
      return this.uData.data.length > 1;
    }
  },
  methods:{
    addDataPointer(){
      if( this.dataPointer < this.uData.data.length - 1 ){
        this.dataPointer++
      }
    },
    subtractDataPointer(){
      if( this.dataPointer > 0 ){
        this.dataPointer--
      }
    }

  }
}
</script>

<style scoped>
.monaco{
  border: 1px solid black;
  height: 90%;
  min-height: 400px;
}
.container{
  padding-top: 30px;
  padding-bottom: 30px;
}
.h-90{
  height: 90%;
}
</style>