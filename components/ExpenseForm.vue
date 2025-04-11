<template>
  <div 
    ref="formRef"
    :class="[
      'bg-white rounded-lg shadow py-8 px-4 transition-all duration-300',
      editingExpenseId ? 'ring-2 ring-green-500 ring-offset-2' : ''
    ]"
  >
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-2xl font-bold">{{ editingExpenseId ? 'Sửa chi tiêu' : 'Thêm chi tiêu mới' }}</h2>
      <!-- Thêm badge khi đang sửa -->
      <span 
        v-if="editingExpenseId" 
        class="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full"
      >
        Đang sửa
      </span>
    </div>
    <form @submit.prevent="handleSubmit">
      <div class="space-y-6">
        <div class="form-control-group">
          <label class="block text-sm font-medium text-gray-700 mb-3">Tên chi tiêu</label>
          <input
            v-model="expense.title"
            type="text"
            required
            class="form-input"
          />
        </div>

        <div class="form-control-group">
          <label class="block text-sm font-medium text-gray-700 mb-3">Số tiền</label>
          <div class="relative">
            <input
              v-model="rawAmount"
              type="text"
              required
              placeholder="Nhập số tiền"
              class="form-input"
            />
            <div class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
              {{ formatCurrency(expense.amount) }}
            </div>
          </div>
          
          <!-- Quick amount suggestions -->
          <div class="mt-4 flex flex-wrap gap-2">
            <button
              v-for="suggestion in quickAmountSuggestions"
              :key="suggestion"
              type="button"
              @click="selectAmount(suggestion)"
              class="px-3 py-1 text-sm rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              {{ formatCurrency(suggestion) }}
            </button>
          </div>

          <!-- Smart suggestions based on input -->
          <div v-if="smartSuggestions.length" class="mt-2 flex flex-wrap gap-2">
            <button
              v-for="suggestion in smartSuggestions"
              :key="suggestion"
              type="button"
              @click="selectAmount(suggestion)"
              class="px-3 py-1 text-sm rounded-full bg-green-50 hover:bg-green-100 text-green-700 transition-colors"
            >
              {{ formatCurrency(suggestion) }}
            </button>
          </div>
        </div>

        <div class="form-control-group">
          <label class="block text-sm font-medium text-gray-700 mb-3">Ngày chi tiêu</label>
          <div class="space-y-2">
            <!-- Date input -->
            <div class="relative">
              <input
                v-model="expense.date"
                type="date"
                :max="today"
                class="form-input"
              />
              <!-- Display formatted date -->
              <div class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                {{ formatDateDisplay(expense.date) }}
              </div>
            </div>

            <!-- Quick date selections -->
            <div class="flex flex-wrap gap-2">
              <button
                v-for="(option, index) in quickDateOptions"
                :key="index"
                type="button"
                @click="selectDate(option.value)"
                :class="[
                  'px-3 py-1 text-sm rounded-full transition-colors',
                  expense.date === option.value
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                ]"
              >
                {{ option.label }}
              </button>
            </div>

            <!-- Recent dates used -->
            <div v-if="recentDates.length" class="mt-2">
              <div class="text-sm text-gray-500 mb-1">Gần đây:</div>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="date in recentDates"
                  :key="date"
                  type="button"
                  @click="selectDate(date)"
                  class="px-3 py-1 text-sm rounded-full bg-green-50 hover:bg-green-100 text-green-700 transition-colors"
                >
                  {{ formatDateDisplay(date) }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="form-control-group relative">
          <label class="block text-sm font-medium text-gray-700 mb-3">Người trả</label>
          
          <!-- Search input -->
          <div class="relative">
            <input
              type="text"
              v-model="payerSearch"
              @focus="showPayerDropdown = true"
              @input="handlePayerSearch"
              :placeholder="selectedPayerName || 'Tìm người trả...'"
              class="form-input"
            />
            <span class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <UserIcon class="h-5 w-5 text-gray-400" />
            </span>
            
            <!-- Quick self select button -->
            <button
              v-if="currentUser && !selectedPayerName"
              type="button"
              @click="selectPayer(currentUser.id)"
              class="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-green-600 hover:text-green-700"
            >
              Tôi trả
            </button>
          </div>

          <!-- Dropdown -->
          <div
            v-if="showPayerDropdown"
            class="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg"
            @blur="showPayerDropdown = false"
          >
            <!-- Frequently used -->
            <div v-if="frequentPayers.length && !payerSearch" class="p-2">
              <div class="text-xs font-medium text-gray-500 mb-2">Thường xuyên</div>
              <div class="space-y-1">
                <button
                  v-for="user in frequentPayers"
                  :key="user.id"
                  @click="selectPayer(user.id)"
                  class="flex items-center w-full px-3 py-2 text-sm rounded-md hover:bg-gray-100"
                >
                  <UserCircleIcon class="h-5 w-5 text-gray-400 mr-2" />
                  <span>{{ user.name }}</span>
                  <span v-if="user.id === currentUser?.id" class="ml-2 text-xs text-gray-500">(Tôi)</span>
                </button>
              </div>
            </div>

            <!-- Search results -->
            <div class="max-h-60 overflow-auto">
              <div v-if="filteredUsers.length" class="py-1">
                <button
                  v-for="user in filteredUsers"
                  :key="user.id"
                  @click="selectPayer(user.id)"
                  class="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100"
                  :class="{'bg-green-50': expense.payer === user.id}"
                >
                  <UserCircleIcon class="h-5 w-5 text-gray-400 mr-2" />
                  <div class="flex flex-col">
                    <span>{{ user.name }}</span>
                    <span v-if="user.email" class="text-xs text-gray-500">{{ user.email }}</span>
                  </div>
                  <span v-if="user.id === currentUser?.id" class="ml-2 text-xs text-gray-500">(Tôi)</span>
                </button>
              </div>
              
              <!-- No results -->
              <div v-else-if="payerSearch" class="px-3 py-2 text-sm text-gray-500">
                Không tìm thấy kết quả
              </div>
            </div>
          </div>

          <!-- Selected payer display -->
          <div v-if="selectedPayerName" class="mt-1 flex items-center text-sm text-gray-500">
            <UserCircleIcon class="h-4 w-4 mr-1" />
            {{ selectedPayerName }}
            <button
              @click="clearPayer"
              class="ml-2 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon class="h-4 w-4" />
            </button>
          </div>
        </div>

        <!-- Phần người tham gia và chia tiền -->
        <div class="space-y-4">
          <!-- Người tham gia -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-3">Người tham gia</label>
            
            <!-- Quick actions -->
            <div class="flex gap-2 mb-3">
              <button
                type="button"
                @click="selectAllParticipants"
                class="px-3 py-1 text-sm rounded-full bg-gray-100 hover:bg-gray-200"
              >
                Chọn tất cả
              </button>
              <button
                v-if="currentUser"
                type="button"
                @click="toggleCurrentUser"
                :class="[
                  'px-3 py-1 text-sm rounded-full',
                  isCurrentUserSelected ? 'bg-green-100 text-green-700' : 'bg-gray-100 hover:bg-gray-200'
                ]"
              >
                Tôi tham gia
              </button>
            </div>

            <!-- Danh sách người tham gia -->
            <div class="grid grid-cols-2 gap-2">
              <label
                v-for="user in users"
                :key="user.id"
                :class="[
                  'flex items-center p-2 rounded-md cursor-pointer hover:bg-gray-50',
                  expense.participants.includes(user.name) && 'bg-green-50'
                ]"
              >
                <input
                  type="checkbox"
                  :value="user.name"
                  v-model="expense.participants"
                  class="h-4 w-4 text-green-600 rounded border-gray-300"
                />
                <span class="ml-2 text-sm">{{ user.name }}</span>
              </label>
            </div>
          </div>

          <!-- Cách chia tiền -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-3">Cách chia tiền</label>
            
            <!-- Thông báo khi chưa chọn người trả -->
            <div v-if="!expense.payer" class="p-3 bg-yellow-50 text-yellow-700 rounded-md mb-3">
              Vui lòng chọn người trả trước khi chia tiền
            </div>

            <!-- Radio buttons cho cách chia - chỉ hiện khi đã chọn người trả -->
            <div v-else class="space-y-2">
              <label class="flex items-center">
                <input
                  type="radio"
                  v-model="splitMethod"
                  value="equal"
                  class="h-4 w-4 text-green-600"
                />
                <span class="ml-2 text-sm">Chia đều cho tất cả</span>
              </label>

              <label class="flex items-center">
                <input
                  type="radio"
                  v-model="splitMethod"
                  value="payerFree"
                  class="h-4 w-4 text-green-600"
                />
                <span class="ml-2 text-sm">Người trả không phải trả</span>
              </label>

              <!-- Hiển thị kết quả chia tiền -->
              <div v-if="expense.participants.length" class="mt-3 p-3 bg-gray-50 rounded-md">
                <div class="text-sm text-gray-600 mb-2">
                  Mỗi người sẽ trả:
                </div>
                <div v-for="(amount, name) in splitResult" :key="name" class="flex justify-between text-sm">
                  <span>{{ name }}</span>
                  <span class="font-medium">{{ formatCurrency(amount) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end space-x-3">
          <button
            type="button"
            @click="resetForm"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Hủy
          </button>
          <button
            type="submit"
            class="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
          >
            {{ editingExpenseId ? 'Cập nhật' : 'Thêm' }}
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { 
  UserCircleIcon,
  UserIcon, 
  UsersIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'
import { computed, onMounted, ref, watch, nextTick } from 'vue'
import { useUserStore } from '~/stores/useUserStore'
import { storeToRefs } from 'pinia'

const userStore = useUserStore()
const { users } = storeToRefs(userStore)

const props = defineProps<{
  editingExpense?: any
  expenses?: any[]
}>()

const emit = defineEmits(['save', 'cancel'])

const formRef = ref(null)

const editingExpenseId = ref(null)
const expense = reactive({
  title: '',
  amount: 0,
  date: new Date().toISOString().split('T')[0],
  payer: '',
  participants: [],
  splitEqually: true,
  individualAmounts: {}
})

const today = computed(() => {
  return new Date().toISOString().split('T')[0]
})

const toggleParticipant = (name: string) => {
  const index = expense.participants.indexOf(name)
  if (index === -1) {
    expense.participants.push(name)
  } else {
    expense.participants.splice(index, 1)
  }
}

const validateTotalAmount = () => {
  if (!expense.splitEqually) {
    const total = Object.values(expense.individualAmounts).reduce((sum, amount) => sum + (Number(amount) || 0), 0)
    if (Math.abs(total - expense.amount) > 0.01) {
      // Hiển thị thông báo lỗi
      return false
    }
  }
  return true
}

const handleSubmit = async () => {
  if (!expense.splitEqually && !validateTotalAmount()) {
    alert('Tổng số tiền chi tiêu cá nhân phải bằng tổng số tiền')
    return
  }

  try {
    const expenseData = {
      title: expense.title,
      amount: expense.amount,
      date: expense.date,
      payer: expense.payer,
      participants: expense.participants,
      split_equally: expense.splitEqually,
      individual_amounts: expense.individualAmounts
    }

    const supabase = useSupabaseClient()
    
    if (editingExpenseId.value) {
      const { error } = await supabase
        .from('expenses')
        .update(expenseData)
        .eq('id', editingExpenseId.value)
      
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('expenses')
        .insert([expenseData])
      
      if (error) throw error
    }
    
    emit('save')
    resetForm()
  } catch (error) {
    console.error('Error saving expense:', error)
  }
}

const resetForm = () => {
  editingExpenseId.value = null
  Object.assign(expense, {
    title: '',
    amount: 0,
    date: today.value,
    payer: '',
    participants: [],
    splitEqually: true,
    individualAmounts: {}
  })
  emit('cancel')
  rawAmount.value = ''
  payerSearch.value = ''
  showPayerDropdown.value = false
}

// Thêm method để scroll và highlight
const scrollToForm = () => {
  if (formRef.value) {
    formRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// Watch for editingExpense prop changes
watch(() => props.editingExpense, (newExpense) => {
  if (newExpense) {
    editingExpenseId.value = newExpense.id
    Object.assign(expense, {
      title: newExpense.title,
      amount: newExpense.amount,
      date: newExpense.date || today.value,
      payer: newExpense.payer,
      participants: newExpense.participants,
      splitEqually: newExpense.split_equally,
      individualAmounts: newExpense.individual_amounts || {}
    })
    // Scroll to form when editing
    nextTick(() => {
      scrollToForm()
    })
  }
}, { immediate: true })

// Ensure users are loaded
onMounted(async () => {
  if (!users.value.length) {
    await userStore.fetchUsers()
  }
})

// Add new refs and computed properties
const rawAmount = ref('')
const quickAmountSuggestions = [
  50000, 100000, 200000, 500000, 1000000
]

const smartSuggestions = computed(() => {
  const input = parseFloat(rawAmount.value)
  if (!input || isNaN(input)) return []
  
  // Generate smart suggestions based on input
  const suggestions = []
  
  // If input is less than 1000, assume user means thousands
  if (input < 1000) {
    suggestions.push(input * 1000)
  }
  
  // If input is less than 1000000, suggest rounding to nearest 1000
  if (input < 1000000) {
    const roundedUp = Math.ceil(input / 1000) * 1000
    if (roundedUp !== input) suggestions.push(roundedUp)
  }
  
  // Suggest common multipliers
  if (input <= 100) {
    suggestions.push(input * 1000, input * 10000)
  }
  
  return [...new Set(suggestions)].slice(0, 3) // Remove duplicates and limit to 3 suggestions
})

// Format currency without currency symbol for input
const formatNumber = (num: number) => {
  return new Intl.NumberFormat('vi-VN').format(num)
}

// Format currency with currency symbol for display
const formatCurrency = (num: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(num)
}

// Handle amount input
const handleAmountInput = (event: Event) => {
  const input = (event.target as HTMLInputElement).value
  // Remove all non-numeric characters
  const numericValue = input.replace(/[^0-9]/g, '')
  
  if (numericValue) {
    expense.amount = parseInt(numericValue)
  } else {
    expense.amount = 0
  }
}

// Handle quick amount selection
const selectAmount = (amount: number) => {
  expense.amount = amount
  rawAmount.value = amount.toString()
}

// Watch expense.amount changes to update rawAmount
watch(() => expense.amount, (newAmount) => {
  if (newAmount !== parseInt(rawAmount.value)) {
    rawAmount.value = newAmount.toString()
  }
}, { immediate: true })

// Watch rawAmount for formatting
watch(rawAmount, (newValue) => {
  const numericValue = newValue.replace(/[^0-9]/g, '')
  if (numericValue !== newValue) {
    rawAmount.value = numericValue
  }
})

// Quick date options
const quickDateOptions = computed(() => {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  const dayBeforeYesterday = new Date(today)
  dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2)
  
  return [
    { label: 'Hôm nay', value: formatDateValue(today) },
    { label: 'Hôm qua', value: formatDateValue(yesterday) },
    { label: 'Hôm kia', value: formatDateValue(dayBeforeYesterday) }
  ]
})

// Recent dates from expenses (maximum 3)
const recentDates = computed(() => {
  const existingDates = props.expenses
    ?.map(exp => exp.date)
    .filter(date => date !== expense.date && date !== today.value)
    .slice(0, 3) || []
  
  return [...new Set(existingDates)] // Remove duplicates
})

// Format date for input value (YYYY-MM-DD)
const formatDateValue = (date: Date) => {
  return date.toISOString().split('T')[0]
}

// Format date for display
const formatDateDisplay = (dateString: string) => {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  // Check if date is today or yesterday
  if (formatDateValue(today) === dateString) {
    return 'Hôm nay'
  } else if (formatDateValue(yesterday) === dateString) {
    return 'Hôm qua'
  }
  
  // Otherwise return formatted date
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    // year: 'numeric',
    // month: 'long',
    // day: 'numeric'
  }).format(date)
}

// Handle date selection
const selectDate = (date: string) => {
  expense.date = date
}

// New refs for payer selection
const payerSearch = ref('')
const showPayerDropdown = ref(false)

// Get current user from auth store
const currentUser = computed(() => userStore.currentUser)

// Computed property for filtered users
const filteredUsers = computed(() => {
  const search = payerSearch.value.toLowerCase().trim()
  if (!search) return users.value
  
  return users.value.filter(user => 
    user.name.toLowerCase().includes(search) ||
    user.email?.toLowerCase().includes(search)
  )
})

// Get frequent payers (based on recent expenses)
const frequentPayers = computed(() => {
  const payerCounts = props.expenses?.reduce((acc, exp) => {
    acc[exp.payer] = (acc[exp.payer] || 0) + 1
    return acc
  }, {})
  
  return users.value
    .filter(user => payerCounts[user.id])
    .sort((a, b) => payerCounts[b.id] - payerCounts[a.id])
    .slice(0, 5)
})

// Get selected payer name
const selectedPayerName = computed(() => {
  if (!expense.payer) return ''
  const user = users.value.find(u => u.id === expense.payer)
  return user ? user.name : ''
})

// Handle payer selection
const selectPayer = (userId: string) => {
  expense.payer = userId
  payerSearch.value = ''
  showPayerDropdown.value = false
}

// Clear selected payer
const clearPayer = () => {
  expense.payer = ''
  payerSearch.value = ''
}

// Handle search input
const handlePayerSearch = () => {
  showPayerDropdown.value = true
}

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.relative')) {
    showPayerDropdown.value = false
  }
}

