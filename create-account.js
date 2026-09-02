const createAccountForm =
    document.getElementById("createAccountForm");

const message = document.getElementById("message");

createAccountForm.addEventListener(
    "submit",
    function (event) {
        event.preventDefault();

        const fullname =
            document.getElementById("fullname").value.trim();

        const username =
            document.getElementById("username").value.trim();

        const email =
            document.getElementById("email").value.trim();

        const role =
            document.getElementById("role").value;

        const password =
            document.getElementById("password").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;

        if (
            fullname === "" ||
            username === "" ||
            email === "" ||
            role === "" ||
            password === "" ||
            confirmPassword === ""
        ) {
            showMessage(
                "Please complete all fields.",
                "error"
            );
            return;
        }

        if (password.length < 6) {
            showMessage(
                "Password must contain at least 6 characters.",
                "error"
            );
            return;
        }

        if (password !== confirmPassword) {
            showMessage(
                "Passwords do not match.",
                "error"
            );
            return;
        }

        const accounts =
            JSON.parse(
                localStorage.getItem("refmansyAccounts")
            ) || [];

        const accountExists = accounts.some(
            function (account) {
                return (
                    account.username.toLowerCase() ===
                        username.toLowerCase() ||
                    account.email.toLowerCase() ===
                        email.toLowerCase()
                );
            }
        );

        if (accountExists) {
            showMessage(
                "The username or email is already registered.",
                "error"
            );
            return;
        }

        const newAccount = {
            id: "USER-" + Date.now(),
            fullname: fullname,
            username: username,
            email: email,
            password: password,
            role: role,
            status: "active",
            dateCreated: new Date().toLocaleString()
        };

        accounts.push(newAccount);

        localStorage.setItem(
            "refmansyAccounts",
            JSON.stringify(accounts)
        );

        showMessage(
            "Account created successfully! Redirecting...",
            "success"
        );

        createAccountForm.reset();

        setTimeout(function () {
            window.location.href = "login.html";
        }, 1500);
    }
);

function showMessage(text, type) {
    message.textContent = text;
    message.className = "message " + type;
}