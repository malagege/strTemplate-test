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
                  <a class="nav-link" :class="{active: mode === 'result'}" href="javascript:;" @click="mode = 'result';result">結果</a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" :class="{active: mode === 'result2'}" href="javascript:;" @click="mode = 'result2';result">總和</a>
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
            <div class="col-12" v-show="mode === 'result' || mode === 'result2'">
              <div class="monaco" ref="monaco3"></div>
            </div>
          </div>
          <div class="row">
            <div class="btn col-12 btn-success" @click="copyText">複製</div>
          </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as monaco from 'monaco-editor' // 用ESM載入變慢
// [Excluding features not reducing bundle size · Issue #97 · microsoft/monaco-editor-webpack-plugin](https://github.com/microsoft/monaco-editor-webpack-plugin/issues/97)
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import {parseYaml, strTemplate as testTemplate, dumpYaml} from '../strTemplateHelper.js'
import {Base64} from 'js-base64'

let  pageEditor = null
let  pageEditor2 = null
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
      templateText: '',
      mode: 'edit',
    }
  },
  mounted(){
    // 處理 url hash
    let { uData,templateText } = this.readHashUrl()
    console.log('{ uData,templateText }',{ uData,templateText })
    this.uData = uData
    this.templateText = templateText
    pageEditor = monaco.editor.create(this.$refs.monaco, {
      value: dumpYaml(uData),
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
      this.result
      // console.log('uData',this.uData.data[this.dataPointer].test1)
      // console.log(strTemplate('Hello World: {{test1}}', this.uData.data[this.dataPointer]))
    })
    pageEditor2 = monaco.editor.create(this.$refs.monaco2, {
      value: templateText,
      language: "twig",
      automaticLayout: true,
    })
    pageEditor2.onDidChangeModelContent( e =>{
      console.log('pageEditor2 onDidChangeModelContent')
      let templateText = pageEditor2.getValue()
      this.templateText = templateText
      this.result
    })
    pageEditor3 = monaco.editor.create(this.$refs.monaco3, {
      value: this.result,
      language: "twig",
      automaticLayout: true,
      readOnly: true
    })

    pageEditor3.onMouseDown(e => {
      const range = pageEditor3.getModel().getFullModelRange();
      pageEditor3.setSelection(range);
    })
    this.result
  },
  computed:{
    result(){
      console.log('this.uData.data',this.uData.data)
      console.log('this.templateText', this.templateText)
      console.log(this.mode)
      if( this.mode === 'result'){
        if(!!!this.uData.data[this.dataPointer]){
          this.dataPointer = 0
        }
        console.log('uData',this.uData.data[this.dataPointer].test1)
        let result =  testTemplate(this.templateText, this.uData.data[this.dataPointer])
        console.log('result',result)
        if (pageEditor3){
          pageEditor3.setValue(result)
        }
        this.urlChgData()
        return  result
      }else if( this.mode === 'result2'){
        let result = ''
        let strMap = this.uData.data.map(element => {
          return testTemplate(this.templateText, element)
        });
        
        console.log('result2',strMap)
        if (pageEditor3){
          pageEditor3.setValue(strMap.join('\n'))
        }
        this.urlChgData();
        return  result
      }
    },
    isShowControl(){
      if(this.mode === 'edit' || this.mode === 'result2')  return false;
      return this.uData.data.length > 1;
    }
  },
  methods:{
    copyText(){
      var text = pageEditor3.getValue()
      navigator.clipboard.writeText(text).then(function() {
        console.log('Async: Copying to clipboard was successful!')
      }, function(err) {
        console.error('Async: Could not copy text: ', err)
      });
    },
    addDataPointer(){
      if( this.dataPointer < this.uData.data.length - 1 ){
        this.dataPointer++
      }
      this.result
    },
    subtractDataPointer(){
      if( this.dataPointer > 0 ){
        this.dataPointer--
      }
      this.result
    },
    urlChgData(){
      let uData = this.uData
      let templateText = this.templateText
      let urlData = {
        uData,
        templateText
      }
      console.log('urlChgData urlData', urlData)
      if (this.templateText == ''){
        return false
      }
      // https://stackoverflow.com/questions/53102700/how-do-i-turn-an-es6-proxy-back-into-a-plain-object-pojo
      urlData = JSON.parse(JSON.stringify(urlData)) 
      console.log('urlData',urlData)
      let hash = Base64.encode(JSON.stringify(urlData))   
      //[JavaScript atob / btoa 編解碼不支援 utf8 的解決方案 - iT 邦幫忙::一起幫忙解決難題，拯救 IT 人的一天](https://ithelp.ithome.com.tw/articles/10229587)
      //https://blog.coding.net/blog/resolve-atob-decode-chinese-character-outputting-messy-code-problem-in-javascript
      //https://nelluil.postach.io/post/btoa-atob-zhi-yuan-zhong-wen-de-fang-fa
      //[原来浏览器原生支持JS Base64编码解码 « 张鑫旭-鑫空间-鑫生活](https://www.zhangxinxu.com/wordpress/2018/08/js-base64-atob-btoa-encode-decode/)
      console.log('url hash:' + hash)
      window.history.replaceState({hash},null,`#${hash}`)
    },
    readHashUrl(){
      let hash = window.location.hash
      if( hash ){
        let data = JSON.parse(Base64.decode(hash.substr(1)))
        console.log('data',data)
        let uData = data.uData
        let templateText = data.templateText
        return {uData,templateText}
        // this.uData = data.uData
        // pageEditor.setValue(dumpYaml(this.uData))
        // this.templateText = data.templateText
        // pageEditor2.setValue(this.templateText)
        // this.result
      }
      return {
        uData: this.uData,
        templateText: 'Hello World {{ test1 }}'
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