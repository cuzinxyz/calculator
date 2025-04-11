import { inject } from 'vue'

export function useLoading() {
  const isLoading = inject('isLoading')
  let loadingTimeout = null

  const showLoading = () => {
    // Clear any existing timeout
    if (loadingTimeout) {
      clearTimeout(loadingTimeout)
      loadingTimeout = null
    }
    isLoading.value = true
  }

  const hideLoading = () => {
    // Đảm bảo loading hiển thị ít nhất 500ms và có transition mượt
    if (loadingTimeout) {
      clearTimeout(loadingTimeout)
    }
    
    loadingTimeout = setTimeout(() => {
      // Add fade out effect
      isLoading.value = false
      loadingTimeout = null
    }, 800) // Increased minimum time for better UX
  }

  const withLoading = async (fn) => {
    showLoading()
    try {
      await Promise.all([
        fn(),
        // Minimum loading time of 1000ms for better UX
        new Promise(resolve => setTimeout(resolve, 1000))
      ])
    } finally {
      hideLoading()
    }
  }

  return {
    isLoading,
    showLoading,
    hideLoading,
    withLoading
  }
}

