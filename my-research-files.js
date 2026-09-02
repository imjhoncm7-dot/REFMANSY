// ========================================
// Refmansy Faculty Research Files
// ========================================

const currentUser = JSON.parse(
    localStorage.getItem("refmansyCurrentUser")
);

let allResearchFiles = [];
let facultyFiles = [];
let selectedFileId = null;

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
    loadResearchFiles();
    setupFilters();
    setupModal();
    setupLogout();
    openPreviouslySelectedFile();
}

// Display faculty name
function displayFacultyName() {
    document.getElementById(
        "headerFacultyName"
    ).textContent =
        currentUser.fullname || currentUser.username;
}

// Load only the current faculty member's files
function loadResearchFiles() {
    allResearchFiles =
        JSON.parse(
            localStorage.getItem("refmansyResearchFiles")
        ) || [];

    facultyFiles = allResearchFiles.filter(
        function (file) {
            return isFacultyFile(file);
        }
    );

    updateSummary();
    loadCategoryOptions();
    filterResearchFiles();
}

// Check file ownership
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
    const pending = facultyFiles.filter(function (file) {
        return normalizeStatus(file.status) === "pending";
    }).length;

    const approved = facultyFiles.filter(function (file) {
        return normalizeStatus(file.status) === "approved";
    }).length;

    const rejected = facultyFiles.filter(function (file) {
        return normalizeStatus(file.status) === "rejected";
    }).length;

    document.getElementById("totalFiles").textContent =
        facultyFiles.length;

    document.getElementById("pendingFiles").textContent =
        pending;

    document.getElementById("approvedFiles").textContent =
        approved;

    document.getElementById("rejectedFiles").textContent =
        rejected;
}

// Load category filter
function loadCategoryOptions() {
    const categoryFilter =
        document.getElementById("categoryFilter");

    const categories = [
        ...new Set(
            facultyFiles
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
    document
        .getElementById("searchInput")
        .addEventListener("input", filterResearchFiles);

    document
        .getElementById("categoryFilter")
        .addEventListener("change", filterResearchFiles);

    document
        .getElementById("statusFilter")
        .addEventListener("change", filterResearchFiles);
}

// Filter research files
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

    const filteredFiles = facultyFiles.filter(
        function (file) {
            const title = String(
                file.title ||
                file.researchTitle ||
                ""
            ).toLowerCase();

            const category = String(
                file.category || "uncategorized"
            ).toLowerCase();

            const status = normalizeStatus(file.status);

            const matchesSearch =
                title.includes(searchValue);

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

// Display files in table
function displayResearchFiles(files) {
    const tableBody =
        document.getElementById("researchFilesTable");

    document.getElementById("resultCount").textContent =
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

        row.innerHTML = `
            <td>${escapeHTML(file.id || "N/A")}</td>

            <td>
                ${escapeHTML(
                    file.title ||
                    file.researchTitle ||
                    "Untitled Research"
                )}
            </td>

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
                <span class="status-label status-${status}">
                    ${capitalizeFirstLetter(status)}
                </span>
            </td>

            <td>
                ${escapeHTML(
                    file.reviewComment ||
                    "No comment"
                )}
            </td>

            <td>
                <button
                    type="button"
                    class="view-button"
                    data-id="${escapeHTML(file.id || "")}"
                >
                    View
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });

    setupViewButtons();
}

// Set up View buttons
function setupViewButtons() {
    document
        .querySelectorAll(".view-button")
        .forEach(function (button) {
            button.addEventListener("click", function () {
                openFileModal(this.dataset.id);
            });
        });
}

// Open selected file from the dashboard
function openPreviouslySelectedFile() {
    const savedFileId =
        localStorage.getItem("refmansySelectedFile");

    if (!savedFileId) {
        return;
    }

    localStorage.removeItem("refmansySelectedFile");

    const fileBelongsToFaculty = facultyFiles.some(
        function (file) {
            return String(file.id) ===
                String(savedFileId);
        }
    );

    if (fileBelongsToFaculty) {
        openFileModal(savedFileId);
    }
}

// Open file details
function openFileModal(fileId) {
    const selectedFile = facultyFiles.find(
        function (file) {
            return String(file.id) === String(fileId);
        }
    );

    if (!selectedFile) {
        return;
    }

    selectedFileId = selectedFile.id;

    const status = normalizeStatus(selectedFile.status);

    document.getElementById("modalFileId").textContent =
        selectedFile.id || "N/A";

    document.getElementById("modalTitle").textContent =
        selectedFile.title ||
        selectedFile.researchTitle ||
        "Untitled Research";

    document.getElementById("modalCategory").textContent =
        selectedFile.category || "Uncategorized";

    document.getElementById("modalDate").textContent =
        selectedFile.dateUploaded ||
        selectedFile.dateAdded ||
        "N/A";

    document.getElementById("modalStatus").textContent =
        capitalizeFirstLetter(status);

    document.getElementById("modalDescription").textContent =
        selectedFile.description ||
        "No description available.";

    document.getElementById("modalComment").textContent =
        selectedFile.reviewComment ||
        "No admin comment available.";

    const editFileButton =
        document.getElementById("editFileButton");

    // Faculty can only edit pending submissions
    editFileButton.disabled = status !== "pending";

    editFileButton.title =
        status === "pending"
            ? "Edit this submission"
            : "Only pending files can be edited";

    document
        .getElementById("fileModal")
        .classList.add("show");
}

// Set up modal controls
function setupModal() {
    const fileModal =
        document.getElementById("fileModal");

    document
        .getElementById("closeModalButton")
        .addEventListener("click", closeFileModal);

    document
        .getElementById("editFileButton")
        .addEventListener("click", editSelectedFile);

    document
        .getElementById("viewFileButton")
        .addEventListener("click", viewSelectedFile);

    fileModal.addEventListener("click", function (event) {
        if (event.target === fileModal) {
            closeFileModal();
        }
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeFileModal();
        }
    });
}

// Edit selected pending file
function editSelectedFile() {
    const selectedFile = facultyFiles.find(
        function (file) {
            return String(file.id) ===
                String(selectedFileId);
        }
    );

    if (
        !selectedFile ||
        normalizeStatus(selectedFile.status) !== "pending"
    ) {
        return;
    }

    localStorage.setItem(
        "refmansyEditFileId",
        String(selectedFile.id)
    );

    window.location.href = "upload-research.html";
}

// View attached file
function viewSelectedFile() {
    const selectedFile = facultyFiles.find(
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

// Allow safe file locations
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
function closeFileModal() {
    document
        .getElementById("fileModal")
        .classList.remove("show");

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

            localStorage.removeItem(
                "refmansySelectedFile"
            );

            localStorage.removeItem(
                "refmansyEditFileId"
            );

            window.location.replace("login.html");
        });
}

// Normalize file status
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