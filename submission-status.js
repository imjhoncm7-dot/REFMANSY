// ========================================
// Refmansy Faculty Submission Status
// ========================================

const currentUser = JSON.parse(
    localStorage.getItem("refmansyCurrentUser")
);

let facultySubmissions = [];
let selectedSubmissionId = null;

// Protect Faculty page
if (!currentUser) {
    window.location.replace("login.html");
} else if (
    currentUser.role !== "faculty" &&
    currentUser.role !== "user"
) {
    window.location.replace("admin-dashboard.html");
} else {
    initializePage();
}

function initializePage() {
    displayFacultyName();
    loadSubmissions();
    setupFilters();
    setupModal();
    setupLogout();
}

// Display Faculty name
function displayFacultyName() {
    document.getElementById(
        "headerFacultyName"
    ).textContent =
        currentUser.fullname || currentUser.username;
}

// Load Faculty submissions
function loadSubmissions() {
    const allResearchFiles =
        JSON.parse(
            localStorage.getItem("refmansyResearchFiles")
        ) || [];

    facultySubmissions = allResearchFiles.filter(
        function (file) {
            return isFacultyFile(file);
        }
    );

    updateSummary();
    filterSubmissions();
}

// Check if the file belongs to the logged-in Faculty
function isFacultyFile(file) {
    const currentId = String(currentUser.id || "");

    const currentEmail = String(
        currentUser.email || ""
    ).toLowerCase();

    const currentUsername = String(
        currentUser.username || ""
    ).toLowerCase();

    const currentFullname = String(
        currentUser.fullname || ""
    ).toLowerCase();

    const ownerId = String(
        file.ownerId ||
        file.userId ||
        file.uploadedById ||
        ""
    );

    const ownerEmail = String(
        file.ownerEmail ||
        file.uploadedByEmail ||
        ""
    ).toLowerCase();

    const uploadedBy = String(
        file.uploadedBy ||
        file.username ||
        ""
    ).toLowerCase();

    const researcher = String(
        file.researcher ||
        file.author ||
        ""
    ).toLowerCase();

    return (
        (currentId && ownerId === currentId) ||
        (currentEmail && ownerEmail === currentEmail) ||
        (
            currentUsername &&
            uploadedBy === currentUsername
        ) ||
        (
            currentFullname &&
            researcher === currentFullname
        )
    );
}

// Update summary cards
function updateSummary() {
    const pending = facultySubmissions.filter(
        function (file) {
            return normalizeStatus(file.status) === "pending";
        }
    ).length;

    const approved = facultySubmissions.filter(
        function (file) {
            return normalizeStatus(file.status) === "approved";
        }
    ).length;

    const rejected = facultySubmissions.filter(
        function (file) {
            return normalizeStatus(file.status) === "rejected";
        }
    ).length;

    document.getElementById(
        "totalSubmissions"
    ).textContent = facultySubmissions.length;

    document.getElementById(
        "pendingSubmissions"
    ).textContent = pending;

    document.getElementById(
        "approvedSubmissions"
    ).textContent = approved;

    document.getElementById(
        "rejectedSubmissions"
    ).textContent = rejected;
}

// Set up search and status filter
function setupFilters() {
    document
        .getElementById("searchInput")
        .addEventListener("input", filterSubmissions);

    document
        .getElementById("statusFilter")
        .addEventListener("change", filterSubmissions);
}

// Filter Faculty submissions
function filterSubmissions() {
    const searchValue =
        document
            .getElementById("searchInput")
            .value
            .trim()
            .toLowerCase();

    const selectedStatus =
        document.getElementById("statusFilter").value;

    const filteredSubmissions =
        facultySubmissions.filter(function (file) {
            const title = String(
                file.title ||
                file.researchTitle ||
                ""
            ).toLowerCase();

            const status = normalizeStatus(file.status);

            const matchesSearch =
                title.includes(searchValue);

            const matchesStatus =
                selectedStatus === "all" ||
                status === selectedStatus;

            return matchesSearch && matchesStatus;
        });

    displaySubmissions(filteredSubmissions);
}

