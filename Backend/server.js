const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Groq = require("groq-sdk");
const multer = require("multer");
const { PDFParse } = require("pdf-parse");
const mammoth = require("mammoth");
require("dotenv").config();

const app = express();

app.use(cors());

app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));

// ======================================================
// GROQ AI
// ======================================================

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// ======================================================
// FILE UPLOAD
// ======================================================

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {

        const allowedTypes = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only PDF and DOCX files are allowed."));
        }
    }
});

// ======================================================
// MONGODB CONNECTION
// ======================================================

mongoose.connect("mongodb://127.0.0.1:27017/ai_interview_platform")
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.log("MongoDB connection error:", err));

// ======================================================
// USER MODEL
// ======================================================

const userSchema = new mongoose.Schema({

    name: String,

    email: {
        type: String,
        unique: true
    },

    password: String,

    role: {
        type: String,
        default: "user"
    }

});

const User = mongoose.model("User", userSchema);

// ======================================================
// INTERVIEW MODEL
// ======================================================

const interviewSchema = new mongoose.Schema({

    email: String,

    section: String,

    date: {
        type: Date,
        default: Date.now
    },

    score: Number,

    questions: [
        {
            q: String,
            answer: String,
            feedback: String,
            score: Number
        }
    ]

});

const Interview = mongoose.model("Interview", interviewSchema);

// ======================================================
// RESUME MODEL
// ======================================================

const resumeSchema = new mongoose.Schema({

    email: String,

    resume: Object,

    date: {
        type: Date,
        default: Date.now
    }

});

const Resume = mongoose.model("Resume", resumeSchema);

// ======================================================
// CV QUESTION SESSION MODEL
// ======================================================

const cvQuestionSchema = new mongoose.Schema({

    email: String,

    fileName: String,

    resumeText: String,

    questions: [
        {
            question: String,
            answer: {
                type: String,
                default: ""
            },
            feedback: {
                type: String,
                default: ""
            }
        }
    ],

    date: {
        type: Date,
        default: Date.now
    }

});

const CVQuestion = mongoose.model(
    "CVQuestion",
    cvQuestionSchema
);

// ======================================================
// QUESTION MODEL
// ======================================================

const questionSchema = new mongoose.Schema({

    section: String,

    type: String,

    question: String,

    options: [String],

    answer: String,

    date: {
        type: Date,
        default: Date.now
    }

});

const Question = mongoose.model(
    "Question",
    questionSchema
);

// ======================================================
// FEEDBACK MODEL
// ======================================================

const feedbackSchema = new mongoose.Schema({

    email: String,

    message: String,

    date: {
        type: Date,
        default: Date.now
    }

});

const Feedback = mongoose.model(
    "Feedback",
    feedbackSchema
);

// ======================================================
// TEST ROUTE
// ======================================================

app.get("/", (req, res) => {

    res.send("AI Interview Backend Running");

});

// ======================================================
// CREATE ADMIN
// ======================================================

app.get("/create-admin", async (req, res) => {

    try {

        const existingAdmin = await User.findOne({
            email: "admin@gmail.com"
        });

        if (existingAdmin) {

            return res.send("Admin already exists");

        }

        const hashedPassword = await bcrypt.hash(
            "admin123",
            10
        );

        const admin = new User({

            name: "Admin",

            email: "admin@gmail.com",

            password: hashedPassword,

            role: "admin"

        });

        await admin.save();

        res.send("Admin created successfully");

    } catch (err) {

        console.error(err);

        res.send("Error creating admin");

    }

});

// ======================================================
// SIGNUP
// ======================================================

app.post("/signup", async (req, res) => {

    const {
        name,
        email,
        password
    } = req.body;

    try {

        const existingUser = await User.findOne({
            email
        });

        if (existingUser) {

            return res.json({
                message: "User already exists"
            });

        }

        const hashedPassword =
            await bcrypt.hash(password, 10);

        const newUser = new User({

            name,

            email,

            password: hashedPassword,

            role: "user"

        });

        await newUser.save();

        res.json({
            message: "Signup successful"
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Server error"
        });

    }

});

// ======================================================
// LOGIN
// ======================================================

