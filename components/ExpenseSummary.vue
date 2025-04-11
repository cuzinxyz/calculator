<template>
  <div class="bg-white rounded-lg shadow p-6">
    <h2 class="text-xl font-bold mb-6 inline-flex items-center gap-1">
      <BellIcon class="h-8 w-8 text-green-500" />
      Tổng kết và thanh toán
    </h2>
    
    <div class="space-y-10">
      <!-- Tổng kết số tiền -->
      <div>
        <h3 class="text-md font-semibold mb-2">Số tiền cần thanh toán</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div v-for="(amount, user) in personalTotals" :key="user" 
            class="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
            <span class="font-medium">{{ getPayerName(user) }}</span>
            <span :class="[
              'font-medium',
              amount < 0 ? 'text-red-500' : 'text-green-500'
            ]">
              <span class="text-xs text-gray-400">
                {{ amount < 0 ? '(cần trả)' : '(được nhận)' }}
              </span>
              {{ formatCurrency(amount) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Danh sách thanh toán -->
      <div>
        <h3 class="text-md font-semibold mb-2">Các khoản cần thanh toán</h3>
        <div class="space-y-4">
          <div 
            v-for="transaction in mergedTransactions" 
            :key="transaction.id || `${transaction.from}-${transaction.to}-${transaction.amount}`"
            :class="[
              'border p-4 rounded-lg transition-colors duration-200',
              transaction.completed ? 'bg-gray-100' : 'bg-white'
            ]"
          >
            <!-- Mobile layout -->
            <div class="flex flex-col sm:hidden">
              <div class="flex items-center space-x-2 mb-2">
                <span class="font-medium">{{ transaction.fromName }}</span>
                <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                <span class="font-medium">{{ transaction.toName }}</span>
              </div>
              <div class="text-lg font-medium text-green-600 mb-3">
                {{ formatCurrency(transaction.amount) }}
              </div>
              <div class="flex flex-col space-y-2">
                <button
                  @click="toggleTransactionStatus(transaction)"
                  :disabled="loadingTransactions.has(transaction.id || `${transaction.from}-${transaction.to}`)"
                  :class="[
                    'w-full py-2 px-3 rounded-md text-sm font-medium transition-colors duration-200',
                    loadingTransactions.has(transaction.id || `${transaction.from}-${transaction.to}`)
                      ? 'bg-gray-300 cursor-not-allowed'
                      : transaction.completed 
                        ? 'bg-gray-200 text-gray-700' 
                        : 'bg-green-100 text-green-700'
                  ]"
                >
                  {{ transaction.completed ? 'Đã hoàn thành' : 'Xác nhận đã chuyển khoản' }}
                  <span v-if="loadingTransactions.has(transaction.id || `${transaction.from}-${transaction.to}`)">
                    ...
                  </span>
                </button>
                <button
                  @click="showQR(transaction)"
                  class="w-full py-2 px-3 rounded-md text-sm font-medium bg-green-50 text-green-600"
                >
                  Tạo mã QR chuyển khoản
                </button>
              </div>
            </div>

            <!-- Desktop layout -->
            <div class="hidden sm:flex sm:justify-between sm:items-center">
              <div>
                <span class="font-medium">{{ transaction.fromName }}</span>
                <span class="mx-2">→</span>
                <span class="font-medium">{{ transaction.toName }}</span>
                <span class="ml-2">{{ formatCurrency(transaction.amount) }}</span>
              </div>
              <div class="flex items-center space-x-2">
                <button
                  @click="toggleTransactionStatus(transaction)"
                  :disabled="loadingTransactions.has(transaction.id || `${transaction.from}-${transaction.to}`)"
                  :class="[
                    'px-3 py-1 rounded-md text-sm transition-colors duration-200',
                    loadingTransactions.has(transaction.id || `${transaction.from}-${transaction.to}`)
                      ? 'bg-gray-300 cursor-not-allowed'
                      : transaction.completed 
                        ? 'bg-gray-200 text-gray-700' 
                        : 'bg-green-100 text-green-700'
                  ]"
                >
                  {{ transaction.completed ? 'Đã hoàn thành' : 'Xác nhận đã chuyển khoản' }}
                  <span v-if="loadingTransactions.has(transaction.id || `${transaction.from}-${transaction.to}`)">
                    ...
                  </span>
                </button>
                <button
                  @click="showQR(transaction)"
                  class="px-3 py-1 rounded-md text-sm bg-green-50 text-green-600"
                >
                  Tạo mã QR chuyển khoản
                </button>
              </div>
            </div>
            
            <div 
              v-if="transaction.completed" 
              class="text-sm text-gray-500 mt-2"
            >
              Đã hoàn thành lúc: {{ formatDateTime(transaction.completed_at) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- QR Code Modal -->
  <div v-if="showQRModal" 
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 !m-0">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-sm">
        <div class="p-4 border-b">
          <h3 class="text-lg font-bold">Mã QR chuyển khoản</h3>
        </div>
        <div class="p-4">
          <img :src="currentQRUrl" alt="Mã QR chuyển khoản" class="w-full">
        </div>
        <div class="p-6 border-t bg-gray-50">
          <div class="flex flex-col sm:flex-row gap-3">
            <button
              @click="downloadQr"
              class="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-2.5 px-4 rounded-xl 
                     hover:from-green-600 hover:to-green-700 transform hover:scale-[1.02] 
                     transition-all duration-200 shadow-sm hover:shadow
                     flex items-center justify-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              Tải xuống QR
            </button>

            <button
              @click="showQRModal = false"
              class="flex-1 bg-white text-gray-700 py-2.5 px-4 rounded-xl border border-gray-200
                     hover:bg-gray-50 transform hover:scale-[1.02] 
                     transition-all duration-200 shadow-sm hover:shadow
                     flex items-center justify-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useUserStore } from '~/stores/useUserStore'
import { storeToRefs } from 'pinia'
import { BellIcon } from '@heroicons/vue/24/outline'

const userStore = useUserStore()
const { users } = storeToRefs(userStore)
const currentQRUrl = ref('')
const showQRModal = ref(false)
const savedTransactions = ref([])
const loadingTransactions = ref(new Set())
const allExpenses = ref([])

// Thay đổi props, không còn phụ thuộc vào expenses từ parent
const props = defineProps<{
  // Không cần props expenses nữa
}>()

// Thêm method để load tất cả expenses
const loadAllExpenses = async () => {
  try {
    const supabase = useSupabaseClient()
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false })
    
    if (error) throw error
    allExpenses.value = data || []
  } catch (error) {
    console.error('Error loading all expenses:', error)
  }
}

