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

    const startInterviewBtn = document.getElementById("startInterview");
    if (startInterviewBtn) {
        startInterviewBtn.addEventListener("click", function () {
            window.location.href = "interview.html";
        });
    }

    const avatarInterviewBtn = document.getElementById("avatarInterview");
    if (avatarInterviewBtn) {
        avatarInterviewBtn.addEventListener("click", function () {
            window.location.href = "avatar-interview.html";
        });
    }

    const viewHistoryBtn = document.getElementById("viewHistory");
    if (viewHistoryBtn) {
        viewHistoryBtn.addEventListener("click", function () {
            window.location.href = "history.html";
        });
    }

    const buildResumeBtn = document.getElementById("buildResume");
    if (buildResumeBtn) {
        buildResumeBtn.addEventListener("click", function () {
            window.location.href = "resume.html";
        });
    }

    const chatbotBtn = document.getElementById("chatbot");
    if (chatbotBtn) {
        chatbotBtn.addEventListener("click", function () {
            window.location.href = "chat.html";
        });
    }

    const logoutLink = document.getElementById("logoutLink");
    if (logoutLink) {
        logoutLink.addEventListener("click", function (e) {
            e.preventDefault();
            localStorage.removeItem("userEmail");
            localStorage.removeItem("userRole");
            localStorage.removeItem("userName");
            window.location.href = "login.html";
        });
    }

    const cvQuestion = document.getElementById("cvQuestion");

if (cvQuestion) {
    cvQuestion.addEventListener("click", function () {
        window.location.href = "cv-question.html";
    });
}

    // ---------------- FEEDBACK ----------------
    const openFeedbackBtn = document.getElementById("openFeedbackBtn");
    const feedbackModal = document.getElementById("feedbackModal");
    const closeFeedbackBtn = document.getElementById("closeFeedbackBtn");
    const submitFeedbackBtn = document.getElementById("submitFeedbackBtn");
    const feedbackText = document.getElementById("feedbackText");
    const feedbackMessage = document.getElementById("feedbackMessage");

    if (openFeedbackBtn) {
        openFeedbackBtn.addEventListener("click", function () {
            feedbackModal.classList.add("active");
            feedbackMessage.innerText = "";
        });
    }

    if (closeFeedbackBtn) {
        closeFeedbackBtn.addEventListener("click", function () {
            feedbackModal.classList.remove("active");
            feedbackText.value = "";
            feedbackMessage.innerText = "";
        });
    }

    if (feedbackModal) {
        feedbackModal.addEventListener("click", function (e) {
            if (e.target === feedbackModal) {
                feedbackModal.classList.remove("active");
                feedbackText.value = "";
                feedbackMessage.innerText = "";
            }
        });
    }

    if (submitFeedbackBtn) {
        submitFeedbackBtn.addEventListener("click", async function () {
            const message = feedbackText.value.trim();

            if (!message) {
                feedbackMessage.innerText = "Please write your feedback first.";
                return;
            }

            try {
                const response = await fetch("http://localhost:5000/feedback", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email: userEmail,
                        message: message
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    feedbackMessage.innerText = data.message || "Feedback submitted successfully.";
                    feedbackText.value = "";

                    setTimeout(() => {
                        feedbackModal.classList.remove("active");
                        feedbackMessage.innerText = "";
                    }, 1200);
                } else {
                    feedbackMessage.innerText = data.message || "Error submitting feedback.";
                }

            } catch (err) {
                console.error(err);
                feedbackMessage.innerText = "Error submitting feedback.";
            }
        });
    }
});