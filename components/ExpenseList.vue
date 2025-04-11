<template>
  <div class="bg-white rounded-lg shadow p-6">
    <h2 class="text-xl font-bold mb-6">Danh sách chi tiêu</h2>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in itemsPerPage" :key="i" 
        class="animate-pulse bg-gray-100 h-16 rounded-lg">
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="!expenses.length" class="text-center py-8 text-gray-500">
      Không có chi tiêu nào
    </div>

    <!-- Expense list -->
    <div v-else class="space-y-4">
      <div v-for="expense in expenses" :key="expense.id" 
        class="bg-white rounded-lg border p-4">
        <div class="font-medium mb-2">{{ expense.title }}</div>
        <div class="space-y-2 text-sm">
          <div class="grid grid-cols-2">
            <div class="text-gray-500">Ngày:</div>
            <div>{{ formatDate(expense.date) }}</div>
          </div>
          <div class="grid grid-cols-2">
            <div class="text-gray-500">Số tiền:</div>
            <div>{{ formatCurrency(expense.amount) }}</div>
          </div>
          <div class="grid grid-cols-2">
            <div class="text-gray-500">Người trả:</div>
            <div>{{ getPayerName(expense.payer) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="mt-4 flex justify-center space-x-2">
      <button 
        @click="prevPage"
        :disabled="currentPage === 1 || loading"
        class="px-3 py-1 rounded-md text-sm"
        :class="[
          currentPage === 1 || loading
            ? 'bg-gray-100 text-gray-400'
            : 'bg-green-100 text-green-700 hover:bg-green-200'
        ]"
      >
        Trước
      </button>
      <button 
        @click="nextPage"
        :disabled="currentPage === totalPages || loading"
        class="px-3 py-1 rounded-md text-sm"
        :class="[
          currentPage === totalPages || loading
            ? 'bg-gray-100 text-gray-400'
            : 'bg-green-100 text-green-700 hover:bg-green-200'
        ]"
      >
        Sau
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useUserStore } from '~/stores/useUserStore'
import { storeToRefs } from 'pinia'

const props = defineProps<{
  expenses: any[]
  currentPage: number
  totalItems: number
  itemsPerPage: number
  loading: boolean
}>()

const emit = defineEmits(['pageChange'])

const userStore = useUserStore()
const { users } = storeToRefs(userStore)

const totalPages = computed(() => Math.ceil(props.totalItems / props.itemsPerPage))

onMounted(() => {
  console.log('ExpenseList mounted with props:', props)
})

// Utility functions
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('vi-VN')
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount)
}

const getPayerName = (payerId: string) => {
  const payer = users.value.find(u => u.id === payerId)
  return payer?.name || 'Unknown'
}

// Navigation methods
const nextPage = () => {
  if (!props.loading && props.currentPage < totalPages.value) {
    emit('pageChange', props.currentPage + 1)
  }
}

const prevPage = () => {
  if (!props.loading && props.currentPage > 1) {
    emit('pageChange', props.currentPage - 1)
  }
}
</script>

