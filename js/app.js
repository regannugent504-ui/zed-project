
const STORAGE_KEY = "readingTrackerBooks_v1";

let books = loadBooks();

// Load saved books from localStorage
function loadBooks() {
  try {
    const savedBooks = localStorage.getItem(STORAGE_KEY);
    return savedBooks ? JSON.parse(savedBooks) : [];
  } catch (error) {
    console.error("Could not load saved books:", error);
    return [];
  }
}

// Save books to localStorage
function saveBooks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}

// Calculate reading progress
function getProgress(book) {
  if (!book.totalPages || book.totalPages <= 0) return 0;

  return Math.min(
    100,
    Math.round((book.pagesRead / book.totalPages) * 100)
  );
}

// Add a new book
function addBook(bookData) {
  const title = bookData.title?.trim();
  const author = bookData.author?.trim() || "Unknown author";
  const totalPages = Number(bookData.totalPages);
  const pagesRead = Number(bookData.pagesRead || 0);

  if (!title) {
    throw new Error("Please enter a book title.");
  }

  if (!Number.isInteger(totalPages) || totalPages <= 0) {
    throw new Error("Total pages must be a positive whole number.");
  }

  if (
    !Number.isInteger(pagesRead) ||
    pagesRead < 0 ||
    pagesRead > totalPages
  ) {
    throw new Error("Pages read must be between 0 and total pages.");
  }

  const book = {
    id: crypto.randomUUID(),
    title,
    author,
    totalPages,
    pagesRead,
    status: bookData.status || "Want to read",
    rating: Number(bookData.rating || 0),
    notes: bookData.notes?.trim() || "",
    createdAt: new Date().toISOString()
  };

  books.push(book);
  saveBooks();

  return book;
}

// Update an existing book
function updateBook(id, updates) {
  const index = books.findIndex(book => book.id === id);

  if (index === -1) {
    throw new Error("Book not found.");
  }

  const updatedBook = { ...books[index], ...updates };

  if (!updatedBook.title?.trim()) {
    throw new Error("Please enter a book title.");
  }

  if (
    !Number.isInteger(Number(updatedBook.totalPages)) ||
    Number(updatedBook.totalPages) <= 0
  ) {
    throw new Error("Total pages must be a positive whole number.");
  }

  if (
    !Number.isInteger(Number(updatedBook.pagesRead)) ||
    Number(updatedBook.pagesRead) < 0 ||
    Number(updatedBook.pagesRead) > Number(updatedBook.totalPages)
  ) {
    throw new Error("Please enter a valid number of pages read.");
  }

  updatedBook.totalPages = Number(updatedBook.totalPages);
  updatedBook.pagesRead = Number(updatedBook.pagesRead);
  updatedBook.title = updatedBook.title.trim();

  if (updatedBook.pagesRead === updatedBook.totalPages) {
    updatedBook.status = "Finished";
  }

  books[index] = updatedBook;
  saveBooks();

  return updatedBook;
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

// Get reading statistics
function getReadingStats() {
  const totalBooks = books.length;

  const finishedBooks = books.filter(
    book => book.status === "Finished"
  ).length;

  const currentlyReading = books.filter(
    book => book.status === "Reading"
  ).length;

  const totalPagesRead = books.reduce(
    (sum, book) => sum + book.pagesRead,
    0
  );

  return {
    totalBooks,
    finishedBooks,
    currentlyReading,
    totalPagesRead
  };
}

// Display the books in the browser
function renderBooks(bookList = books) {
  const container = document.getElementById("book-list");

  if (!container) return;

  container.replaceChildren();

  if (bookList.length === 0) {
    const message = document.createElement("p");
    message.textContent = "No books found. Add a book to get started.";
    container.appendChild(message);
    return;
  }

  bookList.forEach(book => {
    const card = document.createElement("article");
    card.className = "book-card";

    const title = document.createElement("h3");
    title.textContent = book.title;

    const author = document.createElement("p");
    author.textContent = `By ${book.author}`;

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
    percentage.textContent = `${getProgress(book)}% complete`;

    const status = document.createElement("p");
    status.textContent = `Status: ${book.status}`;

    const editButton = document.createElement("button");
    editButton.textContent = "Update Pages";
    editButton.addEventListener("click", () => {
      const input = prompt(
        `How many pages have you read in "${book.title}"?`,
        book.pagesRead
      );

      if (input === null) return;

      const newPages = Number(input);

      try {
        updateBook(book.id, { pagesRead: newPages });
        renderBooks();
      } catch (error) {
        alert(error.message);
      }
    });

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete Book";
    deleteButton.addEventListener("click", () => {
      if (confirm(`Delete "${book.title}"?`)) {
        deleteBook(book.id);
        renderBooks();
      }
    });

    card.append(
      title,
      author,
      pages,
      progress,
      percentage,
      status,
      editButton,
      deleteButton
    );

    container.appendChild(card);
  });
}

// Connect the add-book form to the JavaScript
const bookForm = document.getElementById("book-form");

if (bookForm) {
  bookForm.addEventListener("submit", event => {
    event.preventDefault();

    const formData = new FormData(bookForm);

    try {
      addBook({
        title: formData.get("title"),
        author: formData.get("author"),
        totalPages: formData.get("totalPages"),
        pagesRead: formData.get("pagesRead"),
        status: formData.get("status"),
        rating: formData.get("rating"),
        notes: formData.get("notes")
      });

      bookForm.reset();
      renderBooks();
    } catch (error) {
      alert(error.message);
    }
  });
}

// Connect the search field
const searchInput = document.getElementById("search");

if (searchInput) {
  searchInput.addEventListener("input", () => {
    renderBooks(searchBooks(searchInput.value));
  });
}

// Show saved books when the page opens
renderBooks();
