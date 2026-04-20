
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

    const form = document.getElementById("questionForm");
    const questionsContainer = document.getElementById("questionsContainer");
    const questionMessage = document.getElementById("questionMessage");
    const searchQuestion = document.getElementById("searchQuestion");
    const filterQuestionSection = document.getElementById("filterQuestionSection");
    const filterQuestionType = document.getElementById("filterQuestionType");

    let editQuestionId = null;
    let allQuestions = [];

    function renderQuestions(questions) {
        questionsContainer.innerHTML = "";

        questions.forEach(q => {
            const card = document.createElement("div");
            card.classList.add("question-card");

            card.innerHTML = `
                <p><b>Section:</b> ${q.section}</p>
                <p><b>Type:</b> ${q.type}</p>
                <p><b>Question:</b> ${q.question}</p>
                ${q.type === "mcq" ? `<p><b>Options:</b> ${q.options.join(", ")}</p>` : ""}
                ${q.type === "mcq" ? `<p><b>Answer:</b> ${q.answer}</p>` : ""}
                <button class="edit-btn" data-id="${q._id}">Edit</button>
                <button class="delete-btn" data-id="${q._id}">Delete</button>
            `;

            questionsContainer.appendChild(card);
        });

        document.querySelectorAll(".delete-btn").forEach(btn => {
            btn.addEventListener("click", async function () {
                const id = this.getAttribute("data-id");

                if (!confirm("Delete this question?")) return;

                try {
                    const response = await fetch(`http://localhost:5000/admin/questions/${id}`, {
                        method: "DELETE"
                    });

                    const data = await response.json();
                    alert(data.message);
                    loadQuestions();
                } catch (err) {
                    console.error(err);
                    alert("Error deleting question");
                }
            });
        });

        document.querySelectorAll(".edit-btn").forEach(btn => {
            btn.addEventListener("click", function () {
                const id = this.getAttribute("data-id");
                const q = allQuestions.find(item => item._id === id);

                if (!q) return;

                document.getElementById("section").value = q.section;
                document.getElementById("type").value = q.type;
                document.getElementById("question").value = q.question;
                document.getElementById("options").value = q.options ? q.options.join(", ") : "";
                document.getElementById("answer").value = q.answer || "";

                editQuestionId = q._id;
                questionMessage.innerText = "Editing question...";
                form.querySelector("button[type='submit']").innerText = "Update Question";
            });
        });
    }

    function applyFilters() {
        const searchText = searchQuestion.value.toLowerCase();
        const sectionValue = filterQuestionSection.value;
        const typeValue = filterQuestionType.value;

        const filtered = allQuestions.filter(q => {
            const matchesSearch = q.question.toLowerCase().includes(searchText);
            const matchesSection = sectionValue === "" || q.section === sectionValue;
            const matchesType = typeValue === "" || q.type === typeValue;

            return matchesSearch && matchesSection && matchesType;
        });

        renderQuestions(filtered);
    }

    async function loadQuestions() {
        try {
            const response = await fetch("http://localhost:5000/admin/questions");
            allQuestions = await response.json();
            applyFilters();
        } catch (err) {
            console.error(err);
        }
    }

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const section = document.getElementById("section").value;
        const type = document.getElementById("type").value;
        const question = document.getElementById("question").value;
        const options = document.getElementById("options").value
            .split(",")
            .map(opt => opt.trim())
            .filter(opt => opt !== "");
        const answer = document.getElementById("answer").value;

        try {
            let response;

            if (editQuestionId) {
                response = await fetch(`http://localhost:5000/admin/questions/${editQuestionId}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        section,
                        type,
                        question,
                        options,
                        answer
                    })
                });
            } else {
                response = await fetch("http://localhost:5000/admin/questions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        section,
                        type,
                        question,
                        options,
                        answer
                    })
                });
            }

            const data = await response.json();
            questionMessage.innerText = data.message;

            form.reset();
            editQuestionId = null;
            form.querySelector("button[type='submit']").innerText = "Add Question";
            loadQuestions();

        } catch (err) {
            console.error(err);
            questionMessage.innerText = "Error saving question";
        }
    });

    searchQuestion.addEventListener("input", applyFilters);
    filterQuestionSection.addEventListener("change", applyFilters);
    filterQuestionType.addEventListener("change", applyFilters);

    loadQuestions();
});