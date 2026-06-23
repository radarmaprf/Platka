// ============================================================
// anti-debug.js — базовая защита от просмотра кода
// ============================================================

// 1. Блокировка F12 и других клавиш
document.addEventListener('keydown', function(e) {
    // F12
    if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
    // Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+U / Ctrl+Shift+C
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
    if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
    // Ctrl+Shift+J (альтернатива)
    if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
}, false);

// 2. Блокировка контекстного меню (правый клик)
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
}, false);

// 3. Дополнительная защита: предупреждение при попытке открыть DevTools через меню (не всегда работает)
// Можно попытаться обнаружить открытие DevTools по изменению размера окна
// (но это ненадёжно и может давать ложные срабатывания)
let devtoolsOpen = false;
const element = new Image();
Object.defineProperty(element, 'id', {
    get: function() {
        devtoolsOpen = true;
        alert('🚫 Инструменты разработчика отключены!');
        // Можно перенаправить или выполнить другие действия
        window.location.reload();
    }
});
requestAnimationFrame(function check() {
    if (!devtoolsOpen) {
        console.log('%c', element);
        devtoolsOpen = false;
        requestAnimationFrame(check);
    }
});
