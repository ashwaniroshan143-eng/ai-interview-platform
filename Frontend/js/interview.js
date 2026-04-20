const role = localStorage.getItem("userRole");

if (!role || role === "admin") {
    window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", function () {
    const userEmail = localStorage.getItem("userEmail");
    if (!userEmail) {
        window.location.href = "login.html";
        return;
    }

    const interviewContainer = document.getElementById("interviewContainer");
    const submitBtn = document.getElementById("submitInterview");
    submitBtn.style.display = "none";

    const sections = [
        "Behavioral & HR",
        "Technical & Domain Fundamentals",
        "Coding & DSA (Data Structures & Algorithms)",
        "Aptitude & Logical Reasoning",
        "Communication & Verbal English",
        "Case Study / Business Scenario Test"
    ];

    let currentSection = "";
    let currentQuestions = [];
    let currentQuestionIndex = 0;
    let records = [];

    function shuffleArray(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function showSectionCards() {
        interviewContainer.innerHTML = "";
        submitBtn.style.display = "none";

        const wrapper = document.createElement("div");
        wrapper.style.display = "grid";
        wrapper.style.gridTemplateColumns = "repeat(auto-fit, minmax(260px, 1fr))";
        wrapper.style.gap = "25px";
        wrapper.style.marginTop = "20px";

        sections.forEach(section => {
            const card = document.createElement("div");
            card.classList.add("dashboard-card");
            card.style.cursor = "pointer";
            card.style.padding = "25px";

            card.innerHTML = `
                <h3>${section}</h3>
                <p>Questions will be loaded from admin database.</p>
                <button type="button">Start Practice</button>
            `;

            card.querySelector("button").addEventListener("click", function (e) {
                e.stopPropagation();
                startInterview(section);
            });

            card.addEventListener("click", function () {
                startInterview(section);
            });

            wrapper.appendChild(card);
        });

        interviewContainer.appendChild(wrapper);
    }

    async function startInterview(section) {
        currentSection = section;
        currentQuestionIndex = 0;
        records = [];
        submitBtn.style.display = "none";

        interviewContainer.innerHTML = `
            <div class="dashboard-card" style="max-width:700px; margin:30px auto; padding:30px; text-align:center;">
                <h3>Loading Questions...</h3>
            </div>
        `;

        try {
            const encodedSection = encodeURIComponent(section);
            const response = await fetch(`http://localhost:5000/questions/${encodedSection}`);
            const questions = await response.json();

            if (!questions || questions.length === 0) {
                interviewContainer.innerHTML = `
                    <div class="dashboard-card" style="max-width:700px; margin:30px auto; padding:30px; text-align:center;">
                        <h3>No Questions Found</h3>
                        <p>No questions available for this section yet.</p>
                        <button type="button" id="backBtn">Back to Sections</button>
                    </div>
                `;

                document.getElementById("backBtn").addEventListener("click", showSectionCards);
                return;
            }

            currentQuestions = shuffleArray(questions);
            showSingleQuestion();

        } catch (err) {
            console.error(err);
            interviewContainer.innerHTML = `
                <div class="dashboard-card" style="max-width:700px; margin:30px auto; padding:30px; text-align:center;">
                    <h3>Error</h3>
                    <p>Unable to load questions.</p>
                    <button type="button" id="backBtn">Back to Sections</button>
                </div>
            `;

            document.getElementById("backBtn").addEventListener("click", showSectionCards);
        }
    }

    function showSingleQuestion() {
        interviewContainer.innerHTML = "";

        const currentQ = currentQuestions[currentQuestionIndex];
        const totalQuestions = currentQuestions.length;
        const completedQuestions = currentQuestionIndex;
        const remainingQuestions = totalQuestions - completedQuestions;

        const card = document.createElement("div");
        card.classList.add("dashboard-card");
        card.style.maxWidth = "700px";
        card.style.margin = "30px auto";
        card.style.padding = "30px";

        let answerHTML = "";

        if (currentQ.type === "text") {
            answerHTML = `
                <textarea id="answerBox" rows="5" placeholder="Type your answer here" style="width:100%; margin-top:15px;"></textarea>
            `;
        } else {
            answerHTML = (currentQ.options || []).map(option => `
                <label style="display:block; margin-top:12px; text-align:left;">
                    <input type="radio" name="mcqAnswer" value="${option}">
                    ${option}
                </label>
            `).join("");
        }

        card.innerHTML = `
            <h3>${currentSection}</h3>
            <p><b>Question ${currentQuestionIndex + 1} of ${totalQuestions}</b></p>
            <p><b>Completed:</b> ${completedQuestions} | <b>Remaining:</b> ${remainingQuestions}</p>
            <p style="margin-top:15px;"><b>${currentQ.question}</b></p>
            <div style="margin-top:15px;">
                ${answerHTML}
            </div>
            <div style="margin-top:20px; display:flex; gap:15px; flex-wrap:wrap;">
                <button type="button" id="nextBtn">${currentQuestionIndex === totalQuestions - 1 ? "Finish" : "Next"}</button>
                <button type="button" id="backBtn">Back to Sections</button>
            </div>
        `;

        interviewContainer.appendChild(card);

        document.getElementById("nextBtn").addEventListener("click", handleNextQuestion);
        document.getElementById("backBtn").addEventListener("click", showSectionCards);
    }

    function handleNextQuestion() {
        const currentQ = currentQuestions[currentQuestionIndex];
        let answer = "";
        let score = 0;
        let feedback = "";

        if (currentQ.type === "text") {
            answer = document.getElementById("answerBox").value.trim();

            if (answer.length > 0) score += 1;
            if (answer.length > 40) score += 1;
            if (answer.length > 80) score += 1;

            if (answer.length > 80) {
                feedback = "Excellent detailed answer!";
            } else if (answer.length > 40) {
                feedback = "Good answer, but you can add a little more detail.";
            } else if (answer.length > 0) {
                feedback = "Answered, but try to explain more clearly.";
            } else {
                feedback = "You did not answer this question.";
            }
        } else {
            const selected = document.querySelector('input[name="mcqAnswer"]:checked');
            answer = selected ? selected.value : "";

            if (answer === currentQ.answer) {
                score = 3;
                feedback = "Correct answer!";
            } else if (answer === "") {
                feedback = `No option selected. Correct answer: ${currentQ.answer}`;
            } else {
                feedback = `Incorrect. Correct answer: ${currentQ.answer}`;
            }
        }

        records.push({
            q: currentQ.question,
            answer: answer,
            feedback: feedback,
            score: score
        });

        currentQuestionIndex++;

        if (currentQuestionIndex < currentQuestions.length) {
            showSingleQuestion();
        } else {
            submitInterview();
        }
    }

    function calculateSolvedQuestions() {
        let solved = 0;
        records.forEach(item => {
            if ((item.score ?? 0) > 0) {
                solved += 1;
            }
        });
        return solved;
    }

    async function submitInterview() {
        let totalScore = 0;
        records.forEach(item => totalScore += item.score);

        const totalQuestions = currentQuestions.length;
        const solvedQuestions = calculateSolvedQuestions();
        const maxScore = totalQuestions * 3;

        interviewContainer.innerHTML = `
            <div class="dashboard-card" style="max-width:700px; margin:30px auto; padding:30px; text-align:center;">
                <h3>Interview Completed</h3>
                <p><b>Total Solved Questions:</b> ${solvedQuestions}/${totalQuestions}</p>
                <p><b>Total Score:</b> ${totalScore}/${maxScore}</p>
                <p>Saving your interview...</p>
            </div>
        `;

        try {
            await fetch("http://localhost:5000/interview", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: userEmail,
                    section: currentSection,
                    questions: records,
                    score: totalScore
                })
            });

            alert(`Interview submitted successfully! Total Solved Questions: ${solvedQuestions}/${totalQuestions} | Total Score: ${totalScore}/${maxScore}`);
            window.location.href = "dashboard.html";

        } catch (err) {
            console.error(err);
            alert("Error saving interview");
        }
    }

    document.getElementById("logoutLink").addEventListener("click", function () {
        localStorage.removeItem("userEmail");
        window.location.href = "login.html";
    });

    showSectionCards();
});