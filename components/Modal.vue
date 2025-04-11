<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <div class="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
        <h2 class="text-xl font-bold">Quản lý người dùng</h2>
        <button 
          @click="$emit('close')" 
          class="p-2 hover:bg-gray-100 rounded-full"
        >
          <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="overflow-y-auto">
        <slot></slot>
      </div>
    </div>
  </div>
</template>
