<template>
  <div class="bg-white rounded-lg shadow p-6">
    <h2 class="text-2xl font-bold mb-4">{{ editingExpenseId ? 'Sửa chi tiêu' : 'Thêm chi tiêu mới' }}</h2>
    <form @submit.prevent="handleSubmit">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Tên chi tiêu</label>
          <input
            v-model="expense.title"
            type="text"
            required
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Số tiền</label>
          <input
            v-model="expense.amount"
            type="number"
            required
            min="0"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Ngày chi tiêu</label>
          <input
            v-model="expense.date"
            type="date"
            :max="today"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Người trả</label>
          <select
            v-model="expense.payer"
            required
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          >
            <option value="">Chọn người trả</option>
            <option 
              v-for="user in users" 
              :key="user.id" 
              :value="user.name"
            >
              {{ user.name }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Người tham gia</label>
          <div class="mt-2 space-y-2">
            <div 
              v-for="user in users" 
              :key="user.id" 
              class="flex items-center"
            >
              <input
                type="checkbox"
                :value="user.name"
                v-model="expense.participants"
                :id="'participant-' + user.id"
                class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label 
                :for="'participant-' + user.id"
                class="ml-2 text-sm text-gray-700"
                @click="toggleParticipant(user.name)"
              >
                {{ user.name }}
              </label>
            </div>
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <input
            type="checkbox"
            v-model="expense.splitEqually"
            id="split-equally"
            class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          />
          <label for="split-equally" class="text-sm text-gray-700">
            Chia đều cho tất cả người tham gia
          </label>
        </div>

        <div v-if="!expense.splitEqually">
          <label class="block text-sm font-medium text-gray-700">Chi tiêu cá nhân</label>
          <div class="mt-2 space-y-2">
            <div v-for="participant in expense.participants" :key="participant" class="flex items-center">
              <label class="w-24">{{ participant }}</label>
              <input
                type="number"
                v-model="expense.individualAmounts[participant]"
                class="ml-2 block w-32 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                @input="validateTotalAmount"
              />
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
import { ref, reactive, computed } from 'vue'
import { useUsers } from '~/composables/useUsers'

const props = defineProps<{
  editingExpense?: any
}>()

const emit = defineEmits(['save', 'cancel'])

const { users, loading, error, fetchUsers } = useUsers()
const editingExpenseId = ref(null)

const today = computed(() => {
  const now = new Date()
  return now.toISOString().split('T')[0]
})

const expense = reactive({
  title: '',
  amount: 0,
  date: today.value,
  payer: '',
  participants: [] as string[],
  splitEqually: true,
  individualAmounts: {} as Record<string, number>
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
  }
}, { immediate: true })

onMounted(() => {
  fetchUsers()
})
</script>

