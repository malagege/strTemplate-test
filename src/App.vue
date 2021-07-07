<template>
  <div class="wrap">
    <Header></Header>
    <StrTemplate></StrTemplate>
    <Footer></Footer>
  </div>

</template>

<script setup>
import HelloWorld from './components/HelloWorld.vue'
import Header from './components/Header.vue'
import Footer from './components/Footer.vue'
import StrTemplate from './components/StrTemplateEditor.vue'

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