// Sửa lại computed personalTotals để dùng allExpenses
const personalTotals = computed(() => {
  if (!users.value?.length || !allExpenses.value?.length) return {}
  
  const totals = Object.fromEntries(
    users.value.map(user => [user.id, 0])
  )

  allExpenses.value.forEach(expense => {
    const totalParticipants = expense.participants.length
    if (totalParticipants === 0) return

    const amountPerPerson = expense.amount / totalParticipants
    totals[expense.payer] += expense.amount

    expense.participants.forEach(participantName => {
      const participant = users.value.find(u => u.name === participantName)
      if (participant) {
        totals[participant.id] -= amountPerPerson
      }
    })
  })

  return totals
})

// Calculate transactions
const mergedTransactions = computed(() => {
  const totals = personalTotals.value
  if (!Object.keys(totals).length) return []

  const debtors = []
  const creditors = []

  Object.entries(totals).forEach(([userId, amount]) => {
    if (amount < 0) {
      debtors.push({ id: userId, amount: -amount })
    } else if (amount > 0) {
      creditors.push({ id: userId, amount })
    }
  })

  debtors.sort((a, b) => b.amount - a.amount)
  creditors.sort((a, b) => b.amount - a.amount)

  const result = []
  let debtorIdx = 0
  let creditorIdx = 0

  while (debtorIdx < debtors.length && creditorIdx < creditors.length) {
    const debtor = debtors[debtorIdx]
    const creditor = creditors[creditorIdx]
    const amount = Math.min(debtor.amount, creditor.amount)
    
    // Tìm transaction đã lưu
    const existingTransaction = savedTransactions.value.find(t => 
      t.from_user === debtor.id && t.to_user === creditor.id
    )

    result.push({
      from: debtor.id,
      to: creditor.id,
      amount: Math.round(amount),
      fromName: getPayerName(debtor.id),
      toName: getPayerName(creditor.id),
      completed: existingTransaction?.completed || false,
      completed_at: existingTransaction?.completed_at || null,
      id: existingTransaction?.id
    })

    debtor.amount -= amount
    creditor.amount -= amount

    if (debtor.amount < 0.01) debtorIdx++
    if (creditor.amount < 0.01) creditorIdx++
  }

  return result
})

