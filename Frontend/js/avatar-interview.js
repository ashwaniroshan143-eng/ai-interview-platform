const API_BASE = "http://localhost:5000";

let userEmail = "";

let recognition = null;

let currentQuestions = [];

let currentQuestionIndex = 0;

let currentAnswer = "";

let records = [];

let timerInterval = null;

let timeLeft = 60;

let isPaused = false;

let isRecognizing = false;

let isSubmitting = false;

let interviewStarted = false;


// =====================================================
// AUTHENTICATION
// =====================================================

const userRole = localStorage.getItem("userRole");

if (!userRole || userRole === "admin") {
    window.location.href = "login.html";
}


// =====================================================
// DOM READY
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

    userEmail = localStorage.getItem("userEmail") || "";

    if (!userEmail) {
        window.location.href = "login.html";
        return;
    }

    initializeSpeechRecognition();

    setupButtons();

    updateInitialUI();
});


// =====================================================
// SPEECH RECOGNITION
// =====================================================

function initializeSpeechRecognition() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {

        console.log(
            "Speech Recognition is not supported by this browser."
        );

        return;
    }

    recognition = new SpeechRecognition();

    recognition.lang = "en-US";

    recognition.interimResults = true;

    recognition.continuous = true;

    recognition.maxAlternatives = 1;


    recognition.onstart = () => {

        isRecognizing = true;

        setAvatarState("listening");

        const startButton =
            document.getElementById("startSpeakingBtn");

        if (startButton) {
            startButton.textContent = "Listening...";
        }
    };


    recognition.onresult = (event) => {

        let finalText = "";

        let interimText = "";

        for (
            let i = event.resultIndex;
            i < event.results.length;
            i++
        ) {

            const transcript =
                event.results[i][0].transcript;

            if (event.results[i].isFinal) {
                finalText += transcript + " ";
            } else {
                interimText += transcript;
            }
        }


        if (finalText.trim()) {

            currentAnswer += finalText;

            currentAnswer =
                currentAnswer.replace(/\s+/g, " ").trim();
        }


        const answerBox =
            document.getElementById("answerBox");

        if (answerBox) {

            const displayText =
                currentAnswer +
                (interimText
                    ? " " + interimText
                    : "");

            answerBox.value =
                displayText.trim();
        }


        updateConfidence(
            currentAnswer.length
        );
    };


    recognition.onerror = (event) => {

        console.log(
            "Speech recognition error:",
            event.error
        );

        isRecognizing = false;

        setAvatarState("idle");

        const startButton =
            document.getElementById("startSpeakingBtn");

        if (startButton) {
            startButton.textContent = "Start Speaking";
        }
    };


    recognition.onend = () => {

        isRecognizing = false;

        setAvatarState("idle");

        const startButton =
            document.getElementById("startSpeakingBtn");

        if (startButton) {
            startButton.textContent = "Start Speaking";
        }
    };
}


// =====================================================
// BUTTONS
// =====================================================

function setupButtons() {

    const startButton =
        document.getElementById(
            "startAvatarInterviewBtn"
        );

    const restartButton =
        document.getElementById(
            "restartInterviewBtn"
        );

    const repeatButton =
        document.getElementById(
            "repeatQuestionBtn"
        );

    const speakButton =
        document.getElementById(
            "startSpeakingBtn"
        );

    const pauseButton =
        document.getElementById(
            "pauseBtn"
        );

    const nextButton =
        document.getElementById(
            "nextQuestionBtn"
        );

    const endButton =
        document.getElementById(
            "endInterviewBtn"
        );


    if (startButton) {
        startButton.addEventListener(
            "click",
            startInterview
        );
    }


    if (restartButton) {
        restartButton.addEventListener(
            "click",
            restartInterview
        );
    }


    if (repeatButton) {
        repeatButton.addEventListener(
            "click",
            repeatQuestion
        );
    }


    if (speakButton) {
        speakButton.addEventListener(
            "click",
            startSpeaking
        );
    }


    if (pauseButton) {
        pauseButton.addEventListener(
            "click",
            togglePause
        );
    }


    if (nextButton) {
        nextButton.addEventListener(
            "click",
            handleNextQuestion
        );
    }


    if (endButton) {
        endButton.addEventListener(
            "click",
            endInterview
        );
    }
}


