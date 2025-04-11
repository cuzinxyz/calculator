<template>
  <div class="bg-white rounded-lg shadow p-4 sm:p-6 mt-6">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl sm:text-2xl font-bold">Danh sách chi tiêu</h2>
    </div>

    <!-- Table cho desktop -->
    <div class="hidden sm:block overflow-x-auto mb-8">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên chi tiêu</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số tiền</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người trả</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người tham gia</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="expense in expenses" :key="expense.id">
            <td class="px-6 py-4">{{ expense.title }}</td>
            <td class="px-6 py-4">{{ formatDate(expense.date) }}</td>
            <td class="px-6 py-4">{{ formatCurrency(expense.amount) }}</td>
            <td class="px-6 py-4">{{ getPayerName(expense.payer) }}</td>
            <td class="px-6 py-4">{{ expense.participants.join(', ') }}</td>
            <td class="px-6 py-4 text-right space-x-2">
              <button
                v-if="role === 'spender'"
                @click="$emit('edit', expense)"
                class="text-indigo-600 hover:text-indigo-900"
              >
                Sửa
              </button>
              <button
                v-if="role === 'spender'"
                @click="deleteExpense(expense.id)"
                class="text-red-600 hover:text-red-900"
              >
                Xóa
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Card layout cho mobile -->
    <div class="sm:hidden space-y-4 mb-8">
      <div v-for="expense in expenses" :key="expense.id" 
        class="bg-gray-50 rounded-lg p-4 space-y-2">
        <div class="font-medium">{{ expense.title }}</div>
        <div class="grid grid-cols-2 text-sm gap-2">
          <div class="text-gray-500">Ngày:</div>
          <div>{{ formatDate(expense.date) }}</div>
          
          <div class="text-gray-500">Số tiền:</div>
          <div class="font-medium text-green-600">{{ formatCurrency(expense.amount) }}</div>
          
          <div class="text-gray-500">Người trả:</div>
          <div>{{ getPayerName(expense.payer) }}</div>
          
          <div class="text-gray-500">Người tham gia:</div>
          <div>{{ expense.participants.join(', ') }}</div>
        </div>
        <div class="flex justify-end space-x-3 pt-2 border-t border-gray-200 mt-2">
          <button
            v-if="role === 'spender'"
            @click="$emit('edit', expense)"
            class="text-indigo-600 hover:text-indigo-900 text-sm"
          >
            Sửa
          </button>
          <button
            v-if="role === 'spender'"
            @click="deleteExpense(expense.id)"
            class="text-red-600 hover:text-red-900 text-sm"
          >
            Xóa
          </button>
        </div>
      </div>
    </div>

    <h2 class="text-xl sm:text-2xl font-bold mb-4">Kết quả chia tiền</h2>
    
    <div class="space-y-6">
      <!-- Tổng kết cá nhân -->
      <div>
        <h3 class="text-lg font-semibold mb-2">Tổng kết cá nhân</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div v-for="(amount, user) in personalTotals" :key="user" 
            class="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
            <span class="font-medium">{{ getPayerName(user) }}</span>
            <span :class="[
              'font-medium',
              amount < 0 ? 'text-red-500' : 'text-green-500'
            ]">
              {{ formatCurrency(amount) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Giao dịch cần thực hiện -->
      <div>
        <h3 class="text-lg font-semibold mb-2">Giao dịch cần thực hiện</h3>
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
                  :class="[
                    'w-full py-2 px-3 rounded-md text-sm font-medium',
                    transaction.completed 
                      ? 'bg-gray-200 text-gray-700' 
                      : 'bg-green-100 text-green-700'
                  ]"
                >
                  {{ transaction.completed ? 'Đã chuyển' : 'Đánh dấu đã chuyển' }}
                </button>
                <button
                  @click="showQR(transaction)"
                  class="w-full py-2 px-3 rounded-md text-sm font-medium bg-green-50 text-green-600"
                >
                  Tạo QR chuyển tiền
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
                  :class="[
                    'px-3 py-1 rounded-md text-sm',
                    transaction.completed 
                      ? 'bg-gray-200 text-gray-700' 
                      : 'bg-green-100 text-green-700'
                  ]"
                >
                  {{ transaction.completed ? 'Đã chuyển' : 'Đánh dấu đã chuyển' }}
                </button>
                <button
                  @click="showQR(transaction)"
                  class="px-3 py-1 rounded-md text-sm bg-green-50 text-green-600"
                >
                  Tạo QR chuyển tiền
                </button>
              </div>
            </div>
            
            <div 
              v-if="transaction.completed" 
              class="text-sm text-gray-500 mt-2"
            >
              Hoàn thành: {{ formatDateTime(transaction.completed_at) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- QR Code Modal -->
    <div v-if="showQRModal" 
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-sm">
        <div class="p-4 border-b">
          <h3 class="text-lg font-bold">QR Code chuyển khoản</h3>
        </div>
        <div class="p-4">
          <img :src="currentQRUrl" alt="QR Code" class="w-full">
        </div>
        <div class="p-4 border-t">
          <button
            @click="showQRModal = false"
            class="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '~/stores/useUserStore'
import { storeToRefs } from 'pinia'

const props = defineProps<{
  expenses: any[]
  role: 'payer' | 'spender'
}>()

const emit = defineEmits(['edit', 'refresh'])

const userStore = useUserStore()
const { users } = storeToRefs(userStore)
const showQRModal = ref(false)
const currentQRUrl = ref('')
const savedTransactions = ref([])

// Optimize: Memoize personal totals calculation
const personalTotals = computed(() => {
  if (!users.value?.length || !props.expenses?.length) return {}
  
  // Initialize totals với ID của user thay vì name
  const totals = Object.fromEntries(
    users.value.map(user => [user.id, 0])
  )

  // Tính toán cho từng expense
  props.expenses.forEach(expense => {
    const totalParticipants = expense.participants.length
    if (totalParticipants === 0) return

    // Số tiền mỗi người phải trả
    const amountPerPerson = expense.amount / totalParticipants

    // Cộng tiền cho người trả
    totals[expense.payer] += expense.amount

    // Trừ tiền những người tham gia
    expense.participants.forEach(participantName => {
      const participant = users.value.find(u => u.name === participantName)
      if (participant) {
        totals[participant.id] -= amountPerPerson
      }
    })
  })

  return totals
})

// Optimize: Memoize transactions calculation
const transactions = computed(() => {
  const totals = personalTotals.value
  if (!Object.keys(totals).length) return []

  // Tách người nợ và người cho nợ
  const debtors = []
  const creditors = []

  Object.entries(totals).forEach(([userId, amount]) => {
    if (amount < 0) {
      debtors.push({ id: userId, amount: -amount }) // Đổi dấu để có số dương
    } else if (amount > 0) {
      creditors.push({ id: userId, amount })
    }
  })

  // Sắp xếp theo số tiền giảm dần
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
      amount: Math.round(amount), // Làm tròn số
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

// Computed để hiển thị tên người dùng trong giao dịch
const mergedTransactions = computed(() => {
  return transactions.value.map(transaction => {
    const fromUser = users.value.find(u => u.id === transaction.from)
    const toUser = users.value.find(u => u.id === transaction.to)
    return {
      ...transaction,
      fromName: fromUser?.name || 'Unknown',
      toName: toUser?.name || 'Unknown'
    }
  })
})

// Optimize: Create QR URL generator
const generateQRUrl = (transaction: any) => {
  const toUser = users.value.find(u => u.id === transaction.to)
  const fromUser = users.value.find(u => u.id === transaction.from)
  if (!toUser || !fromUser) return ''

  const description = `${fromUser.name} ck ${toUser.name} tien ${props.expenses.map(e => e.title).join(' ')}`
  
  return `https://qr.sepay.vn/img?acc=${toUser.account_number}&bank=${toUser.bank}&amount=${transaction.amount}&des=${encodeURIComponent(description)}&template=compact&download=false`
}

const showQR = (transaction: any) => {
  currentQRUrl.value = generateQRUrl(transaction)
  showQRModal.value = true
}

// Utility functions
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('vi-VN')
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

const toggleTransactionStatus = async (transaction) => {
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
  }
}

const deleteExpense = async (id: string) => {
  if (!confirm('Bạn có chắc chắn muốn xóa chi tiêu này?')) return

  try {
    const { error } = await useSupabaseClient()
      .from('expenses')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    emit('refresh')
  } catch (error) {
    console.error('Error deleting expense:', error)
  }
}

// Initialize component
onMounted(async () => {
  if (!users.value?.length) {
    await userStore.fetchUsers()
  }
  await loadSavedTransactions()
})

// Thêm helper function để lấy tên người trả
const getPayerName = (payerId: string) => {
  const payer = users.value.find(u => u.id === payerId)
  return payer?.name || 'Unknown'
}
</script>
