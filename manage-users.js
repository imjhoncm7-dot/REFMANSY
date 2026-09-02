// ========================================
// Refmansy Manage Users
// ========================================

const currentUser = JSON.parse(
    localStorage.getItem("refmansyCurrentUser")
);

let accounts = [];

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
    loadAccounts();
    setupFilters();
    setupUserModal();
    setupUserForm();
    setupLogout();
}

// Display administrator name
function displayAdminName() {
    document.getElementById("headerAdminName").textContent =
        currentUser.fullname || currentUser.username;
}

// Load saved accounts
function loadAccounts() {
    accounts =
        JSON.parse(
            localStorage.getItem("refmansyAccounts")
        ) || [];

    let accountsUpdated = false;

    accounts.forEach(function (account, index) {
        if (!account.id) {
            account.id = "USER-" + Date.now() + "-" + index;
            accountsUpdated = true;
        }

        if (!account.status) {
            account.status = "active";
            accountsUpdated = true;
        }
    });

    if (accountsUpdated) {
        saveAccounts();
    }

    updateSummary();
    filterAccounts();
}

// Update summary cards
function updateSummary() {
    const admins = accounts.filter(function (account) {
        return normalizeRole(account.role) === "admin";
    });

    const users = accounts.filter(function (account) {
        return normalizeRole(account.role) === "user";
    });

    const activeAccounts = accounts.filter(
        function (account) {
            return normalizeStatus(account.status) === "active";
        }
    );

    document.getElementById("totalUsers").textContent =
        accounts.length;

    document.getElementById("totalAdmins").textContent =
        admins.length;

    document.getElementById("totalRegularUsers").textContent =
        users.length;

    document.getElementById("activeUsers").textContent =
        activeAccounts.length;
}

// Set up search and filters
function setupFilters() {
    document
        .getElementById("searchInput")
        .addEventListener("input", filterAccounts);

    document
        .getElementById("roleFilter")
        .addEventListener("change", filterAccounts);

    document
        .getElementById("statusFilter")
        .addEventListener("change", filterAccounts);
}

// Filter user accounts
function filterAccounts() {
    const searchValue =
        document
            .getElementById("searchInput")
            .value
            .trim()
            .toLowerCase();

    const selectedRole =
        document.getElementById("roleFilter").value;

    const selectedStatus =
        document.getElementById("statusFilter").value;

    const filteredAccounts = accounts.filter(
        function (account) {
            const fullname = String(
                account.fullname || ""
            ).toLowerCase();

            const username = String(
                account.username || ""
            ).toLowerCase();

            const email = String(
                account.email || ""
            ).toLowerCase();

            const role = normalizeRole(account.role);
            const status = normalizeStatus(account.status);

            const matchesSearch =
                fullname.includes(searchValue) ||
                username.includes(searchValue) ||
                email.includes(searchValue);

            const matchesRole =
                selectedRole === "all" ||
                role === selectedRole;

            const matchesStatus =
                selectedStatus === "all" ||
                status === selectedStatus;

            return (
                matchesSearch &&
                matchesRole &&
                matchesStatus
            );
        }
    );

    displayAccounts(filteredAccounts);
}

// Display accounts in table
function displayAccounts(accountList) {
    const usersTable =
        document.getElementById("usersTable");

    document.getElementById("resultCount").textContent =
        "Showing " +
        accountList.length +
        (accountList.length === 1
            ? " user"
            : " users");

    if (accountList.length === 0) {
        usersTable.innerHTML = `
            <tr>
                <td colspan="7" class="empty-message">
                    No user accounts found.
                </td>
            </tr>
        `;

        return;
    }

    usersTable.innerHTML = "";

    accountList.forEach(function (account) {
        const row = document.createElement("tr");
        const role = normalizeRole(account.role);
        const status = normalizeStatus(account.status);

        row.innerHTML = `
            <td>
                <div class="user-information">

                    <span class="user-avatar">
                        <i class="fa-solid fa-user"></i>
                    </span>

                    <span>
                        ${escapeHTML(
                            account.fullname || "Unnamed User"
                        )}
                    </span>

                </div>
            </td>

            <td>${escapeHTML(account.username)}</td>

            <td>${escapeHTML(account.email)}</td>

            <td>
                <span class="role-label role-${role}">
                    ${capitalizeFirstLetter(role)}
                </span>
            </td>

            <td>
                ${escapeHTML(account.dateCreated || "N/A")}
            </td>

            <td>
                <span class="status-label status-${status}">
                    ${capitalizeFirstLetter(status)}
                </span>
            </td>

            <td>
                <div class="action-buttons">

                    <button
                        type="button"
                        class="edit-button"
                        data-id="${escapeHTML(account.id)}"
                        title="Edit user"
                    >
                        <i class="fa-solid fa-pen"></i>
                    </button>

                    <button
                        type="button"
                        class="status-button"
                        data-id="${escapeHTML(account.id)}"
                        title="Change account status"
                    >
                        <i class="fa-solid fa-power-off"></i>
                    </button>

                    <button
                        type="button"
                        class="delete-button"
                        data-id="${escapeHTML(account.id)}"
                        title="Delete user"
                    >
                        <i class="fa-solid fa-trash"></i>
                    </button>

                </div>
            </td>
        `;

        usersTable.appendChild(row);
    });

    setupTableButtons();
}

