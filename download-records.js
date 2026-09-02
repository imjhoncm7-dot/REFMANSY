// ========================================
// Refmansy Faculty Download Records
// ========================================

const currentUser = JSON.parse(
    localStorage.getItem("refmansyCurrentUser")
);

let approvedFiles = [];
let downloadHistory = [];

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
    loadApprovedFiles();
    loadDownloadHistory();
    setupFilters();
    setupClearHistory();
    setupLogout();
}

// Display Faculty name
function displayFacultyName() {
    document.getElementById(
        "headerFacultyName"
    ).textContent =
        currentUser.fullname || currentUser.username;
}

// Load approved research files
function loadApprovedFiles() {
    const allResearchFiles =
        JSON.parse(
            localStorage.getItem("refmansyResearchFiles")
        ) || [];

    approvedFiles = allResearchFiles.filter(
        function (file) {
            return normalizeStatus(file.status) === "approved";
        }
    );

    loadCategoryFilter();
    loadYearFilter();
    filterDownloadFiles();
}

// Load download history for the logged-in Faculty
function loadDownloadHistory() {
    const allDownloadHistory =
        JSON.parse(
            localStorage.getItem("refmansyDownloadHistory")
        ) || [];

    downloadHistory = allDownloadHistory.filter(
        function (record) {
            return isCurrentFacultyRecord(record);
        }
    );

    updateSummary();
    displayDownloadHistory();
}

// Check download-history ownership
function isCurrentFacultyRecord(record) {
    const sameId =
        String(record.userId || "") ===
        String(currentUser.id || "");

    const sameEmail =
        String(record.userEmail || "").toLowerCase() ===
        String(currentUser.email || "").toLowerCase();

    return sameId || sameEmail;
}

// Update summary cards
function updateSummary() {
    const downloadsToday = downloadHistory.filter(
        function (record) {
            return isToday(record.downloadedAt);
        }
    ).length;

    document.getElementById("availableFiles").textContent =
        approvedFiles.length;

    document.getElementById("totalDownloads").textContent =
        downloadHistory.length;

    document.getElementById("recentDownloads").textContent =
        downloadsToday;
}

// Load category filter
function loadCategoryFilter() {
    const categoryFilter =
        document.getElementById("categoryFilter");

    const categories = [
        ...new Set(
            approvedFiles
                .map(function (file) {
                    return file.category;
                })
                .filter(Boolean)
        )
    ].sort();

    categoryFilter.innerHTML =
        '<option value="all">All Categories</option>';

    categories.forEach(function (category) {
        const option = document.createElement("option");

        option.value = category.toLowerCase();
        option.textContent = category;

        categoryFilter.appendChild(option);
    });
}

// Load year filter
function loadYearFilter() {
    const yearFilter =
        document.getElementById("yearFilter");

    const years = [
        ...new Set(
            approvedFiles
                .map(function (file) {
                    return file.publicationYear;
                })
                .filter(Boolean)
        )
    ].sort(function (firstYear, secondYear) {
        return Number(secondYear) - Number(firstYear);
    });

    yearFilter.innerHTML =
        '<option value="all">All Years</option>';

    years.forEach(function (year) {
        const option = document.createElement("option");

        option.value = String(year);
        option.textContent = year;

        yearFilter.appendChild(option);
    });
}

// Set up filters
function setupFilters() {
    document
        .getElementById("searchInput")
        .addEventListener("input", filterDownloadFiles);

    document
        .getElementById("categoryFilter")
        .addEventListener("change", filterDownloadFiles);

    document
        .getElementById("yearFilter")
        .addEventListener("change", filterDownloadFiles);
}

// Filter downloadable files
function filterDownloadFiles() {
    const searchValue =
        document
            .getElementById("searchInput")
            .value
            .trim()
            .toLowerCase();

    const selectedCategory =
        document.getElementById("categoryFilter").value;

    const selectedYear =
        document.getElementById("yearFilter").value;

    const filteredFiles = approvedFiles.filter(
        function (file) {
            const title = String(
                file.title ||
                file.researchTitle ||
                ""
            ).toLowerCase();

            const researcher = String(
                file.researcher ||
                file.author ||
                ""
            ).toLowerCase();

            const category = String(
                file.category || "uncategorized"
            ).toLowerCase();

            const year = String(
                file.publicationYear || ""
            );

            const matchesSearch =
                title.includes(searchValue) ||
                researcher.includes(searchValue);

            const matchesCategory =
                selectedCategory === "all" ||
                category === selectedCategory;

            const matchesYear =
                selectedYear === "all" ||
                year === selectedYear;

            return (
                matchesSearch &&
                matchesCategory &&
                matchesYear
            );
        }
    );

    displayDownloadFiles(filteredFiles);
}