// =====================================================
// INITIAL UI
// =====================================================

function updateInitialUI() {

    const questionArea =
        document.getElementById(
            "questionArea"
        );

    const finalResultArea =
        document.getElementById(
            "finalResultArea"
        );

    if (questionArea) {
        questionArea.style.display = "none";
    }

    if (finalResultArea) {
        finalResultArea.style.display = "none";
    }

    setAvatarState("idle");
}


// =====================================================
// START INTERVIEW
// =====================================================

function startInterview() {

    if (interviewStarted) {
        return;
    }

    interviewStarted = true;

    isSubmitting = false;

    currentQuestionIndex = 0;

    currentAnswer = "";

    records = [];

    isPaused = false;

    currentQuestions = getBehavioralQuestions();

    shuffleArray(currentQuestions);

    const setupArea =
        document.getElementById(
            "setupArea"
        );

    const questionArea =
        document.getElementById(
            "questionArea"
        );

    const finalResultArea =
        document.getElementById(
            "finalResultArea"
        );

    if (setupArea) {
        setupArea.style.display = "none";
    }

    if (questionArea) {
        questionArea.style.display = "block";
    }

    if (finalResultArea) {
        finalResultArea.style.display = "none";
    }

    showQuestion();

    speakCurrentQuestion();
}


// =====================================================
// BEHAVIORAL QUESTIONS
// =====================================================

function getBehavioralQuestions() {

    return [

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
}


// =====================================================
// SHUFFLE QUESTIONS
// =====================================================

function shuffleArray(array) {

    for (
        let i = array.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() * (i + 1)
            );

        [
            array[i],
            array[j]
        ] =
        [
            array[j],
            array[i]
        ];
    }
}


// =====================================================
// SHOW QUESTION
// =====================================================

function showQuestion() {

    if (
        currentQuestionIndex >=
        currentQuestions.length
    ) {
        submitInterview();
        return;
    }


    currentAnswer = "";

    isPaused = false;


    const question =
        currentQuestions[
            currentQuestionIndex
        ];


    const questionText =
        document.getElementById(
            "questionText"
        );

    const progressLine =
        document.getElementById(
            "progressLine"
        );

    const answerBox =
        document.getElementById(
            "answerBox"
        );

    const confidenceBox =
        document.getElementById(
            "confidenceBox"
        );


    if (questionText) {
        questionText.textContent =
            question;
    }


    if (progressLine) {

        progressLine.textContent =
            `Question ${
                currentQuestionIndex + 1
            } of ${
                currentQuestions.length
            }`;
    }


    if (answerBox) {
        answerBox.value = "";
    }


    if (confidenceBox) {
        confidenceBox.textContent =
            "Confidence: --";
    }


    resetTimer();

    setAvatarState("idle");
}


// =====================================================
// SPEAK CURRENT QUESTION
// =====================================================

function speakCurrentQuestion() {

    const question =
        currentQuestions[
            currentQuestionIndex
        ];

    speakText(
        question,
        () => {
            setAvatarState("idle");
        }
    );
}


// =====================================================
// SPEECH SYNTHESIS
// =====================================================

function speakText(text, callback) {

    if (!window.speechSynthesis) {

        if (callback) {
            callback();
        }

        return;
    }


    window.speechSynthesis.cancel();


    const utterance =
        new SpeechSynthesisUtterance(
            text
        );


    utterance.rate = 0.95;

    utterance.pitch = 1;

    utterance.volume = 1;


    utterance.onstart = () => {
        setAvatarState("speaking");
    };


    utterance.onend = () => {

        setAvatarState("idle");

        if (callback) {
            callback();
        }
    };


    utterance.onerror = () => {

        setAvatarState("idle");

        if (callback) {
            callback();
        }
    };


    window.speechSynthesis.speak(
        utterance
    );
}


