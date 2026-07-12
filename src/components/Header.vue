<template>
  <nav class="navbar bg-light">
    <div class="container justify-content-start">
      <span class="navbar-brand">
        <img :src="logoUrl" alt="" width="30" height="30" class="d-inline-block align-text-top" />
        strTemplate
      </span>
      <ul class="navbar-nav me-auto mb-2 mb-lg-0">
        <li class="nav-item">
          <button type="button" class="btn btn-outline-secondary" @click="$emit('open-use-helper')">使用教學</button>
        </li>
      </ul>
    </div>
  </nav>
</template>

<script setup>
import logoUrl from '../assets/logo.png'

defineEmits(['open-use-helper'])
</script>
