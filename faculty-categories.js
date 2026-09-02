// ========================================
// Refmansy Faculty Categories and Tags
// ========================================

const currentUser = JSON.parse(
    localStorage.getItem("refmansyCurrentUser")
);

let categories = [];
let tags = [];
let approvedFiles = [];

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
    loadData();
    setupCategorySearch();
    setupLogout();
}

// Display Faculty name
function displayFacultyName() {
    document.getElementById(
        "headerFacultyName"
    ).textContent =
        currentUser.fullname || currentUser.username;
}

// Load categories, tags, and approved research files
function loadData() {
    categories =
        JSON.parse(
            localStorage.getItem("refmansyCategories")
        ) || [];

    tags =
        JSON.parse(
            localStorage.getItem("refmansyTags")
        ) || [];

    const allResearchFiles =
        JSON.parse(
            localStorage.getItem("refmansyResearchFiles")
        ) || [];

    approvedFiles = allResearchFiles.filter(
        function (file) {
            return normalizeStatus(file.status) === "approved";
        }
    );

    // Create category entries from files if Admin has not created any
    if (categories.length === 0) {
        categories = createCategoriesFromFiles();
    }

    updateSummary();
    displayCategories(categories);
    displayTags();
}

// Create categories based on approved files
function createCategoriesFromFiles() {
    const categoryNames = [
        ...new Set(
            approvedFiles
                .map(function (file) {
                    return file.category;
                })
                .filter(Boolean)
        )
    ];

    return categoryNames.map(function (categoryName, index) {
        return {
            id: "AUTO-CAT-" + index,
            name: categoryName,
            description:
                "Browse approved research files under " +
                categoryName +
                ".",
            color: getDefaultColor(index)
        };
    });
}

// Update summary
function updateSummary() {
    document.getElementById(
        "totalCategories"
    ).textContent = categories.length;

    document.getElementById("totalTags").textContent =
        tags.length;

    document.getElementById(
        "totalApprovedFiles"
    ).textContent = approvedFiles.length;
}

// Display category cards
function displayCategories(categoryList) {
    const categoriesContainer =
        document.getElementById("categoriesContainer");

    if (categoryList.length === 0) {
        categoriesContainer.innerHTML = `
            <div class="empty-content">
                No categories are currently available.
            </div>
        `;

        return;
    }

    categoriesContainer.innerHTML = "";

    categoryList.forEach(function (category, index) {
        const fileCount =
            countFilesInCategory(category.name);

        const categoryCard =
            document.createElement("article");

        categoryCard.className = "category-card";

        categoryCard.style.setProperty(
            "--category-color",
            category.color || getDefaultColor(index)
        );

        categoryCard.dataset.category = category.name;

        categoryCard.innerHTML = `
            <div class="category-card-header">

                <div class="category-card-icon">
                    <i class="fa-regular fa-folder-open"></i>
                </div>

                <span class="category-file-count">
                    ${fileCount}
                    ${fileCount === 1 ? "file" : "files"}
                </span>

            </div>

            <h4>${escapeHTML(category.name)}</h4>

            <p>
                ${escapeHTML(
                    category.description ||
                    "Browse research files in this category."
                )}
            </p>
        `;

        categoryCard.addEventListener("click", function () {
            openCategorySearch(this.dataset.category);
        });

        categoriesContainer.appendChild(categoryCard);
    });
}

// Count approved files in category
function countFilesInCategory(categoryName) {
    return approvedFiles.filter(function (file) {
        return (
            String(file.category || "").toLowerCase() ===
            String(categoryName).toLowerCase()
        );
    }).length;
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
                    const name = String(
                        category.name || ""
                    ).toLowerCase();

                    const description = String(
                        category.description || ""
                    ).toLowerCase();

                    return (
                        name.includes(searchValue) ||
                        description.includes(searchValue)
                    );
                }
            );

            displayCategories(filteredCategories);
        });
}

// Open Search Files with selected category
function openCategorySearch(categoryName) {
    localStorage.setItem(
        "refmansySearchCategory",
        categoryName
    );

    localStorage.removeItem("refmansySearchTerm");

    window.location.href = "search-files.html";
}

// Display available tags
function displayTags() {
    const tagsContainer =
        document.getElementById("tagsContainer");

    const combinedTags = getCombinedTags();

    if (combinedTags.length === 0) {
        tagsContainer.innerHTML = `
            <p class="empty-content">
                No research tags are currently available.
            </p>
        `;

        return;
    }

    tagsContainer.innerHTML = "";

    combinedTags.forEach(function (tag) {
        const tagButton =
            document.createElement("button");

        tagButton.type = "button";
        tagButton.className = "tag-button";

        tagButton.innerHTML = `
            <i class="fa-solid fa-tag"></i>

            <span>${escapeHTML(tag.name)}</span>

            <span class="tag-count">
                ${tag.count}
            </span>
        `;

        tagButton.addEventListener("click", function () {
            openTagSearch(tag.name);
        });

        tagsContainer.appendChild(tagButton);
    });
}

// Combine Admin tags and research keywords
function getCombinedTags() {
    const tagMap = {};

    tags.forEach(function (tag) {
        const tagName = String(tag.name || "").trim();

        if (tagName) {
            tagMap[tagName.toLowerCase()] = {
                name: tagName,
                count: countTagFiles(tagName)
            };
        }
    });

    approvedFiles.forEach(function (file) {
        const keywords = Array.isArray(file.keywords)
            ? file.keywords
            : String(file.keywords || "")
                .split(",")
                .map(function (keyword) {
                    return keyword.trim();
                })
                .filter(Boolean);

        keywords.forEach(function (keyword) {
            const key = keyword.toLowerCase();

            if (!tagMap[key]) {
                tagMap[key] = {
                    name: keyword,
                    count: 0
                };
            }

            tagMap[key].count += 1;
        });
    });

    return Object.values(tagMap).sort(
        function (firstTag, secondTag) {
            return secondTag.count - firstTag.count;
        }
    );
}

// Count approved files using a tag
function countTagFiles(tagName) {
    return approvedFiles.filter(function (file) {
        const keywords = Array.isArray(file.keywords)
            ? file.keywords
            : String(file.keywords || "").split(",");

        return keywords.some(function (keyword) {
            return (
                keyword.trim().toLowerCase() ===
                tagName.toLowerCase()
            );
        });
    }).length;
}

// Open Search Files using selected tag
function openTagSearch(tagName) {
    localStorage.setItem(
        "refmansySearchTerm",
        tagName
    );

    localStorage.removeItem("refmansySearchCategory");

    window.location.href = "search-files.html";
}

// Default category colors
function getDefaultColor(index) {
    const colors = [
        "#73aee7",
        "#7d6cc4",
        "#4f9e79",
        "#d2a646",
        "#c85b5b",
        "#4ba6a6"
    ];

    return colors[index % colors.length];
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

            localStorage.removeItem(
                "refmansySearchCategory"
            );

            localStorage.removeItem(
                "refmansySearchTerm"
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