// =====================================================
// REPEAT QUESTION
// =====================================================

function repeatQuestion() {

    if (
        currentQuestionIndex >=
        currentQuestions.length
    ) {
        return;
    }

    speakCurrentQuestion();
}


// =====================================================
// START SPEAKING
// =====================================================

function startSpeaking() {

    if (isPaused) {
        return;
    }


    if (!recognition) {

        alert(
            "Speech recognition is not supported. Please use Google Chrome."
        );

        return;
    }


    currentAnswer = "";


    const answerBox =
        document.getElementById(
            "answerBox"
        );

    if (answerBox) {
        answerBox.value = "";
    }


    try {

        recognition.start();

    } catch (error) {

        console.log(
            "Recognition start error:",
            error
        );
    }
}


// =====================================================
// STOP SPEAKING
// =====================================================

function stopRecognition() {

    if (
        recognition &&
        isRecognizing
    ) {

        try {
            recognition.stop();
        } catch (error) {
            console.log(error);
        }
    }

    isRecognizing = false;

    setAvatarState("idle");
}


// =====================================================
// TIMER
// =====================================================

function resetTimer() {

    clearInterval(timerInterval);

    timeLeft = 60;

    updateTimerDisplay();


    timerInterval =
        setInterval(() => {

            if (isPaused) {
                return;
            }

            timeLeft--;

            updateTimerDisplay();


            if (timeLeft <= 0) {

                clearInterval(
                    timerInterval
                );

                stopRecognition();

                handleNextQuestion();
            }

        }, 1000);
}


// =====================================================
// TIMER DISPLAY
// =====================================================

function updateTimerDisplay() {

    const timerBox =
        document.getElementById(
            "timerBox"
        );

    if (timerBox) {

        timerBox.textContent =
            `Time: ${timeLeft}s`;
    }
}


// =====================================================
// CONFIDENCE
// =====================================================

function updateConfidence(length) {

    const confidenceBox =
        document.getElementById(
            "confidenceBox"
        );

    if (!confidenceBox) {
        return;
    }


    let confidence = 0;


    if (length > 0) {
        confidence = 25;
    }

    if (length > 30) {
        confidence = 45;
    }

    if (length > 60) {
        confidence = 65;
    }

    if (length > 100) {
        confidence = 80;
    }

    if (length > 150) {
        confidence = 95;
    }


    confidenceBox.textContent =
        `Confidence: ${confidence}%`;
}


// =====================================================
// PAUSE
// =====================================================

function togglePause() {

    isPaused = !isPaused;


    const pauseButton =
        document.getElementById(
            "pauseBtn"
        );


    if (isPaused) {

        stopRecognition();

        if (pauseButton) {
            pauseButton.textContent =
                "Resume";
        }

        setAvatarState("idle");

    } else {

        if (pauseButton) {
            pauseButton.textContent =
                "Pause";
        }
    }
}


// =====================================================
// NEXT QUESTION
// =====================================================

function handleNextQuestion() {

    if (isSubmitting) {
        return;
    }


    stopRecognition();


    clearInterval(timerInterval);


    saveCurrentAnswer();


    currentQuestionIndex++;


    if (
        currentQuestionIndex >=
        currentQuestions.length
    ) {

        submitInterview();

        return;
    }


    showQuestion();

    speakCurrentQuestion();
}


// =====================================================
// SAVE CURRENT ANSWER
// =====================================================