app.post("/login", async (req, res) => {

    const {
        email,
        password
    } = req.body;

    try {

        const user = await User.findOne({
            email
        });

        if (!user) {

            return res.json({
                message: "Invalid email or password"
            });

        }

        const isMatch =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!isMatch) {

            return res.json({
                message: "Invalid email or password"
            });

        }

        res.json({

            message: "Login successful",

            role: user.role,

            name: user.name,

            email: user.email

        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Server error"
        });

    }

});

// ======================================================
// ADMIN LOGIN
// ======================================================

app.post("/admin/login", async (req, res) => {

    const {
        email,
        password
    } = req.body;

    try {

        const admin = await User.findOne({
            email,
            role: "admin"
        });

        if (!admin) {

            return res.json({
                message: "Admin not found"
            });

        }

        const isMatch =
            await bcrypt.compare(
                password,
                admin.password
            );

        if (!isMatch) {

            return res.json({
                message: "Invalid admin credentials"
            });

        }

        res.json({

            message: "Admin login successful",

            role: admin.role,

            name: admin.name,

            email: admin.email

        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Server error"
        });

    }

});

// ======================================================
// ADMIN STATS
// ======================================================

app.get("/admin/stats", async (req, res) => {

    try {

        const totalUsers =
            await User.countDocuments({
                role: "user"
            });

        const totalInterviews =
            await Interview.countDocuments();

        const totalResumes =
            await Resume.countDocuments();

        const totalFeedbacks =
            await Feedback.countDocuments();

        const totalCVQuestions =
            await CVQuestion.countDocuments();

        res.json({

            totalUsers,

            totalInterviews,

            totalResumes,

            totalFeedbacks,

            totalCVQuestions

        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Error fetching stats"
        });

    }

});

// ======================================================
// ADMIN USERS
// ======================================================

app.get("/admin/users", async (req, res) => {

    try {

        const users =
            await User
                .find()
                .select("name email role");

        res.json(users);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Error fetching users"
        });

    }

});

// ======================================================
// DELETE USER
// ======================================================

app.delete("/admin/users/:id", async (req, res) => {

    try {

        await User.findByIdAndDelete(
            req.params.id
        );

        res.json({
            message: "User deleted successfully"
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Error deleting user"
        });

    }

});

// ======================================================
// GET ALL QUESTIONS
// ======================================================

app.get("/admin/questions", async (req, res) => {

    try {

        const questions =
            await Question
                .find()
                .sort({ date: -1 });

        res.json(questions);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Error fetching questions"
        });

    }

});

// ======================================================
// ADD QUESTION
// ======================================================

app.post("/admin/questions", async (req, res) => {

    const {
        section,
        type,
        question,
        options,
        answer
    } = req.body;

    try {

        const newQuestion =
            new Question({

                section,

                type,

                question,

                options: options || [],

                answer: answer || ""

            });

        await newQuestion.save();

        res.json({
            message: "Question added successfully"
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Error adding question"
        });

    }

});

// ======================================================
// UPDATE QUESTION
// ======================================================

app.put("/admin/questions/:id", async (req, res) => {

    const {
        section,
        type,
        question,
        options,
        answer
    } = req.body;

    try {

        await Question.findByIdAndUpdate(

            req.params.id,

            {

                section,

                type,

                question,

                options: options || [],

                answer: answer || ""

            }

        );

        res.json({
            message: "Question updated successfully"
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Error updating question"
        });

    }

});

// ======================================================
// DELETE QUESTION
// ======================================================

app.delete("/admin/questions/:id", async (req, res) => {

    try {

        await Question.findByIdAndDelete(
            req.params.id
        );

        res.json({
            message: "Question deleted successfully"
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Error deleting question"
        });

    }

});

// ======================================================
// GET QUESTIONS BY SECTION
// ======================================================

app.get("/questions/:section", async (req, res) => {

    try {

        const section =
            decodeURIComponent(
                req.params.section
            );

        const questions =
            await Question.find({
                section
            });

        res.json(questions);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Error fetching questions"
        });

    }

});

// ======================================================
// SAVE INTERVIEW
// ======================================================

app.post("/interview", async (req, res) => {

    const {
        email,
        section,
        questions,
        score
    } = req.body;

    try {

        const newInterview =
            new Interview({

                email,

                section,

                questions,

                score

            });

        await newInterview.save();

        res.json({
            message: "Interview saved successfully"
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Error saving interview"
        });

    }

});

