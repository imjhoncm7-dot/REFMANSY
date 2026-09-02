// ========================================
// Refmansy Upload Research
// ========================================

const currentUser = JSON.parse(
    localStorage.getItem("refmansyCurrentUser")
);

const researchForm =
    document.getElementById("researchForm");

const researchFileInput =
    document.getElementById("researchFile");

const fileUploadArea =
    document.getElementById("fileUploadArea");

const uploadPlaceholder =
    document.getElementById("uploadPlaceholder");

const selectedFileDisplay =
    document.getElementById("selectedFile");

const formMessage =
    document.getElementById("formMessage");

let researchFiles = [];
let selectedPDF = null;
let existingFileData = null;
let editingFileId = null;

const maximumFileSize = 2 * 1024 * 1024;

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
    loadResearchFiles();
    loadCategoryOptions();
    setDefaultValues();
    setupFileUpload();
    setupForm();
    setupLogout();
    checkEditMode();
}

// Display Faculty name
function displayFacultyName() {
    document.getElementById(
        "headerFacultyName"
    ).textContent =
        currentUser.fullname || currentUser.username;
}

// Load research files
function loadResearchFiles() {
    researchFiles =
        JSON.parse(
            localStorage.getItem("refmansyResearchFiles")
        ) || [];
}

// Load categories from Admin category management
function loadCategoryOptions() {
    const categorySelect =
        document.getElementById("category");

    const savedCategories =
        JSON.parse(
            localStorage.getItem("refmansyCategories")
        ) || [];

    const defaultCategories = [
        "Education",
        "Information Technology",
        "Engineering",
        "Business",
        "Health",
        "Social Science",
        "Agriculture",
        "Environmental Science",
        "Other"
    ];

    const categoryNames =
        savedCategories.length > 0
            ? savedCategories.map(function (category) {
                return category.name;
            })
            : defaultCategories;

    categorySelect.innerHTML = `
        <option value="">
            Select a category
        </option>
    `;

    categoryNames.forEach(function (categoryName) {
        const option = document.createElement("option");

        option.value = categoryName;
        option.textContent = categoryName;

        categorySelect.appendChild(option);
    });
}

// Set default researcher and year
function setDefaultValues() {
    document.getElementById("researcher").value =
        currentUser.fullname || "";

    document.getElementById("publicationYear").value =
        new Date().getFullYear();
}

// Set up file selection and drag-and-drop
function setupFileUpload() {
    document
        .getElementById("chooseFileButton")
        .addEventListener("click", function () {
            researchFileInput.click();
        });

    researchFileInput.addEventListener(
        "change",
        function () {
            if (this.files.length > 0) {
                handleSelectedFile(this.files[0]);
            }
        }
    );

    document
        .getElementById("removeFileButton")
        .addEventListener("click", removeSelectedFile);

    fileUploadArea.addEventListener(
        "dragover",
        function (event) {
            event.preventDefault();
            this.classList.add("dragging");
        }
    );

    fileUploadArea.addEventListener(
        "dragleave",
        function () {
            this.classList.remove("dragging");
        }
    );

    fileUploadArea.addEventListener(
        "drop",
        function (event) {
            event.preventDefault();
            this.classList.remove("dragging");

            const droppedFile =
                event.dataTransfer.files[0];

            if (droppedFile) {
                handleSelectedFile(droppedFile);
            }
        }
    );
}

// Validate the selected PDF
function handleSelectedFile(file) {
    clearFormMessage();

    const isPDF =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");

    if (!isPDF) {
        showFormMessage(
            "Please select a PDF document only.",
            "error"
        );
        return;
    }

    if (file.size > maximumFileSize) {
        showFormMessage(
            "The PDF must not exceed 2 MB.",
            "error"
        );
        return;
    }

    selectedPDF = file;

    document.getElementById(
        "selectedFileName"
    ).textContent = file.name;

    document.getElementById(
        "selectedFileSize"
    ).textContent = formatFileSize(file.size);

    uploadPlaceholder.classList.add("hide");
    selectedFileDisplay.classList.add("show");
}

// Remove selected PDF
function removeSelectedFile() {
    selectedPDF = null;
    researchFileInput.value = "";

    uploadPlaceholder.classList.remove("hide");
    selectedFileDisplay.classList.remove("show");
}

