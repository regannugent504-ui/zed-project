
const STORAGE_KEY = "readingTrackerBooks_v1";

let books = loadBooks();

// Load saved books from the browser
function loadBooks() {
    try {
        const savedBooks = localStorage.getItem(STORAGE_KEY);
        return savedBooks ? JSON.parse(savedBooks) : [];
    } catch (error) {
        console.error("Error loading books:", error);
        return [];
    }
}

// Save books to the browser
function saveBooks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}

// Calculate reading progress
function getProgress(book) {
    if (!book.totalPages || book.totalPages <= 0) {
        return 0;
    }

    return Math.min(
        100,
        Math.round((book.pagesRead / book.totalPages) * 100)
    );
}

// Add a new book
function addBook(bookData) {
    const title = bookData.title.trim();
    const author = bookData.author.trim() || "Unknown author";
    const totalPages = Number(bookData.totalPages);
    const pagesRead = Number(bookData.pagesRead || 0);

    if (!title) {
        throw new Error("Please enter a book title.");
    }

    if (!Number.isInteger(totalPages) || totalPages <= 0) {
        throw new Error("Enter a valid total page count.");
    }

    if (
        !Number.isInteger(pagesRead) ||
        pagesRead < 0 ||
        pagesRead > totalPages
    ) {
        throw new Error(
            "Pages read must be between 0 and the total pages."
        );
    }

    const book = {
        id: Date.now().toString() + Math.random().toString(16).slice(2),
        title: title,
        author: author,
        totalPages: totalPages,
        pagesRead: pagesRead,
        status: bookData.status || "Want to read",
        rating: Number(bookData.rating || 0),
        notes: bookData.notes.trim()
    };

    if (pagesRead === totalPages) {
        book.status = "Finished";
    } else if (pagesRead > 0 && book.status === "Want to read") {
        book.status = "Reading";
    }

    books.push(book);
    saveBooks();

    return book;
}

// Update a saved book
function updateBook(id, updates) {
    const book = books.find(item => item.id === id);

    if (!book) {
        throw new Error("Book not found.");
    }

    const updatedBook = { ...book, ...updates };

    updatedBook.title = String(updatedBook.title || "").trim();
    updatedBook.author = String(
        updatedBook.author || "Unknown author"
    ).trim();
    updatedBook.totalPages = Number(updatedBook.totalPages);
    updatedBook.pagesRead = Number(updatedBook.pagesRead);

    if (!updatedBook.title) {
        throw new Error("Please enter a book title.");
    }

    if (
        !Number.isInteger(updatedBook.totalPages) ||
        updatedBook.totalPages <= 0
    ) {
        throw new Error("Total pages must be a positive whole number.");
    }

    if (
        !Number.isInteger(updatedBook.pagesRead) ||
        updatedBook.pagesRead < 0 ||
        updatedBook.pagesRead > updatedBook.totalPages
    ) {
        throw new Error("Please enter a valid number of pages read.");
    }

    if (updatedBook.pagesRead === updatedBook.totalPages) {
        updatedBook.status = "Finished";
    } else if (
        updatedBook.pagesRead > 0 &&
        updatedBook.status === "Want to read"
    ) {
        updatedBook.status = "Reading";
    }

    Object.assign(book, updatedBook);
    saveBooks();

    return book;
}

// Delete a book
function deleteBook(id) {
    books = books.filter(book => book.id !== id);
    saveBooks();
}

// Search books by title or author
function searchBooks(query) {
    const searchTerm = query.toLowerCase().trim();

    return books.filter(book =>
        book.title.toLowerCase().includes(searchTerm) ||
        book.author.toLowerCase().includes(searchTerm)
    );
}

// Filter books by reading status
function filterBooks(status) {
    if (!status || status === "All") {
        return books;
    }

    return books.filter(book => book.status === status);
}

// Calculate reading statistics
function getReadingStats() {
    return {
        totalBooks: books.length,

        finishedBooks: books.filter(
            book => book.status === "Finished"
        ).length,

        currentlyReading: books.filter(
            book => book.status === "Reading"
        ).length,

        totalPagesRead: books.reduce(
            (total, book) => total + book.pagesRead,
            0
        )
    };
}

