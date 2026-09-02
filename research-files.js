// ========================================
// Refmansy Research Files
// ========================================

const currentUser = JSON.parse(
    localStorage.getItem("refmansyCurrentUser")
);

let researchFiles = [];
let selectedFileId = null;

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
    loadResearchFiles();
    setupFilters();
    setupModal();
    setupLogout();
}

// Display administrator name
function displayAdminName() {
    const headerAdminName =
        document.getElementById("headerAdminName");

    headerAdminName.textContent =
        currentUser.fullname || currentUser.username;
}

// Load saved research files
function loadResearchFiles() {
    researchFiles =
        JSON.parse(
            localStorage.getItem("refmansyResearchFiles")
        ) || [];

    updateSummary();
    loadCategoryOptions();
    filterResearchFiles();
}

// Update summary cards
function updateSummary() {
    const pending = researchFiles.filter(function (file) {
        return normalizeStatus(file.status) === "pending";
    }).length;

    const approved = researchFiles.filter(function (file) {
        return normalizeStatus(file.status) === "approved";
    }).length;

    const rejected = researchFiles.filter(function (file) {
        return normalizeStatus(file.status) === "rejected";
    }).length;

    document.getElementById("totalFiles").textContent =
        researchFiles.length;

    document.getElementById("pendingFiles").textContent =
        pending;

    document.getElementById("approvedFiles").textContent =
        approved;

    document.getElementById("rejectedFiles").textContent =
        rejected;
}

// Add saved categories to the category filter
function loadCategoryOptions() {
    const categoryFilter =
        document.getElementById("categoryFilter");

    const categories = [
        ...new Set(
            researchFiles
                .map(function (file) {
                    return file.category;
                })
                .filter(Boolean)
        )
    ];

    categoryFilter.innerHTML =
        '<option value="all">All Categories</option>';

    categories.forEach(function (category) {
        const option = document.createElement("option");

        option.value = category.toLowerCase();
        option.textContent = category;

        categoryFilter.appendChild(option);
    });
}

// Set up search and filters
function setupFilters() {
    const searchInput =
        document.getElementById("searchInput");

    const categoryFilter =
        document.getElementById("categoryFilter");

    const statusFilter =
        document.getElementById("statusFilter");

    searchInput.addEventListener(
        "input",
        filterResearchFiles
    );

    categoryFilter.addEventListener(
        "change",
        filterResearchFiles
    );

    statusFilter.addEventListener(
        "change",
        filterResearchFiles
    );
}

// Filter the research files
function filterResearchFiles() {
    const searchValue =
        document
            .getElementById("searchInput")
            .value
            .trim()
            .toLowerCase();

    const selectedCategory =
        document.getElementById("categoryFilter").value;

    const selectedStatus =
        document.getElementById("statusFilter").value;

    const filteredFiles = researchFiles.filter(
        function (file) {
            const title = String(
                file.title ||
                file.researchTitle ||
                ""
            ).toLowerCase();

            const researcher = String(
                file.researcher ||
                file.author ||
                file.uploadedBy ||
                ""
            ).toLowerCase();

            const category = String(
                file.category || "uncategorized"
            ).toLowerCase();

            const status = normalizeStatus(file.status);

            const matchesSearch =
                title.includes(searchValue) ||
                researcher.includes(searchValue);

            const matchesCategory =
                selectedCategory === "all" ||
                category === selectedCategory;

            const matchesStatus =
                selectedStatus === "all" ||
                status === selectedStatus;

            return (
                matchesSearch &&
                matchesCategory &&
                matchesStatus
            );
        }
    );

    displayResearchFiles(filteredFiles);
}

// Display research files in the table
function displayResearchFiles(files) {
    const tableBody =
        document.getElementById("researchFilesTable");

    const resultCount =
        document.getElementById("resultCount");

    resultCount.textContent =
        "Showing " +
        files.length +
        (files.length === 1
            ? " research file"
            : " research files");

    if (files.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-message">
                    No matching research files found.
                </td>
            </tr>
        `;

        return;
    }

    const sortedFiles = [...files].sort(
        function (firstFile, secondFile) {
            return getFileTime(secondFile) -
                getFileTime(firstFile);
        }
    );

    tableBody.innerHTML = "";

    sortedFiles.forEach(function (file) {
        const row = document.createElement("tr");
        const status = normalizeStatus(file.status);

        const title =
            file.title ||
            file.researchTitle ||
            "Untitled Research";

        const researcher =
            file.researcher ||
            file.author ||
            file.uploadedBy ||
            "Unknown";

        row.innerHTML = `
            <td>${escapeHTML(file.id || "N/A")}</td>

            <td>${escapeHTML(title)}</td>

            <td>${escapeHTML(researcher)}</td>

            <td>${escapeHTML(
                file.category || "Uncategorized"
            )}</td>

            <td>${escapeHTML(
                file.dateUploaded ||
                file.dateAdded ||
                "N/A"
            )}</td>

            <td>
                <span class="status-label status-${status}">
                    ${capitalizeFirstLetter(status)}
                </span>
            </td>

            <td>
                <button
                    type="button"
                    class="view-button"
                    data-id="${escapeHTML(file.id)}"
                >
                    View
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });

    setupViewButtons();
}

