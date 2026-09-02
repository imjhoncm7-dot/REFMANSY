// ========================================
// Refmansy Categories and Tags
// ========================================

const currentUser = JSON.parse(
    localStorage.getItem("refmansyCurrentUser")
);

let categories = [];
let tags = [];
let researchFiles = [];

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
    loadSavedData();
    setupCategoryModal();
    setupCategoryForm();
    setupCategorySearch();
    setupTagForm();
    setupLogout();
}

// Display administrator name
function displayAdminName() {
    document.getElementById("headerAdminName").textContent =
        currentUser.fullname || currentUser.username;
}

// Load categories, tags, and files
function loadSavedData() {
    categories =
        JSON.parse(
            localStorage.getItem("refmansyCategories")
        ) || [];

    tags =
        JSON.parse(
            localStorage.getItem("refmansyTags")
        ) || [];

    researchFiles =
        JSON.parse(
            localStorage.getItem("refmansyResearchFiles")
        ) || [];

    updateSummary();
    displayCategories(categories);
    displayTags();
}

// Update summary numbers
function updateSummary() {
    const categorizedFiles = researchFiles.filter(
        function (file) {
            return file.category &&
                file.category.trim() !== "";
        }
    ).length;

    document.getElementById("totalCategories").textContent =
        categories.length;

    document.getElementById("totalTags").textContent =
        tags.length;

    document.getElementById("categorizedFiles").textContent =
        categorizedFiles;
}

// Set up category modal
function setupCategoryModal() {
    const categoryModal =
        document.getElementById("categoryModal");

    document
        .getElementById("addCategoryButton")
        .addEventListener("click", openAddCategoryModal);

    document
        .getElementById("closeModalButton")
        .addEventListener("click", closeCategoryModal);

    document
        .getElementById("cancelButton")
        .addEventListener("click", closeCategoryModal);

    categoryModal.addEventListener("click", function (event) {
        if (event.target === categoryModal) {
            closeCategoryModal();
        }
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeCategoryModal();
        }
    });
}

// Open modal for a new category
function openAddCategoryModal() {
    document.getElementById("modalTitle").textContent =
        "Add Category";

    document.getElementById("categoryForm").reset();
    document.getElementById("categoryId").value = "";
    document.getElementById("categoryColor").value =
        "#73aee7";

    clearMessage("categoryMessage");

    document
        .getElementById("categoryModal")
        .classList.add("show");
}

// Open modal to edit a category
function openEditCategoryModal(categoryId) {
    const category = categories.find(function (item) {
        return String(item.id) === String(categoryId);
    });

    if (!category) {
        return;
    }

    document.getElementById("modalTitle").textContent =
        "Edit Category";

    document.getElementById("categoryId").value =
        category.id;

    document.getElementById("categoryName").value =
        category.name;

    document.getElementById("categoryDescription").value =
        category.description || "";

    document.getElementById("categoryColor").value =
        category.color || "#73aee7";

    clearMessage("categoryMessage");

    document
        .getElementById("categoryModal")
        .classList.add("show");
}

// Close category modal
function closeCategoryModal() {
    document
        .getElementById("categoryModal")
        .classList.remove("show");

    document.getElementById("categoryForm").reset();
    document.getElementById("categoryId").value = "";
    clearMessage("categoryMessage");
}

// Save category
function setupCategoryForm() {
    document
        .getElementById("categoryForm")
        .addEventListener("submit", function (event) {
            event.preventDefault();

            const categoryId =
                document.getElementById("categoryId").value;

            const categoryName =
                document
                    .getElementById("categoryName")
                    .value
                    .trim();

            const categoryDescription =
                document
                    .getElementById("categoryDescription")
                    .value
                    .trim();

            const categoryColor =
                document.getElementById(
                    "categoryColor"
                ).value;

            if (categoryName === "") {
                showMessage(
                    "categoryMessage",
                    "Please enter a category name.",
                    "error"
                );

                return;
            }

            const duplicateCategory = categories.some(
                function (category) {
                    return (
                        category.name.toLowerCase() ===
                            categoryName.toLowerCase() &&
                        String(category.id) !==
                            String(categoryId)
                    );
                }
            );

            if (duplicateCategory) {
                showMessage(
                    "categoryMessage",
                    "This category already exists.",
                    "error"
                );

                return;
            }

            if (categoryId) {
                updateCategory(
                    categoryId,
                    categoryName,
                    categoryDescription,
                    categoryColor
                );
            } else {
                addCategory(
                    categoryName,
                    categoryDescription,
                    categoryColor
                );
            }

            saveCategories();
            closeCategoryModal();
            updateSummary();
            displayCategories(categories);
        });
}

