import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import ePub from 'epubjs';

// --- CSS-in-JS Styles Object ---
const styles = {
  epubReaderContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: 'calc(100vh - 164px)',
    overflow: 'hidden',
    fontFamily: `'Arial', 'Helvetica', sans-serif`,
    backgroundColor: '#f4f4f4',
  },
  viewerContainer: {
    flexGrow: 1,
    position: 'relative',
    boxShadow: '0 0 10px rgba(0,0,0,0.1) inset',
  },
  errorMessage: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    padding: '20px',
    backgroundColor: '#fff0f0',
    color: '#c00',
    textAlign: 'center',
  },
  controlsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '20px',
    padding: '12px',
    backgroundColor: '#ffffff',
    borderTop: '1px solid #ddd',
    boxShadow: '0 -2px 5px rgba(0,0,0,0.05)',
  },
  controlGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  button: {
    padding: '8px 16px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'background-color 0.2s, box-shadow 0.2s',
  },
  label: {
    fontSize: '14px',
    color: '#555',
  },
  select: {
    padding: '6px 8px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    backgroundColor: 'white',
  },
  rangeInput: {
    cursor: 'pointer',
  },
  fontSizeDisplay: {
    minWidth: '30px',
    textAlign: 'center',
    fontSize: '14px',
    color: '#333',
    fontWeight: 'bold',
  },
};

/**
 * @component BookView
 * @description Renders the ePub from an ArrayBuffer. This is more robust against
 * security policies (CSP) that might block blob: URLs.
 */
const BookView = forwardRef(({ bookData, theme, fontSize, fontFamily, spread, onError }, ref) => {
  const viewerRef = useRef(null);
  const renditionRef = useRef(null);
  const [isRendered, setIsRendered] = useState(false); // State to prevent race conditions

  useImperativeHandle(ref, () => ({
    prev: () => renditionRef.current?.prev(),
    next: () => renditionRef.current?.next(),
  }));

  useEffect(() => {
    if (!viewerRef.current || !bookData) return;
    
    setIsRendered(false); // Reset readiness when a new book is loaded

    const book = ePub(bookData);
    const rendition = book.renderTo(viewerRef.current, {
      width: '100%',
      height: '100%',
      ignoreClass: 'hl',
    });
    renditionRef.current = rendition;

    book.ready.then(() => {
      rendition.themes.register('dark', { 'body': { 'background-color': '#2B2B2B', 'color': '#CCCCCC' }, 'a': { 'color': '#57A9D9' } });
      rendition.themes.register('sepia', { 'body': { 'background-color': '#FBF0D9', 'color': '#5B4636' }, 'a': { 'color': '#335D6F' } });
      rendition.themes.register('light', { 'body': { 'background-color': '#FFFFFF', 'color': '#333333' }, 'a': { 'color': '#0066cc' } });
      
      // --- FONT INJECTION ---
      // The 'rendered' event provides the view object as the second argument.
      rendition.on('rendered', (section, view) => {
        if (view && view.document) {
          const link = view.document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://fonts.cdnfonts.com/css/opendyslexic';
          link.type = 'text/css';
          view.document.head.appendChild(link);
        }
      });
      
      rendition.on('relocated', (location) => {
        localStorage.setItem(`${book.key()}-location`, location.start.cfi);
      });

      // --- Annotation Toggle Logic ---
      rendition.on('selected', (cfiRange, contents) => {
        const annotations = JSON.parse(localStorage.getItem(`${book.key()}-annotations`) || '[]');
        
        const existingIndex = annotations.findIndex(ann => {
            try {
                return new ePub.CFI(ann.cfi).compare(new ePub.CFI(cfiRange)) === 0;
            } catch (e) {
                console.error("Error comparing CFI:", e);
                return ann.cfi === cfiRange;
            }
        });

        if (existingIndex > -1) {
            const annotationToRemove = annotations[existingIndex];
            rendition.annotations.remove(annotationToRemove.cfi, 'highlight');
            annotations.splice(existingIndex, 1); 
            localStorage.setItem(`${book.key()}-annotations`, JSON.stringify(annotations));
        } else {
            const newAnnotation = { cfi: cfiRange, color: 'yellow' };
            rendition.annotations.add('highlight', cfiRange, {}, null, 'hl', { fill: newAnnotation.color, 'fill-opacity': '0.3', 'mix-blend-mode': 'multiply' });
            annotations.push(newAnnotation);
            localStorage.setItem(`${book.key()}-annotations`, JSON.stringify(annotations));
        }

        contents.window.getSelection().removeAllRanges();
      });
      
      const lastLocation = localStorage.getItem(`${book.key()}-location`);
      return rendition.display(lastLocation || undefined);
    }).then(() => {
        const savedAnnotations = JSON.parse(localStorage.getItem(book.key()+"-annotations") || "[]");
        if (savedAnnotations) {
          savedAnnotations.forEach(anno => {
            rendition.annotations.add("highlight", anno.cfi, {}, null, "hl", {"fill": anno.color, "fill-opacity": "0.3"});
          });
        }
        setIsRendered(true); // Set ready state after display is complete
    }).catch(err => {
      console.error("EPUB Loading Error:", err);
      onError(`Failed to load the book. The file may be corrupted or in an unsupported format. Error: ${err.message}`);
    });

    return () => {
      book.destroy();
    };
  }, [bookData, onError]);

  useEffect(() => {
    // Guard the theme/font/layout application until the rendition is ready
    if (renditionRef.current && isRendered) {
        renditionRef.current.themes.select(theme);
        renditionRef.current.themes.font(fontFamily);
        renditionRef.current.themes.fontSize(`${fontSize}px`);
        renditionRef.current.spread(spread);
    }
  }, [isRendered, theme, fontSize, fontFamily, spread]);

  return <div style={styles.viewerContainer} ref={viewerRef} />;
});