// Check if Faculty is editing a pending submission
function checkEditMode() {
    const editFileId =
        localStorage.getItem("refmansyEditFileId");

    if (!editFileId) {
        return;
    }

    localStorage.removeItem("refmansyEditFileId");

    const fileToEdit = researchFiles.find(
        function (file) {
            return (
                String(file.id) === String(editFileId) &&
                isFacultyFile(file)
            );
        }
    );

    if (
        !fileToEdit ||
        normalizeStatus(fileToEdit.status) !== "pending"
    ) {
        showFormMessage(
            "Only your pending submissions can be edited.",
            "error"
        );
        return;
    }

    editingFileId = fileToEdit.id;
    existingFileData = fileToEdit.fileData || null;

    document.getElementById("pageTitle").textContent =
        "Edit Research Submission";

    document.getElementById(
        "pageDescription"
    ).textContent =
        "Update your pending research submission.";

    document.getElementById("submitButton").innerHTML = `
        <i class="fa-solid fa-floppy-disk"></i>
        Save Changes
    `;

    document.getElementById("researchId").value =
        fileToEdit.id;

    document.getElementById("researchTitle").value =
        fileToEdit.title ||
        fileToEdit.researchTitle ||
        "";

    document.getElementById("researcher").value =
        fileToEdit.researcher || "";

    document.getElementById("coResearchers").value =
        fileToEdit.coResearchers || "";

    document.getElementById("category").value =
        fileToEdit.category || "";

    document.getElementById("publicationYear").value =
        fileToEdit.publicationYear || "";

    document.getElementById("department").value =
        fileToEdit.department || "";

    document.getElementById("researchType").value =
        fileToEdit.researchType || "";

    document.getElementById("description").value =
        fileToEdit.description || "";

    document.getElementById("keywords").value =
        Array.isArray(fileToEdit.keywords)
            ? fileToEdit.keywords.join(", ")
            : fileToEdit.keywords || "";

    if (fileToEdit.fileName) {
        const existingFileMessage =
            document.getElementById(
                "existingFileMessage"
            );

        existingFileMessage.textContent =
            "Current file: " +
            fileToEdit.fileName +
            ". Select another PDF only if you want to replace it.";

        existingFileMessage.classList.add("show");
    }
}

// Set up submission form
function setupForm() {
    researchForm.addEventListener(
        "submit",
        async function (event) {
            event.preventDefault();
            clearFormMessage();

            const title =
                document
                    .getElementById("researchTitle")
                    .value
                    .trim();

            const researcher =
                document
                    .getElementById("researcher")
                    .value
                    .trim();

            const coResearchers =
                document
                    .getElementById("coResearchers")
                    .value
                    .trim();

            const category =
                document.getElementById("category").value;

            const publicationYear =
                document.getElementById(
                    "publicationYear"
                ).value;

            const department =
                document
                    .getElementById("department")
                    .value
                    .trim();

            const researchType =
                document.getElementById(
                    "researchType"
                ).value;

            const description =
                document
                    .getElementById("description")
                    .value
                    .trim();

            const keywords =
                document
                    .getElementById("keywords")
                    .value
                    .split(",")
                    .map(function (keyword) {
                        return keyword.trim();
                    })
                    .filter(Boolean);

            if (
                title === "" ||
                researcher === "" ||
                category === "" ||
                publicationYear === "" ||
                department === "" ||
                researchType === "" ||
                description === ""
            ) {
                showFormMessage(
                    "Please complete all required fields.",
                    "error"
                );
                return;
            }

            if (
                !editingFileId &&
                selectedPDF === null
            ) {
                showFormMessage(
                    "Please select a PDF document.",
                    "error"
                );
                return;
            }

            const submitButton =
                document.getElementById("submitButton");

            submitButton.disabled = true;
            submitButton.textContent = "Saving...";

            try {
                let fileData = existingFileData;
                let fileName = "";
                let fileSize = 0;

                if (editingFileId) {
                    const oldFile = researchFiles.find(
                        function (file) {
                            return (
                                String(file.id) ===
                                String(editingFileId)
                            );
                        }
                    );

                    if (oldFile) {
                        fileName = oldFile.fileName || "";
                        fileSize = oldFile.fileSize || 0;
                    }
                }

                if (selectedPDF) {
                    fileData = await readFileAsDataURL(
                        selectedPDF
                    );

                    fileName = selectedPDF.name;
                    fileSize = selectedPDF.size;
                }

                if (editingFileId) {
                    updateResearchFile({
                        title: title,
                        researcher: researcher,
                        coResearchers: coResearchers,
                        category: category,
                        publicationYear: publicationYear,
                        department: department,
                        researchType: researchType,
                        description: description,
                        keywords: keywords,
                        fileData: fileData,
                        fileName: fileName,
                        fileSize: fileSize
                    });
                } else {
                    addResearchFile({
                        title: title,
                        researcher: researcher,
                        coResearchers: coResearchers,
                        category: category,
                        publicationYear: publicationYear,
                        department: department,
                        researchType: researchType,
                        description: description,
                        keywords: keywords,
                        fileData: fileData,
                        fileName: fileName,
                        fileSize: fileSize
                    });
                }

                saveResearchFiles();

                showFormMessage(
                    editingFileId
                        ? "Research submission updated successfully."
                        : "Research submitted successfully for review.",
                    "success"
                );

                localStorage.removeItem(
                    "refmansyEditFileId"
                );

                setTimeout(function () {
                    window.location.href =
                        "my-research-files.html";
                }, 1200);
            } catch (error) {
                showFormMessage(
                    "The browser could not save the document. Try using a smaller PDF.",
                    "error"
                );

                submitButton.disabled = false;
                submitButton.innerHTML = `
                    <i class="fa-solid fa-upload"></i>
                    Submit Research
                `;
            }
        }
    );
}

