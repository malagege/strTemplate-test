<template>
  <div class="wrap">
    <Header @openUseHelperEvent="setOpenUseHelperTrue"></Header>
    <StrTemplate></StrTemplate>
    <Footer></Footer>
    <UseHelper :open="open" @read="setOpenUseHelperFalse"></UseHelper>
  </div>

</template>

<script setup>
import { ref } from 'vue'
import HelloWorld from './components/HelloWorld.vue'
import Header from './components/Header.vue'
import Footer from './components/Footer.vue'
import StrTemplate from './components/StrTemplateEditor.vue'
import UseHelper from './components/UseHelper.vue'

let myStorage = window.localStorage;
let openUseHelper = !!!myStorage.getItem('openUseHelper') 
console.log('openUseHelper',openUseHelper)
let open = ref(openUseHelper)

function setOpenUseHelperFalse(){
  myStorage.setItem('openUseHelper', false);
  open.value = false
}

function setOpenUseHelperTrue(){
   open.value = true
}


// This starter template is using Vue 3 experimental <script setup> SFCs
// Check out https://github.com/vuejs/rfcs/blob/script-setup-2/active-rfcs/0000-script-setup.md
</script>

<style scoped>
.wrap{
  height: 100vh;
  display: grid;
  grid-template-rows: min-content auto 100px;
}
</style>
