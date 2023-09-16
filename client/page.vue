<template>
  <k-layout>
    <div class="otp-layout">
      <h2 v-if="!alive">Please make sure you have sufficient permissions (authority ≥ 4).</h2>
      <div v-else>
        <k-card>
          <h4>Tokens</h4>
          <el-table :data="tokenTable" style="width: 100%;">
            <el-table-column label="ID" prop="id" />
            <el-table-column label="Name" prop="name" />
            <el-table-column label="Method" prop="method">
              <template #default="props">
                {{ props.row.method.toUpperCase() }}
              </template>
            </el-table-column>
            <el-table-column label="Code" prop="code">
              <template #default="props">
                <table-code :method="props.row.method" :id="props.row.id" :digits="props.row.digits"
                  :period="props.row.period" :initial="props.row.initial" :counter="props.row.counter" />
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
            </el-table-column>
            <el-table-column label="Edit">
              <template #default="props">
                <el-button type="primary" disabled @click="sender('edit', props.row.id)">Edit</el-button>
                <el-button type="warning" disabled @click="sender('remove', props.row.id)">Remove</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-button type="primary" disabled @click="sender('add')">Create</el-button>
        </k-card>
      </div>
    </div>
  </k-layout>
</template>

<script setup lang="ts">
import { send } from '@koishijs/client'
import { ref } from 'vue'
import { ElTable, ElTableColumn, ElButton } from 'element-plus'
import TableCode from './components/tableCode.vue'
import { OTPDatabase } from '../src/types'

const loading = ref(true)
const alive = ref<boolean>()
const tokenTable = ref<OTPDatabase[]>([])

const sender = (activity: any, id?: number, data?) => {
  // @ts-ignore
  send(`otp/${activity}`, id, data)
}

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
