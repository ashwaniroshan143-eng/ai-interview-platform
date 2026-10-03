
document.addEventListener("DOMContentLoaded", function () {
    const adminLoginForm = document.getElementById("adminLoginForm");

    if (adminLoginForm) {
        adminLoginForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const email = document.getElementById("adminEmail").value;
            const password = document.getElementById("adminPassword").value;

            try {
                const response = await fetch("http://localhost:5000/admin/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                document.getElementById("adminLoginMessage").innerText = data.message;

                if (data.message === "Admin login successful") {
                    localStorage.setItem("adminEmail", data.email);
                    localStorage.setItem("adminName", data.name);

                    setTimeout(() => {
                        window.location.href = "admin-dashboard.html";
                    }, 1000);
                }

            } catch (err) {
                console.error(err);
                document.getElementById("adminLoginMessage").innerText = "Error connecting to server";
            }
        });
    }
});