const showQR = async (transaction: any) => {
  if (!transaction) {
    console.error('Transaction is undefined')
    return
  }

  try {
    const toUser = await users.value.find(u => u.id === transaction.to)
    const fromUser = await users.value.find(u => u.id === transaction.from)
    
    if (!toUser || !fromUser) {
      console.error('Could not find users for transaction')
      return
    }

    const description = `${fromUser.name} ck ${toUser.name}`
    const url = `https://qr.sepay.vn/img?acc=${toUser.account_number}&bank=${toUser.bank}&amount=${transaction.amount}&des=${encodeURIComponent(description)}&template=compact&download=false`
    
    currentQRUrl.value = url
    showQRModal.value = true
    
  } catch (error) {
    console.error('Error in showQR:', error)
  }
}

const toggleTransactionStatus = async (transaction) => {
  // Kiểm tra nếu transaction đang được xử lý
  if (loadingTransactions.value.has(transaction.id || `${transaction.from}-${transaction.to}`)) {
    return
  }

  const transactionKey = transaction.id || `${transaction.from}-${transaction.to}`
  loadingTransactions.value.add(transactionKey)
  
  const supabase = useSupabaseClient()
  
  try {
    if (transaction.id) {
      const { error } = await supabase
        .from('transactions')
        .update({ 
          completed: !transaction.completed,
          completed_at: !transaction.completed ? new Date().toISOString() : null
        })
        .eq('id', transaction.id)
      
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('transactions')
        .insert([{
          from_user: transaction.from,
          to_user: transaction.to,
          amount: transaction.amount,
          completed: true,
          completed_at: new Date().toISOString()
        }])
      
      if (error) throw error
    }
    
    await loadSavedTransactions()
  } catch (error) {
    console.error('Error updating transaction:', error)
  } finally {
    // Xóa loading state sau khi hoàn thành
    loadingTransactions.value.delete(transactionKey)
  }
}

// Database operations
const loadSavedTransactions = async () => {
  try {
    const { data, error } = await useSupabaseClient()
      .from('transactions')
      .select('*')
    
    if (error) throw error
    savedTransactions.value = data
  } catch (error) {
    console.error('Error loading transactions:', error)
  }
}

const formatDateTime = (dateString: string) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const downloadQr = () => {
  const url = new URL(currentQRUrl.value)
  url.searchParams.set('download', 'true')
  window.location.href = url.toString()
}

// Initialize component
onMounted(async () => {
  if (!users.value?.length) {
    await userStore.fetchUsers()
  }
  await Promise.all([
    loadAllExpenses(),
    loadSavedTransactions()
  ])
})

// Thêm method để refresh data
const refreshData = async () => {
  await Promise.all([
    loadAllExpenses(),
    loadSavedTransactions()
  ])
}

const getPayerName = (payerId: string) => {
  const payer = users.value.find(u => u.id === payerId)
  return payer?.name || 'Unknown'
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount)
}

// Export method để parent component có thể gọi khi cần
defineExpose({
  refreshData
})
</script>
