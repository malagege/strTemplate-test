<template>
  <div class="wrap">
    <AppHeader @open-use-helper="openTutorial" />
    <StrTemplateEditor />
    <AppFooter />
    <UseHelper :open="tutorialOpen" @read="closeTutorial" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AppHeader from './components/Header.vue'
import AppFooter from './components/Footer.vue'
import StrTemplateEditor from './components/StrTemplateEditor.vue'
import UseHelper from './components/UseHelper.vue'
import { createTutorialStorage } from './adapters/tutorial-storage.js'

const tutorialStorage = createTutorialStorage()

// 第一次造訪自動顯示教學；已讀後不再自動顯示（spec FR-08）
const tutorialOpen = ref(!tutorialStorage.isSeen())

function closeTutorial() {
  tutorialStorage.markSeen()
  tutorialOpen.value = false
}

function openTutorial() {
  tutorialOpen.value = true
}
</script>

<style scoped>
.wrap {
  height: 100vh;
  display: grid;
  grid-template-rows: min-content minmax(0, 1fr) min-content;
}
</style>
