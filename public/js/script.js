// script.js - Remember last tab + blue hover on Back to Home in signup
document.addEventListener('DOMContentLoaded', function () {
    const authTab = document.getElementById('authTab');
    const studentMessage = document.querySelector('.student-message');
    const teacherMessage = document.querySelector('.teacher-message');
    const signupMessage = document.querySelector('.signup-message');
    const backHomeLink = document.querySelector('.back-home');

    let lastTab = 'student'; // Remember last login tab

    // Tab switching (Login mode)
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

        // Reset Back to Home hover (use normal orange/green)
        backHomeLink.classList.remove('signup-hover-blue');
    });

    // Show Sign Up
    document.getElementById('show-signup').addEventListener('click', function (e) {
        e.preventDefault();
        document.body.classList.remove('tab-student-active', 'tab-teacher-active');
        document.body.classList.add('signup-active');
        studentMessage.style.display = 'none';
        teacherMessage.style.display = 'none';
        signupMessage.style.display = 'block';

        // Add class for blue hover on Back to Home
        backHomeLink.classList.add('signup-hover-blue');
    });

    // Show Login - Restore last tab
    document.getElementById('show-login').addEventListener('click', function (e) {
        e.preventDefault();
        document.body.classList.remove('signup-active');

        // Restore last selected tab
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

        // Remove blue hover class
        backHomeLink.classList.remove('signup-hover-blue');
    });

    // Default state
    document.body.classList.add('tab-student-active');
    studentMessage.style.display = 'block';
    teacherMessage.style.display = 'none';
    signupMessage.style.display = 'none';
});