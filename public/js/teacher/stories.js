document.addEventListener('DOMContentLoaded', function () {

    // Modal Utilities
    window.openModal = function (modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            // slight delay to allow display flex to apply before opacity transition
            setTimeout(() => {
                modal.classList.add('active');
            }, 10);
            document.body.style.overflow = 'hidden';
        }
    };

    window.closeModal = function (modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 200); // match css transition
            document.body.style.overflow = '';
        }
    };

    // Close Modals on Overlay Click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function (e) {
            if (e.target === this) {
                closeModal(this.id);
            }
        });
    });

    // Story Form Handling
    const storyForm = document.getElementById('storyForm');
    if (storyForm) {
        storyForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const formData = new FormData(this);
            const storyId = document.getElementById('storyId').value;
            formData.append('action', storyId ? 'update' : 'create');

            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerText;
            submitBtn.innerText = 'Saving...';
            submitBtn.disabled = true;

            fetch('../api/stories.php', {
                method: 'POST',
                body: formData
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        closeModal('storyModal');
                        window.location.reload();
                    } else {
                        alert('Error saving story: ' + (data.error || 'Unknown error'));
                    }
                })
                .catch(err => {
                    console.error(err);
                    alert('Error saving story');
                })
                .finally(() => {
                    submitBtn.innerText = originalText;
                    submitBtn.disabled = false;
                });
        });
    }

    // Assignment Form Handling
    const assignForm = document.getElementById('assignForm');
    if (assignForm) {
        assignForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const formData = new FormData(this);
            formData.append('action', 'create');

            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerText;
            submitBtn.innerText = 'Assigning...';
            submitBtn.disabled = true;

            fetch('../api/assignments.php', {
                method: 'POST',
                body: formData
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        alert(data.message || 'Story assigned successfully!');
                        closeModal('assignModal');
                    } else {
                        alert(data.error || 'Failed to assign story');
                    }
                })
                .catch(() => alert('Connection error'))
                .finally(() => {
                    submitBtn.innerText = originalText;
                    submitBtn.disabled = false;
                });
        });
    }

    // Expose functions for onclick handlers
    window.openAddModal = function () {
        document.getElementById('modalTitle').textContent = 'Add New Story';
        document.getElementById('storyForm').reset();
        document.getElementById('storyId').value = '';
        openModal('storyModal');
    };

    window.openEditModal = function (btn) {
        const dataset = btn.dataset;
        document.getElementById('modalTitle').textContent = 'Edit Story';
        document.getElementById('storyId').value = dataset.id;
        document.getElementById('storyTitle').value = dataset.title;
        document.getElementById('storyDesc').value = dataset.description;
        document.getElementById('storyContent').value = dataset.content;
        document.getElementById('storyGrade').value = dataset.grade;
        document.getElementById('storyLang').value = dataset.language;
        openModal('storyModal');
    };

    window.openAssignModal = function (storyId, storyTitle) {
        document.getElementById('assignStoryId').value = storyId;
        document.getElementById('assignStoryTitle').textContent = storyTitle;
        document.getElementById('assignStudent').value = 'all';
        document.getElementById('assignDueDate').value = '';
        openModal('assignModal');
    };

    window.deleteStory = function (id) {
        if (confirm('Are you sure you want to delete this story?')) {
            fetch('../api/stories.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'action=delete&id=' + id
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        window.location.reload();
                    } else {
                        alert('Error deleting story');
                    }
                })
                .catch(() => alert('Error deleting story'));
        }
    };
});
