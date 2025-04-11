<template>
  <div class="bg-white rounded-lg shadow p-6 mt-6">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-2xl font-bold">Danh sách chi tiêu</h2>
    </div>

    <div class="overflow-x-auto mb-8">
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
            <td class="px-6 py-4">{{ expense.payer }}</td>
            <td class="px-6 py-4">{{ expense.participants.join(', ') }}</td>
            <td class="px-6 py-4 text-right space-x-2">
              <button
                @click="$emit('edit', expense)"
                class="text-indigo-600 hover:text-indigo-900"
              >
                Sửa
              </button>
              <button
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

    <h2 class="text-2xl font-bold mb-4">Kết quả chia tiền</h2>
    
    <div class="space-y-6">
      <div>
        <h3 class="text-lg font-semibold mb-2">Tổng kết cá nhân</h3>
        <div class="space-y-2">
          <div v-for="(amount, user) in personalTotals" :key="user" class="flex justify-between">
            <span>{{ user }}</span>
            <span :class="amount < 0 ? 'text-red-500' : 'text-green-500'">
              {{ formatCurrency(amount) }}
            </span>
          </div>
        </div>
      </div>

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
            <div class="flex justify-between items-center">
              <div>
                <span class="font-medium">{{ transaction.from }}</span>
                <span class="mx-2">→</span>
                <span class="font-medium">{{ transaction.to }}</span>
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
                  class="text-green-500 hover:text-green-600"
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
    <div v-if="showQRModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div class="bg-white p-6 rounded-lg max-w-sm w-full">
        <h3 class="text-lg font-bold mb-4">QR Code chuyển khoản</h3>
        <img :src="currentQRUrl" alt="QR Code" class="w-full">
        <button
          @click="showQRModal = false"
          class="mt-4 w-full bg-green-500 text-white py-2 rounded-lg"
        >
          Đóng
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUsers } from '~/composables/useUsers'

const props = defineProps<{
  expenses: any[]
}>()

const { users, fetchUsers } = useUsers()

const showQRModal = ref(false)
const currentQRUrl = ref('')

const personalTotals = computed(() => {
  const totals: Record<string, number> = {}
  
  users.value.forEach(user => {
    totals[user.name] = 0
  })

  props.expenses.forEach(expense => {
    const amount = Number(expense.amount)
    if (isNaN(amount)) return
    
    const payer = expense.payer
    const participants = expense.participants.filter(p => 
      users.value.some(u => u.name === p)
    )

    if (participants.length === 0) return
    
    const perPerson = amount / participants.length

    if (totals.hasOwnProperty(payer)) {
      totals[payer] += amount
    }

    participants.forEach(participant => {
      if (totals.hasOwnProperty(participant)) {
        if (expense.split_equally) {
          totals[participant] -= perPerson
        } else {
          const individualAmount = Number(expense.individual_amounts?.[participant]) || 0
          totals[participant] -= individualAmount
        }
      }
    })
  })

  return totals
})

const transactions = computed(() => {
  const totals = personalTotals.value
  const transactions = []
  
  const debtors = Object.entries(totals)
    .filter(([, amount]) => amount < 0)
    .map(([name, amount]) => [name, Math.round(amount * 100) / 100])

  const creditors = Object.entries(totals)
    .filter(([, amount]) => amount > 0)
    .map(([name, amount]) => [name, Math.round(amount * 100) / 100])
  
  let debtorIndex = 0
  let creditorIndex = 0

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const [debtorName, debtorAmount] = debtors[debtorIndex]
    const [creditorName, creditorAmount] = creditors[creditorIndex]
    
    const amount = Math.min(Math.abs(debtorAmount), creditorAmount)
    
    if (amount > 0) {
      transactions.push({
        from: debtorName,
        to: creditorName,
        amount: Math.round(amount * 100) / 100
      })
    }

    if (Math.abs(debtorAmount) === creditorAmount) {
      debtorIndex++
      creditorIndex++
    } else if (Math.abs(debtorAmount) < creditorAmount) {
      creditors[creditorIndex][1] = Math.round((creditorAmount - Math.abs(debtorAmount)) * 100) / 100
      debtorIndex++
    } else {
      debtors[debtorIndex][1] = Math.round((debtorAmount + creditorAmount) * 100) / 100
      creditorIndex++
    }
  }

  return transactions
})

const showQR = (transaction: any) => {
  console.log(transaction, users)

  const payer = users.value.find(u => u.name == transaction.to)
  if (!payer) return

  const qrUrl = `https://qr.sepay.vn/img?acc=${payer.account_number}&bank=${payer.bank}&amount=${transaction.amount}&des=${encodeURIComponent(`${transaction.from} ck ${transaction.to} tien ${props.expenses.map(e => e.title).join(' ')}`)}&template=compact&download=false`
  
  currentQRUrl.value = qrUrl
  showQRModal.value = true
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('vi-VN')
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

defineEmits(['edit', 'refresh'])

const savedTransactions = ref([])

// Fetch saved transactions from database
const loadSavedTransactions = async () => {
  const { data, error } = await useSupabaseClient()
    .from('transactions')
    .select('*')
  
  if (error) {
    console.error('Error loading transactions:', error)
    return
  }
  
  savedTransactions.value = data
}

// Merge computed transactions with saved ones
const mergedTransactions = computed(() => {
  const computedTxs = transactions.value
  
  return computedTxs.map(tx => {
    const savedTx = savedTransactions.value.find(saved => 
      saved.from_user === tx.from && 
      saved.to_user === tx.to && 
      Number(saved.amount) === Number(tx.amount)
    )
    
    return {
      ...tx,
      id: savedTx?.id,
      completed: savedTx?.completed || false,
      completed_at: savedTx?.completed_at
    }
  })
})

const toggleTransactionStatus = async (transaction) => {
  const supabase = useSupabaseClient()
  
  try {
    if (transaction.id) {
      // Update existing transaction
      const { error } = await supabase
        .from('transactions')
        .update({ 
          completed: !transaction.completed,
          completed_at: !transaction.completed ? new Date().toISOString() : null
        })
        .eq('id', transaction.id)
      
      if (error) throw error
    } else {
      // Create new transaction
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

// Load saved transactions on mount
onMounted(async () => {
  await Promise.all([
    fetchUsers(),
    loadSavedTransactions()
  ])
})
</script>



