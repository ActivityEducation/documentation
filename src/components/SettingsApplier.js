import React, { useLayoutEffect, useEffect } from 'react';
import { useLocation } from '@docusaurus/router';

function applySettings() {
  const font = localStorage.getItem('font') || 'default';
  const fontSize = parseInt(localStorage.getItem('fontSize'), 10) || 16;
  const highContrast = localStorage.getItem('highContrast') === 'true';
  const highlightLinks = localStorage.getItem('highlightLinks') === 'true';
  const grayscale = localStorage.getItem('grayscale') === 'true';

  // Apply font
  setTimeout(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const bodyClasses = document.body.className;
    const newClassArray = bodyClasses.split(' ').filter(c => !c.startsWith('font-') && c !== '');
    newClassArray.push(`font-${font}`);
    document.body.className = newClassArray.join(' ');
  
    // Apply font size
    if (typeof window !== 'undefined') {
      document.documentElement.style.fontSize = `${fontSize}px`;
    }

    // Apply high contrast
    if (highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }

    // Apply highlight links
    if (highlightLinks) {
      document.body.classList.add('highlight-links');
    } else {
      document.body.classList.remove('highlight-links');
    }

    // Apply grayscale
    if (grayscale) {
      document.documentElement.classList.add('grayscale');
      console.log('Grayscale class added to html:', document.documentElement.classList.contains('grayscale'));
    } else {
      document.documentElement.classList.remove('grayscale');
      console.log('Grayscale class removed from html:', !document.documentElement.classList.contains('grayscale'));
    }
  }, 20);
}

export default function SettingsApplier() {
  const location = useLocation();

  useLayoutEffect(() => {
    console.log('useLayoutEffect in SettingsApplier triggered by location change');
    applySettings();
  }, [location.pathname]);

  useEffect(() => {
    window.addEventListener('settings-change', applySettings);
    return () => {
      window.removeEventListener('settings-change', applySettings);
    };
  }, []);

  return null; // This component does not render anything
}