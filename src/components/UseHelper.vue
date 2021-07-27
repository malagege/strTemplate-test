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
            使用教學
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-success" data-bs-dismiss="modal">我了解</button>
        </div>
        </div>
    </div>
    </div>
</template>
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