// Add new research submission
function addResearchFile(data) {
    researchFiles.push({
        id: "RF-" + Date.now(),

        title: data.title,
        researcher: data.researcher,
        coResearchers: data.coResearchers,
        category: data.category,
        publicationYear: data.publicationYear,
        department: data.department,
        researchType: data.researchType,
        description: data.description,
        keywords: data.keywords,

        fileData: data.fileData,
        fileName: data.fileName,
        fileSize: data.fileSize,
        fileType: "application/pdf",

        ownerId: currentUser.id,
        ownerEmail: currentUser.email,
        uploadedBy: currentUser.username,
        uploadedByEmail: currentUser.email,

        status: "pending",
        reviewComment: "",
        reviewedBy: "",
        reviewedDate: "",

        dateUploaded: new Date().toLocaleString(),
        createdAt: new Date().toISOString()
    });
}

// Update pending research submission
function updateResearchFile(data) {
    const fileIndex = researchFiles.findIndex(
        function (file) {
            return (
                String(file.id) ===
                String(editingFileId)
            );
        }
    );

    if (fileIndex === -1) {
        throw new Error("Research file not found.");
    }

    researchFiles[fileIndex] = {
        ...researchFiles[fileIndex],

        title: data.title,
        researcher: data.researcher,
        coResearchers: data.coResearchers,
        category: data.category,
        publicationYear: data.publicationYear,
        department: data.department,
        researchType: data.researchType,
        description: data.description,
        keywords: data.keywords,

        fileData: data.fileData,
        fileName: data.fileName,
        fileSize: data.fileSize,

        status: "pending",
        reviewComment: "",
        reviewedBy: "",
        reviewedDate: "",

        lastUpdated: new Date().toLocaleString()
    };
}

// Save shared research-file data
function saveResearchFiles() {
    localStorage.setItem(
        "refmansyResearchFiles",
        JSON.stringify(researchFiles)
    );
}

// Check ownership
function isFacultyFile(file) {
    return (
        String(file.ownerId || "") ===
            String(currentUser.id || "") ||
        String(file.ownerEmail || "").toLowerCase() ===
            String(currentUser.email || "").toLowerCase()
    );
}

// Read PDF as a data URL
function readFileAsDataURL(file) {
    return new Promise(function (resolve, reject) {
        const reader = new FileReader();

        reader.onload = function () {
            resolve(reader.result);
        };

        reader.onerror = function () {
            reject(new Error("Unable to read the PDF."));
        };

        reader.readAsDataURL(file);
    });
}

// Format file size
function formatFileSize(bytes) {
    if (bytes < 1024) {
        return bytes + " bytes";
    }

    if (bytes < 1024 * 1024) {
        return (bytes / 1024).toFixed(1) + " KB";
    }

    return (
        bytes / (1024 * 1024)
    ).toFixed(1) + " MB";
}

// Form messages
function showFormMessage(text, type) {
    formMessage.textContent = text;
    formMessage.className = "form-message " + type;
}

function clearFormMessage() {
    formMessage.textContent = "";
    formMessage.className = "form-message";
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
                "refmansyEditFileId"
            );

            window.location.replace("login.html");
        });
}