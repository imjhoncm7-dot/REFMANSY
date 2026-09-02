const currentUser = JSON.parse(
    localStorage.getItem("refmansyCurrentUser")
);

// Protect the Admin Dashboard
if (!currentUser) {
    window.location.replace("login.html");
} else if (currentUser.role !== "admin") {
    window.location.replace("user-dashboard.html");
} else {
    loadAdminDashboard();
}

function loadAdminDashboard() {
    const adminName = document.getElementById("adminName");
    const welcomeName = document.getElementById("welcomeName");

    adminName.textContent = currentUser.fullname;
    welcomeName.textContent = currentUser.fullname;

    loadDashboardTotals();
    loadRecentRecords();
}

// Display dashboard totals
function loadDashboardTotals() {
    const accounts =
        JSON.parse(localStorage.getItem("refmansyAccounts")) || [];

    const records =
        JSON.parse(localStorage.getItem("refmansyRecords")) || [];

    const reports =
        JSON.parse(localStorage.getItem("refmansyReports")) || [];

    document.getElementById("totalUsers").textContent =
        accounts.filter(function (account) {
            return account.role === "user";
        }).length;

    document.getElementById("totalRecords").textContent =
        records.length;

    document.getElementById("totalReports").textContent =
        reports.length;
}

// Display recent records
function loadRecentRecords() {
    const recentRecordsTable =
        document.getElementById("recentRecordsTable");

    const records =
        JSON.parse(localStorage.getItem("refmansyRecords")) || [];

    if (records.length === 0) {
        recentRecordsTable.innerHTML = `
            <tr>
                <td colspan="4" class="empty-table">
                    No records available.
                </td>
            </tr>
        `;

        return;
    }

    const recentRecords = records.slice(-5).reverse();

    recentRecordsTable.innerHTML = "";

    recentRecords.forEach(function (record) {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${escapeHTML(record.id || "N/A")}</td>
            <td>${escapeHTML(record.name || "Unnamed Record")}</td>
            <td>${escapeHTML(record.dateAdded || "N/A")}</td>
            <td>${escapeHTML(record.status || "Active")}</td>
        `;

        recentRecordsTable.appendChild(row);
    });
}

// Search the recent records table
const dashboardSearch =
    document.getElementById("dashboardSearch");

dashboardSearch.addEventListener("input", function () {
    const searchValue = this.value.toLowerCase();
    const tableRows = document.querySelectorAll(
        "#recentRecordsTable tr"
    );

    tableRows.forEach(function (row) {
        const rowText = row.textContent.toLowerCase();

        row.style.display = rowText.includes(searchValue)
            ? ""
            : "none";
    });
});

// Logout
const logoutButton = document.getElementById("logoutButton");

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

// Prevent HTML code from being inserted into the table
function escapeHTML(value) {
    const element = document.createElement("div");
    element.textContent = String(value);

    return element.innerHTML;
}