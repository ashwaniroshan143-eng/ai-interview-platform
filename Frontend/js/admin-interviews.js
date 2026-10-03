
const role = localStorage.getItem("userRole");

if(role !== "admin"){
    window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", function () {
    const adminEmail = localStorage.getItem("adminEmail");

    if (!adminEmail) {
        window.location.href = "admin-login.html";
        return;
    }

    const recordsContainer = document.getElementById("recordsContainer");
    const searchInterview = document.getElementById("searchInterview");

    let allInterviews = [];

    function renderInterviews(interviews) {
        recordsContainer.innerHTML = "";

        if (interviews.length === 0) {
            recordsContainer.innerHTML = "<p>No interview records found.</p>";
            return;
        }

        interviews.forEach(record => {
            const div = document.createElement("div");
            div.classList.add("record-card");

            let qaHtml = record.questions.map(q => `
                <li>
                    <b>Q:</b> ${q.q}<br>
                    <b>Answer:</b> ${q.answer}<br>
                    <b>Feedback:</b> ${q.feedback}<br>
                    <b>Score:</b> ${q.score}
                </li>
            `).join("");

            div.innerHTML = `
                <p><b>User Email:</b> ${record.email}</p>
                <p><b>Total Score:</b> ${record.score}</p>
                <p><b>Date:</b> ${new Date(record.date).toLocaleString()}</p>

                <details>
                    <summary>View Questions & Answers</summary>
                    <ul>${qaHtml}</ul>
                </details>

                <button class="delete-btn" data-id="${record._id}">Delete</button>
            `;

            recordsContainer.appendChild(div);
        });

        document.querySelectorAll(".delete-btn").forEach(button => {
            button.addEventListener("click", async function () {
                const id = this.getAttribute("data-id");

                const confirmDelete = confirm("Delete this interview record?");
                if (!confirmDelete) return;

                try {
                    const response = await fetch(`http://localhost:5000/admin/interviews/${id}`, {
                        method: "DELETE"
                    });

                    const data = await response.json();
                    alert(data.message);
                    loadInterviews();

                } catch (err) {
                    console.error(err);
                    alert("Error deleting interview record");
                }
            });
        });
    }

    function applyFilter() {
        const searchText = searchInterview.value.toLowerCase();

        const filtered = allInterviews.filter(record =>
            record.email.toLowerCase().includes(searchText)
        );

        renderInterviews(filtered);
    }

    async function loadInterviews() {
        try {
            const response = await fetch("http://localhost:5000/admin/interviews");
            allInterviews = await response.json();
            applyFilter();
        } catch (err) {
            console.error(err);
            recordsContainer.innerHTML = "<p>Error loading interview records.</p>";
        }
    }

    searchInterview.addEventListener("input", applyFilter);

    loadInterviews();
});