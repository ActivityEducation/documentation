import React, { useState, useEffect, useRef, useMemo } from 'react';

// --- Custom Styles for Docusaurus Theming ---
const DocusaurusStyles = () => (
    <style>{`
        .book-library-container {
            max-width: 1140px;
            margin: 0 auto;
            padding: 2rem 1rem;
        }

        .library-header {
            text-align: center;
            margin-bottom: 2rem;
        }

        .library-toolbar {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            align-items: center;
            gap: 1rem;
            padding: 1rem;
            background-color: var(--ifm-card-background-color);
            border-radius: var(--ifm-card-border-radius);
            margin-bottom: 2rem;
            border: 1px solid var(--ifm-color-emphasis-200);
        }

        .toolbar-main-actions,
        .toolbar-secondary-actions {
             display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            align-items: center;
        }
        
        .library-toolbar input,
        .library-toolbar select {
            padding: 0.5rem 0.75rem;
            border: 1px solid var(--ifm-color-emphasis-300);
            border-radius: var(--ifm-border-radius);
            background-color: var(--ifm-background-color);
            color: var(--ifm-font-color-base);
            height: 2.4rem;
        }

        .book-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 1.5rem;
        }

        .book-card-footer {
            display: flex;
            justify-content: flex-end;
            gap: 0.5rem;
        }
        
        .book-form-grid {
             display: grid;
             grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
             gap: 1.5rem;
        }

        .book-form-grid label {
            display: block;
            font-weight: bold;
            margin-bottom: 0.5rem;
            font-size: 0.9rem;
        }

        .book-form-grid input,
        .book-form-grid textarea {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid var(--ifm-color-emphasis-300);
            border-radius: var(--ifm-border-radius);
            background-color: var(--ifm-background-color);
            color: var(--ifm-font-color-base);
            font-size: var(--ifm-font-size-base);
        }

        .book-form-grid input:focus,
        .book-form-grid textarea:focus {
            outline: none;
            border-color: var(--ifm-color-primary);
            box-shadow: 0 0 0 2px var(--ifm-color-primary-lightest);
        }

        .form-span-all {
            grid-column: 1 / -1;
        }

        .book-form-card {
            border-color: var(--ifm-color-primary);
        }
        
        .book-form-card .card__header h2 {
            color: var(--ifm-color-primary);
        }

        /* Typeahead Styles */
        .typeahead-container {
            position: relative;
        }

        .typeahead-suggestions {
            position: absolute;
            background-color: var(--ifm-card-background-color);
            border: 1px solid var(--ifm-color-emphasis-300);
            border-radius: var(--ifm-border-radius);
            list-style-type: none;
            margin: 0.25rem 0 0;
            padding: 0;
            width: 100%;
            z-index: 10;
            box-shadow: var(--ifm-global-shadow-lw);
            max-height: 200px;
            overflow-y: auto;
        }

        .typeahead-suggestions li {
            padding: 0.75rem;
            cursor: pointer;
        }

        .typeahead-suggestions li:hover {
            background-color: var(--ifm-color-emphasis-100);
        }
    `}</style>
);


// --- Main App Component ---
const App = () => {
    return (
        <>
            <DocusaurusStyles />
            <BookLibrary />
        </>
    );
};