function saveCurrentAnswer() {

    const question =
        currentQuestions[
            currentQuestionIndex
        ];


    const answerBox =
        document.getElementById(
            "answerBox"
        );


    let answer =
        currentAnswer.trim();


    if (
        !answer &&
        answerBox
    ) {

        answer =
            answerBox.value.trim();
    }


    records.push({

        q: question,

        answer: answer,

        feedback:
            createBasicFeedback(
                answer
            ),

        score:
            calculateBasicScore(
                answer
            )

    });
}


// =====================================================
// BASIC SCORE FALLBACK
// =====================================================

function calculateBasicScore(answer) {

    if (!answer || !answer.trim()) {
        return 0;
    }

    if (answer.trim().length < 20) {
        return 1;
    }

    if (answer.trim().length < 60) {
        return 2;
    }

    return 3;
}


// =====================================================
// BASIC FEEDBACK FALLBACK
// =====================================================

function createBasicFeedback(answer) {

    if (!answer || !answer.trim()) {
        return "No answer was given.";
    }

    if (answer.trim().length < 20) {
        return "Your answer is too short. Add more detail and an example.";
    }

    if (answer.trim().length < 60) {
        return "Your answer is acceptable, but more detail would improve it.";
    }

    return "Good detailed answer. AI analysis will provide more specific feedback.";
}


// =====================================================
// END INTERVIEW
// =====================================================

function endInterview() {

    if (isSubmitting) {
        return;
    }


    if (
        !interviewStarted ||
        currentQuestions.length === 0
    ) {
        return;
    }


    stopRecognition();

    clearInterval(timerInterval);


    if (
        currentQuestionIndex <
        currentQuestions.length
    ) {

        saveCurrentAnswer();
    }


    submitInterview();
}


// =====================================================
// SUBMIT INTERVIEW
// =====================================================

async function submitInterview() {

    if (isSubmitting) {
        return;
    }


    isSubmitting = true;


    stopRecognition();

    clearInterval(timerInterval);

    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }


    setAvatarState("idle");


    const finalResultArea =
        document.getElementById(
            "finalResultArea"
        );


    if (finalResultArea) {

        finalResultArea.style.display =
            "block";

        finalResultArea.innerHTML = `
            <div class="ai-loading">
                <h2>🤖 AI is analyzing your interview...</h2>
                <p>
                    Please wait while AI checks your answers,
                    grammar, clarity, missing points and gives
                    improved answers.
                </p>
            </div>
        `;
    }


    let aiResult = null;


    try {

        const response =
            await fetch(
                `${API_BASE}/evaluate-interview`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        questions: records
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "AI evaluation failed"
            );
        }


        aiResult = data;


        if (
            aiResult.questions &&
            Array.isArray(
                aiResult.questions
            )
        ) {

            records =
                aiResult.questions.map(
                    (item, index) => {

                        return {
                            q:
                                item.q ||
                                records[index]?.q ||
                                "",

                            answer:
                                item.answer ||
                                records[index]?.answer ||
                                "",

                            feedback:
                                item.whatWasWrong ||
                                item.whatWasMissing ||
                                "",

                            score:
                                Number(
                                    item.score || 0
                                ),

                            whatWasGood:
                                item.whatWasGood ||
                                "",

                            whatWasWrong:
                                item.whatWasWrong ||
                                "",

                            whatWasMissing:
                                item.whatWasMissing ||
                                "",

                            improvedAnswer:
                                item.improvedAnswer ||
                                "",

                            tips:
                                Array.isArray(
                                    item.tips
                                )
                                    ? item.tips
                                    : []
                        };
                    }
                );
        }

    } catch (error) {

        console.log(
            "AI evaluation failed:",
            error
        );


        aiResult = {

            overallScore:
                records.reduce(
                    (
                        total,
                        item
                    ) =>
                        total +
                        Number(
                            item.score || 0
                        ),
                    0
                ),

            overallFeedback:
                "AI analysis could not be completed. Basic interview feedback is shown below.",

            questions:
                records.map(
                    (item) => {

                        return {
                            q: item.q,

                            answer: item.answer,

                            score:
                                item.score || 0,

                            whatWasGood:
                                "Your answer was recorded successfully.",

                            whatWasWrong:
                                item.answer
                                    ? "Detailed AI analysis was unavailable."
                                    : "No answer was given.",

                            whatWasMissing:
                                item.answer
                                    ? "Try adding a specific example and more details."
                                    : "You should provide an answer.",

                            improvedAnswer:
                                item.answer ||
                                "Please provide a complete answer.",

                            tips: [
                                "Give a clear and direct answer.",
                                "Add a specific example when possible."
                            ]
                        };
                    }
                )
        };
    }


    const totalScore =
        records.reduce(
            (
                total,
                item
            ) =>
                total +
                Number(
                    item.score || 0
                ),
            0
        );


    const maximumScore =
        records.length * 3;


    // =================================================
    // SAVE TO MONGODB
    // =================================================

    try {

        const saveResponse =
            await fetch(
                `${API_BASE}/interview`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        email: userEmail,

                        section:
                            "Behavioral Avatar Interview",

                        questions:
                            records,

                        score:
                            totalScore,

                        aiOverallScore:
                            Number(
                                aiResult.overallScore ||
                                totalScore
                            ),

                        aiFeedback:
                            aiResult.overallFeedback ||
                            ""
                    })
                }
            );


        const saveData =
            await saveResponse.json();


        if (!saveResponse.ok) {

            console.log(
                "Interview save error:",
                saveData
            );
        }

    } catch (error) {

        console.log(
            "Could not save interview:",
            error
        );
    }


    displayFinalResults(
        aiResult,
        totalScore,
        maximumScore
    );


    isSubmitting = false;

    interviewStarted = false;
}


