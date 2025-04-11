<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <div class="flex justify-end">
          <button 
            @click="$emit('close')" 
            class="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        <slot></slot>
      </div>
    </div>
  </div>
</template>