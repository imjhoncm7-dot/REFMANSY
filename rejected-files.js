// ========================================
// Refmansy Rejected Files
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
    document.getElementById("headerAdminName").textContent =
        currentUser.fullname || currentUser.username;
}

// Load saved research files
function loadResearchFiles() {
    researchFiles =
        JSON.parse(
            localStorage.getItem("refmansyResearchFiles")
        ) || [];

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
    filterRejectedFiles();
}

// Get rejected files only
function getRejectedFiles() {
    return researchFiles.filter(function (file) {
        return normalizeStatus(file.status) === "rejected";
    });
}

// Add categories to filter
function loadCategoryOptions() {
    const categoryFilter =
        document.getElementById("categoryFilter");

    const rejectedFiles = getRejectedFiles();

    const categories = [
        ...new Set(
            rejectedFiles
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

// Search and filter events
function setupFilters() {
    document
        .getElementById("searchInput")
        .addEventListener("input", filterRejectedFiles);

    document
        .getElementById("categoryFilter")
        .addEventListener("change", filterRejectedFiles);
}

// Filter rejected files
function filterRejectedFiles() {
    const searchValue =
        document
            .getElementById("searchInput")
            .value
            .trim()
            .toLowerCase();

    const selectedCategory =
        document.getElementById("categoryFilter").value;

    const rejectedFiles = getRejectedFiles();

    const filteredFiles = rejectedFiles.filter(
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
        "totalRejectedFiles"
    ).textContent = rejectedFiles.length;

    displayRejectedFiles(filteredFiles);
}

// Display rejected files
function displayRejectedFiles(files) {
    const tableBody =
        document.getElementById("rejectedFilesTable");

    const resultCount =
        document.getElementById("resultCount");

    resultCount.textContent =
        "Showing " +
        files.length +
        (files.length === 1
            ? " rejected file"
            : " rejected files");

    if (files.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-message">
                    No rejected research files found.
                </td>
            </tr>
        `;

        return;
    }

    const sortedFiles = [...files].sort(
        function (firstFile, secondFile) {
            return getRejectedTime(secondFile) -
                getRejectedTime(firstFile);
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
                    file.reviewedDate ||
                    file.dateRejected ||
                    "N/A"
                )}
            </td>

            <td>
                <span class="status-label">
                    Rejected
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

// Set up table buttons
function setupViewButtons() {
    const viewButtons =
        document.querySelectorAll(".view-button");

    viewButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            openDetailsModal(this.dataset.id);
        });
    });
}

// Open details modal
function openDetailsModal(fileId) {
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

    document.getElementById(
        "modalRejectedDate"
    ).textContent =
        selectedFile.reviewedDate ||
        selectedFile.dateRejected ||
        "N/A";

    document.getElementById(
        "modalReviewedBy"
    ).textContent =
        selectedFile.reviewedBy || "Administrator";

    document.getElementById("modalDescription").textContent =
        selectedFile.description ||
        "No description available.";

    document.getElementById("modalComment").textContent =
        selectedFile.reviewComment ||
        "No rejection reason available.";

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

    document
        .getElementById("markPendingButton")
        .addEventListener("click", function () {
            updateFileStatus("pending");
        });

    document
        .getElementById("approveButton")
        .addEventListener("click", function () {
            updateFileStatus("approved");
        });

    document
        .getElementById("viewFileButton")
        .addEventListener("click", viewSelectedFile);

    detailsModal.addEventListener("click", function (event) {
        if (event.target === detailsModal) {
            closeDetailsModal();
        }
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeDetailsModal();
        }
    });
}

// Change rejected file status
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

    const confirmChange = confirm(
        "Change this file's status to " +
        newStatus +
        "?"
    );

    if (!confirmChange) {
        return;
    }

    researchFiles[fileIndex].status = newStatus;

    researchFiles[fileIndex].reviewedBy =
        currentUser.fullname || currentUser.username;

    researchFiles[fileIndex].reviewedDate =
        new Date().toLocaleString();

    saveResearchFiles();
    closeDetailsModal();
    loadCategoryOptions();
    filterRejectedFiles();
}

// View uploaded file
function viewSelectedFile() {
    const selectedFile = researchFiles.find(
        function (file) {
            return String(file.id) ===
                String(selectedFileId);
        }
    );

    if (!selectedFile) {
        return;
    }

    const fileLocation =
        selectedFile.fileURL ||
        selectedFile.fileUrl ||
        selectedFile.filePath;

    if (!fileLocation) {
        alert("No uploaded file is attached to this record.");
        return;
    }

    if (!isSafeFileLocation(fileLocation)) {
        alert("The saved file location is invalid.");
        return;
    }

    window.open(fileLocation, "_blank", "noopener,noreferrer");
}

// Allow safe file locations only
function isSafeFileLocation(fileLocation) {
    const value = String(fileLocation).trim().toLowerCase();

    return (
        value.startsWith("http://") ||
        value.startsWith("https://") ||
        value.startsWith("blob:") ||
        value.startsWith("data:application/pdf")
    );
}

// Close modal
function closeDetailsModal() {
    document
        .getElementById("detailsModal")
        .classList.remove("show");

    selectedFileId = null;
}

// Save updated research files
function saveResearchFiles() {
    localStorage.setItem(
        "refmansyResearchFiles",
        JSON.stringify(researchFiles)
    );
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
    return String(status || "pending").toLowerCase();
}

// Get rejection timestamp
function getRejectedTime(file) {
    const dateValue =
        file.reviewedDate ||
        file.dateRejected ||
        file.dateUploaded ||
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