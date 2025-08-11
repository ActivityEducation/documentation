import React from 'react';
// Import your ThemeProvider and theme object from your AscendUCore Design System package
import { ThemeProvider, theme } from '@activityeducation/component-library'; // Adjust package name if different
import SettingsApplier from '../components/SettingsApplier.js';

function Root({ children }) {
  return (
    // Wrap your Docusaurus content with your ThemeProvider
    <ThemeProvider theme={theme}>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
        integrity="sha512-9usAa10IRO0HhonpyAIVpjrylPvoDwiPUiKdWk5t3PyolY1cOd4DSE0Ga+ri4AuTroPR5aQvXU9xC6qOPnzFeg=="
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />
      {children}
      <SettingsApplier />
    </ThemeProvider>
  );
}

export default Root;