// ======================================================
// GET HISTORY
// ======================================================

app.get("/history/:email", async (req, res) => {

    try {

        const email =
            decodeURIComponent(
                req.params.email
            );

        const records =
            await Interview
                .find({ email })
                .sort({ date: -1 });

        res.json(records);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Error fetching history"
        });

    }

});

// ======================================================
// DELETE INTERVIEW HISTORY
// ======================================================

app.delete("/history/:id", async (req, res) => {

    try {

        await Interview.findByIdAndDelete(
            req.params.id
        );

        res.json({
            message: "History deleted successfully"
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Error deleting history"
        });

    }

});

// ======================================================
// ADMIN GET ALL INTERVIEWS
// ======================================================

app.get("/admin/interviews", async (req, res) => {

    try {

        const interviews =
            await Interview
                .find()
                .sort({ date: -1 });

        res.json(interviews);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Error fetching interviews"
        });

    }

});

// ======================================================
// ADMIN DELETE INTERVIEW
// ======================================================

app.delete("/admin/interviews/:id", async (req, res) => {

    try {

        await Interview.findByIdAndDelete(
            req.params.id
        );

        res.json({
            message: "Interview record deleted successfully"
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Error deleting interview record"
        });

    }

});

// ======================================================
// SAVE RESUME
// ======================================================

app.post("/resume", async (req, res) => {

    const {
        email,
        resume
    } = req.body;

    try {

        if (!email || !resume) {

            return res.status(400).json({
                message: "Email and resume data are required"
            });

        }

        const newResume =
            new Resume({

                email,

                resume

            });

        await newResume.save();

        res.json({
            message: "Resume saved successfully"
        });

    } catch (err) {

        console.error(
            "Resume Save Error:",
            err
        );

        res.status(500).json({
            message: "Error saving resume"
        });

    }

});

// ======================================================
// ADMIN GET ALL RESUMES
// ======================================================

app.get("/admin/resumes", async (req, res) => {

    try {

        const resumes =
            await Resume
                .find()
                .sort({ date: -1 });

        res.json(resumes);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Error fetching resumes"
        });

    }

});

// ======================================================
// ADMIN DELETE RESUME
// ======================================================

app.delete("/admin/resumes/:id", async (req, res) => {

    try {

        await Resume.findByIdAndDelete(
            req.params.id
        );

        res.json({
            message: "Resume deleted successfully"
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Error deleting resume"
        });

    }

});

// ======================================================
// SAVE FEEDBACK
// ======================================================

app.post("/feedback", async (req, res) => {

    const {
        email,
        message
    } = req.body;

    try {

        if (!email || !message) {

            return res.status(400).json({
                message: "Email and feedback message are required"
            });

        }

        const newFeedback =
            new Feedback({

                email,

                message

            });

        await newFeedback.save();

        res.json({
            message: "Feedback submitted successfully"
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Error saving feedback"
        });

    }

});

// ======================================================
// ADMIN GET ALL FEEDBACKS
// ======================================================

app.get("/admin/feedbacks", async (req, res) => {

    try {

        const feedbacks =
            await Feedback
                .find()
                .sort({ date: -1 });

        res.json(feedbacks);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Error fetching feedbacks"
        });

    }

});

// ======================================================
// ADMIN DELETE FEEDBACK
// ======================================================

app.delete("/admin/feedbacks/:id", async (req, res) => {

    try {

        await Feedback.findByIdAndDelete(
            req.params.id
        );

        res.json({
            message: "Feedback deleted successfully"
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Error deleting feedback"
        });

    }

});

// ======================================================
// ADMIN ANALYTICS
// ======================================================

