<template>
  <Transition
    enter-active-class="transition-opacity duration-300 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-300 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div class="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div class="flex flex-col items-center transform">
        <!-- Logo text với animation -->
        <div class="text-4xl font-bold text-green-600 mb-4 relative">
          <span class="loading-text inline-block">Ez</span>
          <span class="loading-text inline-block text-green-800">Split</span>
        </div>
        
        <!-- Loading bar -->
        <div class="w-48 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div class="loading-bar h-full bg-gradient-to-r from-green-400 to-green-600"></div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.loading-text {
  animation: pulse 2s ease-in-out infinite;
  transform-origin: center center;
}

.loading-bar {
  animation: loading 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(0.98);
  }
}

@keyframes loading {
  0% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(-100%);
  }
}

/* Smooth transition for mounting/unmounting */
.fixed {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
