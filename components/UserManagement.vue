<template>
  <div class="p-4 sm:p-6">
    <!-- Form thêm/sửa user -->
    <form @submit.prevent="handleSubmit" class="mb-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Tên và Số tài khoản trên cùng một hàng khi >= md -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-3">Tên</label>
          <input
            v-model="userForm.name"
            required
            class="form-input"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-3">Số tài khoản</label>
          <input
            v-model="userForm.account_number"
            class="form-input"
          />
        </div>
      </div>

      <!-- Ngân hàng chiếm full width -->
      <div class="mt-4">
        <label class="block text-sm font-medium text-gray-700 mb-3">Ngân hàng</label>
        <div class="relative">
          <input
            type="text"
            v-model="bankSearch"
            @focus="showBankDropdown = true"
            :placeholder="selectedBankName || 'Tìm ngân hàng...'"
            class="form-input pl-10 pr-10 w-full"
          />
          
          <!-- Search icon -->
          <span class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
          </span>
          
          <!-- Clear button -->
          <button
            v-if="userForm.bank"
            type="button"
            @click="clearSelectedBank"
            class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon class="h-5 w-5" />
          </button>

          <!-- Dropdown -->
          <div
            v-show="showBankDropdown"
            class="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg max-h-60 overflow-auto border border-gray-200"
          >
            <!-- Bank list -->
            <div v-if="filteredBanks.length > 0" class="py-1">
              <button
                v-for="bank in filteredBanks"
                :key="bank.code"
                @click="selectBank(bank)"
                class="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 flex items-center justify-between"
                :class="{'bg-green-50': userForm.bank === bank.code}"
              >
                <div class="flex items-center min-w-0 flex-1 mr-2"> <!-- Thêm min-w-0 và flex-1 -->
                  <span class="font-medium truncate">{{ bank.short_name }}</span>
                  <span class="text-gray-500 mx-2">-</span>
                  <span class="text-gray-500 truncate">{{ bank.name }}</span>
                </div>
                <span v-if="userForm.bank === bank.code" class="text-green-600 flex-shrink-0"> <!-- Thêm flex-shrink-0 -->
                  <CheckIcon class="h-5 w-5" />
                </span>
              </button>
            </div>

            <!-- No results -->
            <div
              v-else
              class="px-4 py-2 text-sm text-gray-500 text-center"
            >
              Không tìm thấy ngân hàng phù hợp
            </div>
          </div>
        </div>
      </div>
      
      <div class="mt-4 flex justify-end space-x-3">
        <button
          type="button"
          @click="resetForm"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Reset
        </button>
        <button
          type="submit"
          class="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
        >
          {{ editingUserId ? 'Cập nhật' : 'Thêm' }}
        </button>
      </div>
    </form>

    <!-- Table cho desktop -->
    <div class="hidden sm:block overflow-x-auto">
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

    <!-- Card layout cho mobile -->
    <div class="sm:hidden space-y-4">
      <div v-for="user in users" :key="user.id" 
        class="bg-white rounded-lg border p-4">
        <div class="flex justify-between items-start mb-3">
          <div class="font-medium">{{ user.name }}</div>
          <div class="flex space-x-2">
            <button
              @click="editUser(user)"
              class="text-sm text-indigo-600 hover:text-indigo-900"
            >
              Sửa
            </button>
            <button
              @click="deleteUser(user.id)"
              class="text-sm text-red-600 hover:text-red-900"
            >
              Xóa
            </button>
          </div>
        </div>
        <div class="space-y-2 text-sm">
          <div class="grid grid-cols-2">
            <div class="text-gray-500">Số tài khoản:</div>
            <div>{{ user.account_number }}</div>
          </div>
          <div class="grid grid-cols-2">
            <div class="text-gray-500">Ngân hàng:</div>
            <div>{{ user.bank + ' - ' + getBankName(user.bank) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { XMarkIcon, MagnifyingGlassIcon, CheckIcon } from '@heroicons/vue/24/outline'
import { useBanks } from '~/composables/useBanks'
import { useUserStore } from '~/stores/useUserStore'
import { storeToRefs } from 'pinia'

const userStore = useUserStore()
const { users } = storeToRefs(userStore) // Sử dụng storeToRefs để giữ reactivity
const editingUserId = ref(null)
const userForm = ref({
  name: '',
  account_number: '',
  bank: ''
})

const { banks } = useBanks() // Chỉ cần lấy banks

// Bank selection
const bankSearch = ref('')
const showBankDropdown = ref(false)

// Computed property for filtered banks
const filteredBanks = computed(() => {
  const search = bankSearch.value.toLowerCase().trim()
  if (!search) return banks.value
  
  return banks.value.filter(bank => 
    bank.name.toLowerCase().includes(search) ||
    bank.short_name.toLowerCase().includes(search) ||
    bank.code.toLowerCase().includes(search)
  )
})

// Get selected bank name
const selectedBankName = computed(() => {
  if (!userForm.value.bank) return ''
  const bank = banks.value.find(b => b.code === userForm.value.bank)
  return bank ? `${bank.short_name} - ${bank.name}` : ''
})

// Get bank name from code
const getBankName = (code: string) => {
  const bank = banks.value.find(b => b.code === code)
  return bank ? bank.name : code
}

// Handle form submission
const handleSubmit = async () => {
  try {
    const supabase = useSupabaseClient()
    
    if (editingUserId.value) {
      const { error } = await supabase
        .from('users')
        .update(userForm.value)
        .eq('id', editingUserId.value)
      
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('users')
        .insert([userForm.value])
      
      if (error) throw error
    }
    
    await userStore.refreshUsers()
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
    
    await userStore.refreshUsers()
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

// Handle bank selection
const selectBank = (bank) => {
  userForm.value.bank = bank.code
  bankSearch.value = ''
  showBankDropdown.value = false
}

// Clear selected bank
const clearSelectedBank = () => {
  userForm.value.bank = ''
  bankSearch.value = ''
}

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.relative')) {
    showBankDropdown.value = false
  }
}

// Setup and cleanup click outside listener
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
