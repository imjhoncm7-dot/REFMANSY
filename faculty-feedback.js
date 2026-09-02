// ========================================
// Refmansy Faculty Feedback
// ========================================

const currentUser = JSON.parse(
    localStorage.getItem("refmansyCurrentUser")
);

let allFeedback = [];
let facultyFeedback = [];

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
    loadFeedback();
    setupFeedbackForm();
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

// Load feedback
function loadFeedback() {
    allFeedback =
        JSON.parse(
            localStorage.getItem("refmansyFeedback")
        ) || [];

    facultyFeedback = allFeedback.filter(
        function (feedback) {
            return isFacultyFeedback(feedback);
        }
    );

    updateSummary();
    filterFeedback();
}

// Check feedback ownership
function isFacultyFeedback(feedback) {
    const sameId =
        String(feedback.userId || "") ===
        String(currentUser.id || "");

    const sameEmail =
        String(feedback.userEmail || "").toLowerCase() ===
        String(currentUser.email || "").toLowerCase();

    return sameId || sameEmail;
}

// Update summary cards
function updateSummary() {
    const openFeedback = facultyFeedback.filter(
        function (feedback) {
            return (
                normalizeStatus(feedback.status) !==
                "resolved"
            );
        }
    ).length;

    const resolvedFeedback = facultyFeedback.filter(
        function (feedback) {
            return (
                normalizeStatus(feedback.status) ===
                "resolved"
            );
        }
    ).length;

    document.getElementById("totalFeedback").textContent =
        facultyFeedback.length;

    document.getElementById("openFeedback").textContent =
        openFeedback;

    document.getElementById(
        "resolvedFeedback"
    ).textContent = resolvedFeedback;
}

// Set up feedback submission
function setupFeedbackForm() {
    const feedbackForm =
        document.getElementById("feedbackForm");

    feedbackForm.addEventListener(
        "submit",
        function (event) {
            event.preventDefault();

            const type =
                document.getElementById(
                    "feedbackType"
                ).value;

            const subject =
                document
                    .getElementById("feedbackSubject")
                    .value
                    .trim();

            const message =
                document
                    .getElementById("feedbackMessage")
                    .value
                    .trim();

            if (
                type === "" ||
                subject === "" ||
                message === ""
            ) {
                showFormMessage(
                    "Please complete all required fields.",
                    "error"
                );
                return;
            }

            const newFeedback = {
                id: "FB-" + Date.now(),

                userId: currentUser.id,
                userEmail: currentUser.email,
                username: currentUser.username,

                userName:
                    currentUser.fullname ||
                    currentUser.username,

                type: type,
                subject: subject,
                message: message,

                status: "new",
                adminResponse: "",
                respondedBy: "",
                responseDate: "",

                dateSubmitted:
                    new Date().toLocaleString(),

                createdAt:
                    new Date().toISOString()
            };

            allFeedback.push(newFeedback);

            localStorage.setItem(
                "refmansyFeedback",
                JSON.stringify(allFeedback)
            );

            feedbackForm.reset();

            showFormMessage(
                "Feedback submitted successfully.",
                "success"
            );

            loadFeedback();

            setTimeout(function () {
                clearFormMessage();
            }, 2500);
        }
    );
}

// Set up search and filter
function setupFilters() {
    document
        .getElementById("searchInput")
        .addEventListener("input", filterFeedback);

    document
        .getElementById("statusFilter")
        .addEventListener("change", filterFeedback);
}

// Filter Faculty feedback
function filterFeedback() {
    const searchValue =
        document
            .getElementById("searchInput")
            .value
            .trim()
            .toLowerCase();

    const selectedStatus =
        document.getElementById("statusFilter").value;

    const filteredFeedback = facultyFeedback.filter(
        function (feedback) {
            const subject = String(
                feedback.subject || ""
            ).toLowerCase();

            const message = String(
                feedback.message || ""
            ).toLowerCase();

            const type = String(
                feedback.type || ""
            ).toLowerCase();

            const status =
                normalizeStatus(feedback.status);

            const matchesSearch =
                subject.includes(searchValue) ||
                message.includes(searchValue) ||
                type.includes(searchValue);

            const matchesStatus =
                selectedStatus === "all" ||
                status === selectedStatus;

            return matchesSearch && matchesStatus;
        }
    );

    displayFeedbackHistory(filteredFeedback);
}

