import { ref } from 'vue'
import banksData from '~/constants/banks.json'

export const useBanks = () => {
  const banks = ref([])
  const loading = ref(false)
  const error = ref(null)

  const fetchBanks = async () => {
    loading.value = true
    error.value = null
    
    try {
      // Chỉ lấy các ngân hàng được hỗ trợ
      banks.value = banksData.data
        // .filter(bank => bank.supported)
        .map(bank => ({
          code: bank.code,
          name: bank.name,
          shortName: bank.short_name,
          bin: bank.bin
        }))
    } catch (err) {
      error.value = err
      console.error('Error loading banks:', err)
    } finally {
      loading.value = false
    }
  }

  return {
    banks,
    loading,
    error,
    fetchBanks
  }
}
