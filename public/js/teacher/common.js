// Profile dropdown toggle
function toggleProfileDropdown() {
    document.getElementById('profileMenu').classList.toggle('show');
}

// Close dropdown when clicking outside
document.addEventListener('click', function (e) {
    if (!e.target.closest('.profile-dropdown')) {
        const menu = document.getElementById('profileMenu');
        if (menu) menu.classList.remove('show');
    }
});
