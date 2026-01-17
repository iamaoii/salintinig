function deleteAssignment(id) {
    if (!confirm('Are you sure you want to delete this assignment?')) return;

    fetch('../api/assignments.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `action=delete&id=${id}`
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                location.reload();
            } else {
                alert(data.error || 'Failed to delete assignment');
            }
        })
        .catch(() => alert('Connection error'));
}
