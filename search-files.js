// ========================================
// Refmansy Search Approved Files
// ========================================

const currentUser = JSON.parse(
    localStorage.getItem("refmansyCurrentUser")
);

let approvedFiles = [];
let filteredFiles = [];
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
    loadApprovedFiles();
    setupFilters();
    setupModal();
    setupLogout();
}

// Display Faculty name
function displayFacultyName() {
    document.getElementById(
        "headerFacultyName"
    ).textContent =
        currentUser.fullname || currentUser.username;
}

// Load approved research files only
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
    filterResearchFiles();
}

// Load category options
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

// Load publication years
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

// Set up search and filters
function setupFilters() {
    document
        .getElementById("searchInput")
        .addEventListener("input", filterResearchFiles);

    document
        .getElementById("searchButton")
        .addEventListener("click", filterResearchFiles);

    document
        .getElementById("categoryFilter")
        .addEventListener("change", filterResearchFiles);

    document
        .getElementById("researchTypeFilter")
        .addEventListener("change", filterResearchFiles);

    document
        .getElementById("yearFilter")
        .addEventListener("change", filterResearchFiles);

    document
        .getElementById("sortFilter")
        .addEventListener("change", filterResearchFiles);

    document
        .getElementById("clearFiltersButton")
        .addEventListener("click", clearFilters);
}

// Filter approved files
function filterResearchFiles() {
    const searchValue =
        document
            .getElementById("searchInput")
            .value
            .trim()
            .toLowerCase();

    const selectedCategory =
        document.getElementById("categoryFilter").value;

    const selectedType =
        document.getElementById(
            "researchTypeFilter"
        ).value;

    const selectedYear =
        document.getElementById("yearFilter").value;

    const selectedSort =
        document.getElementById("sortFilter").value;

    filteredFiles = approvedFiles.filter(
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

            const department = String(
                file.department || ""
            ).toLowerCase();

            const description = String(
                file.description || ""
            ).toLowerCase();

            const keywords = Array.isArray(file.keywords)
                ? file.keywords.join(" ").toLowerCase()
                : String(file.keywords || "").toLowerCase();

            const category = String(
                file.category || "uncategorized"
            ).toLowerCase();

            const researchType = String(
                file.researchType || "other"
            ).toLowerCase();

            const publicationYear = String(
                file.publicationYear || ""
            );

            const matchesSearch =
                title.includes(searchValue) ||
                researcher.includes(searchValue) ||
                department.includes(searchValue) ||
                description.includes(searchValue) ||
                keywords.includes(searchValue);

            const matchesCategory =
                selectedCategory === "all" ||
                category === selectedCategory;

            const matchesType =
                selectedType === "all" ||
                researchType === selectedType;

            const matchesYear =
                selectedYear === "all" ||
                publicationYear === selectedYear;

            return (
                matchesSearch &&
                matchesCategory &&
                matchesType &&
                matchesYear
            );
        }
    );

    sortResearchFiles(filteredFiles, selectedSort);
    displayResearchFiles(filteredFiles);
}

// Sort research files
function sortResearchFiles(files, sortType) {
    files.sort(function (firstFile, secondFile) {
        if (sortType === "title") {
            const firstTitle =
                firstFile.title ||
                firstFile.researchTitle ||
                "";

            const secondTitle =
                secondFile.title ||
                secondFile.researchTitle ||
                "";

            return firstTitle.localeCompare(secondTitle);
        }

        const firstTime = getFileTime(firstFile);
        const secondTime = getFileTime(secondFile);

        return sortType === "oldest"
            ? firstTime - secondTime
            : secondTime - firstTime;
    });
}

// Display research result cards
function displayResearchFiles(files) {
    const researchResults =
        document.getElementById("researchResults");

    document.getElementById("resultCount").textContent =
        "Showing " +
        files.length +
        (files.length === 1
            ? " research file"
            : " research files");

    if (files.length === 0) {
        researchResults.innerHTML = `
            <div class="empty-results">

                <i class="fa-regular fa-folder-open"></i>

                <h3>No approved research files found</h3>

                <p>
                    Try changing your search or filters.
                </p>

            </div>
        `;

        return;
    }

    researchResults.innerHTML = "";

    files.forEach(function (file) {
        const researchItem = document.createElement("article");

        researchItem.className = "research-item";

        const title =
            file.title ||
            file.researchTitle ||
            "Untitled Research";

        const description =
            file.description ||
            "No description available.";

        researchItem.innerHTML = `
            <div class="research-item-header">

                <div class="research-file-icon">
                    <i class="fa-regular fa-file-pdf"></i>
                </div>

                <div>
                    <h3>${escapeHTML(title)}</h3>

                    <p>
                        By ${escapeHTML(
                            file.researcher ||
                            file.author ||
                            "Unknown Researcher"
                        )}
                    </p>
                </div>

            </div>

            <p class="research-description">
                ${escapeHTML(
                    shortenText(description, 150)
                )}
            </p>

            <div class="research-meta">

                <span>
                    ${escapeHTML(
                        file.category || "Uncategorized"
                    )}
                </span>

                <span>
                    ${escapeHTML(
                        formatResearchType(
                            file.researchType
                        )
                    )}
                </span>

                <span>
                    ${escapeHTML(
                        file.publicationYear ||
                        "No Year"
                    )}
                </span>

            </div>

            <div class="research-actions">

                <small>
                    ${escapeHTML(
                        file.department ||
                        "No Department"
                    )}
                </small>

                <button
                    type="button"
                    class="details-button"
                    data-id="${escapeHTML(file.id || "")}"
                >
                    View Details
                </button>

            </div>
        `;

        researchResults.appendChild(researchItem);
    });

    setupDetailsButtons();
}

