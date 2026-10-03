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

    const cvFile = document.getElementById("cvFile");
    const fileName = document.getElementById("fileName");
    const analyzeCvBtn = document.getElementById("analyzeCvBtn");
    const uploadStatus = document.getElementById("uploadStatus");

    const uploadSection = document.getElementById("uploadSection");
    const interviewSection = document.getElementById("interviewSection");
    const resultSection = document.getElementById("resultSection");

    const questionNumber = document.getElementById("questionNumber");
    const questionText = document.getElementById("questionText");

    const answerText = document.getElementById("answerText");
    const submitAnswerBtn = document.getElementById("submitAnswerBtn");

    const speakAnswerBtn = document.getElementById("speakAnswerBtn");
    const stopSpeakingBtn = document.getElementById("stopSpeakingBtn");

    const answerStatus = document.getElementById("answerStatus");
    const feedbackBox = document.getElementById("feedbackBox");

    const nextQuestionBtn = document.getElementById("nextQuestionBtn");
    const finishInterviewBtn = document.getElementById("finishInterviewBtn");

    const finalResult = document.getElementById("finalResult");
    const logoutLink = document.getElementById("logoutLink");


    // =====================================================
    // VARIABLES
    // =====================================================

    let sessionId = "";

    let questions = [];

    let currentQuestionIndex = 0;

    let currentQuestion = "";

    let answeredQuestions = [];

    let recognition = null;

    let isListening = false;


    // =====================================================
    // FILE SELECT
    // =====================================================

    cvFile.addEventListener("change", function () {

        if (!cvFile.files.length) {

            fileName.innerText = "";

            return;
        }

        const file = cvFile.files[0];

        fileName.innerText =
            "Selected file: " + file.name;

    });


    // =====================================================
    // ANALYZE CV
    // =====================================================

    analyzeCvBtn.addEventListener("click", async function () {

        if (!cvFile.files.length) {

            alert("Please select your CV first.");

            return;
        }

        const file = cvFile.files[0];

        const allowedExtensions = [
            ".pdf",
            ".docx"
        ];

        const fileNameLower =
            file.name.toLowerCase();

        const validFile =
            allowedExtensions.some(
                extension =>
                    fileNameLower.endsWith(extension)
            );

        if (!validFile) {

            alert(
                "Please upload a PDF or DOCX file."
            );

            return;
        }


        analyzeCvBtn.disabled = true;

        uploadStatus.classList.remove("hidden");

        uploadStatus.innerText =
            "Uploading and analyzing your CV...";


        try {

            const formData = new FormData();

            // IMPORTANT:
            // server.js expects "resume"

            formData.append(
                "resume",
                file
            );

            formData.append(
                "email",
                userEmail
            );


            const response = await fetch(
                "http://localhost:5000/cv-question/upload",
                {
                    method: "POST",
                    body: formData
                }
            );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "CV analysis failed."
                );

            }


            // Store session ID

            sessionId =
                data.sessionId;


            // Store generated questions

            questions =
                data.questions || [];


            if (!sessionId) {

                throw new Error(
                    "CV session was not created."
                );

            }


            if (!questions.length) {

                throw new Error(
                    "No questions were generated from your CV."
                );

            }


            uploadStatus.innerText =
                "CV analyzed successfully. Questions generated.";


            uploadSection.classList.add(
                "hidden"
            );

            interviewSection.classList.remove(
                "hidden"
            );


            currentQuestionIndex = 0;

            answeredQuestions = [];


            showCurrentQuestion();


        } catch (error) {

            console.error(
                "CV Upload Error:",
                error
            );

            uploadStatus.innerText =
                error.message ||
                "Error analyzing CV.";

            analyzeCvBtn.disabled = false;

        }

    });


    // =====================================================
    // SHOW CURRENT QUESTION
    // =====================================================

    function showCurrentQuestion() {

        if (
            currentQuestionIndex >=
            questions.length
        ) {

            finishInterview();

            return;
        }


        currentQuestion =
            questions[
                currentQuestionIndex
            ].question;


        questionNumber.innerText =
            `Question ${currentQuestionIndex + 1}`;


        questionText.innerText =
            currentQuestion;


        answerText.value = "";


        feedbackBox.classList.add(
            "hidden"
        );


        nextQuestionBtn.classList.add(
            "hidden"
        );


        answerStatus.classList.add(
            "hidden"
        );


        submitAnswerBtn.disabled =
            false;


        finishInterviewBtn.disabled =
            false;


        // Speak question

        speakQuestion(
            currentQuestion
        );

    }


    // =====================================================
    // SUBMIT ANSWER
    // =====================================================

    submitAnswerBtn.addEventListener(
        "click",
        async function () {

            const answer =
                answerText.value.trim();


            if (!answer) {

                alert(
                    "Please answer the question first."
                );

                return;
            }


            submitAnswerBtn.disabled =
                true;

            nextQuestionBtn.disabled =
                true;


            answerStatus.classList.remove(
                "hidden"
            );


            answerStatus.innerText =
                "AI is analyzing your answer...";


            try {

                // -----------------------------------------
                // SAVE ANSWER TO CV SESSION
                // -----------------------------------------

                if (sessionId) {

                    await fetch(
                        `http://localhost:5000/cv-question/${sessionId}/answer`,
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                questionIndex:
                                    currentQuestionIndex,

                                answer:
                                    answer

                            })

                        }
                    );

                }


                // -----------------------------------------
                // GET AI FEEDBACK
                // -----------------------------------------

                const response =
                    await fetch(
                        "http://localhost:5000/cv-question/feedback",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                question:
                                    currentQuestion,

                                answer:
                                    answer

                            })

                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Evaluation failed."
                    );

                }


                const feedback =
                    data.feedback || "";


                // -----------------------------------------
                // CALCULATE SCORE
                // -----------------------------------------

                const score =
                     Number(data.score) || 5;


                answeredQuestions.push({

                    question:
                        currentQuestion,

                    answer:
                        answer,

                    feedback:
                        feedback,

                    score:
                        score

                });


                // -----------------------------------------
                // DISPLAY FEEDBACK
                // -----------------------------------------

                feedbackBox.classList.remove(
                    "hidden"
                );


                feedbackBox.innerHTML = `

                    <h3>AI Feedback</h3>

                    <div style="
                        margin-top:15px;
                        line-height:1.7;
                    ">

                        ${formatFeedback(feedback)}

                    </div>

                    <p style="
                        margin-top:15px;
                    ">

                        <b>Score:</b>
                        ${score}/10

                    </p>

                `;


                answerStatus.innerText =
                    "Answer evaluated successfully.";


                // -----------------------------------------
                // SHOW NEXT BUTTON
                // -----------------------------------------

                if (
                    currentQuestionIndex <
                    questions.length - 1
                ) {

                    nextQuestionBtn.classList.remove(
                        "hidden"
                    );

                } else {

                    nextQuestionBtn.classList.add(
                        "hidden"
                    );

                    finishInterviewBtn.innerText =
                        "Finish Interview";

                }


                nextQuestionBtn.disabled =
                    false;


            } catch (error) {

                console.error(
                    "Answer Evaluation Error:",
                    error
                );


                answerStatus.innerText =
                    error.message ||
                    "Error evaluating answer.";


                submitAnswerBtn.disabled =
                    false;

            }

        }
    );


    // =====================================================
    // NEXT QUESTION
    // =====================================================

    nextQuestionBtn.addEventListener(
        "click",
        function () {

            currentQuestionIndex++;

            showCurrentQuestion();

        }
    );


    // =====================================================
    // FINISH INTERVIEW
    // =====================================================

    finishInterviewBtn.addEventListener(
        "click",
        function () {

            finishInterview();

        }
    );


    async function finishInterview() {

        if (answeredQuestions.length === 0) {

            alert(
                "Please answer at least one question."
            );

            return;
        }


        // Stop speech

        if (recognition && isListening) {

            try {
                recognition.stop();
            } catch (error) {}

            isListening = false;

        }


        if (window.speechSynthesis) {

            window.speechSynthesis.cancel();

        }


        interviewSection.classList.add(
            "hidden"
        );

        resultSection.classList.remove(
            "hidden"
        );


        let totalScore = 0;


        answeredQuestions.forEach(
            item => {

                totalScore +=
                    Number(item.score) || 0;

            }
        );


        const maximumScore =
            answeredQuestions.length * 10;


        const averageScore =
            (
                totalScore /
                answeredQuestions.length
            ).toFixed(1);


        // =================================================
        // FINAL RESULT
        // =================================================

        finalResult.innerHTML = `

            <div class="feedback-box">

                <p>
                    <b>Total Questions:</b>
                    ${answeredQuestions.length}
                </p>

                <p>
                    <b>Total Score:</b>
                    ${totalScore}/${maximumScore}
                </p>

                <p>
                    <b>Average Score:</b>
                    ${averageScore}/10
                </p>

                <h3>
                    Question Review
                </h3>

                ${answeredQuestions.map(
                    (item, index) => `

                    <div style="
                        margin-bottom:20px;
                        padding:15px;
                        background:rgba(255,255,255,0.06);
                        border-radius:10px;
                    ">

                        <p>
                            <b>
                                Question ${index + 1}:
                            </b>

                            ${escapeHtml(
                                item.question
                            )}

                        </p>

                        <p>
                            <b>Your Answer:</b>

                            ${escapeHtml(
                                item.answer
                            )}

                        </p>

                        <p>
                            <b>Score:</b>
                            ${item.score}/10
                        </p>

                        <p>
                            <b>AI Feedback:</b>

                            ${formatFeedback(
                                item.feedback
                            )}

                        </p>

                    </div>

                `
                ).join("")}

            </div>

        `;


        // =================================================
        // SAVE TO NORMAL INTERVIEW HISTORY
        // =================================================

        try {

            const response =
                await fetch(
                    "http://localhost:5000/interview",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            email:
                                userEmail,

                            section:
                                "CV Questions",

                            questions:
                                answeredQuestions.map(
                                    item => ({

                                        q:
                                            item.question,

                                        answer:
                                            item.answer,

                                        feedback:
                                            item.feedback,

                                        score:
                                            item.score

                                    })
                                ),

                            score:
                                totalScore

                        })

                    }
                );


            if (!response.ok) {

                console.error(
                    "Failed to save interview history."
                );

            }

        } catch (error) {

            console.error(
                "History save error:",
                error
            );

        }

    }


    // =====================================================
    // SCORE
    // =====================================================

    function calculateScore(feedback) {

        if (!feedback) {
            return 5;
        }


        const text =
            feedback.toLowerCase();


        if (
            text.includes("excellent") ||
            text.includes("very good") ||
            text.includes("strong answer")
        ) {

            return 9;

        }


        if (
            text.includes("good answer") ||
            text.includes("good response")
        ) {

            return 8;

        }


        if (
            text.includes("clear") ||
            text.includes("relevant")
        ) {

            return 7;

        }


        if (
            text.includes("average") ||
            text.includes("somewhat")
        ) {

            return 6;

        }


        if (
            text.includes("weak") ||
            text.includes("unclear") ||
            text.includes("incomplete")
        ) {

            return 4;

        }


        return 5;

    }


    // =====================================================
    // SPEECH RECOGNITION
    // =====================================================

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (SpeechRecognition) {

        recognition =
            new SpeechRecognition();


        recognition.lang =
            "en-US";


        recognition.continuous =
            true;


        recognition.interimResults =
            true;


        recognition.onstart =
            function () {

                isListening = true;

                answerStatus.classList.remove(
                    "hidden"
                );

                answerStatus.innerText =
                    "Listening... Speak your answer.";

            };


        recognition.onresult =
            function (event) {

                let transcript = "";


                for (
                    let i = 0;
                    i < event.results.length;
                    i++
                ) {

                    transcript +=
                        event.results[i][0]
                            .transcript + " ";

                }


                answerText.value =
                    transcript.trim();

            };


        recognition.onerror =
            function (event) {

                console.error(
                    "Speech recognition error:",
                    event
                );


                isListening = false;


                answerStatus.classList.remove(
                    "hidden"
                );


                answerStatus.innerText =
                    "Voice recognition error. Please try again.";

            };


        recognition.onend =
            function () {

                isListening = false;

            };

    }


    // =====================================================
    // START SPEAKING
    // =====================================================

    speakAnswerBtn.addEventListener(
        "click",
        function () {

            if (!recognition) {

                alert(
                    "Speech recognition is not supported in this browser."
                );

                return;
            }


            if (isListening) {

                return;

            }


            try {

                answerText.value = "";

                recognition.start();

            } catch (error) {

                console.error(
                    error
                );

            }

        }
    );


    // =====================================================
    // STOP SPEAKING
    // =====================================================

    stopSpeakingBtn.addEventListener(
        "click",
        function () {

            if (recognition) {

                try {

                    recognition.stop();

                } catch (error) {}

            }


            isListening = false;


            answerStatus.classList.remove(
                "hidden"
            );


            answerStatus.innerText =
                "Voice input stopped.";

        }
    );


    // =====================================================
    // SPEAK QUESTION
    // =====================================================

    function speakQuestion(text) {

        if (!window.speechSynthesis) {

            return;

        }


        window.speechSynthesis.cancel();


        const speech =
            new SpeechSynthesisUtterance(text);


        speech.rate =
            0.95;


        speech.pitch =
            1;


        speech.volume =
            1;


        window.speechSynthesis.speak(
            speech
        );

    }


    // =====================================================
    // FORMAT FEEDBACK
    // =====================================================

    function formatFeedback(text) {

        if (!text) {

            return "";

        }


        return escapeHtml(text)
            .replace(/\n/g, "<br>");

    }


    // =====================================================
    // ESCAPE HTML
    // =====================================================

    function escapeHtml(text) {

        const div =
            document.createElement("div");


        div.innerText =
            text || "";


        return div.innerHTML;

    }


    // =====================================================
    // LOGOUT
    // =====================================================

    if (logoutLink) {

        logoutLink.addEventListener(
            "click",
            function (event) {

                event.preventDefault();


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
        );

    }

});