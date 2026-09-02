// ========================================
// Refmansy Pending Files
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

// Load research files
function loadResearchFiles() {
    researchFiles =
        JSON.parse(
            localStorage.getItem("refmansyResearchFiles")
        ) || [];

    // Give older files an ID if they do not have one
    let filesUpdated = false;

    researchFiles.forEach(function (file, index) {
        if (!file.id) {
            file.id = "RF-" + Date.now() + "-" + index;
            filesUpdated = true;
        }
    });

    if (filesUpdated) {
        saveResearchFiles();
    }

    loadCategoryOptions();
    filterPendingFiles();
}

// Get only pending files
function getPendingFiles() {
    return researchFiles.filter(function (file) {
        return normalizeStatus(file.status) === "pending";
    });
}

// Load category filter
function loadCategoryOptions() {
    const categoryFilter =
        document.getElementById("categoryFilter");

    const pendingFiles = getPendingFiles();

    const categories = [
        ...new Set(
            pendingFiles
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

// Search and category filters
function setupFilters() {
    document
        .getElementById("searchInput")
        .addEventListener("input", filterPendingFiles);

    document
        .getElementById("categoryFilter")
        .addEventListener("change", filterPendingFiles);
}

// Filter pending files
function filterPendingFiles() {
    const searchValue =
        document
            .getElementById("searchInput")
            .value
            .trim()
            .toLowerCase();

    const selectedCategory =
        document.getElementById("categoryFilter").value;

    const pendingFiles = getPendingFiles();

    const filteredFiles = pendingFiles.filter(
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

            const matchesSearch =
                title.includes(searchValue) ||
                researcher.includes(searchValue);

            const matchesCategory =
                selectedCategory === "all" ||
                category === selectedCategory;

            return matchesSearch && matchesCategory;
        }
    );

    document.getElementById(
        "totalPendingFiles"
    ).textContent = pendingFiles.length;

    displayPendingFiles(filteredFiles);
}

// Display pending files
function displayPendingFiles(files) {
    const tableBody =
        document.getElementById("pendingFilesTable");

    const resultCount =
        document.getElementById("resultCount");

    resultCount.textContent =
        "Showing " +
        files.length +
        (files.length === 1
            ? " pending file"
            : " pending files");

    if (files.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-message">
                    No pending research files found.
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
            <td>${escapeHTML(file.id)}</td>

            <td>${escapeHTML(title)}</td>

            <td>${escapeHTML(researcher)}</td>

            <td>
                ${escapeHTML(
                    file.category || "Uncategorized"
                )}
            </td>

            <td>
                ${escapeHTML(
                    file.dateUploaded ||
                    file.dateAdded ||
                    "N/A"
                )}
            </td>

            <td>
                <span class="status-label">
                    Pending
                </span>
            </td>

            <td>
                <button
                    type="button"
                    class="review-button"
                    data-id="${escapeHTML(file.id)}"
                >
                    Review
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });

    setupReviewButtons();
}

// Set up Review buttons
function setupReviewButtons() {
    const reviewButtons =
        document.querySelectorAll(".review-button");

    reviewButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            openReviewModal(this.dataset.id);
        });
    });
}

// Open review modal
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
        selectedFile.id;

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

    document.getElementById("modalDescription").textContent =
        selectedFile.description ||
        "No description available.";

    document.getElementById("reviewComment").value =
        selectedFile.reviewComment || "";

    document
        .getElementById("reviewModal")
        .classList.add("show");
}

// Set up modal controls
function setupModal() {
    const reviewModal =
        document.getElementById("reviewModal");

    document
        .getElementById("closeModalButton")
        .addEventListener("click", closeReviewModal);

    document
        .getElementById("approveButton")
        .addEventListener("click", function () {
            updateFileStatus("approved");
        });

    document
        .getElementById("rejectButton")
        .addEventListener("click", function () {
            updateFileStatus("rejected");
        });

    reviewModal.addEventListener("click", function (event) {
        if (event.target === reviewModal) {
            closeReviewModal();
        }
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeReviewModal();
        }
    });
}

// Update research status
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

    const reviewComment =
        document
            .getElementById("reviewComment")
            .value
            .trim();

    researchFiles[fileIndex].status = newStatus;

    researchFiles[fileIndex].reviewComment =
        reviewComment;

    researchFiles[fileIndex].reviewedBy =
        currentUser.fullname || currentUser.username;

    researchFiles[fileIndex].reviewedDate =
        new Date().toLocaleString();

    saveResearchFiles();
    closeReviewModal();
    loadCategoryOptions();
    filterPendingFiles();
}

// Save files
function saveResearchFiles() {
    localStorage.setItem(
        "refmansyResearchFiles",
        JSON.stringify(researchFiles)
    );
}

// Close modal
function closeReviewModal() {
    document
        .getElementById("reviewModal")
        .classList.remove("show");

    document.getElementById("reviewComment").value = "";
    selectedFileId = null;
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

// Get timestamp for sorting
function getFileTime(file) {
    const dateValue =
        file.dateUploaded ||
        file.dateAdded ||
        file.createdAt ||
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