// Setup and cleanup click outside listener
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const participantSearch = ref('')

// Computed: Grouped and filtered participants
const groupedParticipants = computed(() => {
  const search = participantSearch.value.toLowerCase()
  const filtered = users.value.filter(user => 
    user.name.toLowerCase().includes(search) ||
    user.email?.toLowerCase().includes(search)
  )

  // Group by frequency and filter by search
  const frequent = filtered.filter(user => isFrequentParticipant(user.id))
  const others = filtered.filter(user => !isFrequentParticipant(user.id))

  const groups = []
  
  if (frequent.length) {
    groups.push({
      label: 'Thường xuyên tham gia',
      users: frequent
    })
  }

  if (others.length) {
    groups.push({
      label: 'Những người khác',
      users: others
    })
  }

  return groups
})

// Check if user is frequent participant
const isFrequentParticipant = (userId: string) => {
  if (!props.expenses) return false
  
  const participationCount = props.expenses.filter(exp => 
    exp.participants.includes(users.value.find(u => u.id === userId)?.name)
  ).length

  return participationCount >= 3 // Consider frequent if participated in 3 or more expenses
}

// Quick actions
const selectAllParticipants = () => {
  expense.participants = users.value.map(u => u.name)
}

const selectFrequentGroup = () => {
  const frequentUsers = users.value.filter(user => isFrequentParticipant(user.id))
  expense.participants = frequentUsers.map(u => u.name)
}

