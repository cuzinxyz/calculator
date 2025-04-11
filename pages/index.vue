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

      <Transition
        enter-active-class="transition-opacity duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-300 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="selectedRole">
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
              Quản lý danh sách người tham gia
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
            
            <ExpenseSummary ref="expenseSummaryRef" />
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
      </Transition>

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
import { useLoading } from '~/composables/useLoading'

const userStore = useUserStore()
const { users } = storeToRefs(userStore)

const expenses = ref([])
const selectedRole = ref(null)
const totalExpenses = ref(0)
const currentPage = ref(1)
const itemsPerPage = ref(2)
const loading = ref(false)
const showUserManagement = ref(false)
const editingExpense = ref(null)
const expenseSummaryRef = ref(null)

const { withLoading } = useLoading()

const loadExpenses = async (page = 1) => {
  // Không sử dụng withLoading ở đây nữa
  console.log('loadExpenses called with page:', page)
  
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
    
    if (countResponse.error) throw countResponse.error
    if (dataResponse.error) throw dataResponse.error

    totalExpenses.value = countResponse.count || 0
    expenses.value = dataResponse.data || []
    currentPage.value = page
    
  } catch (error) {
    console.error('Error loading expenses:', error)
  } finally {
    loading.value = false
    console.log('Loading finished')
  }
}

const handleRoleSelect = async (role: 'payer' | 'spender') => {
  await withLoading(async () => {
    console.log('Role selected:', role)
    try {
      if (!users.value.length) {
        await userStore.fetchUsers()
      }
      // Đợi một chút trước khi set role để loading screen có thời gian hiển thị
      await new Promise(resolve => setTimeout(resolve, 100))
      selectedRole.value = role
      // Force load expenses
      await loadExpenses(1)
    } catch (error) {
      console.error('Error in handleRoleSelect:', error)
    }
  })
}

const handleExpenseSave = async () => {
  await loadExpenses(currentPage.value)
  // Refresh ExpenseSummary sau khi có expense mới
  if (expenseSummaryRef.value) {
    await expenseSummaryRef.value.refreshData()
  }
}

// Xử lý đổi vai trò
const changeRole = () => {
  try {
    selectedRole.value = null
    if (editingExpense.value) {
      editingExpense.value = null
    }
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