// =====================================================
// DISPLAY FINAL RESULTS
// =====================================================

function displayFinalResults(
    aiResult,
    totalScore,
    maximumScore
) {

    const finalResultArea =
        document.getElementById(
            "finalResultArea"
        );


    const questionArea =
        document.getElementById(
            "questionArea"
        );


    if (questionArea) {
        questionArea.style.display =
            "none";
    }


    if (!finalResultArea) {
        return;
    }


    finalResultArea.style.display =
        "block";


    const overallScore =
        aiResult?.overallScore ??
        totalScore;


    const overallFeedback =
        aiResult?.overallFeedback ||
        "Review your answers and continue practicing.";


    let html = `

        <div class="ai-final-results">

            <h2>🎯 Interview Completed</h2>

            <div class="overall-score">

                <h3>
                    AI Score
                </h3>

                <div class="score-number">
                    ${overallScore} / ${maximumScore}
                </div>

            </div>

            <div class="overall-feedback">

                <h3>
                    🤖 AI Overall Feedback
                </h3>

                <p>
                    ${escapeHtml(
                        overallFeedback
                    )}
                </p>

            </div>

            <h3>
                📝 Detailed Answer Analysis
            </h3>

            <div class="question-feedback-list">
    `;


    const questionResults =
        aiResult?.questions ||
        records;


    questionResults.forEach(
        (item, index) => {

            const score =
                Number(
                    item.score || 0
                );


            html += `

                <div class="feedback-card">

                    <h3>
                        Question ${index + 1}
                    </h3>

                    <p>
                        <strong>Question:</strong>
                        ${escapeHtml(
                            item.q || ""
                        )}
                    </p>

                    <div class="spoken-answer">

                        <strong>
                            Your Spoken Answer:
                        </strong>

                        <p>
                            ${
                                item.answer
                                    ? escapeHtml(
                                        item.answer
                                    )
                                    : "No answer given."
                            }
                        </p>

                    </div>

                    <div class="answer-score">

                        <strong>
                            Score:
                        </strong>

                        ${score} / 3

                    </div>

                    <div class="good-section">

                        <strong>
                            ✅ What Was Good
                        </strong>

                        <p>
                            ${escapeHtml(
                                item.whatWasGood ||
                                "No specific positive point was identified."
                            )}
                        </p>

                    </div>

                    <div class="wrong-section">

                        <strong>
                            ⚠️ What Was Wrong / Needs Correction
                        </strong>

                        <p>
                            ${escapeHtml(
                                item.whatWasWrong ||
                                "No major problem was identified."
                            )}
                        </p>

                    </div>

                    <div class="missing-section">

                        <strong>
                            📌 What Was Missing
                        </strong>

                        <p>
                            ${escapeHtml(
                                item.whatWasMissing ||
                                "No major missing point was identified."
                            )}
                        </p>

                    </div>

                    <div class="improved-section">

                        <strong>
                            ✨ Improved Answer
                        </strong>

                        <p>
                            ${escapeHtml(
                                item.improvedAnswer ||
                                "No improved answer was generated."
                            )}
                        </p>

                    </div>

            `;


            if (
                Array.isArray(
                    item.tips
                ) &&
                item.tips.length > 0
            ) {

                html += `

                    <div class="tips-section">

                        <strong>
                            💡 Tips
                        </strong>

                        <ul>
                `;


                item.tips.forEach(
                    (tip) => {

                        html += `
                            <li>
                                ${escapeHtml(
                                    tip
                                )}
                            </li>
                        `;
                    }
                );


                html += `
                        </ul>

                    </div>
                `;
            }


            html += `

                </div>

            `;
        }
    );


    html += `

            </div>

            <div class="final-summary">

                <h3>
                    🚀 How to Improve
                </h3>

                <p>
                    Practice answering behavioral questions
                    using a clear structure. Give a direct answer,
                    explain your reasoning, provide a real example,
                    and describe the result whenever possible.
                </p>

            </div>

            <button
                id="finalRestartButton"
                class="restart-button"
            >
                Start New Interview
            </button>

        </div>

    `;


    finalResultArea.innerHTML =
        html;


    const finalRestartButton =
        document.getElementById(
            "finalRestartButton"
        );


    if (finalRestartButton) {

        finalRestartButton.addEventListener(
            "click",
            restartInterview
        );
    }
}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }


    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


