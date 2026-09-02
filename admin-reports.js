// ========================================
// Refmansy Admin Reports
// ========================================

const currentUser = JSON.parse(
    localStorage.getItem("refmansyCurrentUser")
);

let researchFiles = [];
let filteredFiles = [];

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
    setupReportButtons();
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

    loadCategoryOptions();
    updateReportSummary();
    updateStatusChart();
    updateCategoryReport();
    filterReport();
    displayGeneratedDate();
}

// Update summary cards
function updateReportSummary() {
    const approved = researchFiles.filter(function (file) {
        return normalizeStatus(file.status) === "approved";
    }).length;

    const pending = researchFiles.filter(function (file) {
        return normalizeStatus(file.status) === "pending";
    }).length;

    const rejected = researchFiles.filter(function (file) {
        return normalizeStatus(file.status) === "rejected";
    }).length;

    document.getElementById("totalUploaded").textContent =
        researchFiles.length;

    document.getElementById("totalApproved").textContent =
        approved;

    document.getElementById("totalPending").textContent =
        pending;

    document.getElementById("totalRejected").textContent =
        rejected;
}

// Update file-status chart
function updateStatusChart() {
    const total = researchFiles.length;

    const approved = researchFiles.filter(function (file) {
        return normalizeStatus(file.status) === "approved";
    }).length;

    const pending = researchFiles.filter(function (file) {
        return normalizeStatus(file.status) === "pending";
    }).length;

    const rejected = researchFiles.filter(function (file) {
        return normalizeStatus(file.status) === "rejected";
    }).length;

    document.getElementById(
        "approvedChartValue"
    ).textContent = approved;

    document.getElementById(
        "pendingChartValue"
    ).textContent = pending;

    document.getElementById(
        "rejectedChartValue"
    ).textContent = rejected;

    const approvedPercentage =
        total > 0 ? (approved / total) * 100 : 0;

    const pendingPercentage =
        total > 0 ? (pending / total) * 100 : 0;

    const rejectedPercentage =
        total > 0 ? (rejected / total) * 100 : 0;

    document.getElementById(
        "approvedChartBar"
    ).style.width = approvedPercentage + "%";

    document.getElementById(
        "pendingChartBar"
    ).style.width = pendingPercentage + "%";

    document.getElementById(
        "rejectedChartBar"
    ).style.width = rejectedPercentage + "%";
}

// Display category report
function updateCategoryReport() {
    const categoryReport =
        document.getElementById("categoryReport");

    if (researchFiles.length === 0) {
        categoryReport.innerHTML = `
            <p class="empty-chart">
                No category information available.
            </p>
        `;

        return;
    }

    const categoryCounts = {};

    researchFiles.forEach(function (file) {
        const category =
            file.category || "Uncategorized";

        categoryCounts[category] =
            (categoryCounts[category] || 0) + 1;
    });

    const categoryEntries =
        Object.entries(categoryCounts).sort(
            function (firstCategory, secondCategory) {
                return secondCategory[1] -
                    firstCategory[1];
            }
        );

    const highestCount = Math.max(
        ...categoryEntries.map(function (entry) {
            return entry[1];
        })
    );

    categoryReport.innerHTML = "";

    categoryEntries.forEach(function (entry) {
        const categoryName = entry[0];
        const count = entry[1];
        const percentage =
            highestCount > 0
                ? (count / highestCount) * 100
                : 0;

        const categoryItem =
            document.createElement("div");

        categoryItem.className =
            "category-report-item";

        categoryItem.innerHTML = `
            <span>${escapeHTML(categoryName)}</span>

            <div class="category-track">
                <div
                    class="category-bar"
                    style="width: ${percentage}%"
                ></div>
            </div>

            <strong>${count}</strong>
        `;

        categoryReport.appendChild(categoryItem);
    });
}

