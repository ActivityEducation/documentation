import React, { useState, useEffect, useMemo, useCallback } from 'react';

/*
  NOTE: This application is styled using a CSS-in-JS approach.
  All styles are defined as JavaScript objects within the component file.
*/

// --- Global Styles ---
const GlobalStyles = () => (
  <style>{`
    body { 
      font-family: 'Inter', sans-serif; 
      background-color: #f8fafc; 
      margin: 0;
    }
    h1, h2, h3, h4, h5, h6 { 
      font-family: 'Lora', serif; 
    }
    .star-rating span { 
      transition: color 0.2s; 
    }
  `}</style>
);
const FontImports = () => (
    <link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400..700;1,400..700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
);


// --- SVG Icons ---
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" style={{height: '1rem', width: '1rem', marginRight: '0.5rem'}} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
const ImportIcon = () => <svg xmlns="http://www.w3.org/2000/svg" style={{height: '1rem', width: '1rem', marginRight: '0.5rem'}} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;
const ExportIcon = () => <svg xmlns="http://www.w3.org/2000/svg" style={{height: '1rem', width: '1rem', marginRight: '0.5rem'}} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" style={{height: '1rem', width: '1rem', marginRight: '0.5rem'}} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const FilterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" style={{height: '1rem', width: '1rem', marginRight: '0.5rem'}} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L12 14.414V19a1 1 0 01-1.447.894L7 18a1 1 0 01-.553-.894v-3.586L3.293 6.707A1 1 0 013 6V4z" /></svg>;
const MoreIcon = () => <svg xmlns="http://www.w3.org/2000/svg" style={{height: '1.25rem', width: '1.25rem'}} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>;


// --- Helper Functions ---
const getInitialData = (key, defaultValue) => {
  try {
    const savedData = localStorage.getItem(key);
    return savedData ? JSON.parse(savedData) : defaultValue;
  } catch (error) {
    console.error(`Failed to parse ${key} from localStorage`, error);
    return defaultValue;
  }
};