// =====================================================
// RESTART
// =====================================================

function restartInterview() {

    stopRecognition();

    clearInterval(timerInterval);

    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }


    currentQuestions = [];

    currentQuestionIndex = 0;

    currentAnswer = "";

    records = [];

    timeLeft = 60;

    isPaused = false;

    isSubmitting = false;

    interviewStarted = false;


    const setupArea =
        document.getElementById(
            "setupArea"
        );

    const questionArea =
        document.getElementById(
            "questionArea"
        );

    const finalResultArea =
        document.getElementById(
            "finalResultArea"
        );


    if (setupArea) {
        setupArea.style.display =
            "block";
    }


    if (questionArea) {
        questionArea.style.display =
            "none";
    }


    if (finalResultArea) {
        finalResultArea.style.display =
            "none";

        finalResultArea.innerHTML = "";
    }


    setAvatarState("idle");
}


// =====================================================
// AVATAR STATE
// =====================================================

function setAvatarState(state) {

    const avatar =
        document.querySelector(
            ".avatar"
        );


    const status =
        document.querySelector(
            ".status-badge"
        );


    if (avatar) {

        avatar.classList.remove(
            "speaking",
            "listening",
            "idle"
        );

        avatar.classList.add(
            state
        );
    }


    if (status) {

        if (state === "speaking") {

            status.textContent =
                "Speaking";

        } else if (
            state === "listening"
        ) {

            status.textContent =
                "Listening";

        } else {

            status.textContent =
                "Ready";
        }
    }
}


// =====================================================
// LOGOUT
// =====================================================

function logout() {

    localStorage.removeItem(
        "userEmail"
    );

    localStorage.removeItem(
        "userRole"
    );

    localStorage.removeItem(
        "userName"
    );


    window.location.href =
        "login.html";
}