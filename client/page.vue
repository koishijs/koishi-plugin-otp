<template>
  <k-layout>
    <div class="otp-layout">
      <k-card>OTP</k-card>
    </div>
  </k-layout>
</template>

<script setup lang="ts">
import { send } from '@koishijs/client'
import { ref } from 'vue'

const loading = ref(true)
send('alive/interval').then(data => {
  loading.value = false
})
</script>

<style scoped lang="scss">
.otp-layout {
  width: 1100px;
  height: auto;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  margin-top: var(--card-margin);
}
@media (max-width: 1200px) {
  .otp-layout {
    width: 100%;
  }
}
</style>