app.get("/admin/analytics", async (req, res) => {

    try {

        const interviews =
            await Interview.find();

        const sectionCounts = {};

        const sectionScoreTotals = {};

        let totalScore = 0;

        const totalInterviews =
            interviews.length;

        interviews.forEach(interview => {

            const section =
                interview.section || "Other";

            const score =
                interview.score || 0;

            sectionCounts[section] =
                (sectionCounts[section] || 0) + 1;

            sectionScoreTotals[section] =
                (sectionScoreTotals[section] || 0) +
                score;

            totalScore += score;

        });

        let averageScore = 0;

        if (totalInterviews > 0) {

            averageScore =
                (
                    totalScore /
                    totalInterviews
                ).toFixed(2);

        }

        let topSection = "N/A";

        let weakestSection = "N/A";

        let maxCount = 0;

        let minAvgScore = Infinity;

        Object.keys(sectionCounts).forEach(
            section => {

                if (
                    sectionCounts[section] >
                    maxCount
                ) {

                    maxCount =
                        sectionCounts[section];

                    topSection = section;

                }

                const avgSectionScore =
                    sectionScoreTotals[section] /
                    sectionCounts[section];

                if (
                    avgSectionScore <
                    minAvgScore
                ) {

                    minAvgScore =
                        avgSectionScore;

                    weakestSection = section;

                }

            }
        );

        res.json({

            sectionCounts,

            averageScore,

            topSection,

            weakestSection

        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Error fetching analytics"
        });

    }

});

// ======================================================
// CV QUESTION FEATURE
// ======================================================

// Extract text from uploaded PDF/DOCX

