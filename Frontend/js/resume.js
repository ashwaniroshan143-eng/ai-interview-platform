
const role = localStorage.getItem("userRole");

if(!role || role === "admin"){
    window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", function () {
    const userEmail = localStorage.getItem("userEmail");

    if (!userEmail) {
        window.location.href = "login.html";
        return;
    }

    const fields = {
        fullName: document.getElementById("fullName"),
        email: document.getElementById("email"),
        phone: document.getElementById("phone"),
        location: document.getElementById("location"),
        linkedin: document.getElementById("linkedin"),
        summary: document.getElementById("summary"),
        education: document.getElementById("education"),
        skills: document.getElementById("skills"),
        experience: document.getElementById("experience"),
        projects: document.getElementById("projects"),
        certifications: document.getElementById("certifications"),
        photo: document.getElementById("photo")
    };

    const preview = {
        name: document.getElementById("previewName"),
        email: document.getElementById("previewEmail"),
        phone: document.getElementById("previewPhone"),
        location: document.getElementById("previewLocation"),
        linkedin: document.getElementById("previewLinkedin"),
        summary: document.getElementById("previewSummary"),
        education: document.getElementById("previewEducation"),
        skills: document.getElementById("previewSkills"),
        experience: document.getElementById("previewExperience"),
        projects: document.getElementById("previewProjects"),
        certifications: document.getElementById("previewCertifications"),
        photoBox: document.getElementById("previewPhotoBox"),
        photo: document.getElementById("previewPhoto")
    };

    let photoDataUrl = "";

    function setTextOrFallback(element, value, fallback) {
        if (value.trim() !== "") {
            element.textContent = value;
            element.classList.remove("resume-empty");
        } else {
            element.textContent = fallback;
            element.classList.add("resume-empty");
        }
    }

    function updateSkills(skillsText) {
        preview.skills.innerHTML = "";

        if (skillsText.trim() === "") {
            preview.skills.innerHTML = `<span class="resume-empty">Your skills will appear here.</span>`;
            return;
        }

        const skillsArray = skillsText
            .split(",")
            .map(skill => skill.trim())
            .filter(skill => skill !== "");

        skillsArray.forEach(skill => {
            const tag = document.createElement("span");
            tag.className = "skill-tag";
            tag.textContent = skill;
            preview.skills.appendChild(tag);
        });
    }

    function updatePhotoPreview() {
        if (photoDataUrl) {
            preview.photo.src = photoDataUrl;
            preview.photoBox.style.display = "block";
        } else {
            preview.photo.src = "";
            preview.photoBox.style.display = "none";
        }
    }

    function updatePreview() {
        setTextOrFallback(preview.name, fields.fullName.value, "Your Name");
        setTextOrFallback(preview.email, fields.email.value, "your@email.com");
        setTextOrFallback(preview.phone, fields.phone.value, "Phone Number");
        setTextOrFallback(preview.location, fields.location.value, "Location");
        setTextOrFallback(preview.linkedin, fields.linkedin.value, "LinkedIn / Portfolio");

        setTextOrFallback(preview.summary, fields.summary.value, "Your summary will appear here.");
        setTextOrFallback(preview.education, fields.education.value, "Your education details will appear here.");
        setTextOrFallback(preview.experience, fields.experience.value, "Your experience details will appear here.");
        setTextOrFallback(preview.projects, fields.projects.value, "Your project details will appear here.");
        setTextOrFallback(preview.certifications, fields.certifications.value, "Your certifications will appear here.");

        updateSkills(fields.skills.value);
        updatePhotoPreview();
    }

    fields.photo.addEventListener("change", function () {
        const file = this.files[0];

        if (!file) {
            photoDataUrl = "";
            updatePreview();
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            photoDataUrl = e.target.result;
            updatePreview();
        };
        reader.readAsDataURL(file);
    });

    document.getElementById("previewBtn").addEventListener("click", updatePreview);

    Object.values(fields).forEach(field => {
        if (field && field.type !== "file") {
            field.addEventListener("input", updatePreview);
        }
    });

    document.getElementById("saveResumeBtn").addEventListener("click", async function () {
        const resumeData = {
            fullName: fields.fullName.value,
            email: fields.email.value,
            phone: fields.phone.value,
            location: fields.location.value,
            linkedin: fields.linkedin.value,
            summary: fields.summary.value,
            education: fields.education.value,
            skills: fields.skills.value,
            experience: fields.experience.value,
            projects: fields.projects.value,
            certifications: fields.certifications.value,
            photo: photoDataUrl
        };

        try {
            const response = await fetch("http://localhost:5000/resume", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: userEmail,
                    resume: resumeData
                })
            });

            const data = await response.json();
            alert(data.message || "Resume saved successfully");
        } catch (error) {
            console.error(error);
            alert("Error saving resume");
        }
    });

    document.getElementById("downloadPdfBtn").addEventListener("click", async function () {
        updatePreview();

        const resumeElement = document.getElementById("resumePreview");

        try {
            const canvas = await html2canvas(resumeElement, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#ffffff"
            });

            const imgData = canvas.toDataURL("image/png");

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF("p", "mm", "a4");

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            const imgWidth = pdfWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;

            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
                heightLeft -= pdfHeight;
            }

            const fileName = `${fields.fullName.value.trim() || "resume"}.pdf`;
            pdf.save(fileName);

        } catch (error) {
            console.error("PDF download error:", error);
            alert("Error generating PDF");
        }
    });

    document.getElementById("logoutLink").addEventListener("click", function () {
        localStorage.removeItem("userEmail");
        window.location.href = "login.html";
    });

    updatePreview();
});