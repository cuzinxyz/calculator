import { ref } from 'vue'
import banksData from '~/constants/banks.json'

export const useBanks = () => {
  const banks = ref(banksData.data)

  return {
    banks
  }
}