const isCurrentUserSelected = computed(() => {
  return currentUser.value && expense.participants.includes(currentUser.value.name)
})

const toggleCurrentUser = () => {
  if (!currentUser.value) return
  
  const name = currentUser.value.name
  if (expense.participants.includes(name)) {
    expense.participants = expense.participants.filter(p => p !== name)
  } else {
    expense.participants.push(name)
  }
}

// Watch for split equally changes
watch(() => expense.splitEqually, (newValue) => {
  if (newValue) {
    // Reset individual amounts when switching to split equally
    expense.individualAmounts = {}
  } else {
    // Initialize individual amounts when switching to custom split
    expense.participants.forEach(participant => {
      if (!expense.individualAmounts[participant]) {
        expense.individualAmounts[participant] = 0
      }
    })
  }
})

// Watch for participants changes
watch(() => expense.participants, (newParticipants) => {
  if (!expense.splitEqually) {
    // Update individual amounts when participants change
    const amounts = {...expense.individualAmounts}
    
    // Remove amounts for removed participants
    Object.keys(amounts).forEach(participant => {
      if (!newParticipants.includes(participant)) {
        delete amounts[participant]
      }
    })
    
    // Add new participants with 0 amount
    newParticipants.forEach(participant => {
      if (!amounts[participant]) {
        amounts[participant] = 0
      }
    })
    
    expense.individualAmounts = amounts
  }
}, { deep: true })

