<template>
  <nav class="navbar navbar-light bg-light">
  <div class="container justify-content-start">
    <a class="navbar-brand" href="#">
      <img src="https://getbootstrap.com/docs/5.0/assets/brand/bootstrap-logo.svg" alt="" width="30" height="24" class="d-inline-block align-text-top">
      strTemplate
    </a>
    <div id="navbarSupportedContent">
    <ul class="navbar-nav me-auto mb-2 mb-lg-0">
      <li class="nav-item">
        <button class="btn" @click="$emit('openUseHelperEvent')">使用教學</button>
      </li>
    </ul>
    </div>
  </div>

</nav>
</template>

<script>
export default {

}
</script>

<style>

</style>