async function extractResumeText(file) {

    if (!file) {
        throw new Error("Resume file is required");
    }

    if (file.mimetype === "application/pdf") {

        const parser = new PDFParse({
            data: file.buffer
        });

        const result = await parser.getText();

        await parser.destroy();

        return result.text;
    }

    if (
        file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {

        const result = await mammoth.extractRawText({
            buffer: file.buffer
        });

        return result.value;
    }

    throw new Error("Unsupported resume format");
}
// ======================================================
// UPLOAD CV AND GENERATE QUESTIONS
// ======================================================

app.post(
    "/cv-question/upload",
    upload.single("resume"),
    async (req, res) => {

        try {

            const email =
                req.body.email;

            if (!email) {

                return res.status(400).json({

                    message:
                        "User email is required"

                });

            }

            if (!req.file) {

                return res.status(400).json({

                    message:
                        "Please upload a PDF or DOCX resume"

                });

            }

            let resumeText =
                await extractResumeText(
                    req.file
                );

            resumeText =
                resumeText.trim();

            if (!resumeText) {

                return res.status(400).json({

                    message:
                        "Could not extract text from the resume."

                });

            }

            // Limit resume text sent to AI
            // to avoid unnecessarily large requests.

            const limitedResumeText =
                resumeText.substring(
                    0,
                    15000
                );

            const systemPrompt = `

You are an AI interviewer for StudentSathi.

Your task is to generate interview questions
ONLY from the candidate's uploaded resume.

Read the resume carefully.

Ask questions about:

- Education
- Projects
- Skills
- Programming languages
- Internships
- Work experience
- Certifications
- Achievements
- Technologies
- Responsibilities
- Resume claims

Do NOT invent information that is not present
in the resume.

Generate exactly 10 interview questions.

The questions should be suitable for a student
or job candidate.

Mix questions from different parts of the resume.

Return ONLY a JSON array.

Example:

[
    {
        "question": "Can you explain your final year project?"
    },
    {
        "question": "How did you use Java in your project?"
    }
]

`;

            const completion =
                await groq.chat.completions.create({

                    model:
                        "openai/gpt-oss-20b",

                    messages: [

                        {
                            role: "system",
                            content: systemPrompt
                        },

                        {
                            role: "user",

                            content:
                                `Here is the candidate resume:

${limitedResumeText}

Generate 10 interview questions based only on this resume.`

                        }

                    ],

                    temperature: 0.3,

                    max_completion_tokens: 1500

                });

            let aiResponse =
                completion
                    .choices[0]
                    .message
                    .content
                    .trim();

            // Remove markdown JSON formatting
            aiResponse =
                aiResponse
                    .replace(/^```json/i, "")
                    .replace(/^```/i, "")
                    .replace(/```$/i, "")
                    .trim();

            let questions;

            try {

                questions =
                    JSON.parse(aiResponse);

            } catch (jsonError) {

                console.error(
                    "AI JSON Parse Error:",
                    jsonError
                );

                return res.status(500).json({

                    message:
                        "AI returned an invalid question format."

                });

            }

            if (
                !Array.isArray(questions) ||
                questions.length === 0
            ) {

                return res.status(500).json({

                    message:
                        "No questions were generated."

                });

            }

            // Save CV question session

            const cvSession =
                new CVQuestion({

                    email,

                    fileName:
                        req.file.originalname,

                    resumeText:
                        limitedResumeText,

                    questions:
                        questions.map(item => ({

                            question:
                                item.question || "",

                            answer: "",

                            feedback: ""

                        }))

                });

            await cvSession.save();

            res.json({

                message:
                    "CV questions generated successfully",

                sessionId:
                    cvSession._id,

                fileName:
                    req.file.originalname,

                questions:
                    questions.map(item => ({
                        question:
                            item.question
                    }))

            });

        } catch (err) {

            console.error(
                "CV Question Error:",
                err
            );

            res.status(500).json({

                message:
                    err.message ||
                    "Error generating CV questions"

            });

        }

    }
);

// ======================================================
// GET CV QUESTION SESSION
// ======================================================

app.get(
    "/cv-question/:id",
    async (req, res) => {

        try {

            const session =
                await CVQuestion.findById(
                    req.params.id
                );

            if (!session) {

                return res.status(404).json({

                    message:
                        "CV question session not found"

                });

            }

            res.json(session);

        } catch (err) {

            console.error(err);

            res.status(500).json({

                message:
                    "Error fetching CV question session"

            });

        }

    }
);

// ======================================================
// SAVE CV QUESTION ANSWER
// ======================================================

app.put(
    "/cv-question/:id/answer",
    async (req, res) => {

        try {

            const {
                questionIndex,
                answer
            } = req.body;

            const session =
                await CVQuestion.findById(
                    req.params.id
                );

            if (!session) {

                return res.status(404).json({

                    message:
                        "CV question session not found"

                });

            }

            if (
                questionIndex === undefined ||
                !session.questions[questionIndex]
            ) {

                return res.status(400).json({

                    message:
                        "Invalid question index"

                });

            }

            session.questions[
                questionIndex
            ].answer = answer || "";

            await session.save();

            res.json({

                message:
                    "Answer saved successfully"

            });

        } catch (err) {

            console.error(err);

            res.status(500).json({

                message:
                    "Error saving answer"

            });

        }

    }
);

// ======================================================
// AI FEEDBACK FOR CV ANSWER
// ======================================================

app.post(
    "/cv-question/feedback",
    async (req, res) => {

        try {

            const {
                question,
                answer
            } = req.body;


            if (!question || !answer) {

                return res.status(400).json({

                    message:
                        "Question and answer are required"

                });

            }


            const completion =
                await groq.chat.completions.create({

                    model:
                        "openai/gpt-oss-20b",

                    messages: [

                        {

                            role: "system",

                            content: `

You are an AI interview evaluator.

Evaluate the candidate's answer
for the given interview question.

The candidate is a student or job candidate.

Evaluate the answer based on:

1. Relevance to the question
2. Correctness
3. Clarity
4. Completeness
5. Communication quality

Give a score from 1 to 10.

Score guidelines:

9-10 = Excellent answer
7-8 = Good answer
5-6 = Average answer
3-4 = Weak answer
1-2 = Very poor or irrelevant answer

Return ONLY valid JSON.

The JSON format must be exactly:

{
    "feedback": "Your concise feedback here",
    "score": 8
}

The score MUST be a number between 1 and 10.

Do not add markdown.
Do not add json.
Do not add any text outside the JSON.

`

                        },

                        {

                            role: "user",

                            content:
                                `

Interview Question:
${question}

Candidate Answer:
${answer}

Evaluate this answer.

`

                        }

                    ],

                    temperature: 0.2,

                    max_completion_tokens: 800

                });


            let aiResponse =
                completion
                    .choices[0]
                    .message
                    .content
                    .trim();


            // Remove accidental markdown

            aiResponse =
                aiResponse
                    .replace(/^```json/i, "")
                    .replace(/^```/i, "")
                    .replace(/```$/i, "")
                    .trim();


            let result;


            try {

                result =
                    JSON.parse(aiResponse);

            } catch (jsonError) {

                console.error(
                    "Feedback JSON Parse Error:",
                    jsonError
                );


                return res.status(500).json({

                    message:
                        "AI returned an invalid feedback format."

                });

            }


            // Validate feedback

            if (
                !result.feedback ||
                result.score === undefined
            ) {

                return res.status(500).json({

                    message:
                        "AI feedback format is incomplete."

                });

            }


            // Convert score to number

            let score =
                Number(result.score);


            // Make sure score stays between 1 and 10

            if (isNaN(score)) {

                score = 5;

            }


            score =
                Math.round(score);


            if (score < 1) {

                score = 1;

            }


            if (score > 10) {

                score = 10;

            }


            res.json({

                feedback:
                    result.feedback,

                score:
                    score

            });


        } catch (err) {

            console.error(
                "CV Feedback Error:",
                err
            );


            res.status(500).json({

                message:
                    "Error generating feedback"

            });

        }

    }
);
// ======================================================
// GET USER CV QUESTION HISTORY
// ======================================================

app.get(
    "/cv-question/history/:email",
    async (req, res) => {

        try {

            const email =
                decodeURIComponent(
                    req.params.email
                );

            const sessions =
                await CVQuestion
                    .find({ email })
                    .sort({
                        date: -1
                    });

            res.json(sessions);

        } catch (err) {

            console.error(err);

            res.status(500).json({

                message:
                    "Error fetching CV question history"

            });

        }

    }
);

// ======================================================
// ADMIN GET CV QUESTIONS
// ======================================================

app.get(
    "/admin/cv-questions",
    async (req, res) => {

        try {

            const sessions =
                await CVQuestion
                    .find()
                    .sort({
                        date: -1
                    });

            res.json(sessions);

        } catch (err) {

            console.error(err);

            res.status(500).json({

                message:
                    "Error fetching CV questions"

            });

        }

    }
);

// ======================================================
// ADMIN DELETE CV QUESTION SESSION
// ======================================================

app.delete(
    "/admin/cv-questions/:id",
    async (req, res) => {

        try {

            await CVQuestion.findByIdAndDelete(
                req.params.id
            );

            res.json({

                message:
                    "CV question session deleted successfully"

            });

        } catch (err) {

            console.error(err);

            res.status(500).json({

                message:
                    "Error deleting CV question session"

            });

        }

    }
);

// ======================================================
// AI CHATBOT
// ======================================================

app.post("/chat", async (req, res) => {

    const userMessage =
        (req.body.message || "").trim();

    const image =
        req.body.image || null;

    const lowerMessage =
        userMessage.toLowerCase();

    const greetingKeywords = [

        "hi",
        "hello",
        "hey",
        "good morning",
        "good afternoon",
        "good evening",
        "hii",
        "helo"

    ];

    const allowedKeywords = [

        "interview",
        "hr",
        "technical",
        "behavioral",
        "mock interview",

        "study",
        "subject",
        "exam",
        "syllabus",
        "notes",
        "learn",
        "learning",

        "resume",
        "cv",
        "career",
        "job",
        "placement",

        "aptitude",
        "reasoning",
        "logical reasoning",
        "quantitative",
        "verbal",

        "math",
        "maths",
        "mathematics",
        "algebra",
        "calculus",
        "probability",
        "statistics",

        "coding",
        "programming",
        "code",
        "debug",
        "bug",
        "error",

        "dsa",
        "data structure",
        "algorithm",

        "communication",
        "english",
        "grammar",
        "speaking",

        "project",
        "project idea",
        "business case",
        "case study",

        "java",
        "python",
        "javascript",
        "c",
        "c++",
        "html",
        "css",
        "react",

        "node",
        "express",
        "mongodb",
        "sql",
        "dbms",
        "oops",
        "os",
        "networking",

        "computer science",
        "web development",
        "frontend",
        "backend",
        "full stack",

        "ai",
        "machine learning",
        "cloud",
        "data science",

        "roadmap"

    ];

    const blockedKeywords = [

        "shahrukh",
        "srk",
        "salman",
        "actor",
        "actress",
        "celebrity",

        "movie",
        "movies",
        "film",
        "cinema",
        "song",
        "songs",
        "music",

        "love",
        "boyfriend",
        "girlfriend",
        "relationship",
        "dating",
        "crush",

        "recipe",
        "cooking",
        "cook",
        "food recipe",

        "cricket",
        "football",
        "ipl",
        "match",
        "score",
        "sports",

        "politics",
        "election",
        "religion",

        "shopping",
        "fashion",
        "makeup",
        "meme",
        "joke",
        "funny"

    ];

    const mathExpressionPattern =
        /^[0-9\s+\-*/().=<>%^]+$/;

    const containsMathPattern =
        /(\d+\s*[+\-*/%]\s*\d+)|(\d+\s*[=<>]\s*\d+)|(\bsolve\b|\bsimplify\b|\bevaluate\b|\bfind x\b|\bpercentage\b|\bratio\b|\bprofit\b|\bloss\b|\baverage\b|\bprobability\b)/i
            .test(userMessage);

    const isGreeting =
        greetingKeywords.some(word =>
            lowerMessage.includes(word)
        );

    const isAllowed =
        allowedKeywords.some(word =>
            lowerMessage.includes(word)
        );

    const isBlocked =
        blockedKeywords.some(word =>
            lowerMessage.includes(word)
        );

    const isMathQuestion =
        mathExpressionPattern.test(
            userMessage
        ) ||
        containsMathPattern;

    if (!image) {

        if (
            isBlocked ||
            (
                !isGreeting &&
                !isAllowed &&
                !isMathQuestion
            )
        ) {

            return res.json({

                reply:
`I can help only with:

• Interview preparation

• Study and academic subjects

• Resume building

• Aptitude, reasoning, and maths

• Coding and technical subjects

• Communication skills

• Projects and career guidance

Please ask something related to these areas.`

            });

        }

    }

    try {

        const systemPrompt = `

You are StudentSathi AI,
an assistant for an AI Interview Platform.

You must ONLY help with:

- Interview preparation
- HR, technical, behavioral interview questions
- Study topics and academic doubts
- Maths, aptitude, reasoning
- Coding, DSA, programming
- Resume and CV building
- Communication and English improvement
- Project guidance
- Career and placement guidance
- Case study / business scenario preparation
- Educational image analysis

You must REFUSE:

- celebrities
- movies
- songs
- entertainment
- love
- dating
- relationships
- politics
- religion debate
- recipes
- cooking
- sports
- jokes
- memes
- shopping
- fashion
- makeup
- unrelated topics

Keep answers direct,
structured and student-friendly.

For maths and aptitude,
solve step by step.

For resume and interview questions,
give practical guidance.

`;

        let completion;

        if (image) {

            completion =
                await groq.chat.completions.create({

                    model:
                        "meta-llama/llama-4-scout-17b-16e-instruct",

                    messages: [

                        {
                            role: "system",
                            content: systemPrompt
                        },

                        {

                            role: "user",

                            content: [

                                {
                                    type: "text",

                                    text:
                                        userMessage ||
                                        "Please explain this educational image."
                                },

                                {

                                    type: "image_url",

                                    image_url: {
                                        url: image
                                    }

                                }

                            ]

                        }

                    ],

                    temperature: 0.2,

                    max_completion_tokens: 1024

                });

        } else {

            completion =
                await groq.chat.completions.create({

                    model:
                        "openai/gpt-oss-20b",

                    messages: [

                        {
                            role: "system",
                            content: systemPrompt
                        },

                        {
                            role: "user",
                            content: userMessage
                        }

                    ],

                    temperature: 0.2,

                    max_completion_tokens: 1024

                });

        }

        const reply =
            completion
                .choices[0]
                .message
                .content;

        res.json({
            reply
        });

    } catch (error) {

        console.log(
            "AI Error:",
            error.response?.data ||
            error.message
        );

        res.json({

            reply:
                "Error processing request. Please try again."

        });

    }

});

// ======================================================
// MULTER ERROR HANDLER
// ======================================================

app.use((err, req, res, next) => {

    if (err instanceof multer.MulterError) {

        return res.status(400).json({

            message:
                "File upload error: " +
                err.message

        });

    }

    if (err) {

        console.error(err);

        return res.status(400).json({

            message:
                err.message ||
                "Something went wrong"

        });

    }

    next();

});

// ======================================================
// START SERVER
// ======================================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});