// Add a new category
function addCategory(name, description, color) {
    categories.push({
        id: "CAT-" + Date.now(),
        name: name,
        description: description,
        color: color,
        dateCreated: new Date().toLocaleDateString()
    });
}

// Update an existing category
function updateCategory(id, name, description, color) {
    const categoryIndex = categories.findIndex(
        function (category) {
            return String(category.id) === String(id);
        }
    );

    if (categoryIndex === -1) {
        return;
    }

    const oldCategoryName = categories[categoryIndex].name;

    categories[categoryIndex].name = name;
    categories[categoryIndex].description = description;
    categories[categoryIndex].color = color;

    // Update research files using the old category name
    researchFiles.forEach(function (file) {
        if (
            String(file.category).toLowerCase() ===
            oldCategoryName.toLowerCase()
        ) {
            file.category = name;
        }
    });

    localStorage.setItem(
        "refmansyResearchFiles",
        JSON.stringify(researchFiles)
    );
}

// Display categories
function displayCategories(categoryList) {
    const tableBody =
        document.getElementById("categoriesTable");

    document.getElementById("categoryCount").textContent =
        "Showing " +
        categoryList.length +
        (categoryList.length === 1
            ? " category"
            : " categories");

    if (categoryList.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-message">
                    No categories have been created.
                </td>
            </tr>
        `;

        return;
    }

    tableBody.innerHTML = "";

    categoryList.forEach(function (category) {
        const fileCount = countCategoryFiles(category.name);
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>
                <div class="category-name">
                    <span
                        class="category-color"
                        style="background-color:
                        ${escapeHTML(
                            category.color || "#73aee7"
                        )}"
                    ></span>

                    ${escapeHTML(category.name)}
                </div>
            </td>

            <td>
                ${escapeHTML(
                    category.description ||
                    "No description"
                )}
            </td>

            <td>${fileCount}</td>

            <td>
                ${escapeHTML(
                    category.dateCreated || "N/A"
                )}
            </td>

            <td>
                <div class="action-buttons">

                    <button
                        type="button"
                        class="edit-button"
                        data-id="${escapeHTML(category.id)}"
                        title="Edit category"
                    >
                        <i class="fa-solid fa-pen"></i>
                    </button>

                    <button
                        type="button"
                        class="delete-button"
                        data-id="${escapeHTML(category.id)}"
                        title="Delete category"
                    >
                        <i class="fa-solid fa-trash"></i>
                    </button>

                </div>
            </td>
        `;

        tableBody.appendChild(row);
    });

    setupCategoryButtons();
}

// Count files inside a category
function countCategoryFiles(categoryName) {
    return researchFiles.filter(function (file) {
        return (
            String(file.category || "").toLowerCase() ===
            categoryName.toLowerCase()
        );
    }).length;
}

// Set up Edit and Delete buttons
function setupCategoryButtons() {
    document
        .querySelectorAll(".edit-button")
        .forEach(function (button) {
            button.addEventListener("click", function () {
                openEditCategoryModal(this.dataset.id);
            });
        });

    document
        .querySelectorAll(".delete-button")
        .forEach(function (button) {
            button.addEventListener("click", function () {
                deleteCategory(this.dataset.id);
            });
        });
}

