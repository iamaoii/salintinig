// public/js/script.js - Complete & clean auth page script

document.addEventListener('DOMContentLoaded', function () {
    const authTab = document.getElementById('authTab');
    const studentMessage = document.querySelector('.student-message');
    const teacherMessage = document.querySelector('.teacher-message');
    const signupMessage = document.querySelector('.signup-message');
    const backHomeLink = document.querySelector('.back-home');
    const loginSection = document.getElementById('login-section');
    const signupSection = document.getElementById('signup-section');
    const classificationSelect = document.getElementById('classification-select');
    const idField = document.getElementById('id-field');

    let lastTab = 'student'; // Remember last login tab

    // Dynamic ID field (LRN ↔ ID Number)
    if (classificationSelect && idField) {
        classificationSelect.addEventListener('change', function () {
            if (this.value === 'student') {
                idField.name = 'lrn_number';
                idField.placeholder = 'LRN Number';
            } else if (this.value === 'teacher') {
                idField.name = 'id_number';
                idField.placeholder = 'ID Number';
            }
        });
    }

    // Tab switching visual effects
    authTab.addEventListener('shown.bs.tab', function (e) {
        document.body.classList.remove('tab-student-active', 'tab-teacher-active', 'signup-active');

        if (e.target.id === 'student-tab') {
            document.body.classList.add('tab-student-active');
            studentMessage.style.display = 'block';
            teacherMessage.style.display = 'none';
            signupMessage.style.display = 'none';
            lastTab = 'student';
        } else if (e.target.id === 'teacher-tab') {
            document.body.classList.add('tab-teacher-active');
            studentMessage.style.display = 'none';
            teacherMessage.style.display = 'block';
            signupMessage.style.display = 'none';
            lastTab = 'teacher';
        }

        backHomeLink.classList.remove('signup-hover-blue');
    });

    // Show Sign Up
    document.getElementById('show-signup')?.addEventListener('click', function (e) {
        e.preventDefault();
        document.body.classList.remove('tab-student-active', 'tab-teacher-active');
        document.body.classList.add('signup-active');
        studentMessage.style.display = 'none';
        teacherMessage.style.display = 'none';
        signupMessage.style.display = 'block';
        backHomeLink.classList.add('signup-hover-blue');

        loginSection.style.display = 'none';
        signupSection.style.display = 'block';
    });

    // Show Login - Restore last tab
    document.getElementById('show-login')?.addEventListener('click', function (e) {
        e.preventDefault();
        document.body.classList.remove('signup-active');

        if (lastTab === 'student') {
            document.body.classList.add('tab-student-active');
            studentMessage.style.display = 'block';
            teacherMessage.style.display = 'none';
        } else {
            document.body.classList.add('tab-teacher-active');
            studentMessage.style.display = 'none';
            teacherMessage.style.display = 'block';
        }
        signupMessage.style.display = 'none';
        backHomeLink.classList.remove('signup-hover-blue');

        loginSection.style.display = 'block';
        signupSection.style.display = 'none';
    });

    // Signup AJAX
    document.getElementById('signup-form')?.addEventListener('submit', function (e) {
        e.preventDefault();
        const formData = new FormData(this);
        formData.append('action', 'signup');

        fetch('api/auth.php', {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert(data.success);
                // Manually switch to login section
                loginSection.style.display = 'block';
                signupSection.style.display = 'none';
                this.reset(); // Clear form
            } else {
                alert(data.error);
            }
        })
        .catch(err => {
            console.error(err);
            alert('Network error. Please try again.');
        });
    });

    // Login AJAX
    document.querySelectorAll('#login-section form').forEach(form => {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const formData = new FormData(this);
            formData.append('action', 'login');
            formData.append('role', this.closest('.tab-pane').id);

            fetch('api/auth.php', {
                method: 'POST',
                body: formData
            })
            .then(res => res.json())
            .then(data => {
                if (data.success && data.redirect) {
                    window.location.href = data.redirect;
                } else {
                    alert(data.error || 'Login failed');
                }
            })
            .catch(err => {
                console.error(err);
                alert('Network error. Please try again.');
            });
        });
    });

    // Default state
    document.body.classList.add('tab-student-active');
    studentMessage.style.display = 'block';
    teacherMessage.style.display = 'none';
    signupMessage.style.display = 'none';
});