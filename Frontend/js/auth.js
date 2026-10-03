function requireUserPage() {
    const userEmail = localStorage.getItem("userEmail");
    const userRole = localStorage.getItem("userRole");

    if (!userEmail || userRole === "admin") {
        window.location.href = "login.html";
    }
}

function requireAdminPage() {
    const adminEmail = localStorage.getItem("adminEmail");
    const userRole = localStorage.getItem("userRole");

    if (!adminEmail && userRole !== "admin") {
        window.location.href = "admin-login.html";
    }
}

function logoutUser() {
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    window.location.href = "login.html";
}

function logoutAdmin() {
    localStorage.removeItem("adminEmail");
    localStorage.removeItem("adminName");
    localStorage.removeItem("userRole");
    window.location.href = "admin-login.html";
}