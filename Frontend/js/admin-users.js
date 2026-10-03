
const role = localStorage.getItem("userRole");

if(role !== "admin"){
    window.location.href = "login.html";
}


document.addEventListener("DOMContentLoaded", async function () {
    const adminEmail = localStorage.getItem("adminEmail");

    if (!adminEmail) {
        window.location.href = "admin-login.html";
        return;
    }

    const tbody = document.getElementById("usersTableBody");
    const searchUser = document.getElementById("searchUser");
    const filterRole = document.getElementById("filterRole");

    let allUsers = [];

    function renderUsers(users) {
        tbody.innerHTML = "";

        users.forEach(user => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td>
                    ${user.role !== "admin" ? `<button class="delete-btn" data-id="${user._id}">Delete</button>` : ""}
                </td>
            `;

            tbody.appendChild(row);
        });

        document.querySelectorAll(".delete-btn").forEach(button => {
            button.addEventListener("click", async function () {
                const userId = this.getAttribute("data-id");

                const confirmDelete = confirm("Are you sure you want to delete this user?");
                if (!confirmDelete) return;

                try {
                    const response = await fetch(`http://localhost:5000/admin/users/${userId}`, {
                        method: "DELETE"
                    });

                    const data = await response.json();
                    alert(data.message);
                    loadUsers();

                } catch (err) {
                    console.error(err);
                    alert("Error deleting user");
                }
            });
        });
    }

    function applyFilters() {
        const searchText = searchUser.value.toLowerCase();
        const roleValue = filterRole.value;

        const filtered = allUsers.filter(user => {
            const matchesSearch =
                user.name.toLowerCase().includes(searchText) ||
                user.email.toLowerCase().includes(searchText);

            const matchesRole = roleValue === "" || user.role === roleValue;

            return matchesSearch && matchesRole;
        });

        renderUsers(filtered);
    }

    async function loadUsers() {
        try {
            const response = await fetch("http://localhost:5000/admin/users");
            allUsers = await response.json();
            applyFilters();
        } catch (err) {
            console.error(err);
        }
    }

    searchUser.addEventListener("input", applyFilters);
    filterRole.addEventListener("change", applyFilters);

    loadUsers();
});