// Computed properties
const amountPerPerson = computed(() => {
  if (!expense.amount || !expense.participants.length) return 0
  return Math.round(expense.amount / expense.participants.length)
})

const totalAllocated = computed(() => {
  if (!expense.individualAmounts) return 0
  return Object.values(expense.individualAmounts)
    .reduce((sum, amount) => sum + (Number(amount) || 0), 0)
})

const remainingAmount = computed(() => {
  return expense.amount - totalAllocated.value
})

// Quick adjustments for equal split
const quickAdjustments = computed(() => [
  { label: 'Làm tròn xuống', value: 'roundDown' },
  { label: 'Làm tròn lên', value: 'roundUp' },
  { label: 'Làm tròn đến 1k', value: 'roundToThousand' },
  { label: 'Làm tròn đến 10k', value: 'roundToTenThousand' },
])

// Quick options for custom split
const quickSplitOptions = computed(() => [
  { label: 'Chia theo tỷ lệ', value: 'proportional' },
  { label: 'Người trả không phải trả', value: 'payerFree' },
  { label: 'Reset về 0', value: 'reset' },
  { label: 'Chia đều phần còn lại', value: 'splitRemaining' },
])

// Methods
const toggleSplitEqually = () => {
  expense.splitEqually = !expense.splitEqually
  if (expense.splitEqually) {
    const amount = amountPerPerson.value
    expense.participants.forEach(participant => {
      expense.individualAmounts[participant] = amount
    })
  }
}