// Set up table View buttons
function setupViewButtons() {
    const viewButtons =
        document.querySelectorAll(".view-button");

    viewButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            openReviewModal(this.dataset.id);
        });
    });
}

// Open the review modal
function openReviewModal(fileId) {
    const selectedFile = researchFiles.find(
        function (file) {
            return String(file.id) === String(fileId);
        }
    );

    if (!selectedFile) {
        return;
    }

    selectedFileId = selectedFile.id;

    document.getElementById("modalFileId").textContent =
        selectedFile.id || "N/A";

    document.getElementById("modalTitle").textContent =
        selectedFile.title ||
        selectedFile.researchTitle ||
        "Untitled Research";

    document.getElementById("modalResearcher").textContent =
        selectedFile.researcher ||
        selectedFile.author ||
        selectedFile.uploadedBy ||
        "Unknown";

    document.getElementById("modalCategory").textContent =
        selectedFile.category || "Uncategorized";

    document.getElementById("modalDate").textContent =
        selectedFile.dateUploaded ||
        selectedFile.dateAdded ||
        "N/A";

    document.getElementById("modalStatus").textContent =
        capitalizeFirstLetter(
            normalizeStatus(selectedFile.status)
        );

    document.getElementById("modalDescription").textContent =
        selectedFile.description ||
        "No description available.";

    document
        .getElementById("reviewModal")
        .classList.add("show");
}

// Set up modal controls
function setupModal() {
    const reviewModal =
        document.getElementById("reviewModal");

    const closeModalButton =
        document.getElementById("closeModalButton");

    closeModalButton.addEventListener(
        "click",
        closeReviewModal
    );

    reviewModal.addEventListener("click", function (event) {
        if (event.target === reviewModal) {
            closeReviewModal();
        }
    });

    document
        .getElementById("approveButton")
        .addEventListener("click", function () {
            updateFileStatus("approved");
        });

    document
        .getElementById("pendingButton")
        .addEventListener("click", function () {
            updateFileStatus("pending");
        });

    document
        .getElementById("rejectButton")
        .addEventListener("click", function () {
            updateFileStatus("rejected");
        });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeReviewModal();
        }
    });
}

// Close review modal
function closeReviewModal() {
    document
        .getElementById("reviewModal")
        .classList.remove("show");

    selectedFileId = null;
}

// Approve, reject, or mark a file as pending
function updateFileStatus(newStatus) {
    if (selectedFileId === null) {
        return;
    }

    const fileIndex = researchFiles.findIndex(
        function (file) {
            return String(file.id) ===
                String(selectedFileId);
        }
    );

    if (fileIndex === -1) {
        return;
    }

    researchFiles[fileIndex].status = newStatus;
    researchFiles[fileIndex].reviewedBy =
        currentUser.fullname || currentUser.username;

    researchFiles[fileIndex].reviewedDate =
        new Date().toLocaleString();

    localStorage.setItem(
        "refmansyResearchFiles",
        JSON.stringify(researchFiles)
    );

    closeReviewModal();
    updateSummary();
    filterResearchFiles();
}

// Logout
function setupLogout() {
    const logoutButton =
        document.getElementById("logoutButton");

    logoutButton.addEventListener("click", function () {
        const confirmLogout = confirm(
            "Are you sure you want to log out?"
        );

        if (!confirmLogout) {
            return;
        }

        localStorage.removeItem("refmansyCurrentUser");
        window.location.replace("login.html");
    });
}

// Consistent file status
function normalizeStatus(status) {
    const validStatuses = [
        "pending",
        "approved",
        "rejected"
    ];

    const normalizedStatus =
        String(status || "pending").toLowerCase();

    return validStatuses.includes(normalizedStatus)
        ? normalizedStatus
        : "pending";
}

// Sort files by date
function getFileTime(file) {
    const dateValue =
        file.dateUploaded ||
        file.dateAdded ||
        file.createdAt ||
        0;

    const timestamp = new Date(dateValue).getTime();

    return Number.isNaN(timestamp) ? 0 : timestamp;
}

function capitalizeFirstLetter(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

// Prevent HTML injection
function escapeHTML(value) {
    const element = document.createElement("div");
    element.textContent = String(value ?? "");

    return element.innerHTML;
}