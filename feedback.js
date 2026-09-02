// ========================================
// Refmansy Admin Feedback
// ========================================

const currentUser = JSON.parse(
    localStorage.getItem("refmansyCurrentUser")
);

let feedbackList = [];
let selectedFeedbackId = null;

// Protect Admin page
if (!currentUser) {
    window.location.replace("login.html");
} else if (currentUser.role !== "admin") {
    window.location.replace("user-dashboard.html");
} else {
    initializePage();
}

function initializePage() {
    displayAdminName();
    loadFeedback();
    setupFilters();
    setupModal();
    setupLogout();
}

// Display administrator name
function displayAdminName() {
    document.getElementById("headerAdminName").textContent =
        currentUser.fullname || currentUser.username;
}

// Load feedback from localStorage
function loadFeedback() {
    feedbackList =
        JSON.parse(
            localStorage.getItem("refmansyFeedback")
        ) || [];

    let feedbackUpdated = false;

    feedbackList.forEach(function (feedback, index) {
        if (!feedback.id) {
            feedback.id =
                "FB-" + Date.now() + "-" + index;

            feedbackUpdated = true;
        }

        if (!feedback.status) {
            feedback.status = "new";
            feedbackUpdated = true;
        }
    });

    if (feedbackUpdated) {
        saveFeedback();
    }

    updateSummary();
    filterFeedback();
}

// Update summary cards
function updateSummary() {
    const newFeedback = feedbackList.filter(
        function (feedback) {
            return normalizeStatus(feedback.status) === "new";
        }
    ).length;

    const inProgressFeedback = feedbackList.filter(
        function (feedback) {
            return (
                normalizeStatus(feedback.status) ===
                "in-progress"
            );
        }
    ).length;

    const resolvedFeedback = feedbackList.filter(
        function (feedback) {
            return (
                normalizeStatus(feedback.status) ===
                "resolved"
            );
        }
    ).length;

    document.getElementById("totalFeedback").textContent =
        feedbackList.length;

    document.getElementById("newFeedback").textContent =
        newFeedback;

    document.getElementById(
        "inProgressFeedback"
    ).textContent = inProgressFeedback;

    document.getElementById(
        "resolvedFeedback"
    ).textContent = resolvedFeedback;
}

// Set up filters
function setupFilters() {
    document
        .getElementById("searchInput")
        .addEventListener("input", filterFeedback);

    document
        .getElementById("typeFilter")
        .addEventListener("change", filterFeedback);

    document
        .getElementById("statusFilter")
        .addEventListener("change", filterFeedback);
}

// Filter feedback
function filterFeedback() {
    const searchValue =
        document
            .getElementById("searchInput")
            .value
            .trim()
            .toLowerCase();

    const selectedType =
        document.getElementById("typeFilter").value;

    const selectedStatus =
        document.getElementById("statusFilter").value;

    const filteredFeedback = feedbackList.filter(
        function (feedback) {
            const userName = String(
                feedback.userName ||
                feedback.fullname ||
                feedback.username ||
                ""
            ).toLowerCase();

            const subject = String(
                feedback.subject || ""
            ).toLowerCase();

            const message = String(
                feedback.message || ""
            ).toLowerCase();

            const type = normalizeType(feedback.type);
            const status = normalizeStatus(feedback.status);

            const matchesSearch =
                userName.includes(searchValue) ||
                subject.includes(searchValue) ||
                message.includes(searchValue);

            const matchesType =
                selectedType === "all" ||
                type === selectedType;

            const matchesStatus =
                selectedStatus === "all" ||
                status === selectedStatus;

            return (
                matchesSearch &&
                matchesType &&
                matchesStatus
            );
        }
    );

    displayFeedback(filteredFeedback);
}

