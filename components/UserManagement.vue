<template>
  <div class="bg-white rounded-lg shadow p-6 mb-8">
    <h2 class="text-2xl font-bold mb-4">Quản lý người dùng</h2>
    
    <!-- Form thêm/sửa user -->
    <form @submit.prevent="handleSubmit" class="mb-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Tên</label>
          <input
            v-model="userForm.name"
            required
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700">Số tài khoản</label>
          <input
            v-model="userForm.account_number"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700">Ngân hàng</label>
          <div class="relative">
            <select
              v-model="userForm.bank"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            >
              <option value="">Chọn ngân hàng</option>
              <option
                v-for="bank in banks"
                :key="bank.code"
                :value="bank.code"
              >
                {{ bank.name }}
              </option>
            </select>
            <div v-if="loading" class="absolute right-2 top-1/2 -translate-y-1/2">
              <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500"></div>
            </div>
          </div>
          <p v-if="error" class="mt-1 text-sm text-red-600">
            Không thể tải danh sách ngân hàng. Vui lòng thử lại sau.
          </p>
        </div>
      </div>
      
      <div class="mt-4 flex justify-end space-x-3">
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
          {{ editingUserId ? 'Cập nhật' : 'Thêm' }}
        </button>
      </div>
    </form>

    <!-- Danh sách users -->
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số tài khoản</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngân hàng</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="user in users" :key="user.id">
            <td class="px-6 py-4 whitespace-nowrap">{{ user.name }}</td>
            <td class="px-6 py-4 whitespace-nowrap">{{ user.account_number }}</td>
            <td class="px-6 py-4 whitespace-nowrap">
              {{ user.bank + ' - ' + getBankName(user.bank) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right">
              <button
                @click="editUser(user)"
                class="text-indigo-600 hover:text-indigo-900 mr-3"
              >
                Sửa
              </button>
              <button
                @click="deleteUser(user.id)"
                class="text-red-600 hover:text-red-900"
              >
                Xóa
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBanks } from '~/composables/useBanks'

const users = ref([])
const editingUserId = ref(null)
const userForm = ref({
  name: '',
  account_number: '',
  bank: ''
})

const { banks, loading, error, fetchBanks } = useBanks()

// Get bank name from code
const getBankName = (code: string) => {
  const bank = banks.value.find(b => b.code === code)
  return bank ? bank.name : code
}

// Load users
const loadUsers = async () => {
  const { data, error } = await useSupabaseClient()
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error loading users:', error)
    return
  }
  
  users.value = data
}

// Add/Update user
const handleSubmit = async () => {
  try {
    const supabase = useSupabaseClient()
    
    if (editingUserId.value) {
      // Update
      const { error } = await supabase
        .from('users')
        .update(userForm.value)
        .eq('id', editingUserId.value)
      
      if (error) throw error
    } else {
      // Add
      const { error } = await supabase
        .from('users')
        .insert([userForm.value])
      
      if (error) throw error
    }
    
    await loadUsers()
    resetForm()
  } catch (error) {
    console.error('Error saving user:', error)
  }
}

// Edit user
const editUser = (user) => {
  editingUserId.value = user.id
  userForm.value = { ...user }
}

// Delete user
const deleteUser = async (id) => {
  if (!confirm('Bạn có chắc chắn muốn xóa người dùng này?')) return
  
  try {
    const { error } = await useSupabaseClient()
      .from('users')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    await loadUsers()
  } catch (error) {
    console.error('Error deleting user:', error)
  }
}

// Reset form
const resetForm = () => {
  editingUserId.value = null
  userForm.value = {
    name: '',
    account_number: '',
    bank: ''
  }
}

// Load initial data
onMounted(async () => {
  await Promise.all([
    loadUsers(),
    fetchBanks()
  ])
})
</script>
