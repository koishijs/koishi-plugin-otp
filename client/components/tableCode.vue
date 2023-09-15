<template>
  <div class="otp-code">
    <el-progress v-if="method === 'totp'" class="otp-code-progress" type="circle" :width="38"
      :percentage="counter / period * 100">
      <template #default="{ percentage }">
        {{ counter }}
      </template>
    </el-progress>
    <span>{{ code }}</span>
    <!-- <el-button v-if="method === 'hotp'" type="primary" @click="genOTP()">更新</el-button> -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onDeactivated, defineProps } from 'vue'
import { ElProgress } from 'element-plus'
import { useOTP } from '../index'
import { Method, OTPMethod } from '../../src/types';

const props = defineProps({
  method: {
    type: String,
    required: true,
  },
  secret: {
    type: String,
    required: true,
  },
  algorithm: {
    type: String,
    default: 'sha256',
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
const method = ref<OTPMethod>(props.method as OTPMethod || Method.TOTP)
const period = ref<number>(props.period || 30)
const counter = ref<number>(props.period || 30)

let tt = 0
let timer = null

const intervalTimer = async () => {
  let now = Date.now()
  if (now - tt > 1000 || tt === 0) {
    tt = now
    if (counter.value === 0 || tt === 0) {
      counter.value = period.value
      code.value = await useOTP(method.value, {
        secret: props.secret,
        algorithm: props.algorithm as any,
        digits: props.digits,
        period: props.period,
        initial: props.initial,
        counter: props.counter,
      })
    } else {
      counter.value--
    }
  }
  timer = requestAnimationFrame(intervalTimer)
}

onMounted(async () => {
  intervalTimer()
})

onDeactivated(() => {
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
