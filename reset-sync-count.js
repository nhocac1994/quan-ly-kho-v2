// Script để reset sync count
console.log('🔄 Đang reset sync count...');

// Reset sync count trong localStorage
localStorage.setItem('supabase_auto_sync_syncCount', '0');

console.log('✅ Đã reset sync count về 0');
console.log('🔄 Vui lòng refresh trang để thấy thay đổi');

// Tự động refresh sau 2 giây
setTimeout(() => {
  window.location.reload();
}, 2000); 