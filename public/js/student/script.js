document.addEventListener("DOMContentLoaded", () => {
  // Reading Mission Logic (existing)
  const startBtn = document.getElementById("startBtn");
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      alert("Starting today's reading mission!");
    });
  }

  // Dropdown Logic
  const dropdown = document.querySelector('.dropdown');

  if (dropdown) {
    const avatar = dropdown.querySelector('.avatar');

    if (avatar) {
      // Toggle dropdown on avatar click
      avatar.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('is-active');
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) {
          dropdown.classList.remove('is-active');
        }
      });

      // Close dropdown when pressing Escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          dropdown.classList.remove('is-active');
        }
      });
    }
  }
});