// Display submission cards
function displaySubmissions(submissions) {
    const submissionList =
        document.getElementById("submissionList");

    if (submissions.length === 0) {
        submissionList.innerHTML = `
            <div class="empty-submissions">

                <i class="fa-regular fa-folder-open"></i>

                <h3>No submissions available</h3>

                <p>
                    Upload a research file to track its status.
                </p>

                <a href="upload-research.html">
                    Upload Research
                </a>

            </div>
        `;

        return;
    }

    const sortedSubmissions = [...submissions].sort(
        function (firstFile, secondFile) {
            return getFileTime(secondFile) -
                getFileTime(firstFile);
        }
    );

    submissionList.innerHTML = "";

    sortedSubmissions.forEach(function (file) {
        const status = normalizeStatus(file.status);
        const submissionItem =
            document.createElement("article");

        submissionItem.className =
            "submission-item submission-" + status;

        submissionItem.innerHTML = `
            <div class="submission-icon">
                <i class="${getStatusIcon(status)}"></i>
            </div>

            <div class="submission-details">

                <h3>
                    ${escapeHTML(
                        file.title ||
                        file.researchTitle ||
                        "Untitled Research"
                    )}
                </h3>

                <div class="submission-meta">

                    <span>
                        <i class="fa-solid fa-hashtag"></i>
                        ${escapeHTML(file.id || "N/A")}
                    </span>

                    <span>
                        <i class="fa-solid fa-tag"></i>
                        ${escapeHTML(
                            file.category || "Uncategorized"
                        )}
                    </span>

                    <span>
                        <i class="fa-regular fa-calendar"></i>
                        ${escapeHTML(
                            file.dateUploaded ||
                            file.dateAdded ||
                            "N/A"
                        )}
                    </span>

                </div>

            </div>

            <div class="submission-actions">

                <span class="status-label status-${status}">
                    ${capitalizeFirstLetter(status)}
                </span>

                <button
                    type="button"
                    class="details-button"
                    data-id="${escapeHTML(file.id || "")}"
                    title="View submission details"
                >
                    <i class="fa-solid fa-chevron-right"></i>
                </button>

            </div>
        `;

        submissionList.appendChild(submissionItem);
    });

    setupDetailsButtons();
}

// Set up Details buttons
function setupDetailsButtons() {
    document
        .querySelectorAll(".details-button")
        .forEach(function (button) {
            button.addEventListener("click", function () {
                openSubmissionModal(this.dataset.id);
            });
        });
}

// Open submission details
function openSubmissionModal(fileId) {
    const submission = facultySubmissions.find(
        function (file) {
            return String(file.id) === String(fileId);
        }
    );

    if (!submission) {
        return;
    }

    selectedSubmissionId = submission.id;

    const status = normalizeStatus(submission.status);

    document.getElementById("modalTitle").textContent =
        submission.title ||
        submission.researchTitle ||
        "Untitled Research";

    document.getElementById("modalFileId").textContent =
        submission.id || "N/A";

    document.getElementById("modalCategory").textContent =
        submission.category || "Uncategorized";

    document.getElementById(
        "modalUploadDate"
    ).textContent =
        submission.dateUploaded ||
        submission.dateAdded ||
        "N/A";

    document.getElementById("modalStatus").textContent =
        capitalizeFirstLetter(status);

    document.getElementById(
        "modalReviewedBy"
    ).textContent =
        submission.reviewedBy || "Not reviewed";

    document.getElementById(
        "modalReviewedDate"
    ).textContent =
        submission.reviewedDate || "Not reviewed";

    document.getElementById("modalComment").textContent =
        submission.reviewComment ||
        "No Admin comment available.";

    document.getElementById("submittedDate").textContent =
        submission.dateUploaded ||
        submission.dateAdded ||
        "N/A";

    updateTimeline(status, submission);

    const editButton =
        document.getElementById("editSubmissionButton");

    editButton.disabled = status !== "pending";

    editButton.title =
        status === "pending"
            ? "Edit this pending submission"
            : "Only pending submissions can be edited";

    document
        .getElementById("submissionModal")
        .classList.add("show");
}

