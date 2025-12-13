// script.js - Dynamic left side color + message switch
document.addEventListener('DOMContentLoaded', function () {
    const authTab = document.getElementById('authTab');
    const studentMessage = document.querySelector('.student-message');
    const teacherMessage = document.querySelector('.teacher-message');
  
    authTab.addEventListener('shown.bs.tab', function (e) {
        document.body.classList.remove('tab-student-active', 'tab-teacher-active');
  
        if (e.target.id === 'student-tab') {
            document.body.classList.add('tab-student-active');
            studentMessage.style.display = 'block';
            teacherMessage.style.display = 'none';
        } else if (e.target.id === 'teacher-tab') {
            document.body.classList.add('tab-teacher-active');
            studentMessage.style.display = 'none';
            teacherMessage.style.display = 'block';
        }
    });
  
    // Default: Student
    document.body.classList.add('tab-student-active');
    studentMessage.style.display = 'block';
    teacherMessage.style.display = 'none';
  });