// Load category options
function loadCategoryOptions() {
    const categoryFilter =
        document.getElementById("categoryFilter");

    const categories = [
        ...new Set(
            researchFiles.map(function (file) {
                return file.category || "Uncategorized";
            })
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

// Set up filters
function setupFilters() {
    document
        .getElementById("searchInput")
        .addEventListener("input", filterReport);

    document
        .getElementById("categoryFilter")
        .addEventListener("change", filterReport);

    document
        .getElementById("statusFilter")
        .addEventListener("change", filterReport);

    document
        .getElementById("startDate")
        .addEventListener("change", filterReport);

    document
        .getElementById("endDate")
        .addEventListener("change", filterReport);

    document
        .getElementById("clearFiltersButton")
        .addEventListener("click", clearFilters);
}

// Filter report data
function filterReport() {
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

    const startDateValue =
        document.getElementById("startDate").value;

    const endDateValue =
        document.getElementById("endDate").value;

    filteredFiles = researchFiles.filter(function (file) {
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
            file.category || "Uncategorized"
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

        const fileDate = getFileDate(file);

        const matchesStartDate =
            !startDateValue ||
            (
                fileDate &&
                fileDate >= createLocalDate(startDateValue)
            );

        const matchesEndDate =
            !endDateValue ||
            (
                fileDate &&
                fileDate <= createEndOfDay(endDateValue)
            );

        return (
            matchesSearch &&
            matchesCategory &&
            matchesStatus &&
            matchesStartDate &&
            matchesEndDate
        );
    });

    displayReportTable(filteredFiles);
}

// Display detailed report
function displayReportTable(files) {
    const reportTable =
        document.getElementById("reportTable");

    document.getElementById("resultCount").textContent =
        "Showing " +
        files.length +
        (files.length === 1
            ? " research file"
            : " research files");

    if (files.length === 0) {
        reportTable.innerHTML = `
            <tr>
                <td colspan="7" class="empty-message">
                    No research data available.
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

    reportTable.innerHTML = "";

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
                    file.researcher ||
                    file.author ||
                    file.uploadedBy ||
                    "Unknown"
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
                    file.reviewedBy || "Not reviewed"
                )}
            </td>
        `;

        reportTable.appendChild(row);
    });
}

// Clear report filters
function clearFilters() {
    document.getElementById("searchInput").value = "";
    document.getElementById("categoryFilter").value =
        "all";

    document.getElementById("statusFilter").value =
        "all";

    document.getElementById("startDate").value = "";
    document.getElementById("endDate").value = "";

    filterReport();
}

// Set up export and print buttons
function setupReportButtons() {
    document
        .getElementById("exportCsvButton")
        .addEventListener("click", exportReportToCSV);

    document
        .getElementById("printReportButton")
        .addEventListener("click", function () {
            window.print();
        });
}

// Export filtered report to CSV
function exportReportToCSV() {
    if (filteredFiles.length === 0) {
        alert("There is no report data to export.");
        return;
    }

    const rows = [
        [
            "Research ID",
            "Research Title",
            "Researcher",
            "Category",
            "Date Uploaded",
            "Status",
            "Reviewed By"
        ]
    ];

    filteredFiles.forEach(function (file) {
        rows.push([
            file.id || "N/A",

            file.title ||
                file.researchTitle ||
                "Untitled Research",

            file.researcher ||
                file.author ||
                file.uploadedBy ||
                "Unknown",

            file.category || "Uncategorized",

            file.dateUploaded ||
                file.dateAdded ||
                "N/A",

            capitalizeFirstLetter(
                normalizeStatus(file.status)
            ),

            file.reviewedBy || "Not reviewed"
        ]);
    });

    const csvContent = rows
        .map(function (row) {
            return row
                .map(formatCSVValue)
                .join(",");
        })
        .join("\n");

    const csvBlob = new Blob(
        ["\uFEFF" + csvContent],
        {
            type: "text/csv;charset=utf-8;"
        }
    );

    const downloadURL =
        URL.createObjectURL(csvBlob);

    const downloadLink =
        document.createElement("a");

    downloadLink.href = downloadURL;
    downloadLink.download =
        "refmansy-research-report.csv";

    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();

    URL.revokeObjectURL(downloadURL);
}

// Format CSV values safely
function formatCSVValue(value) {
    let safeValue = String(value ?? "");

    // Prevent spreadsheet formula injection
    if (/^[=+\-@]/.test(safeValue)) {
        safeValue = "'" + safeValue;
    }

    return (
        '"' +
        safeValue.replaceAll('"', '""') +
        '"'
    );
}

// Display generated date
function displayGeneratedDate() {
    document.getElementById("generatedDate").textContent =
        new Date().toLocaleString();
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

// Get file date
function getFileDate(file) {
    const dateValue =
        file.dateUploaded ||
        file.dateAdded ||
        file.createdAt;

    if (!dateValue) {
        return null;
    }

    const date = new Date(dateValue);

    return Number.isNaN(date.getTime()) ? null : date;
}

// Get timestamp for sorting
function getFileTime(file) {
    const date = getFileDate(file);
    return date ? date.getTime() : 0;
}

// Create a local start date
function createLocalDate(dateValue) {
    return new Date(dateValue + "T00:00:00");
}

// Create a local end-of-day date
function createEndOfDay(dateValue) {
    return new Date(dateValue + "T23:59:59");
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