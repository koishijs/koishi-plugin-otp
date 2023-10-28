<template>
  <div class="otp-code">
    <el-progress v-if="method === 'totp'" class="otp-code-progress" type="circle" :width="38"
      :percentage="counter / period * 100">
      <template #default="{}">
        {{ counter }}
      </template>
    </el-progress>
    <span>{{ code }}</span>
    <!-- <el-button v-if="method === 'hotp'" type="primary" @click="genOTP()">更新</el-button> -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onDeactivated, defineProps } from 'vue'
import { send } from '@koishijs/client';
import { ElProgress } from 'element-plus'

const props = defineProps({
  method: {
    type: String,
    required: true,
  },
  id: {
    type: Number,
    required: true,
  },
  digits: {
    type: Number,
    default: 6,
  },
  period: Number,
  initial: Number,
  counter: Number,
})

const code = ref<string>('000000')
const method = ref(props.method || 'totp')
const period = ref<number>(props.period || 30)
const counter = ref<number>(props.period || 30)

let tt = 0
let timer = null

const intervalTimer = async () => {
  let now = Date.now()
  if (now - tt > 1000 || tt === 0) {
    tt = now
    if (tt === 0 || counter.value === 0) {
      counter.value = period.value
      code.value = await send('otp/gen', props.id)
    } else {
      counter.value--
    }
  }
  timer = requestAnimationFrame(intervalTimer)
}

onMounted(async () => {
  tt = 0 // GC
  intervalTimer()
})

onDeactivated(() => {
  tt = 0 // GC
  cancelAnimationFrame(timer)
})
</script>

<style lang="scss">
.otp-code {
  display: flex;
  align-items: center;

  .otp-code-progress {
    margin-right: 10px;

    >.el-progress__text {
      min-width: auto !important;
    }
  }
}
</style>
