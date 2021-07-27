<template>
    <!-- Modal -->
    <div ref="myModal" class="modal fade" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
        <div class="modal-header">
            <h5 class="modal-title">使用教學</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">

            <h2>1. 基本介紹</h2>
            <p>
            左邊編輯區是使用 Yaml 格式去設定，可參考:<a href="https://www.ruanyifeng.com/blog/2016/07/yaml.html">YAML 語言教程</a><br>
            右邊內文編輯內容，文字範本會在結果頁籤顯示。<br>
            <img src="../assets/readme1.gif">
            </p>

            <hr>
            <h2>2. 多筆資料切換</h2>
            <p>
                支援多筆資料，可進行多筆資料切換。<br>
                <img src="../assets/readme2.gif">
            </p>
            <p>    
                最後，網址可以分享給別人，也可以加入書籤保存。
            </p>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-success" data-bs-dismiss="modal">我了解</button>
        </div>
        </div>
    </div>
    </div>
</template>
<style scoped>
img{
    width: 100%
}
.modal-dialog{
    max-width: 800px
}
</style>
<script>
import * as bootstrap from 'bootstrap'

export default {
    props:{
        open: Boolean,
    },
    watch: {
        open(val){
            console.log(this.myModal)
            if(val){
                this.myModal.show();
            }
        }
    },
    mounted(){
        this.myModal = new bootstrap.Modal(this.$refs.myModal, {
            keyboard: false
            })
        if(this.open){
            this.myModal.show()
        }
        this.$refs.myModal.addEventListener('hidden.bs.modal',  (event)=> {
            this.$emit('read')
        })
    }
}
</script>