// Delete a category
function deleteCategory(categoryId) {
    const category = categories.find(function (item) {
        return String(item.id) === String(categoryId);
    });

    if (!category) {
        return;
    }

    const fileCount = countCategoryFiles(category.name);

    if (fileCount > 0) {
        alert(
            "This category cannot be deleted because " +
            fileCount +
            " research file(s) are using it."
        );

        return;
    }

    const confirmDelete = confirm(
        'Delete the category "' + category.name + '"?'
    );

    if (!confirmDelete) {
        return;
    }

    categories = categories.filter(function (item) {
        return String(item.id) !== String(categoryId);
    });

    saveCategories();
    updateSummary();
    displayCategories(categories);
}

// Search categories
function setupCategorySearch() {
    document
        .getElementById("categorySearch")
        .addEventListener("input", function () {
            const searchValue =
                this.value.trim().toLowerCase();

            const filteredCategories = categories.filter(
                function (category) {
                    return (
                        category.name
                            .toLowerCase()
                            .includes(searchValue) ||
                        String(
                            category.description || ""
                        )
                            .toLowerCase()
                            .includes(searchValue)
                    );
                }
            );

            displayCategories(filteredCategories);
        });
}

// Add tags
function setupTagForm() {
    document
        .getElementById("tagForm")
        .addEventListener("submit", function (event) {
            event.preventDefault();

            const tagInput =
                document.getElementById("tagName");

            const tagName = tagInput.value.trim();

            if (tagName === "") {
                showMessage(
                    "tagMessage",
                    "Please enter a tag name.",
                    "error"
                );

                return;
            }

            const tagExists = tags.some(function (tag) {
                return (
                    tag.name.toLowerCase() ===
                    tagName.toLowerCase()
                );
            });

            if (tagExists) {
                showMessage(
                    "tagMessage",
                    "This tag already exists.",
                    "error"
                );

                return;
            }

            tags.push({
                id: "TAG-" + Date.now(),
                name: tagName
            });

            saveTags();
            tagInput.value = "";

            showMessage(
                "tagMessage",
                "Tag added successfully.",
                "success"
            );

            displayTags();
            updateSummary();
        });
}

// Display tags
function displayTags() {
    const tagsContainer =
        document.getElementById("tagsContainer");

    if (tags.length === 0) {
        tagsContainer.innerHTML = `
            <p class="empty-tags">
                No tags have been created.
            </p>
        `;

        return;
    }

    tagsContainer.innerHTML = "";

    tags.forEach(function (tag) {
        const tagElement = document.createElement("div");

        tagElement.className = "tag-item";

        tagElement.innerHTML = `
            <span>${escapeHTML(tag.name)}</span>

            <button
                type="button"
                data-id="${escapeHTML(tag.id)}"
                title="Remove tag"
            >
                <i class="fa-solid fa-xmark"></i>
            </button>
        `;

        tagsContainer.appendChild(tagElement);
    });

    tagsContainer
        .querySelectorAll("button")
        .forEach(function (button) {
            button.addEventListener("click", function () {
                deleteTag(this.dataset.id);
            });
        });
}

// Delete tag
function deleteTag(tagId) {
    const confirmDelete = confirm(
        "Are you sure you want to remove this tag?"
    );

    if (!confirmDelete) {
        return;
    }

    tags = tags.filter(function (tag) {
        return String(tag.id) !== String(tagId);
    });

    saveTags();
    displayTags();
    updateSummary();
}

// Save categories
function saveCategories() {
    localStorage.setItem(
        "refmansyCategories",
        JSON.stringify(categories)
    );
}

// Save tags
function saveTags() {
    localStorage.setItem(
        "refmansyTags",
        JSON.stringify(tags)
    );
}

// Display form message
function showMessage(elementId, text, type) {
    const message = document.getElementById(elementId);

    message.textContent = text;
    message.className = "form-message " + type;

    setTimeout(function () {
        clearMessage(elementId);
    }, 2500);
}

function clearMessage(elementId) {
    const message = document.getElementById(elementId);

    message.textContent = "";
    message.className = "form-message";
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