const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const roleInput = document.getElementById("role");
const showPassword = document.getElementById("showPassword");
const message = document.getElementById("message");

// Show or hide the password
showPassword.addEventListener("change", function () {
    passwordInput.type = this.checked
        ? "text"
        : "password";
});

// Login
loginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const usernameOrEmail =
        usernameInput.value.trim().toLowerCase();

    const password = passwordInput.value;
    const selectedRole = roleInput.value;

    if (
        usernameOrEmail === "" ||
        password === "" ||
        selectedRole === ""
    ) {
        showMessage(
            "Please complete all fields.",
            "error"
        );
        return;
    }

    const accounts =
        JSON.parse(
            localStorage.getItem("refmansyAccounts")
        ) || [];

    if (accounts.length === 0) {
        showMessage(
            "No account found. Please create an account first.",
            "error"
        );
        return;
    }

    const account = accounts.find(function (savedAccount) {
        const savedUsername =
            String(savedAccount.username).toLowerCase();

        const savedEmail =
            String(savedAccount.email).toLowerCase();

        // Convert older User accounts into Faculty accounts
        const savedRole =
            savedAccount.role === "user"
                ? "faculty"
                : savedAccount.role;

        return (
            (
                savedUsername === usernameOrEmail ||
                savedEmail === usernameOrEmail
            ) &&
            savedAccount.password === password &&
            savedRole === selectedRole
        );
    });

    if (!account) {
        showMessage(
            "Incorrect username, password, or account type.",
            "error"
        );
        return;
    }

    if (account.status === "inactive") {
        showMessage(
            "This account has been deactivated.",
            "error"
        );
        return;
    }

    // Update an older User role to Faculty
    if (account.role === "user") {
        account.role = "faculty";

        localStorage.setItem(
            "refmansyAccounts",
            JSON.stringify(accounts)
        );
    }

    const loggedInAccount = {
        id: account.id,
        fullname: account.fullname,
        username: account.username,
        email: account.email,
        role: account.role,
        status: account.status || "active"
    };

    localStorage.setItem(
        "refmansyCurrentUser",
        JSON.stringify(loggedInAccount)
    );

    showMessage(
        "Login successful! Redirecting...",
        "success"
    );

    setTimeout(function () {
        if (account.role === "admin") {
            window.location.href =
                "admin-dashboard.html";
        } else {
            window.location.href =
                "faculty-dashboard.html";
        }
    }, 1000);
});

function showMessage(text, type) {
    message.textContent = text;
    message.className = "message " + type;
}