const saveData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Failed to save ${key} to localStorage`, error);
  }
};

const defaultSettings = {
    resultsPerPage: 8,
    statuses: [
        { id: 's1', label: 'Available', color: '#22c55e', core: true },
        { id: 's2', label: 'Checked Out', color: '#ef4444', core: true },
        { id: 's3', label: 'Wishlist', color: '#3b82f6', core: false },
    ]
};

const APP_VERSION = 2;

// --- Main App Component ---
export default function App() {
  // --- State ---
  const [settings, setSettings] = useState(() => getInitialData('my-media-settings', defaultSettings));
  const [mediaItems, setMediaItems] = useState(() => getInitialData('my-media-library', []));
  const [filteredItems, setFilteredItems] = useState([]);
  const [formState, setFormState] = useState({ visible: false, mode: 'add', item: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [mediaTypeFilter, setMediaTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [ratingFilter, setRatingFilter] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedSummaries, setExpandedSummaries] = useState({});
  const [checkoutModal, setCheckoutModal] = useState({ visible: false, itemId: null });
  const [confirmationModal, setConfirmationModal] = useState({ visible: false, message: '', onConfirm: null });
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [openStatusMenu, setOpenStatusMenu] = useState(null);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // --- Effects ---
  useEffect(() => { saveData('my-media-library', mediaItems); }, [mediaItems]);
  useEffect(() => { saveData('my-media-settings', settings); }, [settings]);

  useEffect(() => {
    let currentItems = [...mediaItems];
    if (searchTerm) {
      currentItems = currentItems.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.creator && item.creator.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (mediaTypeFilter !== 'all') currentItems = currentItems.filter(item => item.mediaType === mediaTypeFilter);
    if (statusFilter !== 'all') currentItems = currentItems.filter(item => item.status === statusFilter);
    if (selectedGenres.length > 0) {
        currentItems = currentItems.filter(item => item.genre && selectedGenres.includes(item.genre));
    }
    if (ratingFilter > 0) {
        currentItems = currentItems.filter(item => item.rating >= ratingFilter);
    }
    setFilteredItems(currentItems);
    setCurrentPage(1);
  }, [mediaItems, searchTerm, mediaTypeFilter, statusFilter, selectedGenres, ratingFilter]);
  
  useEffect(() => {
    const closeMenus = () => {
        setOpenStatusMenu(null);
        setIsMoreMenuOpen(false);
    };
    window.addEventListener('click', closeMenus);
    return () => window.removeEventListener('click', closeMenus);
  }, []);

  // --- Memoized Values ---
  const allGenres = useMemo(() => [...new Set(mediaItems.map(i => i.genre).filter(Boolean).sort())], [mediaItems]);
  const paginatedItems = useMemo(() => filteredItems.slice((currentPage - 1) * settings.resultsPerPage, currentPage * settings.resultsPerPage), [filteredItems, currentPage, settings.resultsPerPage]);
  const totalPages = useMemo(() => Math.ceil(filteredItems.length / settings.resultsPerPage), [filteredItems, settings.resultsPerPage]);

  // --- Handlers ---
  const handleShowForm = (mode = 'add', item = null) => setFormState({ visible: true, mode, item });
  const handleHideForm = () => setFormState({ visible: false, mode: 'add', item: null });
  const handleSaveItem = (itemData) => {
    if (formState.mode === 'add') {
      const defaultStatus = settings.statuses[0]?.label || 'Available';
      setMediaItems(prev => [...prev, { ...itemData, id: crypto.randomUUID(), status: itemData.status || defaultStatus, dateAdded: new Date().toISOString() }]);
    } else {
      setMediaItems(prev => prev.map(i => i.id === itemData.id ? { ...i, ...itemData } : i));
    }
    handleHideForm();
  };
  const handleDeleteItem = useCallback((itemId) => {
    setConfirmationModal({ visible: true, message: 'Are you sure you want to permanently delete this item?', onConfirm: () => {
      setMediaItems(prev => prev.filter(i => i.id !== itemId));
      setConfirmationModal({ visible: false, message: '', onConfirm: null });
    }});
  }, []);
  
  const handleUpdateStatus = (itemId, newStatus) => {
    if (newStatus === 'Checked Out') {
        setCheckoutModal({ visible: true, itemId: itemId });
        return;
    }
    setMediaItems(prevItems => prevItems.map(item => {
        if (item.id === itemId) {
            const updatedItem = { ...item, status: newStatus };
            if (item.status === 'Checked Out') {
                updatedItem.borrower = '';
                updatedItem.checkoutDate = null;
                updatedItem.dueDate = null;
            }
            return updatedItem;
        }
        return item;
    }));
  };

  const handleCheckout = (borrower) => {
    if (!borrower.trim() || !checkoutModal.itemId) return;
    const checkoutDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(checkoutDate.getDate() + 14);
    setMediaItems(prev => prev.map(i => i.id === checkoutModal.itemId ? { ...i, status: 'Checked Out', borrower: borrower.trim(), checkoutDate: checkoutDate.toISOString(), dueDate: dueDate.toISOString() } : i));
    setCheckoutModal({ visible: false, itemId: null });
  };
  
  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        
        // Version 2+ import
        if (importedData.version && importedData.version >= 2) {
            setConfirmationModal({ visible: true, message: 'This will overwrite your current library and settings. Continue?', onConfirm: () => {
                setMediaItems(importedData.mediaItems || []);
                setSettings(importedData.settings || defaultSettings);
                setConfirmationModal({ visible: false, message: '', onConfirm: null });
            }});
        } 
        // Legacy (Version 1) import
        else if (Array.isArray(importedData)) {
            setConfirmationModal({ visible: true, message: 'Legacy library file detected. This will overwrite your current library items but preserve your settings. Continue?', onConfirm: () => {
                const sanitizedData = importedData.map(item => ({ 
                    mediaType: 'Book', 
                    status: 'Available', 
                    borrower: '', 
                    checkoutDate: null, 
                    dueDate: null, 
                    dateAdded: new Date().toISOString(), 
                    rating: 0, 
                    ...item 
                }));
                setMediaItems(sanitizedData);
                setConfirmationModal({ visible: false, message: '', onConfirm: null });
            }});
        } else {
            alert('Invalid or unrecognized file format.');
        }

      } catch (error) { 
        alert('Error reading or parsing the file.'); 
        console.error("Import error:", error);
      }
    };
    reader.readAsText(file);
    event.target.value = null; // Reset file input
  };

  const handleExport = () => {
    const exportData = {
        version: APP_VERSION,
        settings: settings,
        mediaItems: mediaItems
    };
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', 'my-media-library.json');
    linkElement.click();
  };
  const toggleSummary = (itemId) => setExpandedSummaries(prev => ({...prev, [itemId]: !prev[itemId]}));

  // --- Sub-components ---
  const FilterCard = ({ settings }) => (
    <>
        {isFiltersVisible && (
            <div style={styles.filterCard}>
                <h3 style={styles.formTitleFilter}>Catalog Filters</h3>
                <div style={styles.filterGrid}>
                    <div>
                        <label htmlFor="search" style={styles.label}>Search</label>
                        <input type="text" id="search" placeholder="Title or creator..." style={styles.input} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div>
                        <label style={styles.label}>Rating</label>
                        <div style={styles.starRatingContainer}>
                            {[1, 2, 3, 4, 5].map(star => (
                                <span key={star} onClick={() => setRatingFilter(prev => prev === star ? 0 : star)} style={{...styles.star, color: star <= ratingFilter ? '#f59e0b' : '#d1d5db'}} className="hover:text-amber-300">★</span>
                            ))}
                            {ratingFilter > 0 && (<button onClick={() => setRatingFilter(0)} style={styles.clearButton}>clear</button>)}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="mediaType" style={styles.label}>Media Type</label>
                        <select id="mediaType" value={mediaTypeFilter} onChange={(e) => setMediaTypeFilter(e.target.value)} style={styles.input}>
                            <option value="all">All Media Types</option>
                            <option value="Book">Book</option><option value="Movie">Movie</option><option value="Music">Music</option><option value="Game">Game</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="status" style={styles.label}>Status</label>
                        <select id="status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={styles.input}>
                            <option value="all">All Statuses</option>
                            {settings.statuses.map(status => <option key={status.id} value={status.label}>{status.label}</option>)}
                        </select>
                    </div>
                    <div style={{gridColumn: 'span 2 / span 2'}}>
                        <label style={styles.label}>Genre</label>
                        <div style={styles.genreList}>
                            {allGenres.map(genre => (
                                <div key={genre} style={styles.checkboxContainer}>
                                    <input id={`genre-${genre}`} type="checkbox" checked={selectedGenres.includes(genre)} onChange={() => setSelectedGenres(prev => prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre])} style={styles.checkbox} />
                                    <label htmlFor={`genre-${genre}`} style={styles.checkboxLabel}>{genre}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}
    </>
  );

  const MediaForm = ({ item, onSave, onCancel, settings }) => {
    const [formData, setFormData] = useState({ mediaType: 'Book', title: '', creator: '', genre: '', year: '', summary: '', location: '', tags: '', rating: 0, platform: '', status: settings.statuses[0]?.label || '', ...item });
    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSubmit = (e) => {
      e.preventDefault();
      if (!formData.title || !formData.creator) { alert('Please fill in Title and Creator fields.'); return; }
      onSave(formData);
    };
    const creatorLabel = { Book: 'Author', Movie: 'Director', Music: 'Artist', Game: 'Developer' }[formData.mediaType] || 'Creator';
    return (
      <div style={styles.formContainer}>
        <h3 style={styles.formTitle}>{item ? 'Edit Item' : 'Add New Item'}</h3>
        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
          <div style={styles.formGrid}>
            <div>
              <label style={styles.label}>Media Type <span style={{color: '#ef4444'}}>*</span></label>
              <select name="mediaType" value={formData.mediaType} onChange={handleChange} style={styles.input}>
                <option>Book</option><option>Movie</option><option>Music</option><option>Game</option>
              </select>
            </div>
            <div style={{gridColumn: 'span 2 / span 2'}}>
              <label style={styles.label}>Title <span style={{color: '#ef4444'}}>*</span></label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} required style={styles.input}/>
            </div>
            <div>
              <label style={styles.label}>{creatorLabel} <span style={{color: '#ef4444'}}>*</span></label>
              <input type="text" name="creator" value={formData.creator} onChange={handleChange} required style={styles.input}/>
            </div>
            <div>
              <label style={styles.label}>Genre</label>
              <input type="text" name="genre" value={formData.genre} onChange={handleChange} style={styles.input}/>
            </div>
            <div>
              <label style={styles.label}>Year</label>
              <input type="number" name="year" value={formData.year} onChange={handleChange} style={styles.input}/>
            </div>
            {formData.mediaType === 'Game' && (
              <div>
                <label style={styles.label}>Platform</label>
                <input type="text" name="platform" value={formData.platform} onChange={handleChange} style={styles.input}/>
              </div>
            )}
             <div>
              <label style={styles.label}>Status</label>
              <select name="status" value={formData.status} onChange={handleChange} style={styles.input}>
                {settings.statuses.map(s => <option key={s.id} value={s.label}>{s.label}</option>)}
              </select>
            </div>
             <div>
                <label style={styles.label}>Your Rating</label>
                <div style={{...styles.starRatingContainer, marginTop: '0.5rem'}}>
                    {[1, 2, 3, 4, 5].map(star => <span key={star} onClick={() => setFormData(f => ({...f, rating: star}))} style={{...styles.star, fontSize: '2rem', color: star <= formData.rating ? '#f59e0b' : '#d1d5db'}} className="hover:text-amber-300">★</span>)}
                </div>
            </div>
          </div>
          <div>
              <label style={styles.label}>Summary</label>
              <textarea name="summary" value={formData.summary} onChange={handleChange} rows="4" style={{...styles.input, height: 'auto'}}></textarea>
          </div>
          <div style={styles.formActions}>
            <button type="button" style={styles.buttonSecondary} onClick={onCancel}>Cancel</button>
            <button type="submit" style={styles.buttonPrimary}>Save Item</button>
          </div>
        </form>
      </div>
    );
  };

  const MediaCard = ({ item, settings, onUpdateStatus, openStatusMenu, setOpenStatusMenu }) => {
    const isExpanded = !!expandedSummaries[item.id];
    const isOverdue = item.status === 'Checked Out' && item.dueDate && new Date(item.dueDate) < new Date();
    const isStatusMenuOpen = openStatusMenu === item.id;
    
    const statusInfo = settings.statuses.find(s => s.label === item.status) || { label: item.status, color: '#64748b' };
    const creatorLabel = { Book: 'by', Movie: 'dir.', Music: 'by', Game: 'dev.' }[item.mediaType] || 'by';

    return (
        <div style={styles.card}>
            <div style={styles.cardContent}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem'}}>
                    <h3 style={styles.cardTitle}>{item.title}</h3>
                    <span style={{...styles.badge, backgroundColor: statusInfo.color }}>{statusInfo.label}</span>
                </div>
                <p style={styles.cardSubtitle}>{creatorLabel} {item.creator} ({item.year})</p>
                <div style={styles.starRatingContainer}>
                    {[1, 2, 3, 4, 5].map(star => <span key={star} style={{...styles.star, fontSize: '1.25rem', color: star <= item.rating ? '#f59e0b' : '#d1d5db'}}>★</span>)}
                </div>
                <p style={styles.cardSummary}>
                    {isExpanded || !item.summary || item.summary.length <= 150 ? item.summary : `${item.summary.substring(0, 150)}...`}
                    {item.summary && item.summary.length > 150 && (<button onClick={() => toggleSummary(item.id)} style={styles.showMoreButton}> {isExpanded ? 'Show less' : 'Show more'}</button>)}
                </p>
                {item.status === 'Checked Out' && (<div style={{...styles.infoBox, borderLeftColor: isOverdue ? '#fecaca' : '#bfdbfe', backgroundColor: isOverdue ? '#fef2f2' : '#eff6ff'}}><p style={{color: isOverdue ? '#991b1b' : '#1e40af'}}><strong>Checked out by:</strong> {item.borrower}</p><p style={{color: isOverdue ? '#991b1b' : '#1e40af'}}><strong>Due Date:</strong> <span style={{fontWeight: isOverdue ? 'bold' : 'normal'}}>{new Date(item.dueDate).toLocaleDateString()}</span></p></div>)}
            </div>
            <div style={styles.cardActions}>
                <div style={{position: 'relative', display: 'inline-block', textAlign: 'left'}}>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setOpenStatusMenu(isStatusMenuOpen ? null : item.id); }}
                        style={styles.buttonSmall}
                    >
                        Update Status
                    </button>
                    {isStatusMenuOpen && (
                        <div style={{...styles.dropdownMenu, bottom: '100%', top: 'auto'}}>
                            <div style={{padding: '0.25rem 0'}}>
                                {settings.statuses.map(s => (
                                    <a
                                        key={s.id}
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            onUpdateStatus(item.id, s.label);
                                            setOpenStatusMenu(null);
                                        }}
                                        style={styles.dropdownItem}
                                    >
                                        {s.label}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <button style={styles.buttonSmall} onClick={() => handleShowForm('edit', item)}>Edit</button>
                <button style={{...styles.buttonSmall, backgroundColor: '#fee2e2', color: '#b91c1c'}} onClick={() => handleDeleteItem(item.id)}>Delete</button>
            </div>
        </div>
    );
  };
  
  const Modal = ({ visible, onClose, title, children, size = 'max-w-md' }) => {
    if (!visible) return null;
    const sizeMap = {
        'max-w-md': '28rem',
        'max-w-2xl': '42rem'
    }
    return (<div style={styles.modalOverlay} onClick={onClose}><div style={{...styles.modalContent, maxWidth: sizeMap[size]}} onClick={e => e.stopPropagation()}><div style={styles.modalHeader}><h2 style={styles.modalTitle}>{title}</h2><button onClick={onClose} style={styles.closeButton}>&times;</button></div><div style={{padding: '1.25rem'}}>{children}</div></div></div>);
  };

  const SettingsModal = ({ settings, onSave, onClose }) => {
    const [localSettings, setLocalSettings] = useState(JSON.parse(JSON.stringify(settings))); // Deep copy

    const handleStatusChange = (id, field, value) => {
        setLocalSettings(prev => ({
            ...prev,
            statuses: prev.statuses.map(s => s.id === id ? { ...s, [field]: value } : s)
        }));
    };

    const handleAddStatus = () => {
        setLocalSettings(prev => ({
            ...prev,
            statuses: [...prev.statuses, { id: crypto.randomUUID(), label: 'New Status', color: '#cccccc', core: false }]
        }));
    };

    const handleRemoveStatus = (id) => {
        setLocalSettings(prev => ({
            ...prev,
            statuses: prev.statuses.filter(s => s.id !== id)
        }));
    };

    return (
        <Modal visible={true} onClose={onClose} title="Settings" size="max-w-2xl">
            <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
                <div>
                    <h3 style={styles.settingsSectionTitle}>Results Per Page</h3>
                    <input 
                        type="number" 
                        value={localSettings.resultsPerPage}
                        onChange={e => setLocalSettings(p => ({...p, resultsPerPage: parseInt(e.target.value, 10) || 1 }))}
                        style={styles.input}
                    />
                </div>
                <div>
                    <h3 style={styles.settingsSectionTitle}>Status Labels</h3>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                        {localSettings.statuses.map(status => (
                            <div key={status.id} style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                <input 
                                    type="color" 
                                    value={status.color}
                                    onChange={e => handleStatusChange(status.id, 'color', e.target.value)}
                                    style={styles.colorInput}
                                />
                                <input 
                                    type="text" 
                                    value={status.label}
                                    onChange={e => handleStatusChange(status.id, 'label', e.target.value)}
                                    disabled={status.core}
                                    style={{...styles.input, flexGrow: 1, backgroundColor: status.core ? '#f3f4f6': 'white', cursor: status.core ? 'not-allowed' : 'text'}}
                                />
                                <button 
                                    onClick={() => handleRemoveStatus(status.id)} 
                                    disabled={status.core}
                                    style={{...styles.iconButton, color: status.core ? '#9ca3af' : '#ef4444', cursor: status.core ? 'not-allowed' : 'pointer'}}
                                    title={status.core ? "This is a core status and cannot be removed." : "Remove status"}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" style={{height: '1.25rem', width: '1.25rem'}} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                    <button onClick={handleAddStatus} style={{...styles.buttonSmall, marginTop: '0.5rem'}}>Add Status</button>
                </div>
            </div>
            <div style={styles.modalActions}>
                <button style={styles.buttonSecondary} onClick={onClose}>Cancel</button>
                <button style={styles.buttonPrimary} onClick={() => onSave(localSettings)}>Save Settings</button>
            </div>
        </Modal>
    );
  };

  const CheckoutModal = ({ settings, ...props }) => {
    const [borrower, setBorrower] = useState('');
    return (<Modal visible={props.visible} onClose={props.onClose} title="Check Out Item"><p style={{color: '#475569', marginBottom: '1rem'}}>Enter the borrower's name.</p><input type="text" value={borrower} onChange={e => setBorrower(e.target.value)} placeholder="Borrower's Name" autoFocus style={styles.input}/><div style={styles.modalActions}><button style={styles.buttonSecondary} onClick={props.onClose}>Cancel</button><button style={{...styles.buttonPrimary, opacity: !borrower.trim() ? 0.5 : 1}} onClick={() => handleCheckout(borrower)} disabled={!borrower.trim()}>Confirm</button></div></Modal>);
  };

  const ConfirmationModal = (props) => (<Modal visible={props.visible} onClose={props.onClose} title="Are you sure?"><p style={{color: '#475569'}}>{props.message}</p><div style={styles.modalActions}><button style={styles.buttonSecondary} onClick={props.onClose}>Cancel</button><button style={{...styles.buttonPrimary, backgroundColor: '#dc2626'}} onClick={props.onConfirm}>Confirm</button></div></Modal>);

  return (
    <>
      <GlobalStyles />
      <FontImports />
      <div style={styles.appContainer}>
        <header style={styles.header}>
          <h1 style={styles.mainTitle}>Library Manager</h1>
          <div style={styles.headerActions}>
            <button style={styles.buttonHeader} onClick={() => setIsFiltersVisible(!isFiltersVisible)}><FilterIcon/>Filters</button>
            <div style={{position: 'relative'}}>
                <button style={styles.buttonHeader} onClick={(e) => { e.stopPropagation(); setIsMoreMenuOpen(!isMoreMenuOpen); }}><MoreIcon/></button>
                {isMoreMenuOpen && (
                    <div style={styles.headerDropdownMenu} onClick={(e) => e.stopPropagation()}>
                         <a href="#" onClick={(e) => { e.preventDefault(); document.getElementById('import-file').click(); setIsMoreMenuOpen(false); }} style={{...styles.dropdownItem, display: 'flex', alignItems: 'center'}}><ImportIcon/>Import</a>
                         <a href="#" onClick={(e) => { e.preventDefault(); handleExport(); setIsMoreMenuOpen(false); }} style={{...styles.dropdownItem, display: 'flex', alignItems: 'center'}}><ExportIcon/>Export</a>
                         <a href="#" onClick={(e) => { e.preventDefault(); setIsSettingsModalOpen(true); setIsMoreMenuOpen(false); }} style={{...styles.dropdownItem, display: 'flex', alignItems: 'center'}}><SettingsIcon/>Settings</a>
                    </div>
                )}
            </div>
            <button style={{...styles.buttonHeader, ...styles.buttonHeaderPrimary}} onClick={() => handleShowForm('add')}><PlusIcon/>Add Item</button>
            <input type="file" id="import-file" style={{display: 'none'}} onChange={handleImport} accept=".json" />
          </div>
        </header>

        <main>
            <FilterCard settings={settings} />
            {formState.visible && <MediaForm item={formState.item} onSave={handleSaveItem} onCancel={handleHideForm} settings={settings} />}
            {paginatedItems.length > 0 ? (
                <div style={styles.grid}>
                    {paginatedItems.map(item => <MediaCard key={item.id} item={item} settings={settings} onUpdateStatus={handleUpdateStatus} openStatusMenu={openStatusMenu} setOpenStatusMenu={setOpenStatusMenu} />)}
                </div>
            ) : (
                <div style={styles.emptyState}>
                    <h3 style={styles.emptyStateTitle}>No items found</h3>
                    <p style={styles.emptyStateText}>Try adjusting your filters or add a new item.</p>
                </div>
            )}

            {totalPages > 1 && (
                <div style={styles.pagination}>
                    <button style={styles.buttonHeader} onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>Previous</button>
                    <span style={styles.paginationText}>Page {currentPage} of {totalPages}</span>
                    <button style={styles.buttonHeader} onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>Next</button>
                </div>
            )}
        </main>
        {isSettingsModalOpen && <SettingsModal settings={settings} onClose={() => setIsSettingsModalOpen(false)} onSave={(newSettings) => { setSettings(newSettings); setIsSettingsModalOpen(false); }} />}
        <CheckoutModal visible={checkoutModal.visible} onClose={() => setCheckoutModal({ visible: false, itemId: null })} />
        <ConfirmationModal visible={confirmationModal.visible} message={confirmationModal.message} onConfirm={confirmationModal.onConfirm} onClose={() => setConfirmationModal({ visible: false, message: '', onConfirm: null })} />
      </div>
    </>
  );
}

// --- Styles ---
const styles = {
    appContainer: { maxWidth: '1280px', margin: '0 auto', padding: '2rem' },
    header: { display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1.5rem', marginBottom: '2rem', borderBottom: '1px solid #e5e7eb' },
    mainTitle: { fontSize: '2.25rem', fontWeight: 'bold', color: '#1e293b' },
    headerActions: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' },
    buttonHeader: { backgroundColor: 'white', color: '#334155', fontWeight: 600, padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', cursor: 'pointer', transition: 'background-color 0.2s' },
    buttonHeaderPrimary: { backgroundColor: '#334155', color: 'white' },
    label: { display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' },
    input: { width: '100%', borderRadius: '0.5rem', border: '1px solid #d1d5db', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', padding: '0.5rem 0.75rem', boxSizing: 'border-box' },
    starRatingContainer: { display: 'flex', alignItems: 'center' },
    star: { cursor: 'pointer', fontSize: '2rem' },
    clearButton: { marginLeft: '0.5rem', fontSize: '0.75rem', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' },
    genreList: { maxHeight: '12rem', overflowY: 'auto', paddingRight: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem' },
    checkboxContainer: { display: 'flex', alignItems: 'center' },
    checkbox: { height: '1rem', width: '1rem', borderRadius: '0.25rem', border: '1px solid #d1d5db' },
    checkboxLabel: { marginLeft: '0.5rem', fontSize: '0.875rem', color: '#475569' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem', marginTop: '2rem' },
    emptyState: { backgroundColor: 'white', textAlign: 'center', padding: '3rem', borderRadius: '0.75rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', border: '1px solid #e5e7eb', marginTop: '2rem' },
    emptyStateTitle: { fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b' },
    emptyStateText: { color: '#64748b', marginTop: '0.5rem' },
    pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem' },
    paginationText: { fontSize: '0.875rem', color: '#475569', fontWeight: 500 },
    card: { backgroundColor: 'white', borderRadius: '0.75rem', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.3s', border: '1px solid #e5e7eb' },
    cardContent: { padding: '1.25rem', display: 'flex', flexDirection: 'column', flexGrow: 1, width: '100%' },
    cardTitle: { fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b', flex: 1, paddingRight: '0.5rem' },
    badge: { fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', padding: '0.25rem 0.5rem', borderRadius: '9999px', color: 'white' },
    cardSubtitle: { fontSize: '0.875rem', color: '#64748b', marginBottom: '0.75rem' },
    cardSummary: { color: '#475569', fontSize: '0.875rem', lineHeight: 1.6, flexGrow: 1 },
    showMoreButton: { color: '#334155', fontWeight: 600, marginLeft: '0.25rem', background: 'none', border: 'none', cursor: 'pointer' },
    infoBox: { marginTop: '1rem', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' },
    cardActions: { backgroundColor: '#f8fafc', padding: '0.75rem 1.25rem', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' },
    buttonSmall: { fontSize: '0.875rem', backgroundColor: '#e2e8f0', color: '#334155', fontWeight: 600, padding: '0.25rem 0.75rem', borderRadius: '0.375rem', transition: 'background-color 0.2s', cursor: 'pointer', border: 'none' },
    dropdownMenu: { position: 'absolute', right: 0, bottom: '100%', marginBottom: '0.5rem', width: '12rem', borderRadius: '0.375rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)', backgroundColor: 'white', zIndex: 20 },
    headerDropdownMenu: { position: 'absolute', right: 0, top: '100%', marginTop: '0.5rem', width: '12rem', borderRadius: '0.375rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)', backgroundColor: 'white', zIndex: 20 },
    dropdownItem: { display: 'block', padding: '0.5rem 1rem', fontSize: '0.875rem', color: '#374151', textDecoration: 'none' },
    modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' },
    modalContent: { backgroundColor: 'white', borderRadius: '0.75rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', width: '100%' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', borderBottom: '1px solid #e5e7eb' },
    modalTitle: { fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b' },
    closeButton: { color: '#9ca3af', background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer' },
    modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #e5e7eb' },
    buttonPrimary: { backgroundColor: '#334155', color: 'white', fontWeight: 'bold', padding: '0.5rem 1rem', borderRadius: '0.5rem', transition: 'background-color 0.2s', border: 'none', cursor: 'pointer' },
    buttonSecondary: { backgroundColor: '#e2e8f0', color: '#334155', fontWeight: 'bold', padding: '0.5rem 1rem', borderRadius: '0.5rem', transition: 'background-color 0.2s', border: 'none', cursor: 'pointer' },
    formContainer: { backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)', marginBottom: '2rem', border: '1px solid #e5e7eb' },
    formTitleFilter: { fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b', margin: '1.5rem', marginBottom: 0 },
    formTitle: { fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '1.5rem' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1.5rem' },
    settingsSectionTitle: { fontSize: '1.125rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' },
    colorInput: { width: '2.5rem', height: '2.5rem', padding: '0.25rem', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' },
    iconButton: { padding: '0.5rem', borderRadius: '0.375rem', background: 'none', border: 'none' },
    filterCard: { backgroundColor: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', marginBottom: '2rem' },
    filterCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', cursor: 'pointer' },
    filterGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', padding: '1.5rem', paddingTop: 0 },
    formActions: { display: 'flex', gap: '8px' }
};
