import React from 'react';
// Import your ThemeProvider and theme object from your AscendUCore Design System package
import { ThemeProvider, theme } from '@activityeducation/component-library'; // Adjust package name if different

function Root({ children }) {
  return (
    // Wrap your Docusaurus content with your ThemeProvider
    <ThemeProvider theme={theme}>
      {children}
    </ThemeProvider>
  );
}

export default Root;