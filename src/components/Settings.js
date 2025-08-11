import React, { useState } from 'react';
import styles from './Settings.module.css';

export default function Settings() {
  const [font, setFont] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('font') || 'default';
    }
    return 'default';
  });

  const [fontSize, setFontSize] = useState(() => {
    if (typeof window !== 'undefined') {
      return parseInt(localStorage.getItem('fontSize'), 10) || 16;
    }
    return 16;
  });

  const [highContrast, setHighContrast] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('highContrast') === 'true';
    }
    return false;
  });

  const [highlightLinks, setHighlightLinks] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('highlightLinks') === 'true';
    }
    return false;
  });

  const [grayscale, setGrayscale] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('grayscale') === 'true';
    }
    return false;
  });

  const dispatchSettingsChange = () => {
    window.dispatchEvent(new Event('settings-change'));
  }

  const handleFontChange = (event) => {
    const newFont = event.target.value;
    setFont(newFont);
    localStorage.setItem('font', newFont);
    dispatchSettingsChange();
  };

  const handleFontSizeIncrease = () => {
    const newSize = fontSize + 2;
    setFontSize(newSize);
    localStorage.setItem('fontSize', newSize);
    dispatchSettingsChange();
  };

  const handleFontSizeDecrease = () => {
    const newSize = fontSize - 2;
    setFontSize(newSize);
    localStorage.setItem('fontSize', newSize);
    dispatchSettingsChange();
  };

  const handleFontSizeReset = () => {
    setFontSize(16);
    localStorage.setItem('fontSize', 16);
    dispatchSettingsChange();
  };

  const handleHighContrastChange = (event) => {
    const newHighContrast = event.target.checked;
    setHighContrast(newHighContrast);
    localStorage.setItem('highContrast', newHighContrast);
    dispatchSettingsChange();
  };

  const handleHighlightLinksChange = (event) => {
    const newHighlightLinks = event.target.checked;
    setHighlightLinks(newHighlightLinks);
    localStorage.setItem('highlightLinks', newHighlightLinks);
    dispatchSettingsChange();
  };

  const handleGrayscaleChange = (event) => {
    const newGrayscale = event.target.checked;
    setGrayscale(newGrayscale);
    localStorage.setItem('grayscale', newGrayscale);
    dispatchSettingsChange();
  };

  return (
    <div className={styles.settingsContainer}>
      <div className={styles.settingRow}>
        <span className={styles.settingLabel}>Font Family</span>
        <div className={styles.settingControl}>
          <select onChange={handleFontChange} value={font}>
            <option value="default">Default</option>
            <option value="opendyslexic">OpenDyslexic</option>
            <option value="atkinson">Atkinson Hyperlegible</option>
          </select>
        </div>
      </div>
      <div className={styles.settingRow}>
        <span className={styles.settingLabel}>Font Size</span>
        <div className={styles.settingControl}>
          <button onClick={handleFontSizeDecrease}>-</button>
          <button onClick={handleFontSizeReset}>Reset</button>
          <button onClick={handleFontSizeIncrease}>+</button>
        </div>
      </div>
      <div className={styles.settingRow}>
        <span className={styles.settingLabel}>High Contrast</span>
        <div className={styles.settingControl}>
          <input type="checkbox" onChange={handleHighContrastChange} checked={highContrast} />
        </div>
      </div>
      <div className={styles.settingRow}>
        <span className={styles.settingLabel}>Highlight Links</span>
        <div className={styles.settingControl}>
          <input type="checkbox" onChange={handleHighlightLinksChange} checked={highlightLinks} />
        </div>
      </div>
      <div className={styles.settingRow}>
        <span className={styles.settingLabel}>Grayscale</span>
        <div className={styles.settingControl}>
          <input type="checkbox" onChange={handleGrayscaleChange} checked={grayscale} />
        </div>
      </div>
    </div>
  );
}