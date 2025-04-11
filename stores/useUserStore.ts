import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('users', () => {
  const users = ref([])
  const loading = ref(false)
  const error = ref(null)
  const isInitialized = ref(false)

  const fetchUsers = async () => {
    // Nếu đang loading thì không fetch
    if (loading.value) return
    
    loading.value = true
    error.value = null
    
    try {
      const { data, error: supabaseError } = await useSupabaseClient()
        .from('users')
        .select('*')
        .order('name')
      
      if (supabaseError) throw supabaseError
      users.value = data
      isInitialized.value = true
    } catch (err) {
      error.value = err
      console.error('Error loading users:', err)
    } finally {
      loading.value = false
    }
  }

  const refreshUsers = async () => {
    isInitialized.value = false
    await fetchUsers()
  }

  return {
    users,
    loading,
    error,
    fetchUsers,
    refreshUsers
  }
})