// Set up table buttons
function setupTableButtons() {
    document
        .querySelectorAll(".edit-button")
        .forEach(function (button) {
            button.addEventListener("click", function () {
                openEditUserModal(this.dataset.id);
            });
        });

    document
        .querySelectorAll(".status-button")
        .forEach(function (button) {
            button.addEventListener("click", function () {
                toggleAccountStatus(this.dataset.id);
            });
        });

    document
        .querySelectorAll(".delete-button")
        .forEach(function (button) {
            button.addEventListener("click", function () {
                deleteAccount(this.dataset.id);
            });
        });
}

// Set up modal controls
function setupUserModal() {
    const userModal =
        document.getElementById("userModal");

    document
        .getElementById("addUserButton")
        .addEventListener("click", openAddUserModal);

    document
        .getElementById("closeModalButton")
        .addEventListener("click", closeUserModal);

    document
        .getElementById("cancelButton")
        .addEventListener("click", closeUserModal);

    userModal.addEventListener("click", function (event) {
        if (event.target === userModal) {
            closeUserModal();
        }
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeUserModal();
        }
    });
}

// Open Add User modal
function openAddUserModal() {
    document.getElementById("modalTitle").textContent =
        "Add User";

    document.getElementById("userForm").reset();
    document.getElementById("userId").value = "";
    document.getElementById("role").value = "user";
    document.getElementById("accountStatus").value =
        "active";

    document.getElementById("password").required = true;
    document.getElementById(
        "confirmPassword"
    ).required = true;

    clearFormMessage();

    document
        .getElementById("userModal")
        .classList.add("show");
}

// Open Edit User modal
function openEditUserModal(accountId) {
    const account = accounts.find(function (item) {
        return String(item.id) === String(accountId);
    });

    if (!account) {
        return;
    }

    document.getElementById("modalTitle").textContent =
        "Edit User";

    document.getElementById("userId").value =
        account.id;

    document.getElementById("fullname").value =
        account.fullname || "";

    document.getElementById("username").value =
        account.username || "";

    document.getElementById("email").value =
        account.email || "";

    document.getElementById("role").value =
        normalizeRole(account.role);

    document.getElementById("accountStatus").value =
        normalizeStatus(account.status);

    document.getElementById("password").value = "";
    document.getElementById("confirmPassword").value = "";

    document.getElementById("password").required = false;
    document.getElementById(
        "confirmPassword"
    ).required = false;

    clearFormMessage();

    document
        .getElementById("userModal")
        .classList.add("show");
}

// Close modal
function closeUserModal() {
    document
        .getElementById("userModal")
        .classList.remove("show");

    document.getElementById("userForm").reset();
    document.getElementById("userId").value = "";
    clearFormMessage();
}