const adjustAmount = (type: string) => {
  if (!expense.amount || !expense.participants.length) return
  
  let newAmount = amountPerPerson.value
  switch (type) {
    case 'roundDown':
      newAmount = Math.floor(newAmount)
      break
    case 'roundUp':
      newAmount = Math.ceil(newAmount)
      break
    case 'roundToThousand':
      newAmount = Math.round(newAmount / 1000) * 1000
      break
    case 'roundToTenThousand':
      newAmount = Math.round(newAmount / 10000) * 10000
      break
  }
  
  expense.participants.forEach(participant => {
    expense.individualAmounts[participant] = newAmount
  })
}

const applySplitOption = (type: string) => {
  switch (type) {
    case 'proportional':
      // Chia theo tỷ lệ dựa trên số tiền hiện tại
      const total = totalAllocated.value || expense.amount
      expense.participants.forEach(participant => {
        const current = expense.individualAmounts[participant] || 0
        expense.individualAmounts[participant] = Math.round(
          (current / total) * expense.amount
        )
      })
      break
    
    case 'payerFree':
      // Người trả không phải trả
      const perPerson = expense.amount / (expense.participants.length - 1)
      expense.participants.forEach(participant => {
        expense.individualAmounts[participant] = participant === selectedPayerName.value
          ? 0
          : Math.round(perPerson)
      })
      break
    
    case 'reset':
      // Reset tất cả về 0
      expense.participants.forEach(participant => {
        expense.individualAmounts[participant] = 0
      })
      break
    
    case 'splitRemaining':
      // Chia đều phần còn lại
      const remaining = remainingAmount.value
      const split = remaining / expense.participants.length
      expense.participants.forEach(participant => {
        expense.individualAmounts[participant] = (
          expense.individualAmounts[participant] || 0
        ) + Math.round(split)
      })
      break
  }
}

