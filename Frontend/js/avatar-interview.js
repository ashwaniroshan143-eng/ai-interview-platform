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

    const startAvatarInterviewBtn = document.getElementById("startAvatarInterviewBtn");
    const restartInterviewBtn = document.getElementById("restartInterviewBtn");
    const questionArea = document.getElementById("questionArea");
    const finalResultArea = document.getElementById("finalResultArea");
    const questionText = document.getElementById("questionText");
    const answerBox = document.getElementById("answerBox");
    const progressLine = document.getElementById("progressLine");
    const timerBox = document.getElementById("timerBox");
    const confidenceBox = document.getElementById("confidenceBox");
    const speakQuestionBtn = document.getElementById("speakQuestionBtn");
    const startSpeakingBtn = document.getElementById("startSpeakingBtn");
    const pauseInterviewBtn = document.getElementById("pauseInterviewBtn");
    const nextQuestionBtn = document.getElementById("nextQuestionBtn");
    const endInterviewBtn = document.getElementById("endInterviewBtn");
    const avatarCircle = document.getElementById("avatarCircle");
    const avatarStatus = document.getElementById("avatarStatus");

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = SpeechRecognition ? new SpeechRecognition() : null;

    if (recognition) {
        recognition.lang = "en-US";
        recognition.interimResults = true;
        recognition.continuous = true;
    }

    const behavioralQuestions = [
        "Tell me about yourself.",
        "What are your strengths?",
        "What is one weakness you are working on?",
        "Why should we hire you?",
        "Describe a difficult situation you handled.",
        "How do you handle criticism?",
        "Where do you see yourself in five years?",
        "What motivates you to work hard?",
        "How do you handle pressure and deadlines?",
        "Why do you want to work with our company?"
    ];

    let currentQuestions = [];
    let currentQuestionIndex = 0;
    let records = [];
    let currentAnswer = "";
    let timer = null;
    let timeLeft = 60;
    let paused = false;

    function setAvatarState(state) {
        avatarCircle.classList.remove("speaking", "listening");
        avatarStatus.classList.remove("status-speaking", "status-listening", "status-idle");

        if (state === "speaking") {
            avatarCircle.classList.add("speaking");
            avatarStatus.classList.add("status-speaking");
            avatarStatus.innerText = "Speaking";
        } else if (state === "listening") {
            avatarCircle.classList.add("listening");
            avatarStatus.classList.add("status-listening");
            avatarStatus.innerText = "Listening";
        } else {
            avatarStatus.classList.add("status-idle");
            avatarStatus.innerText = "Idle";
        }
    }

    function speakText(text, callback) {
        if (!window.speechSynthesis) {
            if (callback) callback();
            return;
        }

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 1;
        utterance.volume = 1;

        setAvatarState("speaking");

        utterance.onend = function () {
            setAvatarState("idle");
            if (callback) callback();
        };

        window.speechSynthesis.speak(utterance);
    }

    function shuffleArray(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function startTimer() {
        clearInterval(timer);
        timeLeft = 60;
        timerBox.innerText = `Time Left: ${timeLeft}s`;

        timer = setInterval(() => {
            if (paused) return;

            timeLeft--;
            timerBox.innerText = `Time Left: ${timeLeft}s`;

            if (timeLeft <= 0) {
                clearInterval(timer);
                stopRecognitionIfRunning();
                handleNextQuestion();
            }
        }, 1000);
    }

    function stopRecognitionIfRunning() {
        try {
            if (recognition) recognition.stop();
        } catch (e) {}
        setAvatarState("idle");
    }

    function updateConfidence() {
        const len = currentAnswer.trim().length;
        let confidence = 0;

        if (len > 0) confidence = 25;
        if (len > 30) confidence = 45;
        if (len > 60) confidence = 65;
        if (len > 100) confidence = 80;
        if (len > 150) confidence = 95;

        confidenceBox.innerText = `Confidence: ${confidence}%`;
    }

    function startInterview() {
        currentQuestions = shuffleArray(behavioralQuestions);
        currentQuestionIndex = 0;
        records = [];
        currentAnswer = "";
        paused = false;

        questionArea.style.display = "block";
        finalResultArea.style.display = "none";
        finalResultArea.innerHTML = "";

        showCurrentQuestion();
    }

    function showCurrentQuestion() {
        const total = currentQuestions.length;
        const completed = currentQuestionIndex;
        const remaining = total - completed;
        const currentQ = currentQuestions[currentQuestionIndex];

        currentAnswer = "";
        answerBox.innerText = "Your spoken answer will appear here...";
        confidenceBox.innerText = "Confidence: 0%";
        pauseInterviewBtn.innerText = "Pause";
        paused = false;

        progressLine.innerHTML = `
            <b>Question ${currentQuestionIndex + 1} of ${total}</b> |
            <b>Completed:</b> ${completed} |
            <b>Remaining:</b> ${remaining}
        `;

        questionText.innerText = currentQ;
        startTimer();
        speakText(currentQ);
    }

    function startSpeaking() {
        if (!recognition) {
            alert("Speech recognition is not supported in this browser.");
            return;
        }

        currentAnswer = "";
        answerBox.innerText = "Listening... speak now.";
        confidenceBox.innerText = "Confidence: 0%";
        setAvatarState("listening");

        try {
            recognition.start();
        } catch (e) {}
    }

    if (recognition) {
        recognition.onresult = function (event) {
            let transcript = "";
            for (let i = 0; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript + " ";
            }
            currentAnswer = transcript.trim();
            answerBox.innerText = currentAnswer || "Listening...";
            updateConfidence();
        };

        recognition.onerror = function () {
            setAvatarState("idle");
            answerBox.innerText = currentAnswer || "Voice input error. Try again.";
        };

        recognition.onend = function () {
            setAvatarState("idle");
            if (!currentAnswer.trim()) {
                answerBox.innerText = "No speech detected.";
            }
        };
    }

    function evaluateAnswer(answer) {
        const cleaned = answer.trim();
        let score = 0;
        let feedback = "";

        if (cleaned.length === 0) {
            score = 0;
            feedback = "No answer given.";
        } else if (cleaned.length < 20) {
            score = 1;
            feedback = "Answered, but too short.";
        } else if (cleaned.length < 60) {
            score = 2;
            feedback = "Good answer, but add more detail.";
        } else {
            score = 3;
            feedback = "Good detailed answer.";
        }

        return { score, feedback };
    }

    function handleNextQuestion() {
        clearInterval(timer);
        stopRecognitionIfRunning();

        const result = evaluateAnswer(currentAnswer || "");

        records.push({
            q: currentQuestions[currentQuestionIndex],
            answer: currentAnswer || "",
            feedback: result.feedback,
            score: result.score
        });

        currentQuestionIndex++;

        if (currentQuestionIndex < currentQuestions.length) {
            showCurrentQuestion();
        } else {
            submitInterview();
        }
    }

    function calculateSolvedQuestions() {
        let solved = 0;
        records.forEach(item => {
            if ((item.answer || "").trim().length > 0) {
                solved += 1;
            }
        });
        return solved;
    }

    async function submitInterview() {
        clearInterval(timer);
        stopRecognitionIfRunning();

        let totalScore = 0;
        records.forEach(item => totalScore += item.score);

        const totalQuestions = currentQuestions.length;
        const solvedQuestions = calculateSolvedQuestions();
        const maxScore = totalQuestions * 3;

        questionArea.style.display = "none";
        finalResultArea.style.display = "block";
        finalResultArea.innerHTML = `
            <div class="dashboard-card" style="max-width:700px; margin:0 auto; padding:30px; text-align:center;">
                <h3>Avatar Interview Completed</h3>
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
                    section: "Behavioral Avatar Interview",
                    questions: records,
                    score: totalScore
                })
            });

            finalResultArea.innerHTML = `
                <div class="dashboard-card" style="max-width:700px; margin:0 auto; padding:30px; text-align:center;">
                    <h3>Avatar Interview Completed</h3>
                    <p><b>Total Solved Questions:</b> ${solvedQuestions}/${totalQuestions}</p>
                    <p><b>Total Score:</b> ${totalScore}/${maxScore}</p>
                    <p>Interview saved successfully.</p>
                    <button onclick="window.location.href='dashboard.html'" class="primary-btn">Back to Dashboard</button>
                </div>
            `;
        } catch (err) {
            console.error(err);
            finalResultArea.innerHTML = `
                <div class="dashboard-card" style="max-width:700px; margin:0 auto; padding:30px; text-align:center;">
                    <h3>Avatar Interview Completed</h3>
                    <p><b>Total Solved Questions:</b> ${solvedQuestions}/${totalQuestions}</p>
                    <p><b>Total Score:</b> ${totalScore}/${maxScore}</p>
                    <p>Error saving interview.</p>
                    <button onclick="window.location.href='dashboard.html'" class="primary-btn">Back to Dashboard</button>
                </div>
            `;
        }
    }

    function restartInterview() {
        clearInterval(timer);
        stopRecognitionIfRunning();
        records = [];
        currentQuestions = [];
        currentQuestionIndex = 0;
        currentAnswer = "";
        questionArea.style.display = "none";
        finalResultArea.style.display = "none";
        finalResultArea.innerHTML = "";
        answerBox.innerText = "Your spoken answer will appear here...";
        questionText.innerText = "Question will appear here";
        timerBox.innerText = "Time Left: 60s";
        confidenceBox.innerText = "Confidence: 0%";
        setAvatarState("idle");
    }

    function togglePause() {
        paused = !paused;
        pauseInterviewBtn.innerText = paused ? "Resume" : "Pause";
        if (paused) {
            stopRecognitionIfRunning();
            setAvatarState("idle");
        }
    }

    startAvatarInterviewBtn.addEventListener("click", startInterview);
    restartInterviewBtn.addEventListener("click", restartInterview);
    speakQuestionBtn.addEventListener("click", function () {
        if (currentQuestions[currentQuestionIndex]) {
            speakText(currentQuestions[currentQuestionIndex]);
        }
    });
    startSpeakingBtn.addEventListener("click", startSpeaking);
    pauseInterviewBtn.addEventListener("click", togglePause);
    nextQuestionBtn.addEventListener("click", handleNextQuestion);
    endInterviewBtn.addEventListener("click", submitInterview);

    document.getElementById("logoutLink").addEventListener("click", function () {
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userName");
        window.location.href = "login.html";
    });
});