<template>
  <div class="min-h-screen bg-green-50">
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-4xl font-bold text-center text-green-800 mb-8">EzSplit</h1>
      
      <UserManagement />
      
      <ExpenseForm 
        :editing-expense="editingExpense"
        @save="handleExpenseSave" 
        @cancel="editingExpense = null"
      />
      
      <ExpenseResults 
        :expenses="expenses" 
        @edit="editExpense"
        @refresh="loadExpenses"
      />
      
      <footer class="text-center mt-8 text-sm text-gray-600">
        <p>Made with ♥️ by abner</p>
        <p>&copy; 2025 EzSplit. All rights reserved.</p>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const expenses = ref([])
const editingExpense = ref(null)

const loadExpenses = async () => {
  const { data, error } = await useSupabaseClient()
    .from('expenses')
    .select('*')
    .order('date', { ascending: false })
  
  if (error) {
    console.error('Error loading expenses:', error)
    return
  }
  
  expenses.value = data
}

const editExpense = (expense) => {
  editingExpense.value = expense
}

const handleExpenseSave = () => {
  loadExpenses()
  editingExpense.value = null
}

onMounted(() => {
  loadExpenses()
})
</script>

