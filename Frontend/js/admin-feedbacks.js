document.addEventListener("DOMContentLoaded", async function () {
    const feedbackContainer = document.getElementById("feedbackContainer");
const manageFeedbacksBtn = document.getElementById("manageFeedbacks");
if (manageFeedbacksBtn) {
    manageFeedbacksBtn.addEventListener("click", function () {
        window.location.href = "admin-feedbacks.html";
    });
}
    async function loadFeedbacks() {
        feedbackContainer.innerHTML = "<p>Loading feedbacks...</p>";

        try {
            const response = await fetch("http://localhost:5000/admin/feedbacks");
            const feedbacks = await response.json();

            feedbackContainer.innerHTML = "";

            if (!feedbacks || feedbacks.length === 0) {
                feedbackContainer.innerHTML = "<p>No feedbacks found.</p>";
                return;
            }

            feedbacks.forEach(item => {
                const div = document.createElement("div");
                div.classList.add("feedback-card");

                div.innerHTML = `
                    <p><b>Email:</b> ${item.email}</p>
                    <p><b>Feedback:</b> ${item.message}</p>
                    <p><b>Date:</b> ${new Date(item.date).toLocaleString()}</p>
                    <button class="delete-btn" data-id="${item._id}">Delete</button>
                `;

                feedbackContainer.appendChild(div);
            });

            document.querySelectorAll(".delete-btn").forEach(btn => {
                btn.addEventListener("click", async function () {
                    const id = this.getAttribute("data-id");
                    const confirmDelete = confirm("Delete this feedback?");
                    if (!confirmDelete) return;

                    try {
                        const response = await fetch(`http://localhost:5000/admin/feedbacks/${id}`, {
                            method: "DELETE"
                        });
                        const data = await response.json();
                        alert(data.message || "Deleted successfully");
                        loadFeedbacks();
                    } catch (err) {
                        console.error(err);
                        alert("Error deleting feedback");
                    }
                });
            });

        } catch (err) {
            console.error(err);
            feedbackContainer.innerHTML = "<p>Error loading feedbacks.</p>";
        }
    }

    loadFeedbacks();
});