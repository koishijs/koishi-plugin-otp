<template>
  <k-layout>
    <div class="otp-layout">
      <h2 v-if="!alive">Please make sure you have sufficient permissions (authority ≥ 4).</h2>
      <div v-else>
        <k-card>
          <h4>令牌管理</h4>
          <el-table :data="tokenTable" style="width: 100%;">
            <el-table-column label="ID" prop="id" />
            <el-table-column label="Name" prop="name" />
            <el-table-column label="Method" prop="method" />
            <el-table-column label="Code" prop="code">
              <template #default="props">
                <table-code :method="props.row.method" :secret="props.row.token" :algorithm="props.row.algorithm"
                  :digits="props.row.digits" :period="props.row.period" :initial="props.row.initial"
                  :counter="props.row.counter" />
              </template>
            </el-table-column>
            <el-table-column type="expand" lable="Info">
              <template #default="props">
                <div m="4">
                  <p m="t-0 b-2">Alogrithm: {{ props.row.algorithm || 'Unknown' }}</p>
                  <p m="t-0 b-2">Created At: {{ props.row.created_at }}</p>
                  <p m="t-0 b-2">Updated At: {{ props.row.updated_at }}</p>
                </div>
              </template>
            </el-table-column>x
          </el-table>
        </k-card>
      </div>
    </div>
  </k-layout>
</template>

<script setup lang="ts">
import { send } from '@koishijs/client'
import { ref, onMounted, onDeactivated } from 'vue'
import { ElTable, ElTableColumn, ElProgress } from 'element-plus'
import TableCode from './components/tableCode.vue'
import { OTPDatabase } from '../src/types'
import { useOTP } from './index'

const loading = ref(true)
const alive = ref<boolean>()
const tokenTable = ref<OTPDatabase[]>([])

send('alive/interval').then(data => {
  loading.value = false
  alive.value = data
  send('otp/list').then(data => {
    tokenTable.value = data
  })
})
</script>

<style lang="scss">
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