// --- Book Library Component (The main app view) ---
const BookLibrary = () => {
    const [books, setBooks] = useState([]);
    const [filteredBooks, setFilteredBooks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formMode, setFormMode] = useState(null); // 'add', 'edit', or null
    const [currentBook, setCurrentBook] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterGenre, setFilterGenre] = useState('');
    const importFileRef = useRef(null);

    // --- LocalStorage Data Fetching ---
    useEffect(() => {
        try {
            const storedBooks = localStorage.getItem('my-book-library');
            if (storedBooks) {
                setBooks(JSON.parse(storedBooks));
            }
        } catch (e) {
            setError("Could not load books from local storage.");
            console.error(e);
        }
        setIsLoading(false);
    }, []);

    // --- Persist data to LocalStorage on change ---
    useEffect(() => {
        if (!isLoading) {
            try {
                localStorage.setItem('my-book-library', JSON.stringify(books));
            } catch (e) {
                setError("Could not save books to local storage.");
                console.error(e);
            }
        }
    }, [books, isLoading]);


    // --- Search and Filter Logic ---
    useEffect(() => {
        let tempBooks = books.filter(book => 
            (book.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (book.author?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        );
        if (filterGenre) {
            tempBooks = tempBooks.filter(book => book.genre === filterGenre);
        }
        setFilteredBooks(tempBooks);
    }, [searchTerm, filterGenre, books]);

    // --- Form Handlers ---
    const handleShowAddForm = () => {
        setCurrentBook(null);
        setFormMode('add');
    };

    const handleShowEditForm = (book) => {
        setCurrentBook(book);
        setFormMode('edit');
    };

    const handleCancelForm = () => {
        setFormMode(null);
        setCurrentBook(null);
    };

    const handleSubmitForm = (formData) => {
        try {
            if (formMode === 'add') {
                const newBook = { ...formData, id: crypto.randomUUID() };
                setBooks([...books, newBook]);
            } else if (formMode === 'edit' && currentBook) {
                setBooks(books.map(b => b.id === currentBook.id ? { ...formData, id: currentBook.id } : b));
            }
            handleCancelForm();
        } catch (e) {
            console.error("Error submitting form: ", e);
            setError("Failed to save the book.");
        }
    };

    const handleDeleteBook = (id) => {
        if (window.confirm("Are you sure you want to delete this book?")) {
            try {
                setBooks(books.filter(b => b.id !== id));
            } catch (e) {
                console.error("Error deleting book: ", e);
                setError("Failed to delete the book.");
            }
        }
    };
    
    // --- Import/Export Handlers ---
    const handleExport = () => {
        const dataStr = JSON.stringify(books, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = 'my-book-library.json';
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    const handleImport = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedBooks = JSON.parse(e.target.result);
                if (!Array.isArray(importedBooks)) {
                    throw new Error("Imported file is not a valid book array.");
                }
                if (window.confirm("Are you sure you want to overwrite your current library with the imported data?")) {
                    setBooks(importedBooks);
                }
            } catch (err) {
                setError("Failed to import file. Please make sure it's a valid JSON file exported from this app.");
                console.error(err);
            }
        };
        reader.readAsText(file);
        event.target.value = null; 
    };

    // --- Memoized lists for typeahead ---
    const uniqueAuthors = useMemo(() => [...new Set(books.map(b => b.author).filter(Boolean))], [books]);
    const uniqueGenres = useMemo(() => [...new Set(books.map(b => b.genre).filter(Boolean))], [books]);
    const uniqueLocations = useMemo(() => [...new Set(books.map(b => b.location).filter(Boolean))], [books]);
    const uniqueTags = useMemo(() => [...new Set(books.flatMap(b => (b.tags || '').split(',')).map(t => t.trim()).filter(Boolean))], [books]);

    return (
        <div className="book-library-container">
            <header className="library-header">
                 <h1>Personal Library Manager</h1>
                 <p className="p--small">Data stored locally in your browser</p>
            </header>

            {error && <div className="alert alert--danger margin-bottom--lg" role="alert">{error}</div>}

            <div className="library-toolbar">
                <div className="toolbar-main-actions">
                    <button onClick={handleShowAddForm} className="button button--primary" disabled={formMode === 'add'}>Add New Book</button>
                    <button onClick={() => importFileRef.current.click()} className="button button--secondary">Import</button>
                    <button onClick={handleExport} className="button button--secondary">Export</button>
                    <input type="file" ref={importFileRef} style={{display: 'none'}} accept=".json" onChange={handleImport} />
                </div>
                <div className="toolbar-secondary-actions">
                    <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    <select value={filterGenre} onChange={(e) => setFilterGenre(e.target.value)}>
                        <option value="">All Genres</option>
                        {uniqueGenres.map(genre => <option key={genre} value={genre}>{genre}</option>)}
                    </select>
                </div>
            </div>
            
            {formMode && (
                <BookForm 
                    mode={formMode} 
                    initialData={currentBook} 
                    onSubmit={handleSubmitForm} 
                    onCancel={handleCancelForm}
                    suggestions={{ uniqueAuthors, uniqueGenres, uniqueLocations, uniqueTags }}
                />
            )}

            {isLoading ? (
                <div style={{textAlign: 'center', padding: '2rem'}}><p>Loading your books...</p></div>
            ) : (
                filteredBooks.length > 0 ? (
                    <div className="book-grid">
                        {filteredBooks.map(book => <BookCard key={book.id} book={book} onEdit={handleShowEditForm} onDelete={handleDeleteBook} />)}
                    </div>
                ) : (
                    <div className="card">
                        <div className="card__body" style={{ textAlign: 'center' }}>
                            <p>No books found.</p>
                        </div>
                    </div>
                )
            )}
        </div>
    );
};

