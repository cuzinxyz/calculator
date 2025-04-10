import { ref, onMounted } from 'vue'

export const useUsers = () => {
  const users = ref([])
  const loading = ref(false)
  const error = ref(null)

  const fetchUsers = async () => {
    loading.value = true
    error.value = null
    
    try {
      const { data, error: supabaseError } = await useSupabaseClient()
        .from('users')
        .select('*')
        .order('name')
      
      if (supabaseError) throw supabaseError
      users.value = data
    } catch (err) {
      error.value = err
      console.error('Error loading users:', err)
    } finally {
      loading.value = false
    }
  }

  return {
    users,
    loading,
    error,
    fetchUsers
  }
}