const validateIndividualAmount = (participant: string) => {
  const amount = expense.individualAmounts[participant]
  if (amount < 0) {
    expense.individualAmounts[participant] = 0
  }
}

const hasError = (participant: string) => {
  const amount = expense.individualAmounts[participant]
  return amount < 0 || amount > expense.amount
}

const getErrorMessage = (participant: string) => {
  const amount = expense.individualAmounts[participant]
  if (amount < 0) return 'Số tiền không thể âm'
  if (amount > expense.amount) return 'Số tiền không thể lớn hơn tổng'
  return ''
}

const calculatePercentage = (participant: string) => {
  const amount = expense.individualAmounts[participant] || 0
  if (!expense.amount) return 0
  return Math.round((amount / expense.amount) * 100)
}

// Watch for amount changes
watch(() => expense.amount, (newAmount) => {
  if (expense.splitEqually) {
    const perPerson = Math.round(newAmount / expense.participants.length)
    expense.participants.forEach(participant => {
      expense.individualAmounts[participant] = perPerson
    })
  }
})

// Thêm reactive variables
const splitMethod = ref('equal') // 'equal' hoặc 'payerFree'

// Computed để tính toán số tiền mỗi người phải trả
const splitResult = computed(() => {
  const result = {}
  
  if (!expense.payer || !expense.amount || !expense.participants.length) {
    return result
  }
  
  // Lấy tên người trả từ ID
  const payer = users.value.find(u => u.id === expense.payer)
  if (!payer) return result
  
  if (splitMethod.value === 'equal') {
    const amountPerPerson = Math.round(expense.amount / expense.participants.length)
    expense.participants.forEach(name => {
      result[name] = amountPerPerson
    })
  } else if (splitMethod.value === 'payerFree') {
    const payingParticipants = expense.participants.filter(name => name !== payer.name)
    
    if (payingParticipants.length === 0) {
      result[payer.name] = expense.amount
    } else {
      const amountPerPerson = Math.round(expense.amount / payingParticipants.length)
      expense.participants.forEach(name => {
        result[name] = name === payer.name ? 0 : amountPerPerson
      })
    }
  }
  
  return result
})

// Watch để cập nhật individual amounts khi thay đổi cách chia
watch([splitMethod, () => expense.participants, () => expense.amount], () => {
  expense.individualAmounts = { ...splitResult.value }
})
</script>

<style scoped>
.form-control-group {
  @apply relative mb-6;
}
</style>

