<template>
  <div class="min-h-screen bg-green-50">
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-4xl font-bold text-center text-green-800 mb-8">EzSplit</h1>

      <!-- Role Selection khi mới vào -->
      <div v-if="!selectedRole" class="max-w-md mx-auto">
        <h2 class="text-xl font-semibold mb-6 text-center">Bạn là...</h2>
        <div class="space-y-4">
          <button
            @click="handleRoleSelect('payer')"
            class="w-full p-6 text-left bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <h3 class="text-lg font-medium text-green-700">Người trả tiền 💰</h3>
            <p class="text-gray-600 mt-2">Xem danh sách các khoản cần thanh toán</p>
          </button>

          <button
            @click="handleRoleSelect('spender')"
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
            type="button"
            @click="changeRole"
            class="text-green-600 hover:text-green-700"
          >
            ← Đổi vai trò
          </button>
          <button 
            type="button"
            @click="handleShowUserManagement"
            class="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
          >
            Quản lý người dùng
          </button>
        </div>

        <!-- Content cho người trả tiền -->
        <ExpenseResults 
          v-if="selectedRole === 'payer'"
          :expenses="expenses" 
          :role="selectedRole"
          @refresh="loadExpenses"
        />

        <!-- Content cho người chi tiền -->
        <div v-else-if="selectedRole === 'spender'" class="space-y-6">
          <!-- Wrap ExpenseForm trong div để có thể scroll đến -->
          <div id="expense-form">
            <ExpenseForm 
              :editing-expense="editingExpense"
              :expenses="expenses"
              @save="handleExpenseSave" 
              @cancel="editingExpense = null"
            />
          </div>
          
          <!-- Thêm divider để phân tách form và danh sách -->
          <div class="border-t border-gray-200 my-6"></div>

          <ExpenseResults 
            :expenses="expenses" 
            :role="selectedRole"
            @edit="editExpense"
            @refresh="loadExpenses"
          />
        </div>
      </div>

      <!-- User Management Modal -->
      <Modal v-if="showUserManagement" @close="closeUserManagement">
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
import { useUserStore } from '~/stores/useUserStore'
import { storeToRefs } from 'pinia'

const userStore = useUserStore()
const { users } = storeToRefs(userStore)

const expenses = ref([])
const editingExpense = ref(null)
const selectedRole = ref(null)
const showUserManagement = ref(false)

// Xử lý chọn role
const handleRoleSelect = async (role: 'payer' | 'spender') => {
  try {
    selectedRole.value = role
    // Fetch users cho cả hai role
    await userStore.fetchUsers()
    await loadExpenses()
  } catch (error) {
    console.error('Error in handleRoleSelect:', error)
  }
}

// Xử lý đổi vai trò
const changeRole = () => {
  try {
    selectedRole.value = null
    editingExpense.value = null
    showUserManagement.value = false
  } catch (error) {
    console.error('Error in changeRole:', error)
  }
}

// Xử lý hiển thị modal quản lý user
const handleShowUserManagement = async () => {
  try {
    await userStore.fetchUsers()
    showUserManagement.value = true
  } catch (error) {
    console.error('Error in handleShowUserManagement:', error)
  }
}

// Xử lý đóng modal
const closeUserManagement = () => {
  showUserManagement.value = false
}

const loadExpenses = async () => {
  try {
    const { data, error } = await useSupabaseClient()
      .from('expenses')
      .select('*')
      .order('date', { ascending: false })
    
    if (error) throw error
    expenses.value = data
  } catch (error) {
    console.error('Error loading expenses:', error)
  }
}

const editExpense = (expense) => {
  editingExpense.value = expense
}

const handleExpenseSave = async () => {
  await loadExpenses()
  editingExpense.value = null
}

// Load initial data
onMounted(async () => {
  try {
    await loadExpenses()
  } catch (error) {
    console.error('Error in onMounted:', error)
  }
})
</script>

