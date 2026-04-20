
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

    const resumeRecordsContainer = document.getElementById("resumeRecordsContainer");
    const searchResume = document.getElementById("searchResume");

    let allResumes = [];

    function renderResumes(resumes) {
        resumeRecordsContainer.innerHTML = "";

        if (resumes.length === 0) {
            resumeRecordsContainer.innerHTML = "<p>No resumes found.</p>";
            return;
        }

        resumes.forEach(record => {
            const resume = record.resume || {};

            const div = document.createElement("div");
            div.classList.add("resume-record-card");

            div.innerHTML = `
                <p><b>User Email:</b> ${record.email}</p>
                <p><b>Saved On:</b> ${new Date(record.date).toLocaleString()}</p>

                <details>
                    <summary>View Resume Details</summary>
                    <p><b>Full Name:</b> ${resume.fullName || ""}</p>
                    <p><b>Email:</b> ${resume.email || ""}</p>
                    <p><b>Phone:</b> ${resume.phone || ""}</p>
                    <p><b>Location:</b> ${resume.location || ""}</p>
                    <p><b>LinkedIn:</b> ${resume.linkedin || ""}</p>
                    <p><b>Summary:</b> ${resume.summary || ""}</p>
                    <p><b>Education:</b> ${resume.education || ""}</p>
                    <p><b>Skills:</b> ${resume.skills || ""}</p>
                    <p><b>Experience:</b> ${resume.experience || ""}</p>
                    <p><b>Projects:</b> ${resume.projects || ""}</p>
                    <p><b>Certifications:</b> ${resume.certifications || ""}</p>
                </details>

                <button class="delete-btn" data-id="${record._id}">Delete</button>
            `;

            resumeRecordsContainer.appendChild(div);
        });

        document.querySelectorAll(".delete-btn").forEach(button => {
            button.addEventListener("click", async function () {
                const id = this.getAttribute("data-id");

                const confirmDelete = confirm("Delete this resume?");
                if (!confirmDelete) return;

                try {
                    const response = await fetch(`http://localhost:5000/admin/resumes/${id}`, {
                        method: "DELETE"
                    });

                    const data = await response.json();
                    alert(data.message);
                    loadResumes();

                } catch (err) {
                    console.error(err);
                    alert("Error deleting resume");
                }
            });
        });
    }

    function applyFilter() {
        const searchText = searchResume.value.toLowerCase();

        const filtered = allResumes.filter(record =>
            record.email.toLowerCase().includes(searchText)
        );

        renderResumes(filtered);
    }

    async function loadResumes() {
        try {
            const response = await fetch("http://localhost:5000/admin/resumes");
            allResumes = await response.json();
            applyFilter();
        } catch (err) {
            console.error(err);
            resumeRecordsContainer.innerHTML = "<p>Error loading resumes.</p>";
        }
    }

    searchResume.addEventListener("input", applyFilter);

    loadResumes();
});