// Update status timeline
function updateTimeline(status, submission) {
    const reviewStep =
        document.getElementById("reviewStep");

    const decisionStep =
        document.getElementById("decisionStep");

    const reviewText =
        reviewStep.querySelector("p");

    const decisionText =
        document.getElementById("decisionText");

    const decisionIcon =
        decisionStep.querySelector("i");

    reviewStep.className = "timeline-step";
    decisionStep.className = "timeline-step";

    reviewText.textContent = "Waiting for review";
    decisionText.textContent = "Pending";

    decisionIcon.className = "fa-solid fa-check";

    if (status === "approved") {
        reviewStep.classList.add("completed");
        decisionStep.classList.add("completed");

        reviewText.textContent =
            submission.reviewedDate || "Reviewed";

        decisionText.textContent = "Approved";
        decisionIcon.className = "fa-solid fa-check";
    }

    if (status === "rejected") {
        reviewStep.classList.add("completed");
        decisionStep.classList.add("rejected");

        reviewText.textContent =
            submission.reviewedDate || "Reviewed";

        decisionText.textContent = "Rejected";
        decisionIcon.className = "fa-solid fa-xmark";
    }
}

// Set up modal
function setupModal() {
    const submissionModal =
        document.getElementById("submissionModal");

    document
        .getElementById("closeModalButton")
        .addEventListener("click", closeSubmissionModal);

    document
        .getElementById("editSubmissionButton")
        .addEventListener("click", editSubmission);

    document
        .getElementById("viewDocumentButton")
        .addEventListener("click", viewDocument);

    submissionModal.addEventListener(
        "click",
        function (event) {
            if (event.target === submissionModal) {
                closeSubmissionModal();
            }
        }
    );

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeSubmissionModal();
        }
    });
}

// Edit a pending submission
function editSubmission() {
    const submission = getSelectedSubmission();

    if (
        !submission ||
        normalizeStatus(submission.status) !== "pending"
    ) {
        return;
    }

    localStorage.setItem(
        "refmansyEditFileId",
        String(submission.id)
    );

    window.location.href = "upload-research.html";
}

// View attached PDF
function viewDocument() {
    const submission = getSelectedSubmission();

    if (!submission) {
        return;
    }

    const fileLocation = getFileLocation(submission);

    if (!fileLocation) {
        alert("No PDF document is attached.");
        return;
    }

    window.open(fileLocation, "_blank", "noopener,noreferrer");
}

// Get selected submission
function getSelectedSubmission() {
    return facultySubmissions.find(function (file) {
        return (
            String(file.id) ===
            String(selectedSubmissionId)
        );
    });
}

// Get safe file location
function getFileLocation(file) {
    const fileLocation =
        file.fileData ||
        file.fileURL ||
        file.fileUrl ||
        file.filePath;

    if (!fileLocation) {
        return null;
    }

    const value =
        String(fileLocation).trim().toLowerCase();

    const safeLocation =
        value.startsWith("data:application/pdf") ||
        value.startsWith("blob:") ||
        value.startsWith("https://") ||
        value.startsWith("http://");

    return safeLocation ? fileLocation : null;
}

// Close modal
function closeSubmissionModal() {
    document
        .getElementById("submissionModal")
        .classList.remove("show");

    selectedSubmissionId = null;
}

// Status icon
function getStatusIcon(status) {
    if (status === "approved") {
        return "fa-solid fa-check";
    }

    if (status === "rejected") {
        return "fa-solid fa-xmark";
    }

    return "fa-regular fa-clock";
}

// Normalize status
function normalizeStatus(status) {
    const normalizedStatus =
        String(status || "pending").toLowerCase();

    if (
        normalizedStatus !== "approved" &&
        normalizedStatus !== "rejected"
    ) {
        return "pending";
    }

    return normalizedStatus;
}

// Get upload timestamp
function getFileTime(file) {
    const dateValue =
        file.createdAt ||
        file.dateUploaded ||
        file.dateAdded ||
        0;

    const timestamp = new Date(dateValue).getTime();

    return Number.isNaN(timestamp) ? 0 : timestamp;
}

function capitalizeFirstLetter(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

// Logout
function setupLogout() {
    document
        .getElementById("logoutButton")
        .addEventListener("click", function () {
            const confirmLogout = confirm(
                "Are you sure you want to log out?"
            );

            if (!confirmLogout) {
                return;
            }

            localStorage.removeItem(
                "refmansyCurrentUser"
            );

            localStorage.removeItem(
                "refmansyEditFileId"
            );

            window.location.replace("login.html");
        });
}

// Prevent HTML injection
function escapeHTML(value) {
    const element = document.createElement("div");
    element.textContent = String(value ?? "");

    return element.innerHTML;
}