// --- Typeahead Input Component ---
const TypeaheadInput = ({ value, name, placeholder, required, suggestions, onChange, isTags = false }) => {
    const [filteredSuggestions, setFilteredSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const handleChange = (e) => {
        const userInput = e.target.value;
        let currentQuery = userInput;

        if (isTags) {
            const parts = userInput.split(',');
            currentQuery = parts[parts.length - 1].trim();
        }

        if (currentQuery) {
            const filtered = suggestions.filter(
                (suggestion) => suggestion.toLowerCase().indexOf(currentQuery.toLowerCase()) > -1
            );
            setFilteredSuggestions(filtered);
        } else {
            setFilteredSuggestions([]);
        }
        
        setShowSuggestions(true);
        onChange(e); 
    };

    const handleClick = (suggestion) => {
        let newValue = suggestion;
        if (isTags) {
            const parts = value.split(',');
            parts[parts.length - 1] = suggestion;
            newValue = parts.join(', ');
        }
        
        onChange({ target: { name, value: newValue } });
        setFilteredSuggestions([]);
        setShowSuggestions(false);
    };

    return (
        <div className="typeahead-container">
            <input
                type="text"
                name={name}
                value={value}
                onChange={handleChange}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder={placeholder}
                required={required}
                autoComplete="off"
            />
            {showSuggestions && filteredSuggestions.length > 0 && (
                <ul className="typeahead-suggestions">
                    {filteredSuggestions.map((suggestion) => (
                        <li key={suggestion} onMouseDown={() => handleClick(suggestion)}>
                            {suggestion}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

// --- Inline Book Form Component ---
const BookForm = ({ mode, initialData, onSubmit, onCancel, suggestions }) => {
    const [formData, setFormData] = useState({
        title: '', author: '', genre: '', year: '', summary: '',
        location: '', isbn10: '', isbn13: '', tags: ''
    });

    useEffect(() => {
        setFormData({
            title: initialData?.title || '',
            author: initialData?.author || '',
            genre: initialData?.genre || '',
            year: initialData?.year || '',
            summary: initialData?.summary || '',
            location: initialData?.location || '',
            isbn10: initialData?.isbn10 || '',
            isbn13: initialData?.isbn13 || '',
            tags: initialData?.tags || '',
        });
    }, [initialData, mode]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSubmit = (e) => { e.preventDefault(); onSubmit(formData); };

    return (
        <div className="card book-form-card margin-bottom--lg">
            <div className="card__header">
                <h2>{mode === 'add' ? 'Add a New Book' : `Editing: ${initialData.title}`}</h2>
            </div>
            <div className="card__body">
                <form onSubmit={handleSubmit}>
                    <div className="book-form-grid">
                        {/* Main Details */}
                        <div>
                            <label>Title*</label>
                            <input type="text" name="title" value={formData.title} onChange={handleChange} required />
                        </div>
                        <div>
                            <label>Author*</label>
                            <TypeaheadInput name="author" value={formData.author} onChange={handleChange} suggestions={suggestions.uniqueAuthors} required />
                        </div>
                        <div>
                            <label>Genre*</label>
                            <TypeaheadInput name="genre" value={formData.genre} onChange={handleChange} suggestions={suggestions.uniqueGenres} required />
                        </div>
                        <div>
                            <label>Year Published*</label>
                            <input type="number" name="year" value={formData.year} onChange={handleChange} required />
                        </div>

                        {/* Location & Tags */}
                        <div>
                            <label>Location</label>
                            <TypeaheadInput name="location" value={formData.location} onChange={handleChange} suggestions={suggestions.uniqueLocations} placeholder="e.g., Living Room Shelf" />
                        </div>
                        <div>
                            <label>Tags</label>
                            <TypeaheadInput name="tags" value={formData.tags} onChange={handleChange} suggestions={suggestions.uniqueTags} placeholder="e.g., Signed, Favorite" isTags={true} />
                        </div>

                        {/* ISBN Group */}
                        <div>
                            <label>ISBN-13</label>
                            <input type="text" name="isbn13" value={formData.isbn13} onChange={handleChange} />
                        </div>
                        <div>
                            <label>ISBN-10</label>
                            <input type="text" name="isbn10" value={formData.isbn10} onChange={handleChange} />
                        </div>
                        
                        {/* Summary */}
                        <div className="form-span-all">
                            <label>Summary*</label>
                            <textarea name="summary" value={formData.summary} onChange={handleChange} rows="4" required />
                        </div>
                    </div>
                    <div className="card__footer">
                         <div className="book-card-footer">
                            <button type="button" onClick={onCancel} className="button button--secondary">Cancel</button>
                            <button type="submit" className="button button--primary">Save Book</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --- Book Card Component ---
const BookCard = ({ book, onEdit, onDelete }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const SUMMARY_MAX_LENGTH = 200;

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };

    const summaryIsLong = book.summary.length > SUMMARY_MAX_LENGTH;
    const displayedSummary = summaryIsLong && !isExpanded 
        ? `${book.summary.substring(0, SUMMARY_MAX_LENGTH)}...` 
        : book.summary;

    return (
        <div className="card">
            <div className="card__body">
                <h3>{book.title}</h3>
                <p>by <strong>{book.author}</strong></p>
                <div style={{marginBottom: '1rem'}}>
                    <span className="badge badge--primary margin-right--xs">{book.genre}</span>
                    <span className="badge badge--secondary">Published: {book.year}</span>
                </div>
                <p className="p--small" style={{whiteSpace: 'pre-wrap'}}>
                    {displayedSummary}
                </p>
                {summaryIsLong && (
                    <button onClick={toggleExpanded} className="button button--link button--sm" style={{paddingLeft: 0, marginTop: '0.5rem'}}>
                        {isExpanded ? 'Show less' : 'Show more'}
                    </button>
                )}
                
                {book.tags && (
                     <div style={{paddingTop: '1rem', marginTop: '1rem', borderTop: '1px solid var(--ifm-color-emphasis-200)', display: 'flex', flexWrap: 'wrap', gap: '0.5rem'}}>
                        {book.tags.split(',').map(tag => tag.trim()).filter(Boolean).map(tag => (
                            <span key={tag} className="badge badge--success">{tag}</span>
                        ))}
                    </div>
                )}

                {(book.location || book.isbn10 || book.isbn13) && (
                    <div style={{paddingTop: '1rem', marginTop: '1rem', borderTop: '1px solid var(--ifm-color-emphasis-200)', fontSize: '0.8rem'}}>
                        {book.location && (
                            <p><strong>Location:</strong> {book.location}</p>
                        )}
                        {book.isbn13 && (
                            <p><strong>ISBN-13:</strong> {book.isbn13}</p>
                        )}
                        {book.isbn10 && (
                            <p><strong>ISBN-10:</strong> {book.isbn10}</p>
                        )}
                    </div>
                )}
            </div>
            <div className="card__footer">
                <div className="book-card-footer">
                    <button onClick={() => onEdit(book)} className="button button--link button--sm">Edit</button>
                    <button onClick={() => onDelete(book.id)} className="button button--link button--sm text--danger">Delete</button>
                </div>
            </div>
        </div>
    );
};

export default App;
