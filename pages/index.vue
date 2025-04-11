<template>
  <div class="min-h-screen bg-green-50 flex flex-col">
    <div class="container mx-auto px-4 py-8 flex-grow">
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
        <div v-if="selectedRole === 'payer'" class="max-w-5xl mx-auto space-y-8">
          <ExpenseList
            :expenses="expenses"
            :current-page="currentPage"
            :total-items="totalExpenses"
            :items-per-page="itemsPerPage"
            :loading="loading"
            @page-change="loadExpenses"
          />
          
          <ExpenseSummary :expenses="expenses" />
        </div>

        <!-- Content cho người chi tiền -->
        <div v-if="selectedRole === 'spender'" class="max-w-5xl mx-auto space-y-8">
          <ExpenseForm 
            :expenses="expenses"
            @save="handleExpenseSave" 
          />
          
          <ExpenseList
            :expenses="expenses"
            :current-page="currentPage"
            :total-items="totalExpenses"
            :items-per-page="itemsPerPage"
            :loading="loading"
            @page-change="loadExpenses"
          />
          
          <!-- <ExpenseSummary :expenses="expenses" /> -->
        </div>
      </div>

      <!-- User Management Modal -->
      <Modal v-if="showUserManagement" @close="closeUserManagement">
        <UserManagement />
      </Modal>

    </div>

    <footer class="text-center py-4 text-sm text-gray-600 bg-green-50">
      <p>Made with ♥️ by abner</p>
      <p>&copy; 2025 EzSplit. All rights reserved.</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '~/stores/useUserStore'
import { storeToRefs } from 'pinia'

const userStore = useUserStore()
const { users } = storeToRefs(userStore)

const expenses = ref([])
const selectedRole = ref(null)
const totalExpenses = ref(0)
const currentPage = ref(1)
const itemsPerPage = ref(2)
const loading = ref(false)
const showUserManagement = ref(false)

const loadExpenses = async (page = 1) => {
  console.log('loadExpenses called with page:', page)
  
  // Bỏ check duplicate vì đang cần load data lần đầu
  // if (loading.value || page === currentPage.value) {
  //   console.log('Skipping duplicate request')
  //   return
  // }
  
  try {
    loading.value = true
    console.log('Loading started')
    
    const from = (page - 1) * itemsPerPage.value
    const to = from + itemsPerPage.value - 1
    
    console.log('Fetching range:', from, 'to', to)
    
    const supabase = useSupabaseClient()
    
    // Luôn fetch count mới
    const countPromise = supabase
      .from('expenses')
      .select('id', { count: 'exact', head: true })
      
    const dataPromise = supabase
      .from('expenses')
      .select(`
        id,
        title,
        amount,
        date,
        payer,
        participants,
        split_equally,
        individual_amounts
      `)
      .order('date', { ascending: false })
      .range(from, to)
    
    const [countResponse, dataResponse] = await Promise.all([
      countPromise,
      dataPromise
    ])
    
    console.log('Count response:', countResponse)
    console.log('Data response:', dataResponse)

    if (countResponse.error) {
      console.error('Count error:', countResponse.error)
      throw countResponse.error
    }
    if (dataResponse.error) {
      console.error('Data error:', dataResponse.error)
      throw dataResponse.error
    }

    // Cập nhật state
    totalExpenses.value = countResponse.count || 0
    expenses.value = dataResponse.data || []
    currentPage.value = page
    
    console.log('Updated state:', {
      totalExpenses: totalExpenses.value,
      expenses: expenses.value.length,
      currentPage: currentPage.value
    })
  } catch (error) {
    console.error('Error loading expenses:', error)
  } finally {
    loading.value = false
    console.log('Loading finished')
  }
}

const handleRoleSelect = async (role: 'payer' | 'spender') => {
  console.log('Role selected:', role)
  try {
    selectedRole.value = role
    if (!users.value.length) {
      await userStore.fetchUsers()
    }
    // Force load expenses
    await loadExpenses(1)
  } catch (error) {
    console.error('Error in handleRoleSelect:', error)
  }
}

const handleExpenseSave = async () => {
  totalExpenses.value = 0
  await loadExpenses(1)
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

onMounted(() => {
  console.log('Component mounted')
})
</script>