// Display books on the page
function renderBooks(bookList = books) {
    const container = document.getElementById("book-list");

    if (!container) {
        return;
    }

    container.replaceChildren();

    if (bookList.length === 0) {
        const message = document.createElement("p");
        message.textContent =
            "No books found. Add a book to get started.";
        container.appendChild(message);
        return;
    }

    bookList.forEach(book => {
        const card = document.createElement("article");
        card.className = "book-card";

        const title = document.createElement("h3");
        title.textContent = book.title;

        const author = document.createElement("p");
        author.textContent = "By " + book.author;

        const pages = document.createElement("p");
        pages.textContent =
            `${book.pagesRead} of ${book.totalPages} pages read`;

        const progress = document.createElement("progress");
        progress.max = 100;
        progress.value = getProgress(book);
        progress.setAttribute(
            "aria-label",
            `${book.title}: ${getProgress(book)}% complete`
        );

        const percentage = document.createElement("p");
        percentage.textContent = getProgress(book) + "% complete";

        const status = document.createElement("p");
        status.textContent = "Status: " + book.status;

        const rating = document.createElement("p");
        rating.textContent = book.rating
            ? "Rating: " + "★".repeat(book.rating)
            : "Not rated";

        card.append(title, author, pages, progress, percentage, status, rating);

        if (book.notes) {
            const notes = document.createElement("p");
            notes.textContent = "Notes: " + book.notes;
            card.appendChild(notes);
        }

        // Update page count
        const updateButton = document.createElement("button");
        updateButton.textContent = "Update Pages";

        updateButton.addEventListener("click", () => {
            const input = prompt(
                `How many pages have you read in "${book.title}"?`,
                book.pagesRead
            );

            if (input === null) {
                return;
            }

            try {
                updateBook(book.id, { pagesRead: Number(input) });
                applyFilters();
            } catch (error) {
                alert(error.message);
            }
        });

        // Edit book details
        const editButton = document.createElement("button");
        editButton.textContent = "Edit Book";

        editButton.addEventListener("click", () => {
            const newTitle = prompt("Book title:", book.title);

            if (newTitle === null) {
                return;
            }

            const newAuthor = prompt("Author:", book.author);

            if (newAuthor === null) {
                return;
            }

            const newTotal = prompt(
                "Total pages:", book.totalPages
            );

            if (newTotal === null) {
                return;
            }

            const newNotes = prompt("Notes:", book.notes);

            if (newNotes === null) {
                return;
            }

            try {
                updateBook(book.id, {
                    title: newTitle,
                    author: newAuthor,
                    totalPages: Number(newTotal),
                    notes: newNotes
                });

                applyFilters();
            } catch (error) {
                alert(error.message);
            }
        });

        // Delete book
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete Book";
        deleteButton.className = "delete-button";

        deleteButton.addEventListener("click", () => {
            if (confirm(`Are you sure you want to delete "${book.title}"?`)) {
                deleteBook(book.id);
                applyFilters();
            }
        });

        card.append(updateButton, editButton, deleteButton);
        container.appendChild(card);
    });
}

// Update the statistics at the top of the page
function updateStats() {
    const stats = getReadingStats();

    document.getElementById("total-books").textContent =
        stats.totalBooks;

    document.getElementById("finished-books").textContent =
        stats.finishedBooks;

    document.getElementById("pages-read").textContent =
        stats.totalPagesRead;
}

// Apply search and status filters together
function applyFilters() {
    const searchInput = document.getElementById("search");
    const statusFilter = document.getElementById("status-filter");

    const query = searchInput ? searchInput.value : "";
    const status = statusFilter ? statusFilter.value : "All";

    let results = searchBooks(query);

    if (status !== "All") {
        results = results.filter(book => book.status === status);
    }

    renderBooks(results);
    updateStats();
}

// Handle the add-book form
const bookForm = document.getElementById("book-form");

bookForm.addEventListener("submit", event => {
    event.preventDefault();

    const formData = new FormData(bookForm);

    try {
        addBook({
            title: formData.get("title") || "",
            author: formData.get("author") || "",
            totalPages: formData.get("totalPages"),
            pagesRead: formData.get("pagesRead"),
            status: formData.get("status"),
            rating: formData.get("rating"),
            notes: formData.get("notes") || ""
        });

        bookForm.reset();
        document.getElementById("pagesRead").value = 0;

        applyFilters();
    } catch (error) {
        alert(error.message);
    }
});

// Handle search
document.getElementById("search").addEventListener("input", applyFilters);

// Handle status filtering
document.getElementById("status-filter").addEventListener(
    "change",
    applyFilters
);
// Export books to a CSV file
function escapeCSV(value) {
    const text = String(value ?? "");
    // Wrap in quotes and double any quotes inside the text
    return `"${text.replace(/"/g, '""')}"`;
}

function exportToCSV() {
    if (books.length === 0) {
        alert("You don't have any books to export yet.");
        return;
    }

    const headers = [
        "Title",
        "Author",
        "Total Pages",
        "Pages Read",
        "Progress (%)",
        "Status",
        "Rating",
        "Notes"
    ];

    const rows = books.map(book => [
        book.title,
        book.author,
        book.totalPages,
        book.pagesRead,
        getProgress(book),
        book.status,
        book.rating,
        book.notes
    ]);

    const csv = [headers, ...rows]
        .map(row => row.map(escapeCSV).join(","))
        .join("\n");

    // The BOM (\uFEFF) helps Excel read special characters correctly
    const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "reading-tracker.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Handle the export button
const exportBtn = document.getElementById("exportBtn");

if (exportBtn) {
    exportBtn.addEventListener("click", exportToCSV);
}
// Display saved books when the page loads
applyFilters();