/**
 * @component EpubReader
 * @description The main component that manages controls and state.
 * @prop {string} [epubUrl] - Optional URL to an ePub file to load automatically.
 */
const EpubReader = ({ epubUrl }) => {
  const fileInputRef = useRef(null);
  const bookViewRef = useRef(null);

  const [bookData, setBookData] = useState(null);
  const [error, setError] = useState(null);
  const [key, setKey] = useState(0); // Key to force re-mounting of the BookView
  const [theme, setTheme] = useState('light');
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [spread, setSpread] = useState('none'); // Add spread state ('none' for single, 'always' for double)

  // Effect to load the initial book from a URL if provided
  useEffect(() => {
    if (epubUrl) {
      fetch(epubUrl)
        .then(res => res.arrayBuffer())
        .then(buffer => {
          setError(null);
          setBookData(buffer);
          setKey(prevKey => prevKey + 1);
        })
        .catch(err => {
          console.error("Initial EPUB Fetch Error:", err);
          setError("Could not load the initial book from the provided URL.");
        });
    }
  }, [epubUrl]);


  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setError(null);
        setBookData(e.target.result);
        setKey(prevKey => prevKey + 1); // Increment key to force remount
      };
      reader.onerror = (e) => {
        console.error("File Reader Error:", e);
        setError("Failed to read the selected file.");
      }
      reader.readAsArrayBuffer(file);
    }
  };

  const handleOpenFile = () => {
    fileInputRef.current?.click();
  };

  const prevPage = () => bookViewRef.current?.prev();
  const nextPage = () => bookViewRef.current?.next();

  return (
    <div style={styles.epubReaderContainer}>
      {error ? (
        <div style={styles.errorMessage}>{error}</div>
      ) : bookData ? (
        <BookView
          ref={bookViewRef}
          key={key} // Use the key to force a full remount
          bookData={bookData}
          theme={theme}
          fontSize={fontSize}
          fontFamily={fontFamily}
          spread={spread}
          onError={setError}
        />
      ) : (
        <div style={styles.errorMessage}>
          {epubUrl ? 'Loading book...' : 'Please open an ePub file to begin.'}
        </div>
      )}
      
      <div style={styles.controlsContainer}>
        {/* Only show the 'Open ePub' button if no epubUrl is provided */}
        {!epubUrl && (
          <>
            <input
              type="file"
              accept=".epub"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <button style={styles.button} onClick={handleOpenFile}>Open ePub</button>
          </>
        )}
        <button style={styles.button} onClick={prevPage}>&larr; Prev</button>
        
        <div style={styles.controlGroup}>
          <label style={styles.label} htmlFor="font-size">Font Size:</label>
          <input
            style={styles.rangeInput}
            type="range"
            id="font-size"
            min="12"
            max="32"
            step="1"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
          />
          <span style={styles.fontSizeDisplay}>{fontSize}px</span>
        </div>
        
        <div style={styles.controlGroup}>
          <label style={styles.label} htmlFor="font-family">Font:</label>
          <select style={styles.select} id="font-family" value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}>
            <option value="Arial">Arial</option>
            <option value="Verdana">Verdana</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="OpenDyslexic">OpenDyslexic</option>
          </select>
        </div>
        
        <div style={styles.controlGroup}>
          <label style={styles.label} htmlFor="theme">Theme:</label>
          <select style={styles.select} id="theme" value={theme} onChange={(e) => setTheme(e.target.value)}>
            <option value="light">Light</option>
            <option value="sepia">Sepia</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <div style={styles.controlGroup}>
          <label style={styles.label} htmlFor="spread">Layout:</label>
          <select style={styles.select} id="spread" value={spread} onChange={(e) => setSpread(e.target.value)}>
            <option value="none">Single Page</option>
            <option value="always">Double Page</option>
          </select>
        </div>
        
        <button style={styles.button} onClick={nextPage}>Next &rarr;</button>
      </div>
    </div>
  );
};

export default EpubReader;
