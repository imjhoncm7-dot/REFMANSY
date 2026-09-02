// ========================================
// Refmansy Faculty Dashboard
// ========================================

const currentUser = JSON.parse(
    localStorage.getItem("refmansyCurrentUser")
);

let facultyFiles = [];

// Protect Faculty Dashboard
if (!currentUser) {
    window.location.replace("login.html");
} else if (
    currentUser.role !== "faculty" &&
    currentUser.role !== "user"
) {
    window.location.replace("admin-dashboard.html");
} else {
    initializeDashboard();
}

function initializeDashboard() {
    displayFacultyName();
    loadFacultyFiles();
    setupLogout();
}

// Display faculty name
function displayFacultyName() {
    const headerFacultyName =
        document.getElementById("headerFacultyName");

    headerFacultyName.textContent =
        currentUser.fullname || currentUser.username;
}

// Load only the logged-in faculty member's files
function loadFacultyFiles() {
    const allResearchFiles =
        JSON.parse(
            localStorage.getItem("refmansyResearchFiles")
        ) || [];

    facultyFiles = allResearchFiles.filter(
        function (file) {
            return isFacultyFile(file);
        }
    );

    updateStatusCards();
    displayRecentFiles();
    displayStatusUpdates();
}

// Check if the file belongs to the current faculty member
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

    const fileOwnerId = String(
        file.ownerId ||
        file.userId ||
        file.uploadedById ||
        ""
    );

    const fileEmail = String(
        file.ownerEmail ||
        file.uploadedByEmail ||
        ""
    ).toLowerCase();

    const fileUsername = String(
        file.username ||
        file.uploadedBy ||
        ""
    ).toLowerCase();

    const fileResearcher = String(
        file.researcher ||
        file.author ||
        ""
    ).toLowerCase();

    return (
        (currentId && fileOwnerId === currentId) ||
        (currentEmail && fileEmail === currentEmail) ||
        (
            currentUsername &&
            fileUsername === currentUsername
        ) ||
        (
            currentFullname &&
            fileResearcher === currentFullname
        )
    );
}

// Update dashboard numbers
function updateStatusCards() {
    const pendingFiles = facultyFiles.filter(
        function (file) {
            return normalizeStatus(file.status) === "pending";
        }
    );

    const approvedFiles = facultyFiles.filter(
        function (file) {
            return normalizeStatus(file.status) === "approved";
        }
    );

    const rejectedFiles = facultyFiles.filter(
        function (file) {
            return normalizeStatus(file.status) === "rejected";
        }
    );

    document.getElementById("totalMyFiles").textContent =
        facultyFiles.length;

    document.getElementById("totalPending").textContent =
        pendingFiles.length;

    document.getElementById("totalApproved").textContent =
        approvedFiles.length;

    document.getElementById("totalRejected").textContent =
        rejectedFiles.length;
}

// Display five recent faculty files
function displayRecentFiles() {
    const facultyFilesTable =
        document.getElementById("facultyFilesTable");

    if (facultyFiles.length === 0) {
        facultyFilesTable.innerHTML = `
            <tr>
                <td colspan="6" class="empty-table">
                    You have not uploaded any research files.
                </td>
            </tr>
        `;

        return;
    }

    const recentFiles = [...facultyFiles]
        .sort(function (firstFile, secondFile) {
            return getFileTime(secondFile) -
                getFileTime(firstFile);
        })
        .slice(0, 5);

    facultyFilesTable.innerHTML = "";

    recentFiles.forEach(function (file) {
        const row = document.createElement("tr");
        const status = normalizeStatus(file.status);

        row.innerHTML = `
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

        facultyFilesTable.appendChild(row);
    });

    setupViewButtons();
}

// Display recent status updates
function displayStatusUpdates() {
    const statusUpdates =
        document.getElementById("statusUpdates");

    const reviewedFiles = facultyFiles
        .filter(function (file) {
            return (
                file.reviewedDate ||
                normalizeStatus(file.status) !== "pending"
            );
        })
        .sort(function (firstFile, secondFile) {
            return getReviewTime(secondFile) -
                getReviewTime(firstFile);
        })
        .slice(0, 4);

    if (reviewedFiles.length === 0) {
        statusUpdates.innerHTML = `
            <p class="empty-message">
                No submission updates available.
            </p>
        `;

        return;
    }

    statusUpdates.innerHTML = "";

    reviewedFiles.forEach(function (file) {
        const status = normalizeStatus(file.status);
        const updateItem = document.createElement("div");

        updateItem.className =
            "update-item update-" + status;

        updateItem.innerHTML = `
            <span class="update-icon">
                <i class="${getStatusIcon(status)}"></i>
            </span>

            <div>
                <h4>
                    ${escapeHTML(
                        file.title ||
                        file.researchTitle ||
                        "Untitled Research"
                    )}
                </h4>

                <p>
                    Status changed to
                    ${capitalizeFirstLetter(status)}
                    ${file.reviewedDate
                        ? " • " +
                          escapeHTML(file.reviewedDate)
                        : ""}
                </p>
            </div>
        `;

        statusUpdates.appendChild(updateItem);
    });
}

// Set up file View buttons
function setupViewButtons() {
    document
        .querySelectorAll(".view-button")
        .forEach(function (button) {
            button.addEventListener("click", function () {
                const fileId = this.dataset.id;

                if (fileId) {
                    localStorage.setItem(
                        "refmansySelectedFile",
                        fileId
                    );
                }

                window.location.href =
                    "my-research-files.html";
            });
        });
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

// Select the correct status icon
function getStatusIcon(status) {
    if (status === "approved") {
        return "fa-solid fa-check";
    }

    if (status === "rejected") {
        return "fa-solid fa-xmark";
    }

    return "fa-regular fa-clock";
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

// Get review timestamp
function getReviewTime(file) {
    const dateValue =
        file.reviewedDate ||
        file.dateUploaded ||
        file.dateAdded ||
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