// Display feedback table
function displayFeedback(feedbackItems) {
    const feedbackTable =
        document.getElementById("feedbackTable");

    document.getElementById("resultCount").textContent =
        "Showing " +
        feedbackItems.length +
        (feedbackItems.length === 1
            ? " feedback message"
            : " feedback messages");

    if (feedbackItems.length === 0) {
        feedbackTable.innerHTML = `
            <tr>
                <td colspan="7" class="empty-message">
                    No feedback has been submitted.
                </td>
            </tr>
        `;

        return;
    }

    const sortedFeedback = [...feedbackItems].sort(
        function (firstItem, secondItem) {
            return getFeedbackTime(secondItem) -
                getFeedbackTime(firstItem);
        }
    );

    feedbackTable.innerHTML = "";

    sortedFeedback.forEach(function (feedback) {
        const row = document.createElement("tr");
        const type = normalizeType(feedback.type);
        const status = normalizeStatus(feedback.status);

        const userName =
            feedback.userName ||
            feedback.fullname ||
            feedback.username ||
            "Unknown User";

        row.innerHTML = `
            <td>${escapeHTML(feedback.id)}</td>

            <td>${escapeHTML(userName)}</td>

            <td>
                <span class="feedback-type type-${type}">
                    ${formatType(type)}
                </span>
            </td>

            <td>
                ${escapeHTML(
                    feedback.subject || "No Subject"
                )}
            </td>

            <td>
                ${escapeHTML(
                    feedback.dateSubmitted ||
                    feedback.dateCreated ||
                    "N/A"
                )}
            </td>

            <td>
                <span class="status-label status-${status}">
                    ${formatStatus(status)}
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

        feedbackTable.appendChild(row);
    });

    setupViewButtons();
}

// Set up View buttons
function setupViewButtons() {
    document
        .querySelectorAll(".view-button")
        .forEach(function (button) {
            button.addEventListener("click", function () {
                openFeedbackModal(this.dataset.id);
            });
        });
}

// Open feedback details
function openFeedbackModal(feedbackId) {
    const feedback = feedbackList.find(
        function (item) {
            return String(item.id) === String(feedbackId);
        }
    );

    if (!feedback) {
        return;
    }

    selectedFeedbackId = feedback.id;

    document.getElementById(
        "modalFeedbackId"
    ).textContent = feedback.id;

    document.getElementById("modalDate").textContent =
        feedback.dateSubmitted ||
        feedback.dateCreated ||
        "N/A";

    document.getElementById("modalUser").textContent =
        feedback.userName ||
        feedback.fullname ||
        feedback.username ||
        "Unknown User";

    document.getElementById("modalType").textContent =
        formatType(normalizeType(feedback.type));

    document.getElementById("modalSubject").textContent =
        feedback.subject || "No Subject";

    document.getElementById("modalMessage").textContent =
        feedback.message || "No message provided.";

    document.getElementById("adminResponse").value =
        feedback.adminResponse || "";

    document.getElementById("feedbackStatus").value =
        normalizeStatus(feedback.status);

    clearModalMessage();

    document
        .getElementById("feedbackModal")
        .classList.add("show");
}

// Set up modal controls
function setupModal() {
    const feedbackModal =
        document.getElementById("feedbackModal");

    document
        .getElementById("closeModalButton")
        .addEventListener("click", closeFeedbackModal);

    document
        .getElementById("cancelButton")
        .addEventListener("click", closeFeedbackModal);

    document
        .getElementById("saveResponseButton")
        .addEventListener("click", saveAdminResponse);

    feedbackModal.addEventListener("click", function (event) {
        if (event.target === feedbackModal) {
            closeFeedbackModal();
        }
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeFeedbackModal();
        }
    });
}

// Save response and status
function saveAdminResponse() {
    if (selectedFeedbackId === null) {
        return;
    }

    const feedbackIndex = feedbackList.findIndex(
        function (feedback) {
            return (
                String(feedback.id) ===
                String(selectedFeedbackId)
            );
        }
    );

    if (feedbackIndex === -1) {
        return;
    }

    const adminResponse =
        document
            .getElementById("adminResponse")
            .value
            .trim();

    const status =
        document.getElementById("feedbackStatus").value;

    if (status === "resolved" && adminResponse === "") {
        showModalMessage(
            "Please enter a response before marking the feedback as resolved.",
            "error"
        );

        return;
    }

    feedbackList[feedbackIndex].adminResponse =
        adminResponse;

    feedbackList[feedbackIndex].status = status;

    feedbackList[feedbackIndex].respondedBy =
        currentUser.fullname || currentUser.username;

    feedbackList[feedbackIndex].responseDate =
        new Date().toLocaleString();

    saveFeedback();
    closeFeedbackModal();
    updateSummary();
    filterFeedback();
}

// Close modal
function closeFeedbackModal() {
    document
        .getElementById("feedbackModal")
        .classList.remove("show");

    document.getElementById("adminResponse").value = "";
    selectedFeedbackId = null;
    clearModalMessage();
}

// Save feedback
function saveFeedback() {
    localStorage.setItem(
        "refmansyFeedback",
        JSON.stringify(feedbackList)
    );
}

// Modal messages
function showModalMessage(text, type) {
    const message =
        document.getElementById("modalMessageBox");

    message.textContent = text;
    message.className = "form-message " + type;
}

function clearModalMessage() {
    const message =
        document.getElementById("modalMessageBox");

    message.textContent = "";
    message.className = "form-message";
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

// Normalize feedback status
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
        feedback.dateSubmitted ||
        feedback.dateCreated ||
        feedback.createdAt ||
        0;

    const timestamp = new Date(dateValue).getTime();

    return Number.isNaN(timestamp) ? 0 : timestamp;
}

// Prevent HTML injection
function escapeHTML(value) {
    const element = document.createElement("div");
    element.textContent = String(value ?? "");

    return element.innerHTML;
}