// Display downloadable files
function displayDownloadFiles(files) {
    const tableBody =
        document.getElementById("downloadFilesTable");

    document.getElementById("resultCount").textContent =
        "Showing " +
        files.length +
        (files.length === 1
            ? " downloadable file"
            : " downloadable files");

    if (files.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-message">
                    No approved documents are available.
                </td>
            </tr>
        `;

        return;
    }

    tableBody.innerHTML = "";

    files.forEach(function (file) {
        const row = document.createElement("tr");
        const hasDocument = Boolean(getFileLocation(file));

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
                    file.researcher ||
                    file.author ||
                    "Unknown Researcher"
                )}
            </td>

            <td>
                ${escapeHTML(
                    file.category || "Uncategorized"
                )}
            </td>

            <td>
                ${escapeHTML(
                    file.publicationYear || "N/A"
                )}
            </td>

            <td>
                ${escapeHTML(
                    file.fileName || "No attached PDF"
                )}
            </td>

            <td>
                ${escapeHTML(
                    formatFileSize(file.fileSize)
                )}
            </td>

            <td>
                <button
                    type="button"
                    class="download-button"
                    data-id="${escapeHTML(file.id || "")}"
                    ${hasDocument ? "" : "disabled"}
                >
                    <i class="fa-solid fa-download"></i>
                    Download
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });

    setupDownloadButtons();
}

// Set up Download buttons
function setupDownloadButtons() {
    document
        .querySelectorAll(".download-button")
        .forEach(function (button) {
            button.addEventListener("click", function () {
                downloadResearchFile(this.dataset.id);
            });
        });
}

// Download selected research file
function downloadResearchFile(fileId) {
    const selectedFile = approvedFiles.find(
        function (file) {
            return String(file.id) === String(fileId);
        }
    );

    if (!selectedFile) {
        return;
    }

    const fileLocation = getFileLocation(selectedFile);

    if (!fileLocation) {
        alert("No PDF document is attached.");
        return;
    }

    const downloadLink =
        document.createElement("a");

    downloadLink.href = fileLocation;

    downloadLink.download =
        selectedFile.fileName ||
        createDownloadName(selectedFile);

    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();

    saveDownloadRecord(selectedFile);
}

// Save download history
function saveDownloadRecord(file) {
    const allDownloadHistory =
        JSON.parse(
            localStorage.getItem("refmansyDownloadHistory")
        ) || [];

    const downloadRecord = {
        id: "DOWNLOAD-" + Date.now(),
        userId: currentUser.id,
        userEmail: currentUser.email,
        username: currentUser.username,

        fileId: file.id,

        title:
            file.title ||
            file.researchTitle ||
            "Untitled Research",

        researcher:
            file.researcher ||
            file.author ||
            "Unknown Researcher",

        fileName:
            file.fileName ||
            createDownloadName(file),

        downloadedAt: new Date().toISOString(),
        downloadedDate: new Date().toLocaleString()
    };

    allDownloadHistory.push(downloadRecord);

    localStorage.setItem(
        "refmansyDownloadHistory",
        JSON.stringify(allDownloadHistory)
    );

    loadDownloadHistory();
}

// Display Faculty download history
function displayDownloadHistory() {
    const historyTable =
        document.getElementById("downloadHistoryTable");

    const clearHistoryButton =
        document.getElementById("clearHistoryButton");

    clearHistoryButton.disabled =
        downloadHistory.length === 0;

    if (downloadHistory.length === 0) {
        historyTable.innerHTML = `
            <tr>
                <td colspan="4" class="empty-message">
                    You have no download history.
                </td>
            </tr>
        `;

        return;
    }

    const sortedHistory = [...downloadHistory].sort(
        function (firstRecord, secondRecord) {
            return (
                new Date(secondRecord.downloadedAt).getTime() -
                new Date(firstRecord.downloadedAt).getTime()
            );
        }
    );

    historyTable.innerHTML = "";

    sortedHistory.forEach(function (record) {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${escapeHTML(record.title)}</td>

            <td>${escapeHTML(record.researcher)}</td>

            <td>${escapeHTML(record.fileName)}</td>

            <td>
                ${escapeHTML(
                    record.downloadedDate ||
                    formatDate(record.downloadedAt)
                )}
            </td>
        `;

        historyTable.appendChild(row);
    });
}

// Clear only the logged-in Faculty's history
function setupClearHistory() {
    document
        .getElementById("clearHistoryButton")
        .addEventListener("click", function () {
            const confirmClear = confirm(
                "Clear your download history?"
            );

            if (!confirmClear) {
                return;
            }

            const allDownloadHistory =
                JSON.parse(
                    localStorage.getItem(
                        "refmansyDownloadHistory"
                    )
                ) || [];

            const remainingRecords =
                allDownloadHistory.filter(
                    function (record) {
                        return !isCurrentFacultyRecord(record);
                    }
                );

            localStorage.setItem(
                "refmansyDownloadHistory",
                JSON.stringify(remainingRecords)
            );

            loadDownloadHistory();
        });
}

// Get safe PDF location
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

// Create fallback filename
function createDownloadName(file) {
    const title =
        file.title ||
        file.researchTitle ||
        "research-document";

    const safeTitle = title
        .replace(/[<>:"/\\|?*]/g, "")
        .trim()
        .replace(/\s+/g, "-");

    return (safeTitle || "research-document") + ".pdf";
}

// Format file size
function formatFileSize(bytes) {
    const size = Number(bytes);

    if (!size || size <= 0) {
        return "N/A";
    }

    if (size < 1024) {
        return size + " bytes";
    }

    if (size < 1024 * 1024) {
        return (size / 1024).toFixed(1) + " KB";
    }

    return (
        size / (1024 * 1024)
    ).toFixed(1) + " MB";
}

// Check if download was made today
function isToday(dateValue) {
    if (!dateValue) {
        return false;
    }

    const date = new Date(dateValue);
    const today = new Date();

    return (
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate()
    );
}

function formatDate(dateValue) {
    const date = new Date(dateValue);

    return Number.isNaN(date.getTime())
        ? "N/A"
        : date.toLocaleString();
}

function normalizeStatus(status) {
    return String(status || "pending").toLowerCase();
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