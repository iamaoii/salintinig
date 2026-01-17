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
        document.getElementById('storyImageUrl').value = '';
        resetImagePreview();
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

        // Handle image
        const imageUrl = dataset.image || '';
        document.getElementById('storyImageUrl').value = imageUrl;
        if (imageUrl) {
            showImagePreview('../' + imageUrl);
        } else {
            resetImagePreview();
        }

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

    // Image Upload Handling
    window.handleImageUpload = function (input) {
        if (!input.files || !input.files[0]) return;

        const file = input.files[0];
        const formData = new FormData();
        formData.append('image', file);

        const uploadArea = document.getElementById('imageUploadArea');
        uploadArea.innerHTML = '<span class="material-symbols-outlined" style="font-size: 2rem; color: #64748B;">hourglass_empty</span><p style="margin: 0.5rem 0 0; color: #64748B;">Uploading...</p>';

        fetch('../api/upload-image.php', {
            method: 'POST',
            body: formData
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    document.getElementById('storyImageUrl').value = data.image_url;
                    showImagePreview('../' + data.image_url);
                } else {
                    alert(data.error || 'Upload failed');
                    resetImagePreview();
                }
            })
            .catch(() => {
                alert('Upload error');
                resetImagePreview();
            });
    };

    function showImagePreview(src) {
        const area = document.getElementById('imageUploadArea');
        area.innerHTML = `
            <input type="file" id="imageFileInput" accept="image/*" style="display: none" onchange="handleImageUpload(this)">
            <img src="${src}" class="image-preview" style="display: block;">
            <p style="margin: 0.5rem 0 0; color: #10B981; font-size: 0.75rem;">✓ Image uploaded (click to change)</p>
        `;
        area.classList.add('has-image');
    }

    function resetImagePreview() {
        const area = document.getElementById('imageUploadArea');
        area.innerHTML = `
            <input type="file" id="imageFileInput" accept="image/*" style="display: none" onchange="handleImageUpload(this)">
            <span class="material-symbols-outlined" style="font-size: 2rem; color: #94A3B8;">add_photo_alternate</span>
            <p style="margin: 0.5rem 0 0; color: #64748B; font-size: 0.875rem;">Click to upload image</p>
            <img id="imagePreview" class="image-preview" style="display: none;">
        `;
        area.classList.remove('has-image');
    }
});