// Set up Details buttons
function setupDetailsButtons() {
    document
        .querySelectorAll(".details-button")
        .forEach(function (button) {
            button.addEventListener("click", function () {
                openDetailsModal(this.dataset.id);
            });
        });
}

// Open research details
function openDetailsModal(fileId) {
    const selectedFile = approvedFiles.find(
        function (file) {
            return String(file.id) === String(fileId);
        }
    );

    if (!selectedFile) {
        return;
    }

    selectedFileId = selectedFile.id;

    document.getElementById("modalTitle").textContent =
        selectedFile.title ||
        selectedFile.researchTitle ||
        "Untitled Research";

    document.getElementById("modalResearcher").textContent =
        selectedFile.researcher ||
        selectedFile.author ||
        "Unknown Researcher";

    document.getElementById(
        "modalCoResearchers"
    ).textContent =
        selectedFile.coResearchers || "None";

    document.getElementById("modalCategory").textContent =
        selectedFile.category || "Uncategorized";

    document.getElementById(
        "modalResearchType"
    ).textContent =
        formatResearchType(selectedFile.researchType);

    document.getElementById("modalDepartment").textContent =
        selectedFile.department || "N/A";

    document.getElementById("modalYear").textContent =
        selectedFile.publicationYear || "N/A";

    document.getElementById(
        "modalDescription"
    ).textContent =
        selectedFile.description ||
        "No description available.";

    displayModalKeywords(selectedFile.keywords);

    document
        .getElementById("detailsModal")
        .classList.add("show");
}

// Display modal keywords
function displayModalKeywords(keywords) {
    const modalKeywords =
        document.getElementById("modalKeywords");

    const keywordList = Array.isArray(keywords)
        ? keywords
        : String(keywords || "")
            .split(",")
            .map(function (keyword) {
                return keyword.trim();
            })
            .filter(Boolean);

    if (keywordList.length === 0) {
        modalKeywords.innerHTML =
            "<span>No keywords</span>";
        return;
    }

    modalKeywords.innerHTML = "";

    keywordList.forEach(function (keyword) {
        const keywordElement =
            document.createElement("span");

        keywordElement.textContent = keyword;
        modalKeywords.appendChild(keywordElement);
    });
}

// Set up modal buttons
function setupModal() {
    const detailsModal =
        document.getElementById("detailsModal");

    document
        .getElementById("closeModalButton")
        .addEventListener("click", closeDetailsModal);

    document
        .getElementById("viewDocumentButton")
        .addEventListener("click", viewSelectedDocument);

    document
        .getElementById("downloadButton")
        .addEventListener("click", downloadSelectedDocument);

    detailsModal.addEventListener("click", function (event) {
        if (event.target === detailsModal) {
            closeDetailsModal();
        }
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeDetailsModal();
        }
    });
}

// View selected PDF
function viewSelectedDocument() {
    const selectedFile = getSelectedFile();

    if (!selectedFile) {
        return;
    }

    const fileLocation = getFileLocation(selectedFile);

    if (!fileLocation) {
        alert("No PDF document is attached.");
        return;
    }

    window.open(fileLocation, "_blank", "noopener,noreferrer");
}

// Download selected PDF
function downloadSelectedDocument() {
    const selectedFile = getSelectedFile();

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
        "research-document.pdf";

    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
}

// Get selected approved file
function getSelectedFile() {
    return approvedFiles.find(function (file) {
        return (
            String(file.id) ===
            String(selectedFileId)
        );
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

// Close modal
function closeDetailsModal() {
    document
        .getElementById("detailsModal")
        .classList.remove("show");

    selectedFileId = null;
}

// Clear filters
function clearFilters() {
    document.getElementById("searchInput").value = "";
    document.getElementById("categoryFilter").value =
        "all";

    document.getElementById(
        "researchTypeFilter"
    ).value = "all";

    document.getElementById("yearFilter").value = "all";
    document.getElementById("sortFilter").value = "newest";

    filterResearchFiles();
}

// Format research type
function formatResearchType(type) {
    const names = {
        institutional: "Institutional Research",
        "action-research": "Action Research",
        thesis: "Thesis",
        capstone: "Capstone Project",
        other: "Other"
    };

    return names[type] || "Other";
}

// Shorten long descriptions
function shortenText(text, maximumLength) {
    return text.length > maximumLength
        ? text.slice(0, maximumLength) + "..."
        : text;
}

// Normalize status
function normalizeStatus(status) {
    return String(status || "pending").toLowerCase();
}

// Get upload time
function getFileTime(file) {
    const dateValue =
        file.createdAt ||
        file.dateUploaded ||
        file.dateAdded ||
        0;

    const timestamp = new Date(dateValue).getTime();

    return Number.isNaN(timestamp) ? 0 : timestamp;
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