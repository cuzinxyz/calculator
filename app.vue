<template>
  <div>
    <LoadingScreen v-if="isLoading" />
    <Transition
      enter-active-class="transition-opacity duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-300 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-show="!isLoading">
        <NuxtPage />
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { provide, ref, onMounted, onBeforeUnmount } from 'vue'

const isLoading = ref(true)
provide('isLoading', isLoading)

onMounted(() => {
  // Nếu trang đã load xong
  if (document.readyState === 'complete') {
    setTimeout(() => {
      isLoading.value = false
    }, 500)
  } else {
    // Nếu trang chưa load xong, đợi event load
    const handleLoad = () => {
      setTimeout(() => {
        isLoading.value = false
      }, 500)
      window.removeEventListener('load', handleLoad)
    }
    window.addEventListener('load', handleLoad)
  }

  // Xử lý navigation
  const handleBeforeUnload = () => {
    isLoading.value = true
  }
  
  if (window?.navigator?.connection) {
    const connection = window.navigator.connection
    if (connection.effectiveType === '3g' || connection.effectiveType === '2g') {
      window.addEventListener('beforeunload', handleBeforeUnload)
    }
  }

  // Cleanup
  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
  })
})
</script>

<style>
.page-enter-active,
.page-leave-active {
  transition: all 0.3s ease-out;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>