// Save user form
function setupUserForm() {
    document
        .getElementById("userForm")
        .addEventListener("submit", function (event) {
            event.preventDefault();

            const userId =
                document.getElementById("userId").value;

            const fullname =
                document
                    .getElementById("fullname")
                    .value
                    .trim();

            const username =
                document
                    .getElementById("username")
                    .value
                    .trim();

            const email =
                document
                    .getElementById("email")
                    .value
                    .trim();

            const role =
                document.getElementById("role").value;

            const status =
                document.getElementById(
                    "accountStatus"
                ).value;

            const password =
                document.getElementById("password").value;

            const confirmPassword =
                document.getElementById(
                    "confirmPassword"
                ).value;

            if (
                fullname === "" ||
                username === "" ||
                email === ""
            ) {
                showFormMessage(
                    "Please complete all required fields.",
                    "error"
                );

                return;
            }

            const duplicateAccount = accounts.some(
                function (account) {
                    const sameAccount =
                        String(account.id) ===
                        String(userId);

                    return (
                        !sameAccount &&
                        (
                            account.username.toLowerCase() ===
                                username.toLowerCase() ||
                            account.email.toLowerCase() ===
                                email.toLowerCase()
                        )
                    );
                }
            );

            if (duplicateAccount) {
                showFormMessage(
                    "The username or email already exists.",
                    "error"
                );

                return;
            }

            if (!userId && password.length < 6) {
                showFormMessage(
                    "Password must contain at least 6 characters.",
                    "error"
                );

                return;
            }

            if (password && password.length < 6) {
                showFormMessage(
                    "Password must contain at least 6 characters.",
                    "error"
                );

                return;
            }

            if (password !== confirmPassword) {
                showFormMessage(
                    "Passwords do not match.",
                    "error"
                );

                return;
            }

            if (userId) {
                updateAccount(
                    userId,
                    fullname,
                    username,
                    email,
                    role,
                    status,
                    password
                );
            } else {
                addAccount(
                    fullname,
                    username,
                    email,
                    role,
                    status,
                    password
                );
            }

            saveAccounts();
            closeUserModal();
            updateSummary();
            filterAccounts();
        });
}

// Add account
function addAccount(
    fullname,
    username,
    email,
    role,
    status,
    password
) {
    accounts.push({
        id: "USER-" + Date.now(),
        fullname: fullname,
        username: username,
        email: email,
        role: role,
        status: status,
        password: password,
        dateCreated: new Date().toLocaleString()
    });
}

// Update account
function updateAccount(
    userId,
    fullname,
    username,
    email,
    role,
    status,
    password
) {
    const accountIndex = accounts.findIndex(
        function (account) {
            return String(account.id) === String(userId);
        }
    );

    if (accountIndex === -1) {
        return;
    }

    const editingCurrentAccount =
        String(accounts[accountIndex].id) ===
        String(currentUser.id);

    if (
        editingCurrentAccount &&
        (role !== "admin" || status !== "active")
    ) {
        showFormMessage(
            "You cannot remove your own admin access or deactivate your account.",
            "error"
        );

        return;
    }

    accounts[accountIndex].fullname = fullname;
    accounts[accountIndex].username = username;
    accounts[accountIndex].email = email;
    accounts[accountIndex].role = role;
    accounts[accountIndex].status = status;

    if (password) {
        accounts[accountIndex].password = password;
    }

    if (editingCurrentAccount) {
        currentUser.fullname = fullname;
        currentUser.username = username;
        currentUser.email = email;

        localStorage.setItem(
            "refmansyCurrentUser",
            JSON.stringify(currentUser)
        );
    }
}

// Activate or deactivate account
function toggleAccountStatus(accountId) {
    const accountIndex = accounts.findIndex(
        function (account) {
            return String(account.id) === String(accountId);
        }
    );

    if (accountIndex === -1) {
        return;
    }

    if (
        String(accounts[accountIndex].id) ===
        String(currentUser.id)
    ) {
        alert("You cannot deactivate your own account.");
        return;
    }

    const currentStatus = normalizeStatus(
        accounts[accountIndex].status
    );

    const newStatus =
        currentStatus === "active"
            ? "inactive"
            : "active";

    const confirmChange = confirm(
        "Change this account's status to " +
        newStatus +
        "?"
    );

    if (!confirmChange) {
        return;
    }

    accounts[accountIndex].status = newStatus;

    saveAccounts();
    updateSummary();
    filterAccounts();
}

// Delete account
function deleteAccount(accountId) {
    const account = accounts.find(function (item) {
        return String(item.id) === String(accountId);
    });

    if (!account) {
        return;
    }

    if (String(account.id) === String(currentUser.id)) {
        alert("You cannot delete your own account.");
        return;
    }

    const confirmDelete = confirm(
        'Delete the account "' +
        account.username +
        '"? This cannot be undone.'
    );

    if (!confirmDelete) {
        return;
    }

    accounts = accounts.filter(function (item) {
        return String(item.id) !== String(accountId);
    });

    saveAccounts();
    updateSummary();
    filterAccounts();
}

// Save accounts
function saveAccounts() {
    localStorage.setItem(
        "refmansyAccounts",
        JSON.stringify(accounts)
    );
}

// Form message
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

function normalizeRole(role) {
    return String(role).toLowerCase() === "admin"
        ? "admin"
        : "user";
}

function normalizeStatus(status) {
    return String(status).toLowerCase() === "inactive"
        ? "inactive"
        : "active";
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