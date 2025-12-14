// public/js/script.js - FINAL: Auto-redirect after signup + login, clean UI

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

    let lastTab = 'student';

    // Dynamic ID field
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

    // Tab visual effects
    if (authTab) {
        authTab.addEventListener('shown.bs.tab', function (e) {
            document.body.classList.remove('tab-student-active', 'tab-teacher-active', 'signup-active');

            if (e.target.id === 'student-tab') {
                document.body.classList.add('tab-student-active');
                if (studentMessage) studentMessage.style.display = 'block';
                if (teacherMessage) teacherMessage.style.display = 'none';
                if (signupMessage) signupMessage.style.display = 'none';
                lastTab = 'student';
            } else if (e.target.id === 'teacher-tab') {
                document.body.classList.add('tab-teacher-active');
                if (studentMessage) studentMessage.style.display = 'none';
                if (teacherMessage) teacherMessage.style.display = 'block';
                if (signupMessage) signupMessage.style.display = 'none';
                lastTab = 'teacher';
            }

            backHomeLink.classList.remove('signup-hover-blue');
        });
    }

    // Show Sign Up
    document.getElementById('show-signup')?.addEventListener('click', function (e) {
        e.preventDefault();
        document.body.classList.remove('tab-student-active', 'tab-teacher-active');
        document.body.classList.add('signup-active');
        if (studentMessage) studentMessage.style.display = 'none';
        if (teacherMessage) teacherMessage.style.display = 'none';
        if (signupMessage) signupMessage.style.display = 'block';
        backHomeLink.classList.add('signup-hover-blue');

        loginSection.style.display = 'none';
        signupSection.style.display = 'block';
    });

    // Show Login
    document.getElementById('show-login')?.addEventListener('click', function (e) {
        e.preventDefault();
        document.body.classList.remove('signup-active');

        if (lastTab === 'student') {
            document.body.classList.add('tab-student-active');
            if (studentMessage) studentMessage.style.display = 'block';
            if (teacherMessage) teacherMessage.style.display = 'none';
        } else {
            document.body.classList.add('tab-teacher-active');
            if (studentMessage) studentMessage.style.display = 'none';
            if (teacherMessage) teacherMessage.style.display = 'block';
        }
        if (signupMessage) signupMessage.style.display = 'none';
        backHomeLink.classList.remove('signup-hover-blue');

        loginSection.style.display = 'block';
        signupSection.style.display = 'none';
    });

    // === SIGNUP & LOGIN: SAME REDIRECT LOGIC ===
    const handleAuthResponse = (data) => {
        if (data.success && data.redirect) {
            // No alert — just redirect immediately
            window.location.href = data.redirect;
        } else {
            alert(data.error || 'Something went wrong. Please try again.');
        }
    };

    // Signup
    document.getElementById('signup-form')?.addEventListener('submit', function (e) {
        e.preventDefault();
        const formData = new FormData(this);
        formData.append('action', 'signup');

        fetch('api/auth.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(handleAuthResponse)
        .catch(err => {
            console.error('Signup error:', err);
            alert('Connection error. Please try again.');
        });
    });

    // Login
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
            .then(response => response.json())
            .then(handleAuthResponse)
            .catch(err => {
                console.error('Login error:', err);
                alert('Connection error. Please try again.');
            });
        });
    });

    // Default state
    document.body.classList.add('tab-student-active');
    if (studentMessage) studentMessage.style.display = 'block';
    if (teacherMessage) teacherMessage.style.display = 'none';
    if (signupMessage) signupMessage.style.display = 'none';
    loginSection.style.display = 'block';
    signupSection.style.display = 'none';
});