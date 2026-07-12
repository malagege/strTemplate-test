<template>
  <!-- 使用教學 Modal -->
  <div
    ref="modalEl"
    class="modal fade"
    data-bs-backdrop="static"
    data-bs-keyboard="false"
    tabindex="-1"
    aria-labelledby="useHelperTitle"
    aria-hidden="true"
  >
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 id="useHelperTitle" class="modal-title">使用教學</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="關閉"></button>
        </div>
        <div class="modal-body">
          <h2>1. 基本介紹</h2>
          <p>
            左邊編輯區使用 Yaml 格式設定資料，可參考：
            <a href="https://www.ruanyifeng.com/blog/2016/07/yaml.html" target="_blank" rel="noopener noreferrer">YAML 語言教程</a><br />
            右邊編輯範本內容，文字範本會在「結果」頁籤顯示。<br />
            <img :src="readme1Url" alt="基本操作示範動畫" />
          </p>
          <hr />
          <h2>2. 多筆資料切換</h2>
          <p>
            支援多筆資料，可用「前一筆／後一筆」切換。<br />
            <img :src="readme2Url" alt="多筆資料切換示範動畫" />
          </p>
          <h2>3. 分享網址</h2>
          <p>
            網址會自動包含目前的資料與範本，可以分享給別人，也可以加入書籤保存。
          </p>
          <p class="alert alert-warning">
            注意：分享網址內含你輸入的完整資料與範本。網址可能被書籤、瀏覽器歷史、
            通訊軟體或第三方服務留存，請勿在內容中放入敏感資料。
          </p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-success" data-bs-dismiss="modal">我了解</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Modal from 'bootstrap/js/dist/modal'
import readme1Url from '../assets/readme1.gif'
import readme2Url from '../assets/readme2.gif'

const props = defineProps({
  open: { type: Boolean, default: false },
})
const emit = defineEmits(['read'])

const modalEl = ref(null)
let modal = null

function handleHidden() {
  emit('read')
}

onMounted(() => {
  modal = new Modal(modalEl.value, { keyboard: false })
  modalEl.value.addEventListener('hidden.bs.modal', handleHidden)
  if (props.open) {
    modal.show()
  }
})

watch(
  () => props.open,
  (value) => {
    if (!modal) {
      return
    }
    if (value) {
      modal.show()
    } else {
      modal.hide()
    }
  }
)

onBeforeUnmount(() => {
  if (modalEl.value) {
    modalEl.value.removeEventListener('hidden.bs.modal', handleHidden)
  }
  if (modal) {
    modal.dispose()
    modal = null
  }
})
</script>

<style scoped>
img {
  width: 100%;
}
.modal-dialog {
  max-width: 800px;
}
</style>