// Display feedback history
function displayFeedbackHistory(feedbackList) {
    const historyTable =
        document.getElementById(
            "feedbackHistoryTable"
        );

    document.getElementById("resultCount").textContent =
        "Showing " +
        feedbackList.length +
        (
            feedbackList.length === 1
                ? " feedback message"
                : " feedback messages"
        );

    if (feedbackList.length === 0) {
        historyTable.innerHTML = `
            <tr>
                <td colspan="7" class="empty-message">
                    You have not submitted any feedback.
                </td>
            </tr>
        `;

        return;
    }

    const sortedFeedback = [...feedbackList].sort(
        function (firstFeedback, secondFeedback) {
            return (
                getFeedbackTime(secondFeedback) -
                getFeedbackTime(firstFeedback)
            );
        }
    );

    historyTable.innerHTML = "";

    sortedFeedback.forEach(function (feedback) {
        const row = document.createElement("tr");

        const type = normalizeType(feedback.type);
        const status = normalizeStatus(feedback.status);

        row.innerHTML = `
            <td>${escapeHTML(feedback.id)}</td>

            <td>
                <span class="feedback-type type-${type}">
                    ${formatType(type)}
                </span>
            </td>

            <td>${escapeHTML(feedback.subject)}</td>

            <td>
                ${escapeHTML(
                    feedback.dateSubmitted || "N/A"
                )}
            </td>

            <td>
                <span class="status-label status-${status}">
                    ${formatStatus(status)}
                </span>
            </td>

            <td>
                <span class="response-preview">
                    ${escapeHTML(
                        feedback.adminResponse ||
                        "No response yet"
                    )}
                </span>
            </td>

            <td>
                <button
                    type="button"
                    class="view-button"
                    data-id="${escapeHTML(feedback.id)}"
                >
                    View
                </button>
            </td>
        `;

        historyTable.appendChild(row);
    });

    setupViewButtons();
}

// Set up View buttons
function setupViewButtons() {
    document
        .querySelectorAll(".view-button")
        .forEach(function (button) {
            button.addEventListener("click", function () {
                openFeedbackDetails(this.dataset.id);
            });
        });
}

// Open feedback details
function openFeedbackDetails(feedbackId) {
    const feedback = facultyFeedback.find(
        function (item) {
            return (
                String(item.id) ===
                String(feedbackId)
            );
        }
    );

    if (!feedback) {
        return;
    }

    document.getElementById(
        "modalFeedbackId"
    ).textContent = feedback.id;

    document.getElementById("modalDate").textContent =
        feedback.dateSubmitted || "N/A";

    document.getElementById("modalType").textContent =
        formatType(normalizeType(feedback.type));

    document.getElementById("modalStatus").textContent =
        formatStatus(normalizeStatus(feedback.status));

    document.getElementById("modalSubject").textContent =
        feedback.subject || "No Subject";

    document.getElementById("modalMessage").textContent =
        feedback.message || "No message available.";

    document.getElementById(
        "modalAdminResponse"
    ).textContent =
        feedback.adminResponse ||
        "The administrator has not responded yet.";

    document.getElementById(
        "modalRespondedBy"
    ).textContent =
        feedback.respondedBy || "N/A";

    document.getElementById(
        "modalResponseDate"
    ).textContent =
        feedback.responseDate || "N/A";

    document
        .getElementById("detailsModal")
        .classList.add("show");
}

// Set up modal
function setupModal() {
    const detailsModal =
        document.getElementById("detailsModal");

    document
        .getElementById("closeModalButton")
        .addEventListener("click", closeDetailsModal);

    detailsModal.addEventListener(
        "click",
        function (event) {
            if (event.target === detailsModal) {
                closeDetailsModal();
            }
        }
    );

    document.addEventListener(
        "keydown",
        function (event) {
            if (event.key === "Escape") {
                closeDetailsModal();
            }
        }
    );
}

// Close modal
function closeDetailsModal() {
    document
        .getElementById("detailsModal")
        .classList.remove("show");
}

// Form messages
function showFormMessage(text, type) {
    const formMessage =
        document.getElementById("formMessage");

    formMessage.textContent = text;
    formMessage.className = "form-message " + type;
}

function clearFormMessage() {
    const formMessage =
        document.getElementById("formMessage");

    formMessage.textContent = "";
    formMessage.className = "form-message";
}

// Normalize feedback type
function normalizeType(type) {
    const validTypes = [
        "suggestion",
        "concern",
        "technical",
        "general"
    ];

    const normalizedType =
        String(type || "general")
            .toLowerCase()
            .replaceAll(" ", "-");

    return validTypes.includes(normalizedType)
        ? normalizedType
        : "general";
}

// Normalize status
function normalizeStatus(status) {
    const normalizedStatus =
        String(status || "new")
            .toLowerCase()
            .replaceAll(" ", "-");

    if (
        normalizedStatus !== "in-progress" &&
        normalizedStatus !== "resolved"
    ) {
        return "new";
    }

    return normalizedStatus;
}

function formatType(type) {
    const typeNames = {
        suggestion: "Suggestion",
        concern: "Concern",
        technical: "Technical Issue",
        general: "General"
    };

    return typeNames[type] || "General";
}

function formatStatus(status) {
    const statusNames = {
        new: "New",
        "in-progress": "In Progress",
        resolved: "Resolved"
    };

    return statusNames[status] || "New";
}

// Get timestamp for sorting
function getFeedbackTime(feedback) {
    const dateValue =
        feedback.createdAt ||
        feedback.dateSubmitted ||
        0;

    const timestamp = new Date(dateValue).getTime();

    return Number.isNaN(timestamp) ? 0 : timestamp;
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

            window.location.replace("login.html");
        });
}

// Prevent HTML injection
function escapeHTML(value) {
    const element = document.createElement("div");
    element.textContent = String(value ?? "");

    return element.innerHTML;
}