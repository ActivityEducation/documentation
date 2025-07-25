---
sidebar_position: 5
title: "Design System & Component Library"
published: false
---

# **AscendUCore Design System & Component Library**

> Please feel free to also checkout out [Design System & Component Library](https://design.edupub.social) in storybook.

## **Introduction & Overview**

The **AscendUCore Design System** is the foundational visual and interactive language for our educational platform built on ActivityPub. It encompasses a set of reusable components, clear guidelines, and robust design tokens designed to ensure a consistent, professional, and confidence-inspiring user experience across all applications.

### **Purpose and Benefits**

The primary motivation behind the AscendUCore Design System is to streamline development, ensure brand consistency, and elevate the overall user experience.

* **Consistency:** The system guarantees a unified look, feel, and behavior across every part of the platform. This means that buttons will always look and act the same, forms will follow predictable patterns, and colors will be applied thoughtfully, fostering trust and ease of use for self-paced learners who rely on a stable and predictable environment.  
* **Efficiency:** By providing a library of pre-built, thoroughly tested, and well-documented UI components, the design system significantly accelerates development cycles. Developers can assemble user interfaces rapidly, focusing on core application logic rather than reinventing common UI elements, thus reducing redundant work and speeding up the delivery of new features.  
* **Scalability:** As the educational platform grows in complexity and team size, the design system makes it easier to onboard new developers and designers. Everyone works from a shared language and set of tools, preventing design drift and ensuring that new features and sections seamlessly integrate with existing ones without sacrificing quality or coherence.  
* **Maintainability:** Centralizing all design decisions and component logic within one system dramatically simplifies ongoing maintenance. Updates, bug fixes, and feature enhancements to UI elements can be applied in one place and propagated throughout all consuming applications, reducing technical debt and long-term effort.  
* **Accessibility:** Components are meticulously built with accessibility (WCAG standards) as a core consideration from the ground up. This proactive approach ensures that the platform is inclusive and usable by individuals with diverse abilities, creating an equitable learning environment for everyone.  
* **Brand Identity:** The consistent application of visual guidelines and interactive patterns reinforces the AscendUCore brand. Every interaction and visual element contributes to a cohesive and recognizable brand presence, strengthening user perception of professionalism and reliability.

### **Core Principles & Design Philosophy**

Our design system is deeply rooted in principles specifically tailored for an educational context, prioritizing the learner's journey and experience:

* **Clarity & Readability:** All information, from lesson content to interface labels, is presented in a clear and legible manner. Typography, color contrast, and layout choices are optimized to minimize cognitive load, allowing learners to absorb information effortlessly and focus on their studies.  
* **Approachability & Trust:** The interface is designed to be inviting, intuitive, and visually reassuring. A clean aesthetic, thoughtful use of our color palette, and predictable interactions foster a sense of reliability and ease of use, building user confidence in the platform's content and mission.  
* **Focus & Minimal Distraction:** For self-paced learners, maintaining concentration is paramount. UI elements are crafted to guide the learner's attention to essential content and critical interactions, while unnecessary visual clutter and distracting animations are minimized. The design encourages deep engagement with learning material.  
* **Progress & Achievement:** The system incorporates subtle but effective design patterns that convey a sense of progress and celebrate milestones. Visual indicators for completion, encouraging feedback, and clear pathways motivate learners, providing positive reinforcement throughout their educational journey.  
* **Responsiveness:** Components are engineered to adapt seamlessly and gracefully to a wide array of screen sizes and device types, including desktops, tablets, and mobile phones. This ensures that regardless of the device a learner chooses, they will always have an optimal and uncompromised experience.

## **Design Tokens: The Foundation of Our Visual Language**

Design tokens are the atomic elements of our design system. They are named entities that store visual design attributes, acting as the single source of truth for all foundational design decisions. By abstracting these values into tokens, we ensure consistency across all applications and make global design changes incredibly efficient and less prone to errors.

### **Definition Locations**

Our design tokens are meticulously defined in two primary formats to cater to diverse development needs:

* **TypeScript Object (for Emotion.js):** The definitive source for all design tokens resides within a TypeScript object located at src/theme/index.ts. This centralized object acts as the single source of truth for all visual attributes. It is programmatically accessible by React components that are styled using Emotion.js, ensuring that component styles are directly tied to the system's design specifications.  
* **CSS Variables (for broader CSS/Sass consumption):** To enable usage outside of React and Emotion.js, all core design tokens are also exported as standard CSS variables within a \_theme.scss file. This allows any project, including static sites like Docusaurus or applications using traditional CSS/Sass, to directly consume and apply theme values. This cross-technology compatibility is crucial for maintaining a cohesive brand identity across various front-end technologies.

### **Categories of Design Tokens**

The design tokens are organized into distinct categories, each governing a fundamental aspect of the visual design.

#### **Colors**

Our comprehensive color palette is meticulously crafted to evoke trust, clarity, and engagement, supporting a positive learning environment. It includes primary, secondary, tertiary, neutral, neutral-variant, and error color families. Each family provides a spectrum of shades, typically ranging from 0 to 100, offering granular control over visual intensity. Beyond these raw palettes, we define **semantic color aliases**. These aliases (e.g., text.default, background.surface, action.primary) refer to specific shades from the core palettes, ensuring that colors are applied based on their *purpose* in the UI (e.g., text.default for main body copy) rather than just their hexadecimal value. This approach enhances consistency and makes it simpler to adjust themes or create variations without changing individual component styles.  
Definition Structure:  
The theme object's colors property contains nested objects for each color palette and for semantic groupings. Each raw palette is an object where numerical keys correspond to hexadecimal color values. Semantic groups (like text, background, border, action, status) contain aliases that point to specific shades within the primary palettes, ensuring purposeful and consistent color application.  
Usage in React (Emotion.js):  
Within React components styled using Emotion.js, developers access these defined color tokens through the props.theme.colors object. For instance, to style a button, its background color might be set by referencing props.theme.colors.action.primary, and its text color by props.theme.colors.text.onPrimary. Dynamic styling, such as changing a button's background on hover to props.theme.colors.action.primaryHover, directly leverages these token values, guaranteeing adherence to the design system's specifications.  
Usage in CSS/Sass (via \_theme.scss):  
When the \_theme.scss file is imported into a Sass or plain CSS project, all color tokens are transformed into standard CSS variables (e.g., \--color-background-surface, \--color-text-default). These variables can then be directly applied within CSS rules or Sass mixins. This allows development teams working outside the React/Emotion stack to use the exact same consistent color palette, ensuring visual harmony across all parts of the application.

#### **Typography**

Our typography system is carefully designed to ensure readability, establish clear visual hierarchy, and maintain a consistent voice across all content. It defines global font families, precise font sizes for various text elements, appropriate font weights, and optimized line heights.  
Definition Structure:  
The typography object within the theme specifies a default fontFamily (using a robust system font stack for broad compatibility). It then provides detailed typographic specifications for all heading levels (H1 through H6), various body text styles (body, bodyLarge, bodySmall, caption), and specific styles for interactive elements like button text. Each style includes properties such as fontSize (often employing clamp() for responsive scaling across devices), fontWeight, lineHeight, and a default color referencing the main color palette.  
Usage in React (Emotion.js):  
React components consume typography styles by accessing properties directly from props.theme.typography. For example, a styled heading component will dynamically set its font-family, font-size, and font-weight by referencing the corresponding properties within props.theme.typography.h1. This programmatic approach ensures that all text elements rendered by components consistently adhere to the defined typographic hierarchy and visual style.  
Usage in CSS/Sass (via \_theme.scss):  
Once the \_theme.scss file is imported into a Sass or CSS stylesheet, all typography tokens become available as standard CSS variables (e.g., \--font-family-default, \--font-size-h1, \--font-weight-body). These variables can be directly applied in global CSS rules or component-specific styles to ensure consistent fonts, sizes, and weights are used for all text elements throughout the application, regardless of the underlying JavaScript framework.

#### **Spacing**

Our spacing system employs a consistent scale to define the distances between UI elements. This approach ensures visual rhythm, improves readability, and establishes clear hierarchies within the interface. By using predefined spacing tokens, we eliminate arbitrary pixel values, leading to a more harmonious and predictable layout.  
Definition Structure:  
The spacing object defines a discrete set of proportional values, using intuitive keys such as xxs, xs, sm, md, lg, xl, 2xl, and 3xl. Each key is mapped to a specific pixel value (e.g., '4px', '8px', '16px'). This provides a structured and consistent scale for applying padding, margin, and gaps.  
Usage in React (Emotion.js):  
Components leverage spacing tokens by referencing props.theme.spacing. For instance, a container component might apply internal padding using props.theme.spacing.xl, and define the separation between its child elements using a gap of props.theme.spacing.md. This ensures consistent visual separation and alignment across all components and layouts.  
Usage in CSS/Sass (via \_theme.scss):  
When the \_theme.scss file is imported into a Sass or CSS project, spacing tokens are exposed as standard CSS variables (e.g., \--spacing-md, \--spacing-lg). These variables can be directly applied in CSS properties such as padding, margin, or gap, ensuring that visual rhythm and element separation remain consistent throughout the application, regardless of whether it's built with React or traditional HTML/CSS.

#### **Border Radii**

Our border radii system establishes standardized values for all rounded corners on UI elements. This consistency contributes to a polished and predictable visual aesthetic across the entire platform, creating a cohesive and approachable user interface.  
Definition Structure:  
The borderRadius object defines a set of named values for corner rounding. These include none (for '0'), sm (for '4px'), md (for '8px', which is also the default value used widely), lg (for '12px'), and full (for '9999px', designed to create perfect pill shapes for elements like buttons or badges).  
Usage in React (Emotion.js):  
Styled components dynamically apply border radius values by referencing props.theme.borderRadius. For example, a Card component will set its border-radius property to props.theme.borderRadius.md, ensuring all cards maintain a consistent rounded appearance throughout the application. This centralizes control over corner rounding, making global changes simple.  
Usage in CSS/Sass (via \_theme.scss):  
When the \_theme.scss file is imported into a Sass or CSS project, border radius tokens are exposed as standard CSS variables (e.g., \--border-radius-default, \--border-radius-full). These variables are then applied directly to elements requiring rounded corners in CSS rules, ensuring a uniform and consistent visual style that aligns with the design system.

#### **Shadows**

Our shadow system provides subtle yet effective visual cues for depth and hierarchy. Applying standardized shadows helps to distinguish elements, indicate elevation (like modals or cards), and subtly hint at interactivity (like a lifted appearance on hover).  
Definition Structure:  
The shadows object defines several distinct box-shadow values, each specified as a complete CSS string. These range from none (for no shadow) to sm, md, lg, and xl, with increasing intensity and spread. Each shadow value is a meticulously crafted combination of color, blur, and offset to ensure visual consistency and performance.  
Usage in React (Emotion.js):  
Components that require a sense of elevation or visual separation, such as dropdown menus, tooltips, or modals, apply shadows by referencing props.theme.shadows. For instance, a dropdown might use props.theme.shadows.md for its box-shadow property, ensuring it consistently appears elevated above the surrounding content.  
Usage in CSS/Sass (via \_theme.scss):  
When the \_theme.scss file is imported into a Sass or CSS project, shadow tokens are accessible as standard CSS variables (e.g., \--shadow-lg, \--shadow-sm). These variables can be directly applied to elements in CSS rules to create a consistent sense of depth and visual hierarchy throughout the UI, aligning with the design system's aesthetic.

#### **Breakpoints**

Our breakpoint system defines a set of standardized screen width thresholds. These breakpoints are crucial for implementing responsive design, ensuring that the platform's layout and content adapt gracefully and optimally across a diverse range of devices, from small mobile phones to large desktop monitors.  
Definition Structure:  
The breakpoints object defines pixel values for common screen size categories. These include sm (small, e.g., '640px'), md (medium, e.g., '768px'), lg (large, e.g., '1024px'), xl (extra-large, e.g., '1280px'), and 2xl (double extra-large, e.g., '1536px').  
Usage in React (Emotion.js) with Media Queries:  
React components utilize Emotion's css prop or its styled components with template literals to apply media queries. Within these, they reference the breakpoint values from props.theme.breakpoints. This allows component styles to dynamically change based on the viewport width, ensuring a responsive layout that adapts gracefully across different screen sizes.  
Usage in CSS/Sass (via \_theme.scss):  
When the \_theme.scss file is imported into a Sass or CSS project, breakpoint tokens are exposed as standard CSS variables (e.g., \--breakpoint-md, \--breakpoint-lg). These variables are then seamlessly used within Sass @media rules to apply responsive styles directly in CSS, ensuring consistent breakpoints are used across all stylesheets and preventing fragmented responsive behavior.

#### **Transitions**

Our transitions system defines common durations and timing functions for all UI animations and interactions. This ensures that visual changes, such as elements appearing, disappearing, or changing state, occur smoothly and consistently, enhancing the perceived responsiveness and polish of the user interface.  
Definition Structure:  
The transitions object defines named transition properties, each represented as a complete CSS string. These include default (e.g., 'all 0.2s ease-in-out'), fast (e.g., 'all 0.1s ease-out'), and slow (e.g., 'all 0.3s ease-in'). Each string specifies the properties to transition, the duration, and the easing function.  
Usage in React (Emotion.js):  
Styled components apply transition effects by referencing props.theme.transitions. For example, an interactive element might set its transition property to props.theme.transitions.default to ensure that its visual changes (like background color on hover) occur with a consistent and smooth animation.  
Usage in CSS/Sass (via \_theme.scss):  
When the \_theme.scss file is imported into a Sass or CSS project, transition tokens are available as standard CSS variables (e.g., \--transition-fast, \--transition-slow). These variables are then directly used in CSS properties like transition to ensure consistent animation timings and easing functions across all interactive elements, regardless of the underlying development stack.

## **Component Library: Building Blocks for Your UI**

The AscendUCore Component Library is a robust collection of reusable React UI components. Each component is meticulously pre-styled using our design tokens, ensuring that consistency, accessibility, and brand identity are inherent from the moment they are integrated into an application. These components serve as the fundamental building blocks, accelerating development and maintaining a high standard of user experience.

### **Technology Stack**

The AscendUCore Component Library is built upon a modern and efficient technology stack chosen for its performance, developer experience, and compatibility within the React ecosystem.

* **React:** As the core JavaScript library, React is fundamental for building interactive and dynamic user interfaces. Its component-based architecture is perfectly suited for developing reusable UI elements.  
* **Emotion.js (@emotion/react, @emotion/styled):** This is our chosen CSS-in-JS library, providing a powerful way to style React components. Emotion enables dynamic styles based on component props or theme values, ensures styles are scoped to individual components to prevent conflicts, and supports robust theming capabilities, directly leveraging our design tokens.  
* **TypeScript:** Used universally throughout the library, TypeScript provides static type-checking. This dramatically improves code quality by catching errors early in development, enhances developer experience with intelligent autocompletion, and makes the codebase more maintainable and understandable for large teams.  
* **Storybook:** Storybook serves as the primary development environment and documentation portal for our UI components. It allows developers to build, test, and showcase components in complete isolation, separate from the main application. This isolation facilitates rapid iteration and comprehensive testing of individual UI elements.  
* **Font Awesome (@fortawesome/react-fontawesome):** Integrated for its vast library of scalable vector icons, Font Awesome ensures consistent and high-quality iconography across the entire platform. Its React integration makes it easy to incorporate icons into components with minimal effort.  
* **Vite:** A next-generation frontend tooling that serves as our build tool for local development. Vite provides an extremely fast development server and efficient bundling capabilities, significantly improving the development workflow for the library.  
* **Rollup:** Used specifically for generating production-ready JavaScript bundles. Rollup is highly optimized for creating lean, efficient CommonJS (CJS) and ES Module (ESM) outputs, which are essential for component libraries. It also handles the generation of TypeScript declaration files (.d.ts), crucial for providing type information to consuming applications.  
* **Semantic-Release:** This tool automates the entire package release workflow. It analyzes commit messages to determine the next semantic version (major, minor, patch), generates changelogs, publishes the new version to npm, creates GitHub releases, and tags the repository. This automation ensures consistent and reliable releases.  
* **Vitest:** Our chosen testing framework for unit and component testing. Vitest provides a fast and modern testing experience, integrating seamlessly with Vite and offering powerful capabilities for ensuring component reliability and correctness.  
* **ESLint:** This static code analysis tool is configured to enforce code quality standards and adherence to predefined style guidelines across all TypeScript and React files. ESLint helps maintain a consistent codebase, reduces errors, and improves readability.

### **Available Components**

The AscendUCore Component Library currently provides the following foundational UI components, each meticulously designed and implemented to align with the system's principles and tokens:

* **Badge**: Small, versatile UI elements used to display short, descriptive labels. They are ideal for indicating status (e.g., "New," "Active"), showing counts (e.g., "99+"), or categorizing content. Badges support various semantic color variants (default, primary, secondary, tertiary, success, info, warning, error), allowing them to convey meaning effectively.  
* **Button**: The fundamental interactive element for triggering user actions. Buttons are available in a range of visual styles (primary, secondary, tertiary, ghost, destructive, icon) and sizes (sm, md, lg). The icon variant is a specialized, compact, and completely rounded button designed to contain only an icon, perfect for actions that require minimal screen real estate. Buttons also support active and disabled states to indicate their current usability or selection.  
* **Card**: Highly flexible container components used for grouping and displaying related content in a visually distinct block. Cards support a structured layout, featuring dedicated slots for a header (for introductory information), a clear title, a concise subtitle, the main children content area, an actions section (for interactive elements like buttons), and an optional footer. This structure makes them versatile for presenting course modules, articles, or dashboard widgets.  
* **Checkbox**: Standard form controls used for binary selections, allowing users to choose one or more options from a set. Checkboxes support distinct visual states: checked (selected), unchecked (not selected), indeterminate (a mixed state, often used for parent checkboxes), and disabled (uninteractable).  
* **Flipper**: A unique container component that provides a captivating 3D flip animation effect. It's ideal for presenting content with a distinct "front" and "back," such as digital flashcards for language learning or interactive quizzes. The Flipper is highly configurable, allowing control over the duration of the flip animation and the flipDirection (horizontal or vertical).  
* **Flyover**: A contextual UI component that wraps specific inline text. When the wrapped text is hovered over (on desktop) or tapped (on mobile), a small, non-obtrusive Card (the "popover") is displayed. This is incredibly useful for implementing glossary definitions, tooltips, or providing immediate contextual information without navigating away. The popover's position can be explicitly configured (top, bottom, left, right, and fixed viewport corners like fix-top-left). Importantly, it includes automatic collision detection, ensuring the popover dynamically adjusts its position (e.g., flips from left to right, or bottom to top) to remain fully visible within the viewport.  
* **Icon**: A versatile and essential component for rendering scalable vector icons throughout the platform. The Icon component is highly adaptable, supporting icons loaded from Font Awesome classes (by providing a name like "fa-solid fa-book"), external SVG URLs (via the src prop), or directly by providing inline SVG content as children. Icons are configurable in terms of size (sm, md, lg, xl) and color, ensuring they fit seamlessly into any part of the UI.  
* **Input**: A foundational form component for collecting single-line text input from users. It features an outlined visual appearance and supports a floating label that animates above the input field when it gains focus or contains a value. It also provides space for helperText (for guidance), an error state with a specific errorMessage (for validation feedback), and leading/trailing adornments. These adornments can be any ReactNode, commonly used to integrate Icon components for visual cues or functional elements.  
* **List / ListItem**: These components provide structured containers for displaying collections of content in a vertical arrangement. The List component acts as the parent container, while individual ListItem components represent each entry. ListItem supports primary children content, and can include optional leading and trailing elements. These adornments are versatile, commonly used for Icon components, Badges, Checkboxes, or any other small ReactNode. Individual list items can be made interactive (to respond to clicks) or marked as disabled.  
* **Menu / MenuItem**: Components designed to present a contextual list of actions or options to the user. A Menu is triggered by a designated trigger element (often a Button). When activated, it displays a dropdown containing MenuItem components. Each MenuItem represents a selectable action or option, and they can support leading and trailing content (including Icon components) to enhance clarity. Menu items also respect disabled states.  
* **ProgressBar**: A visual indicator used to represent the progress of a task or achievement towards a defined goal. It displays a value relative to a max value, providing immediate feedback on completion status. A unique feature for the educational platform's video content is its ability to visually indicate interactive interrupts directly on the progress bar, allowing learners to see where key points or questions will appear in a video.  
* **Radio**: A standard form control used for single selections within a group of mutually exclusive options. When a Radio button is selected, all other radio buttons in the same named group are automatically deselected. Each radio button supports checked and disabled states to indicate its current selection and interactivity.  
* **Select / Option**: A customizable dropdown component designed for selecting a single value from a predefined list of choices. The Select component acts as the trigger, and when opened, displays a list of Option components. It features custom styling to align with the design system, supports comprehensive keyboard navigation (using ArrowUp/Down, Enter, Space, and Escape keys for accessibility), and visually hides native scrollbars while retaining scroll functionality. The Select component is designed to expand its width to comfortably fit the content of the currently selected option or placeholder, while also respecting any maximum width constraints imposed by its parent component via standard CSS.  
* **Slider**: An interactive UI control used for selecting a value from a continuous or discrete range. It features a draggable thumb that users can manipulate to precisely adjust the value. The Slider is highly configurable, allowing developers to set the min, max, and step values of the range, and also supports a disabled state to prevent interaction.  
* **Spinner**: An animated circular loading indicator used to signify that an operation is in progress and the system is busy. Spinners are typically used for indeterminate loading states (where the progress percentage is unknown). They are available in various sizes (sm, md, lg) to fit different contexts within the UI.  
* **Table**: A structured component designed for the clear and organized display of tabular data. It comes with default styling for headers (TableHead, TableHeaderCell) and rows (TableRow, TableCell). To ensure responsiveness across different screen sizes, the Table component is wrapped in an overflow-x: auto container, allowing horizontal scrolling on narrower viewports to prevent content truncation. It also supports striped rows (alternating background colors for readability) and bordered cells.  
* **TabGroup / Tab**: These components work in tandem to organize content into distinct, switchable sections within an interface. The TabGroup component acts as a container that manages the active state of its Tab children. Users can click on a Tab to display its associated content, providing a clean way to navigate between different views or categories of information.  
* **Toolbar**: Flexible container components used for grouping and organizing actions or navigation elements, typically positioned at the top or bottom of a section. Toolbars offer flexible justifyContent alignment options for their children and support item wrapping on smaller screens. They also include ToolbarGroup for internally grouping related sets of actions with visual separators.  
* **VideoPlayer**: A custom-built video player component that provides a consistent and branded video playback experience. It features integrated controls for play/pause, volume adjustment, progress tracking, and fullscreen toggle, all using Icon components for visual consistency. The player supports standard video attributes like autoPlay, loop, muted, and a placeholderImage (poster image). A key educational feature is its support for interactive interrupts, which automatically pause the video at predefined timestampSeconds and display a Card with custom content (e.g., questions or supplemental information). These interrupt points are also visually marked on the progress bar.  
* **WYSIWYGEditor**: A foundational rich text editor component for authoring story-like content directly within the platform. It provides a contentEditable area and a robust toolbar. The toolbar is built using other AscendUCore components like Toolbar, Button (all using the compact icon variant), Select (for changing heading levels), Input (for inserting links), and Icon components. The editor supports basic formatting such as bold, italic, underline, strikethrough, clearing format, undo/redo, creating lists (bulleted and numbered), blockquotes, and inserting/removing hyperlinks. It handles initial content population and displays a placeholder when empty. A crucial feature is its ability to accurately apply block formatting (like h1, p) to the specific line containing the cursor or selection, reliably replacing any prior block format for that line.

### **Project Structure**

The component library's repository (ascenducore-ui-kit/) is organized logically to separate source code, documentation, configuration, and build artifacts, facilitating clear development and maintenance.

* **src/**: This directory contains all the core source code for the component library.  
  * **components/**: Houses all individual reusable React UI components (e.g., Badge.tsx, Button.tsx). Complex components like the WYSIWYGEditor might reside in their own subdirectories (e.g., Editor/).  
  * **theme/**: Contains the definition of the design tokens.  
    * **colors.ts**: Defines the raw hexadecimal color values for all palettes.  
    * **index.ts**: The main theme object, combining all color palettes with typography scales, spacing values, border radii, shadows, and transitions into a single, comprehensive theme.  
  * **index.ts**: This file serves as the main entry point for the entire library, exporting all public components and the theme object. When another application consumes this library, it imports modules from this file.  
  * **vite-env.d.ts**: TypeScript declaration file for Vite environment variables.  
* **src/stories/**: This directory contains all Storybook stories, essential for component documentation, isolated development, and visual testing.  
  * **design-system/**: Dedicated sub-directory for stories that specifically showcase and document the design tokens (e.g., Colors.stories.tsx, Typography.stories.tsx).  
  * **library/**: Contains stories for each individual UI component in the library (e.g., Button.stories.tsx, Card.stories.tsx).  
  * **StyleGuide.mdx**: A comprehensive Markdown/MDX document that serves as the overall style guide and high-level documentation for the entire design system, providing a narrative overview.  
* **.storybook/**: This directory holds all configuration files for Storybook.  
  * **main.ts**: The primary Storybook configuration file. It defines where Storybook finds your stories, which addons are enabled, and the underlying framework (React with Vite).  
  * **preview.ts**: Sets up global decorators (like the ThemeProvider to ensure theme access for all components), global parameters, and applies global styles to all stories and docs pages within the Storybook preview iframe. It also initializes Font Awesome icons.  
  * **preview-head.html**: An HTML file used to inject global \<link\> or \<script\> tags directly into the \<head\> of the Storybook preview iframe, such as the Font Awesome CSS CDN link.  
  * **vitest.setup.ts**: Configures Vitest for integration with Storybook's testing utilities, allowing for component testing within the Storybook environment.  
* **.github/**: Contains configuration files related to GitHub, primarily for Continuous Integration/Continuous Deployment (CI/CD) workflows.  
  * **workflows/**: Holds GitHub Actions workflow definitions, such as build-publish-deploy.yml, which automates the build, testing, publishing, and deployment processes.  
* **CNAME**: A plain text file used for custom domain configuration for GitHub Pages deployment. It points the Storybook documentation site to design.edupub.social.  
* **LICENSE**: Specifies the licensing terms for the project.  
* **README.md**: This document, serving as the top-level introduction and guide for the repository.  
* **package.json**: The Node.js project manifest file, containing metadata (name, version), project scripts (for development, build, test, Storybook), and lists all project dependencies and development dependencies.  
* **package-lock.json**: A generated file that records the exact versions of dependencies used, ensuring consistent installations across different environments.  
* **rollup.config.js**: The configuration file for Rollup, the module bundler used to compile the component library's source code into optimized distribution formats (CommonJS and ES Modules) for publishing to npm.  
* **tsconfig.app.json**: A TypeScript configuration file specifically for the application code within the component library, defining compilation options.  
* **tsconfig.build.json**: Another TypeScript configuration file, specifically tailored for the Rollup build process to generate optimized output and declaration files.  
* **tsconfig.json**: The main TypeScript configuration file for the project, which extends and references other tsconfig.\*.json files.  
* **tsconfig.node.json**: TypeScript configuration for Node.js environment, used by tools like Vite and Rollup configurations.  
* **vite.config.ts**: The configuration file for Vite, used for development and local bundling.

### **Installation**

To set up the AscendUCore Design System locally for development or to explore its components, follow these steps:

1. **Clone the repository:** Begin by cloning the project's Git repository from GitHub to your local machine using the git clone command, then navigate into the newly created directory.  
2. **Install dependencies:** Once in the project directory, use your preferred package manager (npm or yarn) to install all necessary project dependencies and development dependencies. This command reads the package.json file and fetches all required packages.  
3. **Add Font Awesome CSS for Storybook (Crucial for Icon Component):** To ensure that Font Awesome icons render correctly within the Storybook environment, their global CSS stylesheet must be loaded. This is handled automatically by Storybook due to configurations in main.ts and the inclusion of the Font Awesome CDN link within preview-head.html. This ensures that when you run the Storybook development server, the icons are correctly displayed.

## **Usage in React Applications**

The AscendUCore Component Library is designed to be consumed as a standard npm package within any React application.

### **Package Information**

The library is published as a versioned npm package, making it easily installable and manageable as a dependency in other projects.

* **Name:** The package is named @activityeducation/component-library.  
* **Current Version:** The current stable version is 1.0.5.  
* **Main Entry (CommonJS):** For Node.js environments and older bundlers, the main entry point is dist/cjs/index.js.  
* **Module Entry (ESM):** For modern browsers and bundlers, the ES Module entry point is dist/esm/index.js.  
* **Type Declarations:** TypeScript declaration files (.d.ts) are provided at dist/index.d.ts, offering full type-checking support when consuming the library in TypeScript projects.

### **Peer Dependencies**

The library relies on react and react-dom as "peer dependencies." This means the library itself does not bundle its own copies of React. Instead, it *expects* the consuming application to provide compatible versions of React and ReactDOM. This prevents issues like duplicate React instances, which can lead to unpredictable behavior and errors (e.g., problems with React Context). The package.json specifies that React and ReactDOM versions compatible with ^19.0.0 are required.

### **ThemeProvider Setup (Crucial\!)**

As all components within AscendUCore are styled using Emotion.js, they rely on a ThemeProvider to access the global design tokens (colors, spacing, typography, etc.). It is **crucial** to wrap your application, or at least the specific sections of your application that utilize AscendUCore components, with this ThemeProvider.

* **For Docusaurus:** If integrating into a Docusaurus project, you should modify the src/theme/Root.js (or Root.tsx) file within your Docusaurus project. This file is Docusaurus's designated mechanism for wrapping the entire application with custom React contexts. Inside Root.js, you'll import both ThemeProvider and the theme object from @activityeducation/component-library and then use the ThemeProvider to encapsulate the children prop, ensuring the theme is available to all Docusaurus-rendered components.  
* **For other React applications (e.g., a Create React App or Next.js app):** In a standard React application, you would wrap your root component (commonly App.js or, in Next.js, \_app.js) with the ThemeProvider. This involves importing ThemeProvider and the theme object from your component library and using the ThemeProvider to encapsulate your entire application's user interface.

### **Importing Components**

Components from the AscendUCore Design System are imported directly from the published npm package using standard ES6 import syntax. For example, to bring in common components like Button, Card, Input, and Icon, you would use a single import statement. For components that are composed of sub-components or exported as a group (like TabGroup and its Tab children), they are also imported directly from the same package.

### **Basic Component Usage**

Once imported, AscendUCore components are used as standard React components within your JSX code. They accept props according to their defined TypeScript interfaces, allowing for flexible configuration and customization. For instance, a Card component might receive distinct props to define its Header, Title, Subtitle, the main Content passed as children, and an Actions section for interactive elements. Within these structured slots, you would then embed other AscendUCore components like Button or Input.

### **Using the css Prop for Custom Styles**

Emotion.js, the styling library used in AscendUCore, provides a powerful css prop that can be applied directly to any of your components. This prop allows for writing inline custom styles or overriding existing component styles using Emotion's CSS-in-JS syntax. The css prop accepts either a serialized CSS object or a function that returns one, providing a flexible mechanism for fine-tuning styles while still benefiting from Emotion's features like theme access and automatic vendor prefixing.

### **Font Awesome Integration**

To ensure that Font Awesome icons, which are used by the Icon component, display correctly within your consuming application, the Font Awesome CDN link must be included. This link provides the necessary CSS stylesheet for the icons.

* **For Docusaurus:** The recommended approach is to add the Font Awesome CDN URL to the stylesheets array within the themeConfig object in your Docusaurus project's docusaurus.config.js file. Docusaurus will then automatically inject this link into the \<head\> of every page.  
* **For other HTML-based projects:** If you are using a standard HTML-based project setup (e.g., a Create React App or a custom Webpack setup), the \<link\> tag for the Font Awesome CSS should be placed directly within the \<head\> section of your project's index.html file.

## **Usage in CSS/Sass Applications (via CSS Variables)**

Even if your project primarily uses traditional CSS or Sass for styling and does not directly leverage React or Emotion.js, you can still benefit from the consistent design tokens defined in the AscendUCore Design System.

1. **Import \_theme.scss:** The \_theme.scss file is generated during the component library's build process and contains all design tokens as standard CSS variables (e.g., \--color-background-surface, \--spacing-md). You should copy this file into your project (for example, from node\_modules/@activityeducation/component-library/dist/\_theme.scss after building your library) and then import it into your main Sass or CSS entry point.  
2. **Apply CSS Variables:** Once the \_theme.scss file is imported, its defined CSS variables become globally available throughout your stylesheets. You can then directly use these variables in your Sass or CSS rules to apply consistent styling, such as setting background-color, padding, font-family, or box-shadow properties, ensuring visual alignment with the design system.

## **Development Workflow**

The AscendUCore Design System employs a streamlined development workflow designed to maximize efficiency, collaboration, and code quality.

### **Storybook: Isolated Development & Documentation**

Storybook is an indispensable tool that serves as the primary environment for developing, testing, and comprehensively documenting UI components in isolation from the main application. It provides a dedicated sandbox for component work.

* **To start Storybook:** Initiating the Storybook development server is straightforward. Running either npm run storybook or yarn storybook from the project's root directory will compile and launch Storybook, typically opening it automatically in your web browser at http://localhost:6006.  
* **Key Features in Storybook:**  
  * **Isolated Rendering:** Developers can view and interact with components in various states, completely decoupled from any application-specific data or dependencies. This isolation prevents side effects and speeds up development.  
  * **Controls (Args Table):** Storybook's built-in Controls addon provides a dynamic UI panel. Developers can use this panel to adjust component props on the fly, enabling rapid testing of different scenarios, states, and prop combinations without writing additional code.  
  * **Docs Tab:** For each component story, Storybook automatically generates a dedicated "Docs" tab. This tab displays a detailed overview of the component, including its API (props), usage examples, and often renders directly from JSDoc comments within the component's source code and explicit Markdown/MDX documentation.  
  * **Addons:** Storybook's extensibility is a major strength. It supports a wide range of official and community-contributed addons. For instance, the a11y addon provides automated accessibility checks to identify common accessibility violations, and the interactions addon allows simulating user behavior and writing automated UI tests directly within Storybook stories.

#### **Storybook Configuration (.storybook/)**

The .storybook/ directory contains all the configuration files that dictate how Storybook behaves, where it finds your components, and how it renders them.

* **main.ts:** This is the core Storybook configuration file. It defines critical parameters such as where Storybook should locate your stories (both MDX documentation files and Component Story Format (CSF) files), which Storybook addons are enabled, and the underlying framework being used (in this case, React with Vite). It also configures autodocs to automatically generate documentation pages for all stories that are explicitly tagged with tags: \['autodocs'\].  
* **preview.ts:** This file is responsible for setting up global configurations that apply across all stories and documentation pages within the Storybook preview iframe. Crucially, it imports and applies the ThemeProvider from your design system as a global decorator. This ensures that every component rendered in Storybook automatically has access to your defined theme tokens. Additionally, it sets up global parameters for controls and initializes Font Awesome icons for consistent display.  
* **preview-head.html:** This is a simple HTML file that allows you to inject global \<link\> or \<script\> tags directly into the \<head\> of the Storybook preview iframe. In this project, it is specifically used to ensure the Font Awesome CSS stylesheet is loaded, which is necessary for the Icon component to render correctly within Storybook.  
* **vitest.setup.ts:** This file configures Vitest for seamless integration with Storybook's testing utilities. It applies project-specific annotations and setups that are necessary for running unit and component tests effectively within the Storybook environment.

#### **Storybook Deployment**

The Storybook documentation site is designed for automatic deployment, making the live style guide easily accessible. It is automatically deployed to GitHub Pages. This deployment utilizes a custom domain, design.edupub.social, which is configured through the CNAME file located in the root directory of the repository.

### **Adding New Components**

The process for adding a new component to the AscendUCore Component Library is standardized to ensure consistency, proper documentation, and ease of integration.

1. **Create the component file:** Develop the new React component and its corresponding Emotion.js styles. These files should be placed in the src/components/ directory. For more complex components, a dedicated subdirectory within components/ may be created (e.g., src/components/MyNewComponent/index.tsx).  
2. **Create the Storybook story file:** A dedicated Storybook story file for the new component must be created in src/stories/library/MyNewComponent.stories.tsx. This file will contain the Component Story Format (CSF) definitions for your component, thoroughly documenting its props, various visual styles (variants), and functional states. It is essential to include tags: \['autodocs'\] within the story's metadata to ensure automatic documentation generation in Storybook.  
3. **Export the component:** To make the new component available for consumption by other applications (after the library is built and published), an export statement for the component must be added to the main entry point file, src/index.ts.

### **Building the Library**

To build the AscendUCore Component Library for distribution (e.g., to prepare it for publishing to a package registry like npm), specific commands are used that orchestrate a series of build steps.

* **Build command:** The command npm run build:component (or yarn build:component) initiates the entire build process. This script, defined in package.json, leverages configuration files like rollup.config.js and tsconfig.build.json to perform the compilation and bundling.  
* **Build Steps:**  
  * **Clean dist:** The build process begins by thoroughly cleaning the dist directory, removing any previously built artifacts to ensure a fresh build.  
  * **TypeScript Declarations (tsc \-b / tsc \-p tsconfig.build.json \--emitDeclarationOnly \--declarationDir dist/esm/types):** TypeScript files are compiled specifically to generate .d.ts declaration files. These files are crucial for providing robust type-checking support and intelligent autocompletion when other TypeScript projects consume your library.  
  * **Rollup Bundling (rollup \-c):** Rollup, the module bundler, then processes the JavaScript code to create optimized bundles in different module formats. This includes CommonJS (CJS) for Node.js environments (dist/cjs/index.js) and ES Modules (ESM) for modern browsers and bundlers (dist/esm/index.js).  
  * **Minification (@rollup/plugin-terser):** The generated JavaScript bundles are minified using @rollup/plugin-terser to reduce their file size. This optimization is vital for production environments, leading to faster load times for applications that consume the library.  
  * **CSS Extraction (rollup-plugin-postcss):** Emotion's CSS is extracted from the JavaScript and typically bundled into the generated JavaScript files, or optionally extracted into static .css files if configured.

Upon successful completion, the dist/ folder will contain the compiled and packaged version of your library, fully optimized and ready to be consumed by other projects.

* **Build Storybook Static Site:** The command npm run build-storybook (or yarn build-storybook) compiles your entire Storybook instance into a static web application. The resulting output, typically located in the storybook-static directory, can then be easily hosted on any static web server (such as GitHub Pages) to serve as a live, interactive documentation site for your components.

### **Linting & Type Checking**

To maintain high code quality, consistency, and minimize errors, the design system integrates robust linting and type-checking processes into its development workflow.

* **Linting:** The npm run lint or yarn lint command executes ESLint, a powerful static code analysis tool. ESLint is configured using eslint.config.js and leverages typescript-eslint to specifically check TypeScript and React files. This process identifies potential code quality issues, enforces coding style guidelines, and helps maintain a consistent codebase across all contributors.  
* **Type Checking:** TypeScript type checking is an integral part of the build process. The tsc \-b command (executed as part of the main build script) performs comprehensive type validation across the entire project. This static analysis catches type-related errors and inconsistencies before the code is compiled, significantly reducing runtime bugs and improving overall code reliability.

## **Contributing to the System**

Contributions to the AscendUCore Design System are highly encouraged and welcome\! We believe that a collaborative effort will help the system evolve and improve. For detailed instructions on how to set up your development environment, adhere to coding standards, and submit your contributions, please refer to our (forthcoming) CONTRIBUTING.md file. This document will provide step-by-step guidance for new contributors.

## **Accessibility (A11y)**

Accessibility is a non-negotiable core tenet of the AscendUCore Design System. Our commitment to accessibility ensures that the educational platform is usable by all individuals, regardless of their abilities or assistive technologies.  
All components are meticulously developed with Web Content Accessibility Guidelines (WCAG) in mind from conception through implementation. This includes utilizing proper semantic HTML elements (which inherently convey meaning to assistive technologies), incorporating necessary ARIA (Accessible Rich Internet Applications) attributes to enhance interactive elements, and ensuring full keyboard navigation support for all interactive components.  
To proactively identify and resolve accessibility issues during the development phase, automated accessibility checks are deeply integrated into Storybook via the @storybook/addon-a11y. This addon visually highlights potential accessibility violations directly within the Storybook environment. Furthermore, the vitest.setup.ts file configures the @storybook/addon-a11y/preview to run accessibility annotations during automated tests, ensuring a consistently high standard of accessibility across the entire component library.

## **Maintenance & Versioning**

The AscendUCore Design System is recognized as a living product, continuously evolving to meet the changing needs of the platform and adapt to new design insights. Robust processes are in place to manage its growth and ensure stability.

* **Automated Release with Semantic-Release:** The project utilizes semantic-release, an automated tool configured in .releaserc.json, to manage the entire release workflow. This automation significantly reduces human error and ensures consistent versioning. The process includes:  
  * **Commit Analysis (@semantic-release/commit-analyzer):** This plugin analyzes conventional commit messages (e.g., feat:, fix:, BREAKING CHANGE:) to automatically determine the next appropriate semantic version (major, minor, or patch).  
  * **Release Notes Generation (@semantic-release/release-notes-generator):** Based on the analyzed commits, this plugin automatically generates comprehensive release notes and a changelog, providing clear documentation of what has changed in each new version.  
  * **npm Publishing (@semantic-release/npm):** The new version of the @activityeducation/component-library package is automatically published to the configured npm registry (e.g., GitHub Packages), making it available for consumption by other projects.  
  * **GitHub Releases (@semantic-release/github):** A new release is automatically created on GitHub, and any associated build artifacts are uploaded, providing a clear history of releases directly within the repository.  
  * **Git Tagging (@semantic-release/git):** A new Git tag corresponding to the new version is automatically pushed to the repository, ensuring that specific release points are clearly marked in the version control history.  
* **CI/CD Pipeline (GitHub Actions):** The .github/workflows/build-publish-deploy.yml workflow, defined using GitHub Actions, orchestrates the entire Continuous Integration/Continuous Deployment (CI/CD) pipeline. This automated workflow ensures that every change goes through a standardized process:  
  * **build-and-publish-component job:** This job is triggered automatically on every push to the main branch. It installs project dependencies, executes the npm run build:component command to build the library, configures Git for authentication, and then runs npx semantic-release to automate the versioning, changelog generation, and publishing of the npm package. This job requires specific write permissions (contents, packages, issues, pull-requests) to perform its tasks.  
  * **deploy-storybook job:** This job is configured to run only after the successful completion of the build-and-publish-component job. It installs dependencies, executes npm run build-storybook to compile the Storybook documentation into a static website, and then deploys this static site to GitHub Pages using the peaceiris/actions-gh-pages@v3 action. The Storybook documentation is made publicly accessible at the custom domain design.edupub.social, which is configured via the CNAME file in the repository root.

This comprehensive document serves as a foundational guide for anyone (human or AI) seeking to understand, utilize, or contribute to the **AscendUCore Design System and Component Library**, ensuring a smooth and consistent development experience.