const role = localStorage.getItem("userRole");

if (role !== "admin") {
    window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", async function () {
    const adminEmail = localStorage.getItem("adminEmail");
    const adminName = localStorage.getItem("adminName");

    if (!adminEmail) {
        window.location.href = "admin-login.html";
        return;
    }

    document.getElementById("adminName").innerText = adminName || "Admin";

    try {
        const statsResponse = await fetch("http://localhost:5000/admin/stats");
        const statsData = await statsResponse.json();

        document.getElementById("totalUsers").innerText = statsData.totalUsers || 0;
        document.getElementById("totalInterviews").innerText = statsData.totalInterviews || 0;
        document.getElementById("totalResumes").innerText = statsData.totalResumes || 0;
        document.getElementById("totalFeedbacks").innerText = statsData.totalFeedbacks || 0;

        const analyticsResponse = await fetch("http://localhost:5000/admin/analytics");
        const analyticsData = await analyticsResponse.json();

        document.getElementById("averageScore").innerText = analyticsData.averageScore || 0;
        document.getElementById("topSection").innerText = analyticsData.topSection || "N/A";
        document.getElementById("weakestSection").innerText = analyticsData.weakestSection || "N/A";

        const labels = Object.keys(analyticsData.sectionCounts || {});
        const values = Object.values(analyticsData.sectionCounts || {});

        const ctx = document.getElementById("analyticsChart").getContext("2d");

        new Chart(ctx, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [{
                    label: "Interview Count by Section",
                    data: values,
                    backgroundColor: [
                        "rgba(54, 162, 235, 0.7)",
                        "rgba(255, 99, 132, 0.7)",
                        "rgba(255, 206, 86, 0.7)",
                        "rgba(75, 192, 192, 0.7)",
                        "rgba(153, 102, 255, 0.7)",
                        "rgba(255, 159, 64, 0.7)"
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        labels: {
                            color: "black"
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: "black"
                        }
                    },
                    x: {
                        ticks: {
                            color: "black"
                        }
                    }
                }
            }
        });

    } catch (err) {
        console.error(err);
    }

    const manageFeedbacksBtn = document.getElementById("manageFeedbacksBtn");
    if (manageFeedbacksBtn) {
        manageFeedbacksBtn.addEventListener("click", function () {
            window.location.href = "admin-feedbacks.html";
        });
    }

    document.getElementById("adminLogout").addEventListener("click", function () {
        localStorage.removeItem("adminEmail");
        localStorage.removeItem("adminName");
        localStorage.removeItem("userRole");
        window.location.href = "admin-login.html";
    });
});