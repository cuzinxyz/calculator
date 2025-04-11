<template>
  <div class="min-h-screen bg-green-50">
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-4xl font-bold text-center text-green-800 mb-8">EzSplit</h1>

      <!-- Role Selection khi mới vào -->
      <div v-if="!selectedRole" class="max-w-md mx-auto">
        <h2 class="text-xl font-semibold mb-6 text-center">Bạn là...</h2>
        <div class="space-y-4">
          <button
            @click="selectedRole = 'payer'"
            class="w-full p-6 text-left bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <h3 class="text-lg font-medium text-green-700">Người trả tiền 💰</h3>
            <p class="text-gray-600 mt-2">Xem danh sách các khoản cần thanh toán</p>
          </button>

          <button
            @click="selectedRole = 'spender'"
            class="w-full p-6 text-left bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <h3 class="text-lg font-medium text-green-700">Người chi tiền 📝</h3>
            <p class="text-gray-600 mt-2">Tạo và quản lý các khoản chi tiêu</p>
          </button>
        </div>
      </div>

      <!-- Main Content sau khi chọn role -->
      <div v-else>
        <!-- Header với nút đổi role và quản lý user -->
        <div class="flex justify-between items-center mb-6">
          <button 
            @click="selectedRole = null"
            class="text-green-600 hover:text-green-700"
          >
            ← Đổi vai trò
          </button>
          <button 
            @click="showUserManagement = true"
            class="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
          >
            Quản lý người dùng
          </button>
        </div>

        <!-- Content cho người trả tiền -->
        <ExpenseResults 
          v-if="selectedRole === 'payer'"
          :expenses="expenses" 
          @refresh="loadExpenses"
        />

        <!-- Content cho người chi tiền -->
        <div v-else-if="selectedRole === 'spender'">
          <ExpenseForm 
            :editing-expense="editingExpense"
            @save="handleExpenseSave" 
            @cancel="editingExpense = null"
          />
          <ExpenseResults 
            :expenses="expenses" 
            @edit="editExpense"
            @refresh="loadExpenses"
          />
        </div>
      </div>

      <!-- User Management Modal -->
      <Modal v-if="showUserManagement" @close="showUserManagement = false">
        <UserManagement />
      </Modal>

      <footer class="text-center mt-8 text-sm text-gray-600">
        <p>Made with ♥️ by abner</p>
        <p>&copy; 2025 EzSplit. All rights reserved.</p>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const expenses = ref([])
const editingExpense = ref(null)
const selectedRole = ref(null)
const showUserManagement = ref(false)

const loadExpenses = async () => {
  const { data, error } = await useSupabaseClient()
    .from('expenses')
    .select('*')
    .order('date', { ascending: false })
  
  if (error) {
    console.error('Error loading expenses:', error)
    return
  }
  
  expenses.value = data
}

const editExpense = (expense) => {
  editingExpense.value = expense
}

const handleExpenseSave = () => {
  loadExpenses()
  editingExpense.value = null
}

onMounted(() => {
  loadExpenses()
})
</script>

