---
sidebar_position: 4
title: "User Experience and Visual Design"
---

# **EducationPub User Experience and Visual Design**

This document describes the user experience (UX) and visual elements of the EducationPub platform, designed to provide a robust and empowering learning interface. We will break down key user flows, detailing the pages and components involved in each step, all through the lens of Angular Material Design, with a strong emphasis on **Visual Hierarchy** to guide the user's journey.

## **1\. Core Design Principles**

The EducationPub platform will be built upon the following design principles to ensure a user-centric and effective learning environment:

* **Clarity & Simplicity (Material Metaphor):** Information and interactions should be straightforward and easy to understand, minimizing cognitive load. The interface will leverage Material Design's metaphor of physical paper and ink, using distinct surfaces and subtle shadows (mat-elevation) to create clear visual hierarchy. The user should feel a sense of calm and control, akin to navigating a well-organized university campus or a meticulously structured language course. Every element serves a clear purpose, guiding the eye effortlessly towards learning objectives on a predictable, tactile surface.  
* **Engagement & Motivation (Motion Provides Meaning):** The interface will be visually appealing and foster a sense of progress and accomplishment. Subtle gamification elements (badges for milestones, streaks for consistent study, progress milestones for objective completion) could be integrated, providing gentle nudges and celebrating small victories. Material Design's emphasis on meaningful motion will be employed, with smooth transitions and ripple effects (matRipple) guiding user attention and providing satisfying feedback for interactions. This makes learning feel like an achievable and rewarding academic journey, akin to advancing through a curriculum or mastering new vocabulary in a language app. The user should feel encouraged, celebrated, and intrinsically driven by responsive and intuitive interactions.  
* **Personalization (Flexible Foundation):** Users should feel that the platform adapts to their individual learning needs and preferences, offering tailored content and progress tracking. Material Design's flexible foundation ensures the interface adapts gracefully across devices and screen sizes, providing a consistent yet personalized experience. The interface should feel like a dedicated academic advisor or a highly responsive language tutor, understanding and anticipating their unique learning style, pace, and goals.  
* **Accessibility (Inclusive Design):** Design choices will consider users with diverse abilities, adhering to WCAG guidelines for contrast, navigation, and alternative text. Material Design components are built with accessibility in mind, providing robust foundations for keyboard navigation, screen reader support, and high contrast options. The platform should feel welcoming and usable for everyone, ensuring no learner is left behind due to interface barriers, much like a modern educational institution strives for inclusive design.  
* **Federation Awareness (Subtle):** While a robust local experience is key, subtle visual cues (e.g., @username@instance.com format, small, unobtrusive instance badges next to remote content) will indicate the federated nature of content and interactions where relevant, without overwhelming the user. This creates a sense of a vast, interconnected global classroom or a network of specialized academic departments, without making it feel complex or fragmented.

## **1.1. Color Palette**

The EducationPub platform will utilize a thoughtfully chosen color palette, adhering to Material Design's color system, derived directly from the provided \_theme-colors.scss. This palette ensures visual consistency, accessibility, and a professional aesthetic that supports the learning environment.

* **Primary Palette (Base: \#1A435A \- Deep Ocean Blue):** This serves as the dominant brand color, evoking trust, stability, and intellectual depth.  
  * **Primary 400 (\#3d637b):** This shade will be prominently used for primary action buttons (mat-raised-button), active navigation states, and key interactive elements, drawing the user's eye to the most important actions.  
  * **Primary 10 (\#001e2e):** A very dark shade, suitable for deep backgrounds in dark mode or subtle accents.  
  * **Primary 90 (\#c7e7ff):** A very light shade, ideal for hover states or subtle highlights.  
* **Secondary Palette (Base: \#4CAF50 \- Vibrant Green):** This acts as an accent color, symbolizing growth, success, and positive feedback.  
  * **Secondary 500 (\#22892f):** This shade will be used for success indicators (e.g., checkmarks, progress completion), accent elements, and calls to action that signify positive outcomes (e.g., "Start Study Session").  
  * **Secondary 10 (\#002204):** A very dark, almost black green.  
  * **Secondary 90 (\#94f990):** A light, refreshing green for subtle accents.  
* **Tertiary Palette (Base: \#36454F \- Slate Gray):** This palette provides complementary tones, offering visual balance and depth without competing with the primary and secondary colors.  
  * **Tertiary 70 (\#9dadb9):** A medium-light gray, suitable for subtle backgrounds, borders, or dividers, creating clear separation of content.  
  * **Tertiary 20 (\#23323c):** A dark, rich gray for backgrounds or secondary text in dark mode.  
* **Neutral Palette (Grayscale):** Essential for text, backgrounds, and general UI elements, ensuring high contrast and readability.  
  * **Neutral 95 (\#f1f0f2):** A very light gray, serving as the primary background color for light themes, providing a clean canvas.  
  * **Neutral 10 (\#1a1c1d):** A dark gray, ideal for primary text color in light themes, ensuring strong readability.  
  * **Neutral 50 (\#767779):** A medium gray, suitable for secondary text, icons, or subtle borders.  
  * **Neutral 0 (\#000000):** Pure black, used sparingly for maximum contrast where needed.  
  * **Neutral 100 (\#ffffff):** Pure white, used for text on dark backgrounds or elevated surfaces.  
* **Error Palette (Base: \#BA1A1A \- Alert Red):** Dedicated to signaling errors, warnings, and destructive actions, ensuring immediate user attention.  
  * **Error 500 (\#de3730):** This vibrant red will be used for error messages, validation feedback, and prominent destructive action buttons (e.g., "Delete Account").  
  * **Error 400 (\#ba1a1a):** A slightly darker red, used for primary destructive buttons to emphasize their irreversible nature.

The strategic application of these colors will evoke a sense of professionalism, calm, and encouragement, fostering a positive and intuitive learning atmosphere.

## **1.2. Overall Application Feeling**

The EducationPub application strives to feel like a modern, well-structured academic institution brought to life digitally. Imagine the quiet, focused hum of a university library, combined with the encouraging, step-by-step progression of a premium language learning app. Every interaction is designed to be purposeful and clear, guiding the user through their educational journey with the reassuring presence of a dedicated mentor. The interface is clean and uncluttered, allowing knowledge to take center stage, fostering a sense of intellectual clarity and a calm environment for deep learning. It's a space where learners feel empowered to explore, create, and connect, much like walking through a vibrant campus where every path leads to discovery and growth.

## **2\. Global Navigation and Layout**

The application will feature a consistent global navigation system, adapting seamlessly to different screen sizes (responsive design). The overall aesthetic will be clean, modern, and inviting, reminiscent of a polished academic portal or a sophisticated language learning application, with a strong focus on readability, visual hierarchy, and a sense of intellectual professionalism, all underpinned by Material Design's structured surfaces.

### **2.1. Desktop Layout**

* **Header (Top Bar \- mat-toolbar):** This will be a sleek, fixed mat-toolbar at the top, typically with a light or neutral background color (e.g., **Neutral 99 (\#fcfcfe)** or **Neutral 98 (\#f9f9fb)**) and a subtle mat-elevation-z4 shadow, providing a clean, unobtrusive backdrop and a sense of depth. The visual hierarchy here directs the eye from the brand identity to global search, then to personal notifications and creation, and finally to profile management.  
  * **Logo/Site Title:** Positioned prominently on the left, perhaps a stylized "EducationPub" wordmark or a minimalist icon that subtly suggests a book, a brain, or a connection. It acts as a comforting anchor, always visible, and a clickable link back to the Home/Feed, offering a quick return to the central learning hub.  
  * **Search Bar:** A central, elegant search input field, implemented as a mat-form-field with an outline or fill appearance. It might feature a subtle mat-icon (magnifying glass) as a prefix. When clicked, it expands slightly with a smooth Material animation, inviting the user to type. A small, almost hidden, mat-icon-button (filter/advanced search) to its right suggests deeper exploration without cluttering the initial view. The user feels empowered to find exactly what they need, whether it's a specific lesson, a fellow learner, or a research topic, quickly and efficiently, much like searching a well-indexed academic library.  
  * **Notifications Icon (mat-icon-button):** A classic bell mat-icon, which glows softly or shows a small, unobtrusive matBadge for unread notifications. This subtle visual cue creates a gentle anticipation of new interactions, feedback on submissions, or progress updates, akin to receiving an important message from a professor or a study group. Clicking it triggers a mat-menu or mat-dialog for immediate context, or a smooth transition to the full Notifications page.  
  * **Create Button (mat-fab or mat-raised-button):** This is the **primary action button** in the header, visually distinct as a prominent, often brightly colored mat-fab (Floating Action Button) or a mat-raised-button with the **Primary 400 (\#3d637b)** color. Its position and visual weight make it a clear call to action, inspiring the user to contribute their knowledge, design a lesson, or set a new objective. Clicking it triggers a Material ripple effect and feels like opening a new notebook or starting a fresh project.  
  * **Profile Avatar/Menu (mat-menu trigger):** On the far right, a small circular mat-chip or mat-icon-button displays the user's profile picture. This personal touch provides a sense of ownership and identity within the academic community. Clicking it unfurls a clean, organized mat-menu with essential mat-list-item links like My Profile (their academic portfolio), Settings (personal preferences), Help (support resources), and Logout, offering quick access to personal controls.  
* **Sidebar (Left Navigation \- mat-sidenav):** A clean, fixed mat-sidenav that provides a constant sense of orientation, much like a well-structured course syllabus. It can be toggled between a minimalist icon-only view and an expanded view, maximizing content space. The expansion/collapse will feature smooth Material animations. The visual hierarchy here guides the user through core platform sections, with active links clearly highlighted.  
  * **Main Navigation Links (mat-list-item):** Each link features a clear, intuitive mat-icon (e.g., a house for Home, a book for My Learning, a compass for Explore, chat bubbles for Messages) paired with concise text labels. These mat-list-items are generously spaced, making them easy to click, and change background color or highlight subtly on hover and when active, providing clear feedback with Material ripple effects. The user feels grounded and knows exactly where they are within their learning journey and where they can go next.  
  * **Quick Access/Recent Items (mat-list):** (Optional) A small, dynamic mat-list section at the bottom of the sidebar. It might display small mat-card thumbnails or mat-list-item titles of recently accessed content or active objectives, acting as a mental bookmark, allowing for quick resumption of learning, reducing friction, and making the user feel efficient and productive, like picking up exactly where they left off in a textbook.  
* **Main Content Area:** This is the expansive, primary workspace where all specific page content is rendered. It's designed to be clean, with ample whitespace, allowing the content to breathe and the user to focus without distraction. The background is typically a soft, neutral tone (e.g., **Neutral 96 (\#f4f3f5)** or **Neutral 99 (\#fcfcfe)**), ensuring readability and reducing eye strain, creating an optimal environment for concentration and learning, consistent with Material Design's surface principles.

### **2.2. Mobile Layout**

* **Header (Top Bar \- mat-toolbar):** Streamlined for smaller screens, retaining essential elements. The logo might be smaller, and the search and notifications mat-icon-buttons might remain, but the main navigation is typically condensed into a mat-icon-button (hamburger menu icon) on the left. Tapping it smoothly slides in the main navigation mat-sidenav as a full-screen overlay, maintaining the sense of a cohesive experience, even on the go.  
* **Bottom Navigation Bar (mat-bottom-nav or mat-toolbar with mat-icon-buttons):** A fixed bar at the bottom, optimized for thumb-reachability. This provides quick access to core features, ensuring the most frequent actions are always at hand, making mobile learning feel fluid and responsive. The **primary action for mobile is often the "Create" button**, centrally located and visually distinct.  
  * **Home/Feed**  
  * **My Learning**  
  * **Create** (Central, prominent mat-fab with the **Primary 400 (\#3d637b)** color that visually pops, inviting creation and contribution, serving as the **primary action button** on the mobile navigation bar)  
  * **Explore**  
  * Notifications  
    Each mat-icon-button is large enough for easy tapping, with clear visual feedback on press and Material ripple effects, making interaction effortless.  
* **Main Content Area:** Takes up most of the screen, optimized for vertical scrolling and touch interactions. Content adapts fluidly, images resize gracefully, and text wraps intelligently, ensuring a comfortable reading and interaction experience on the go, making learning accessible anytime, anywhere, within Material Design's adaptive layouts.

## **3\. User Flows and Page Details**

### **3.1. Onboarding & Account Management Flow**

**Purpose:** To allow new users to register, log in, and manage their basic account information, creating a welcoming and secure entry point into the EducationPub community, similar to enrolling in a new course or joining an academic institution's online portal.

#### **3.1.1. Registration Page (/register)**

* **Visual Elements:** The page exudes simplicity and trust, setting a professional yet inviting tone. The EducationPub brand logo is prominently displayed at the top, perhaps with a subtle glow or animation, conveying a sense of innovation and opportunity. The heading, "Sign Up for EducationPub," is rendered using a Material Design typography style (e.g., mat-headline-5), large, friendly, and clear, like a welcome sign to a new learning environment. The visual hierarchy here clearly leads the user to complete the registration.  
  * Input fields for Username, Email Address, Password, and Confirm Password are clearly labeled mat-form-field components, using an outline or fill appearance with floating labels. Subtle placeholder text (e.g., "Choose a unique username, e.g., @yourusername@yourplatform.com") guides input. The password field might include a dynamic strength indicator (a colored mat-progress-bar or text like "Strong") that updates in real-time as the user types, providing immediate feedback and encouraging robust security, akin to best practices in an academic setting.  
  * A mat-checkbox for "I agree to the Terms of Service and Privacy Policy" is accompanied by clickable, underlined links to these documents, fostering transparency and legal understanding, much like reviewing a university's code of conduct.  
  * The "**Sign Up**" button is the **primary action button** on this page, implemented as a mat-raised-button with the **Primary 400 (\#3d637b)** color from the theme and a subtle mat-elevation shadow, drawing the eye and inviting the user to embark on their learning journey with confidence. It features a Material ripple effect on click.  
  * A secondary, less prominent link, "Already have an account? Log In," is a mat-button (text button), offering a clear alternative for returning users without distracting from the main goal.  
  * Real-time validation feedback is crucial: Error messages (e.g., "Username already taken," "Passwords do not match," "Invalid email format") appear immediately and clearly below the relevant mat-form-field components, often in the **Error 500 (\#de3730)** color, preventing frustration and guiding the user to correct their input efficiently.  
* **Components:**  
  * AuthForm component: A clean, well-structured mat-card or container that wraps all authentication-related inputs and actions, ensuring consistency across login and registration.  
  * mat-form-field with mat-input: Standardized text, email, and password inputs with integrated validation states, providing a consistent and reliable user experience.  
  * mat-raised-button (primary, using Primary 400), mat-button (secondary): For actions, designed with consistent Material styling and ripple effects.  
  * mat-checkbox: For terms agreement, ensuring legal compliance is handled smoothly.  
  * mat-progress-bar: For password strength indication.

#### **3.1.2. Login Page (/login)**

* **Visual Elements:** Mirrors the registration page's clean layout and branding, creating a familiar and secure entry point. The heading, "Log In to EducationPub," is clear and direct, signaling access to their personalized learning space, using Material typography. The visual hierarchy guides the user straight to the login action.  
  * Input fields for Username/Email and Password are straightforward and intuitive mat-form-field components.  
  * The "**Log In**" button is the **primary action button**, implemented as a mat-raised-button with the **Primary 400 (\#3d637b)** color, providing a clear, visually dominant path to access the platform.  
  * "Forgot Password?" and "Don't have an account? Sign Up" links are mat-buttons, offering easy navigation for common scenarios, ensuring users can always regain access or create a new account, without competing with the primary login action.  
  * Error messages for incorrect credentials are displayed subtly but clearly, preventing user confusion while maintaining security. The user should feel that their account is secure and that the platform is guiding them if they make a mistake, much like a helpful IT support system at an institution.  
* **Components:**  
  * AuthForm component (likely a mat-card).  
  * mat-form-field with mat-input.  
  * mat-raised-button (primary, using Primary 400), mat-button (secondary).

#### **3.1.3. Profile Settings Page (/settings/profile)**

* **Purpose:** To empower users to update their public profile information, allowing them to express their identity and learning interests, akin to setting up an academic profile or a professional portfolio.  
* **Visual Elements:** The page is organized and intuitive, making customization feel simple and empowering. The visual hierarchy ensures that saving changes is the clear primary action.  
  * **Settings Navigation (mat-tab-group or mat-list in mat-sidenav):** A clear mat-tab-group at the top or a mat-list within a left mat-sidenav provides a sense of structure, allowing users to easily switch between Profile, Account, Notifications, Privacy, Display, and More settings. The active tab or list item is clearly highlighted with Material's ink bar or background color, providing a visual anchor and a clear sense of location within the settings.  
  * **Profile Picture Upload (mat-chip or circular container):** A large, circular display of the current avatar invites personalization. An "Upload" or "Change Avatar" mat-icon-button subtly overlays the image, and clicking it opens a file selector. A live preview of the new image appears before saving, giving the user confidence in their choice, much like selecting a professional headshot.  
  * **Header/Banner Image Upload:** A rectangular area above the profile picture allows for a larger, expressive banner image, similar to a cover photo on a professional networking site or a personal academic blog. An "Upload Header" or "Change Banner" mat-raised-button makes it easy to add a personal touch.  
  * Input fields for Display Name, Bio/About Me (a generous multi-line mat-form-field with mat-input and mat-autosize), Location, Website, Preferred Language (a clear mat-select dropdown for UI language), and Languages Learning/Teaching (a mat-select with multiple selection that feels effortless to use, reflecting language learning app features). Each mat-form-field has a clear floating label and optional placeholder text.  
  * The "**Save Changes**" button is the **primary action button** for this page, implemented as a mat-raised-button with the **Primary 400 (\#3d637b)** color, perhaps sticky at the bottom or clearly visible, ensuring the user doesn't miss it after making edits. Its prominence guides the user to confirm their profile updates.  
  * "Change Password" and "Delete Account" buttons are clearly separated and distinct, appearing as mat-buttons or mat-stroked-buttons. "Delete Account" often appears in the **Error 500 (\#ba1a1a)** color but remains visually secondary to "Save Changes", requiring a mat-dialog confirmation modal, emphasizing the gravity of the action. The user feels in control of their data and identity, like managing their academic records.  
* **Components:**  
  * SettingsNavigation component (mat-tab-group or mat-sidenav with mat-list).  
  * mat-card for content sections.  
  * mat-form-field with mat-input, mat-select, mat-checkbox.  
  * mat-raised-button (primary, using Primary 400), mat-button, mat-icon-button, mat-stroked-button (secondary).  
  * mat-dialog for confirmation.

### **3.2. Learning Content Creation & Management Flow**

**Purpose:** To enable users (especially educators or self-learners) to create, edit, and organize educational content, fostering a sense of creative empowerment and structured learning, much like a university lecturer designing a course or a language learner curating personalized study materials.

#### **3.2.1. Create New Content Menu (mat-dialog or mat-menu)**

* **Visual Elements:** When the global "Create" button is clicked, a sleek mat-dialog overlay or mat-menu gracefully appears, dimming the background slightly to focus attention. The clear heading, "What would you like to create?", is rendered with Material typography and invites action and creativity. The visual hierarchy here emphasizes the *choice* of content type.  
  * A visually appealing list of content types is presented, each as a clickable mat-list-item or mat-card with a distinct, intuitive mat-icon (e.g., a flashcard icon, a book for Story, a video camera for Video Lesson) paired with a concise title and a brief, encouraging description (e.g., "Digital flashcards for memorization," "Define the structure of your flashcards"). These mat-list-items or mat-cards serve as the **primary interactive elements** of this menu, each designed to draw the eye and encourage selection. They might have subtle mat-elevation changes on hover, making selection feel responsive and engaging, like choosing a specialized tool from an academic toolkit.  
  * A "Cancel" or "Close" mat-button provides an easy exit, serving as a clear secondary action. The user feels guided through the creation process, not overwhelmed by options, but rather inspired by the possibilities.  
* **Components:**  
  * mat-dialog or mat-menu component.  
  * mat-list-item or mat-card components (primary interactive elements): Designed with clear mat-icons, titles, and descriptions, making content type selection intuitive.  
  * mat-button (secondary).

#### **3.2.2. Flashcard Creation/Editing Page (/create/flashcard or /flashcard/:id/edit)**

* **Purpose:** To provide a dynamic and intuitive interface for creating new flashcards or modifying existing ones, adapting to the user's chosen edu:FlashcardModel, making the process feel like designing a highly effective learning tool.  
* **Visual Elements:** The page feels like a digital workshop for crafting knowledge, presented on a clean Material surface. The header, "Create New Flashcard" or "Edit Flashcard," is clear and purposeful, using Material typography. The visual hierarchy directs the user towards saving their work.  
  * **Model Selection (mat-select):** A prominent mat-select dropdown or a visually engaging mat-radio-group of mat-card selectors for edu:FlashcardModel (e.g., "Basic Vocabulary", "Image Occlusion") is at the top. As the user selects a model, the form fields below dynamically and smoothly transition with Material animations, creating a responsive and intelligent experience, as if the canvas itself is adapting to their educational vision.  
  * **Dynamic Fields Section (mat-form-field):** Based on the selected edu:FlashcardModel's edu:fields, the page displays appropriate mat-form-field input components.  
    * **Text fields:** Standard mat-form-field with mat-input or mat-autosize textarea components (e.g., "Word", "Definition", "Example Sentence") are clean and easy to type into, providing ample space for detailed content.  
    * **Media fields:** Custom MediaUploadInput components will integrate mat-button for upload, a mat-progress-bar during upload, and a helpful preview (e.g., an integrated audio player with Material sliders, a small mat-card thumbnail for Image). Each field has a clear floating label, ensuring the user understands what content goes where, similar to adding multimedia to a presentation.  
  * **Live Preview Area (mat-card):** A dedicated, prominent mat-card section on the right or below the form provides a live preview of how the flashcard will look on both "Front" and "Back" sides. This area uses the edu:cardTemplates and edu:stylingCSS from the selected model, offering immediate visual feedback. mat-button-toggle-group or mat-icon-buttons allow effortlessly switching between front and back views, making the user feel like a designer and a learner simultaneously, ensuring the card is effective.  
  * **Metadata Section:**  
    * Tags Input (mat-chip-list):\*\* A mat-chip-listforedu:tags(hashtags) is smart, offeringmat-autocompletesuggestions based on popular or user-defined tags (e.g.,\#FrenchVocabulary, \#Algebra\`), making discoverability effortless, like categorizing academic papers.  
    * Related To (mat-form-fieldwithmat-autocomplete):\*\* An mat-form-fieldwithmat-autocomplete\` to link to other content (e.g., a Story, Lesson Plan) with a search/autocomplete feature, allowing users to establish context and build interconnected learning paths, much like cross-referencing in a curriculum.  
    * Target Language and Source Language selectors (mat-select): Intuitive mat-select dropdowns, crucial for language learning.  
    * Visibility selector (mat-radio-group or mat-select): Provides clear control over who sees the content, akin to setting privacy for academic publications.  
  * Action Buttons: The "**Save Flashcard**" button is the **primary action button** for this page, implemented as a mat-raised-button with the **Primary 400 (\#3d637b)** color, visually drawing the eye to confirm the creation/edits. The "Cancel" button is a secondary mat-button, providing a clear alternative without visual competition.  
* **Components:**  
  * DynamicForm component: A powerful component that intelligently renders input fields based on a dynamic schema (the edu:FlashcardModel), ensuring flexibility and consistency within Material Design forms.  
  * MediaUploadInput component: Integrates mat-button, mat-progress-bar, and visual previews.  
  * FlashcardPreview component: Renders the live interactive preview within a mat-card.  
  * mat-chip-list with mat-autocomplete: For managing tags with smart suggestions.  
  * ContentLinker component: For linking to related content, fostering a connected learning environment.  
  * mat-raised-button (primary, using Primary 400), mat-button (secondary), mat-select, mat-radio-group, mat-button-toggle-group.

#### **3.2.3. Story Creation/Editing Page (/create/story or /story/:id/edit)**

* **Purpose:** To provide a rich environment for creating or editing narrative content, designed for reading and listening comprehension, making the user feel like an author or a curriculum developer.  
* **Visual Elements:** The page feels like a digital manuscript or a lesson plan editor, presented on a clean Material surface. The header, "Create New Story" or "Edit Story," sets the tone for a creative and structured task. The visual hierarchy emphasizes content creation and the final save action.  
  * A clear mat-form-field with mat-input for Name (the title of the story) is at the top, inviting a compelling title.  
  * A robust Rich Text Editor for Content (the main story text) dominates the central area. It will be styled to fit Material Design aesthetics, supporting Markdown or basic HTML, allowing for expressive formatting, embedding images, and linking to external resources. The user feels like a storyteller or an editor, with all the tools at their fingertips to craft engaging narratives for learning.  
  * An Audio Upload section for edu:audio (story narration) includes an integrated mat-slider-based audio player for immediate preview, making it easy to synchronize text and sound, crucial for language comprehension.  
  * **Glossary Section (mat-expansion-panel):** A collapsible/expandable mat-expansion-panel, initially compact but expanding smoothly with Material animations to reveal a structured mat-list.  
    * An "Add Term" mat-button invites expansion, making it easy to build a comprehensive vocabulary aid.  
    * Each term entry provides clear mat-form-field input fields for Term, Definition, optional Audio upload (for term pronunciation), and an optional Example Sentence). A small mat-icon-button (e.g., delete icon) next to each term allows for easy removal, making the process feel flexible and iterative, like refining a study guide.  
  * **Comprehension Questions Section (mat-expansion-panel):** Similar to the glossary, this section expands to reveal a dynamic mat-list of questions.  
    * An "Add Question" mat-button.  
    * Each question entry includes a Question Type mat-select dropdown (multipleChoice, fillInTheBlank, trueFalse, shortAnswer, audioResponse, pronunciation, essay), Content mat-form-field input (text, image URL, or audio URL). Dynamic fields appear based on the chosen type (e.g., mat-radio-group for Options, mat-input for Correct Answer, mat-hint for Feedback), making the question creation process adaptable and comprehensive, like designing a quiz for a course. A mat-icon-button provides easy editing/removal.  
  * Level and Target Language selectors (mat-select) are intuitive dropdowns, essential for academic and language learning contexts.  
  * Action Buttons: The "**Save Story**" button is the **primary action button** for this page, implemented as a mat-raised-button with the **Primary 400 (\#3d637b)** color, drawing the eye to commit the story. The "Cancel" button is a secondary mat-button, offering a clear alternative.  
* **Components:**  
  * RichTextEditor component (custom, but styled with Material inputs/buttons).  
  * AudioUploadInput component (integrating mat-slider, mat-icon-button).  
  * mat-expansion-panel with mat-list and mat-form-field: Reusable for managing lists of complex objects (Glossary terms, Questions), providing a consistent editing experience.  
  * QuestionEditor component (nested, integrating mat-select, mat-radio-group, mat-checkbox, mat-input).  
  * mat-raised-button (primary, using Primary 400), mat-button (secondary).

#### **3.2.4. My Learning Dashboard (/my-learning)**

* **Purpose:** To serve as a personalized, motivating dashboard for the user's learning journey, visually summarizing their progress and highlighting key activities, much like a student portal showing course progress and upcoming deadlines. This page's visual hierarchy emphasizes key learning metrics and calls to action for active learning.  
* **Visual Elements:** The dashboard feels like a command center for personal academic growth, presented as a collection of informative Material mat-cards.  
  * **Overview Section (Prominent mat-cards):** This section features visually appealing mat-cards that immediately convey progress and focus, with subtle mat-elevation for emphasis.  
    * "Current Objectives": Displays top 3-5 objectives within mat-cards, featuring vibrant mat-progress-bars that fill up as goals are met, and clear mat-chip Status badges (e.g., "In Progress" in a calming blue from the **Primary palette**, "Achieved" in a satisfying green from the **Secondary palette**, "At Risk" in a gentle orange from a custom warning palette). This creates a sense of immediate accomplishment and focus, akin to seeing a grade report or course completion status.  
    * "Flashcards Due Today": A clear count of cards needing review within a mat-card, accompanied by a prominent "**Start Study Session**" mat-raised-button with the **Secondary 500 (\#22892f)** color that invites immediate action, serving as a **primary call to action** within this section, making it easy to stay on track with spaced repetition, similar to a daily language lesson reminder.  
    * "Upcoming Assessments/Deadlines": A concise mat-list of pending assignments or self-assessments within a mat-card, providing a clear overview of upcoming tasks, like a course calendar.  
  * **Content Sections (Categorized mat-cards/mat-lists):** Below the overview, content is organized into intuitive sections, each displaying a summary (e.g., count of items, recent activity) and a "View All" mat-button link.  
    * "My Flashcard Decks": Collections of edu:Flashcards, perhaps with small mat-progress-spinner circles for each deck, like a library of study sets.  
    * "My Stories": A mat-list of created or saved edu:Storys, with small mat-card thumbnails or mat-icons, like a reading list.  
    * "My Video Lessons": Similar to stories, visually representing video content, like a lecture archive.  
    * "My Assessments": A mat-list of edu:SelfAssessments and edu:Assignments, like a record of quizzes and exams.  
    * "My Writing Prompts & Submissions": A dedicated section for creative and analytical writing, like a portfolio of essays.  
    * "My Exercises": A mat-list of edu:Exercises and edu:PronunciationExercises, like a practice workbook.  
  * Visual indicators for progress (e.g., mat-progress-bars on objectives, mat-icon badges on assessments) are consistently applied, providing a tangible sense of achievement and encouraging continued effort.  
  * "Quick Create" mat-fab buttons are strategically placed within each section for relevant content types, allowing for seamless content creation from the dashboard. The user feels organized, motivated, and always aware of their next learning step, like a proactive student managing their academic workload.  
* **Components:**  
  * mat-card: For all primary content containers, leveraging Material's elevation system.  
  * mat-progress-bar, mat-progress-spinner: For progress indicators.  
  * mat-chip: For status badges.  
  * mat-raised-button (primary within its section, using Secondary 500), mat-fab, mat-button (secondary).  
  * mat-list: For displaying lists of content.

### **3.3. Learning Activity Flow (Flashcards, Assessments)**

**Purpose:** To provide immersive and interactive interfaces for engaging with learning content, making practice and assessment feel productive and insightful, much like a focused study session or a graded examination.

#### **3.3.1. Flashcard Study Session Page (/study/flashcard-deck/:id)**

* **Purpose:** An immersive, distraction-free interface for reviewing flashcards, designed to optimize the spaced repetition learning experience and foster a sense of mastery. The visual hierarchy focuses on the card content and the self-assessment decision.  
* **Visual Elements:** The page transforms into a focused study environment, minimizing distractions to promote deep learning. The central element is a large mat-card representing the flashcard, with a distinct mat-elevation-z8 or higher to make it pop off the background.  
  * **Central Card Display (mat-card):** A large, prominent mat-card area dominates the screen, displaying the current flashcard. It has a clean, minimalist design, allowing the content to take center stage, much like a physical flashcard.  
    * Initially, it shows the "Front" template content (e.g., `&#123;&#123;Word&#125;&#125;`, `&#123;&#123;Image&#125;&#125;`). The text is clear, and images are crisp and relevant.  
    * A clear "**Reveal Answer**" mat-raised-button with the **Primary 400 (\#3d637b)** color, or a satisfying tap/swipe gesture, smoothly flips the card with a Material animation to show the "Back" template content (e.g., &#123;&#123;Definition&#125;&#125;, &#123;&#123;Example Sentence&#125;&#125;). This button is the **primary action** before the answer is revealed, guiding the user to engage. The flip animation is fluid and responsive, creating a tangible sense of revealing knowledge and reinforcing memory.  
  * **Audio Playback (mat-slider and mat-icon-button):** An integrated AudioPlayer is subtly present for edu:audio fields (e.g., pronunciation of a word). It features a simple mat-icon-button (play/pause) and a mat-slider for progress, making listening effortless and essential for language acquisition.  
  * **Self-Assessment Buttons (mat-button-toggle-group or mat-raised-buttons):** After revealing the answer, a set of distinct, color-coded mat-raised-buttons or a mat-button-toggle-group appear at the bottom. These buttons (e.g., "Again", "Hard", "Good", "Easy") become the **primary action buttons** *after* the answer is revealed, guiding the spaced repetition process and providing immediate feedback on recall:  
    * "Again" (Red, using **Error 400 (\#ba1a1a)**): For cards that need immediate re-study, conveying a sense of urgency and the need for more practice.  
    * "Hard" (Orange, using a custom orange shade, e.g., from Neutral 500 or a specific warning palette if defined): For cards that were challenging, suggesting a slightly shorter interval, indicating a need for more focused attention.  
    * "Good" (Green, using **Secondary 500 (\#22892f)**): For cards that were recalled well, indicating a moderate interval, providing positive reinforcement.  
    * "Easy" (Blue, using Primary 400 (\#3d637b)): For cards that were effortless, suggesting a longer interval, celebrating mastery.  
      These buttons are generously sized for easy tapping, and their colors provide immediate emotional feedback. The user feels in control of their learning pace and actively participating in their memory retention process, similar to a highly effective language app. Each button will have a Material ripple effect.  
  * **Navigation Controls (mat-icon-button):** Subtle mat-icon-buttons (e.g., chevron\_left, chevron\_right) or intuitive swipe gestures on mobile allow for smooth navigation within the session, without breaking the flow, maintaining focus. These are secondary to the self-assessment.  
  * **Contextual Links (mat-icon-button with mat-tooltip):** Small, unobtrusive mat-icon-buttons (e.g., search for model definition, link for related content, flag for reporting) provide quick access to additional information or actions without cluttering the main card view. mat-tooltips appear on hover for clarity, allowing for deeper academic inquiry.  
  * **Progress Indicator (mat-progress-bar):** A clear "X of Y cards reviewed" counter and a mat-progress-bar at the top or bottom provide a constant sense of advancement, motivating the user to complete the session and achieve their daily study goals.  
  * An "End Session" mat-button allows for graceful exit, serving as a secondary action. The entire experience is designed to be focused, efficient, and rewarding, fostering a sense of academic discipline.  
* **Components:**  
  * mat-card: For the central flashcard display.  
  * mat-slider, mat-icon-button: For audio playback.  
  * mat-raised-button (primary for "Reveal Answer" and self-assessment options, using specified palette colors), mat-button-toggle-group (primary for self-assessment options), mat-icon-button (secondary navigation).  
  * mat-progress-bar: For session progress.  
  * mat-tooltip: For contextual information.

#### **3.3.2. Self-Assessment/Quiz Page (/assessments/:id/take)**

* **Purpose:** To provide a structured and clear interface for users to take self-assessments or quizzes, facilitating self-evaluation and targeted feedback, much like a formal examination or a practice test. The visual hierarchy guides the user to answer and submit each question.  
* **Visual Elements:** The page feels like a focused examination room, designed to minimize distractions and promote concentration. The header clearly displays the Assessment Name and Assessment Type (e.g., "Unit 1 Grammar Quiz", "Practice Exam"), using Material typography, setting the context.  
  * **Question Navigation (mat-chip-list or mat-stepper):** (Optional, for multi-question assessments) A visual indicator of question numbers (e.g., mat-chips or a mat-stepper at the top or side) allows users to see their progress and jump between questions. The current question is clearly highlighted, and answered/unanswered status might be indicated by color or a checkmark mat-icon, providing a sense of orientation and progress tracking.  
  * **Current Question Display (mat-card):** The Question Content (text, image, audio) is prominently displayed within a mat-card, often in a larger font size (mat-body-1 or mat-headline-6) for readability, ensuring the question is the focus.  
    * The dynamic input area below adapts intelligently based on edu:questionType, providing the appropriate Material Design tool for the task:  
      * **Multiple Choice:** Clearly presented mat-radio-buttons within a mat-radio-group or mat-checkboxes for edu:options, making selection intuitive and quick.  
      * **Fill-in-the-Blank:** Clean mat-form-field with mat-input field(s) where the blanks are clearly indicated, inviting precise answers.  
      * **True/False:** A simple mat-slide-toggle or two distinct mat-raised-buttons for quick decision-making.  
      * **Short Answer/Essay:** A generous multi-line mat-form-field with mat-input and mat-autosize for free-form input, encouraging detailed responses.  
      * **Pronunciation/Audio Response:** A clear "Record" mat-raised-button with the **Primary 400 (\#3d637b)** color, a dynamic waveform display (custom component), and a "Play" mat-icon-button for playback, making audio input feel natural and supportive for language practice.  
  * A "**Submit Answer**" mat-raised-button with the **Primary 400 (\#3d637b)** color is the **primary action button** for each question, clearly visible and commanding attention, providing a definitive action point with a Material ripple.  
  * **Feedback Display (mat-card or mat-snack-bar):** After submission (or at the end of the assessment), edu:feedback is shown immediately, often in a distinct mat-card or a mat-snack-bar (toast message). edu:isCorrect is indicated by a satisfying green check\_circle mat-icon (using a success color, e.g., **Secondary 500 (\#22892f)**) or a clear red cancel mat-icon (using **Error 500 (\#ba1a1a)**), providing immediate and unambiguous feedback, akin to a teacher's direct correction.  
  * **Navigation:** A "Next Question" mat-button or mat-icon-button appears after submitting an answer, serving as a secondary navigation element to proceed.  
  * **Overall Score/Results Page (mat-card with mat-list):** At the end of the assessment, a summary page provides a clear overview of edu:overallScore / edu:maxScore, often with a large, celebratory display for high scores, fostering a sense of accomplishment. A detailed breakdown of correct/incorrect answers for each question is presented within mat-list-items, allowing for review and targeted learning. Options to "Review Answers" or "Retake Assessment" are clearly offered as mat-raised-buttons (e.g., "Retake Assessment" in **Primary 400 (\#3d637b)**, "Review Answers" as a mat-button), serving as primary actions on *this specific results page*, encouraging further learning and mastery. The user feels a sense of closure and clear direction for improvement, much like receiving a graded assignment with constructive comments.  
* **Components:**  
  * mat-card: For question display and results summary.  
  * mat-chip-list, mat-stepper: For question navigation.  
  * mat-form-field with mat-input, mat-radio-group, mat-checkbox, mat-select, mat-slide-toggle.  
  * mat-raised-button (primary for submission/results actions, using specified palette colors), mat-button, mat-icon-button (secondary).  
  * mat-snack-bar: For transient feedback.  
  * mat-list: For displaying results breakdown.

### **3.4. Progress Tracking Flow**

**Purpose:** To visualize and manage learning objectives and key results, providing a clear and motivating overview of the user's learning journey, akin to tracking academic progress towards a degree or a language proficiency level. The visual hierarchy guides the user to set new goals and update existing progress.

#### **3.4.1. Objectives Dashboard (/objectives)**

* **Visual Elements:** The dashboard feels like a personalized academic roadmap, guiding the user towards their educational aspirations, presented as a grid of Material mat-cards. The header, "My Learning Objectives," is clear and inspiring, using Material typography. The visual hierarchy on this page emphasizes the creation of new objectives.  
  * A prominent "**Create New Objective**" mat-raised-button with the **Primary 400 (\#3d637b)** color invites users to set new goals, serving as the **primary action button** on this dashboard. Its vibrant brand color and elevation draw immediate attention, making the goal-setting process feel accessible and empowering, like declaring a major or setting a new academic challenge.  
  * **Filter/Sort Options (mat-button-toggle-group or mat-select):** A sleek bar with mat-button-toggle-groups or mat-select dropdowns allows users to filter by Status (e.g., "In Progress", "Achieved", "At Risk", "Abandoned"), Target Date (e.g., "Upcoming", "Past Due"), or Related Content. These are secondary controls for managing the view.  
  * **List/Grid of Objectives (mat-grid-list or mat-card grid):** Each objective is displayed as a visually distinct mat-card, creating a sense of individual milestones or course modules, with subtle mat-elevation for visual separation.  
    * Objective Name is bold and clear, representing the core academic goal, using Material typography (e.g., mat-subheading-2).  
    * An Overall Progress Bar (mat-progress-bar) visually represents the combined progress of its Key Results, filling up with a satisfying animation as goals are met. This provides immediate visual gratification and reinforces effort. The progress bar color might reflect the objective's status (e.g., **Secondary 500 (\#22892f)** for "Achieved", **Error 500 (\#ba1a1a)** for "At Risk").  
    * A Status badge (mat-chip) (e.g., "In Progress" in a calming blue from the **Primary palette**, "Achieved" in a satisfying green from the **Secondary palette**, "At Risk" in a gentle orange from a custom warning palette) provides immediate visual feedback, mirroring the status of a course or project.  
    * Target Date (if set) is clearly displayed, adding a sense of academic timeline.  
    * A Key Results Summary (e.g., "3 of 5 Key Results on track") offers a quick overview of sub-goals.  
    * Clicking an objective mat-card smoothly navigates to its Objective Detail Page with a Material transition, creating a seamless flow into deeper academic planning. The user feels organized, motivated by their visible progress, and in control of their educational trajectory.  
* **Components:**  
  * mat-card: Displays objective summary and progress, designed for visual impact.  
  * mat-progress-bar: For overall objective progress.  
  * mat-chip: For status badges.  
  * mat-raised-button (primary for "Create New Objective", using Primary 400), mat-button-toggle-group, mat-select (secondary for filters).  
  * mat-grid-list: For a grid layout of objectives.

#### **3.4.2. Objective Detail Page (/objective/:id)**

* **Purpose:** To provide a detailed view of a specific objective and its measurable key results, allowing for granular tracking and updates, much like reviewing a detailed syllabus or a project plan. The visual hierarchy on this page emphasizes updating the progress of key results.  
* **Visual Elements:** The page feels like a detailed academic project plan, presented on a clean Material surface. The header, Objective Name, is large and prominent, signifying the central goal, using Material typography (e.g., mat-display-1).  
  * Summary text provides a detailed description of the objective, giving comprehensive context.  
  * Attributed To (the learner or group this objective belongs to) is clearly indicated, reinforcing ownership.  
  * Target Date (if specified) is presented in an easy-to-read format, emphasizing deadlines.  
  * The Overall Progress Bar (mat-progress-bar) with a color reflecting status (e.g., **Secondary 500 (\#22892f)** for "Achieved", **Error 500 (\#ba1a1a)** for "At Risk") and Status badge (mat-chip) are prominently displayed at the top, reinforcing the objective's current state and overall academic standing.  
  * **Key Results Section (mat-list within a mat-card):** A clear, scrollable mat-list of Key Result items forms the core of this page, representing the measurable steps towards the objective, each within a mat-list-item.  
    * Each Key Result: Name (a concise statement), Metric Type, Target Value, Current Value, and Unit (e.g., "Count: 2 of 5 sessions", "Percentage: 55% of 80%").  
    * A Key Result Progress Bar (mat-progress-bar) (if applicable, for percentage/count metrics) visually tracks individual progress, providing micro-motivations and a sense of incremental achievement. Its color will also reflect the key result's individual status.  
    * A Key Result Status badge (mat-chip) (e.g., "On Track", "At Risk", "Achieved") offers immediate feedback, similar to the status of an assignment.  
    * An "**Update Progress**" mat-icon-button with the **Primary 400 (\#3d637b)** color or an inline mat-form-field with mat-input next to Current Value serves as the **primary action** for each key result, allowing for easy manual updates and making tracking feel effortless and immediate.  
    * Related To links (mat-chips or mat-buttons) provide direct access to the learning materials, linking goals to actionable steps.  
    * Last Updated timestamp offers transparency.  
  * An "Edit Objective" mat-stroked-button allows the user to modify objective details or key results, serving as a secondary action. The user feels empowered to manage their learning path with precision and accountability.  
* **Components:**  
  * mat-card: For the main objective details and key results section.  
  * mat-progress-bar: For overall and individual key result progress.  
  * mat-chip: For status badges and related links.  
  * mat-list, mat-list-item: For displaying key results.  
  * mat-form-field with mat-input: For inline progress updates.  
  * mat-icon-button (primary for update, using Primary 400), mat-stroked-button (secondary for edit).

### **3.5. Social & Community Flow (Federation)**

**Purpose:** To enable users to discover, follow, and interact with content and users across the Fediverse, fostering a vibrant and interconnected learning community, much like an academic conference, a research network, or a global study group.

#### **3.5.1. Home Feed (/home or /feed)**

* **Purpose:** A personalized, dynamic stream of activities from followed users, groups, and relevant public content, serving as the central hub for user interaction and discovery, akin to an academic news feed or a specialized forum. The visual hierarchy emphasizes content consumption and interaction.  
* **Visual Elements:** The feed feels alive, a constant stream of new knowledge, discussions, and connections, presented as a flowing stream of Material mat-cards.  
  * **Filter/Sort options (mat-button-toggle-group or mat-tab-group):** Prominent mat-button-toggle-groups or mat-tab-group at the top (e.g., "Following", "Local", "Global", "Popular", "Latest") allow users to effortlessly switch their view, giving them control over their information diet, like choosing which academic journals to follow.  
  * **Compose Post Area (mat-card with mat-form-field):** A prominent mat-card containing a mat-form-field with mat-input or textarea at the top of the feed invites immediate contribution. It allows users to write a new as:Note (a simple text post) or to link to existing edu: objects (e.g., "Share a Flashcard", "Announce a new Story"). Options for visibility (mat-radio-group or mat-select) are clearly presented. The "**Post**" mat-raised-button with the **Primary 400 (\#3d637b)** color within this composer is the **primary action button** for initiating new content on the feed.  
  * **Activity Cards (mat-card):** A scrollable, infinite feed of visually distinct mat-cards, each representing an ActivityPub Activity. These mat-cards are clean, with rounded corners and subtle mat-elevation-z2 shadows, making them feel like tangible pieces of information or academic announcements.  
    * **Actor Information (mat-list-item or mat-chip):** Each mat-card prominently displays the Profile Picture (mat-avatar), Display Name (Material mat-subheading-2), and full Fediverse address (@username@instance.com). Clicking this information seamlessly leads to their User Profile Page with a Material transition, fostering connection within the academic network.  
    * **Activity Type Icon/Label (mat-icon):** Visually distinct mat-icons (e.g., add\_circle for Create, campaign for Announce, favorite for Like, chat\_bubble for Reply) provide immediate context, making the feed easy to scan and understand, like symbols on a conference agenda.  
    * **Object Display:** The core of the activity is dynamically rendered based on the edu: object type, ensuring a rich and informative preview within the mat-card:  
      * For Create/Announce of edu:Flashcard: A mini-flashcard preview (mat-card with simplified content) is displayed, inviting interaction, with a clear "Study" or "View Card" mat-button to the full interactive card, like a quick glance at a study aid.  
      * For edu:Story/edu:VideoLesson: The Title (Material mat-title), Summary (mat-body-1), and a prominent "Read Story" or "Watch Video" mat-raised-button with the **Primary 400 (\#3d637b)** color are shown, encouraging engagement with educational content, like a preview of a lecture.  
      * For edu:Objective/edu:SelfAssessment: The Name (mat-title), Summary (mat-body-1), and a mat-progress-bar/mat-chip Status badge provide a quick overview of learning goals or assessments, like a project status update.  
      * For edu:WritingSubmission/edu:AssessmentResponse: A snippet of content and a "View Submission" mat-button invite deeper exploration, like reviewing a peer's essay.  
      * For edu:PeerReview: A summary of the feedback and a "Read Review" mat-button provide insight into peer interactions, fostering constructive criticism.  
      * For generic as:Note: The note content is displayed (mat-body-1), potentially with rich text formatting, making simple posts visually appealing, like a short academic announcement.  
    * **Interaction Buttons (Below each mat-card):** A row of clear, intuitive mat-icon-buttons allows for immediate engagement, fostering academic discourse. While multiple actions are present, the most frequent are visually accessible, and the reply icon often serves as a primary engagement point.  
      * Like (favorite\_border icon): Toggles like status (favorite icon when liked), providing a simple way to show appreciation for valuable content.  
      * Boost/Announce (repeat icon): Re-posts to your followers, amplifying valuable content within the network, like sharing a relevant article.  
      * Reply (reply icon): Opens a mat-form-field composer for a threaded reply, serving as a **primary interaction point** for discussion on a post.  
      * Share (share icon): For sharing the URL externally, connecting EducationPub content to the wider web, like citing a resource.  
      * ... (more\_vert icon \- mat-menu trigger): A discreet mat-menu offering additional actions like Report, Mute User, Block User, providing the user with control over their experience and contributing to a respectful academic environment.  
    * Timestamp (e.g., "2h ago", "Jul 15, 2025" \- mat-caption) and Source Instance (subtle text, e.g., "via example.com" \- mat-caption) provide context and a sense of the federated network. The user feels connected to a global learning community, like being part of an international academic forum.  
* **Components:**  
  * mat-card: The primary container for activities.  
  * mat-button-toggle-group, mat-tab-group: For feed filters.  
  * mat-form-field with mat-input, textarea: For composing posts.  
  * mat-raised-button (primary for "Post", using Primary 400), mat-button, mat-icon-button (primary for Reply, secondary for others).  
  * mat-avatar: For profile pictures.  
  * mat-icon: For activity types and interaction icons.  
  * mat-menu: For more options.  
  * mat-progress-bar, mat-chip: For content previews.

#### **3.5.2. Explore Page (/explore)**

* **Purpose:** To facilitate discovery of new content, users, and groups beyond the user's immediate network, inspiring new learning paths and connections, much like browsing a university's course catalog or a research database. The visual hierarchy here emphasizes the content cards themselves as primary entry points.  
* **Visual Elements:** The page feels like a curated library of knowledge and a vibrant community hub, inviting academic exploration, presented with Material mat-cards and organized sections.  
  * **Discovery Sections (mat-cards or mat-grid-list):** Content is organized into visually engaging sections, each with a clear heading (Material mat-title).  
    * "Trending Content": Visually appealing mat-cards for edu:Flashcards, edu:Stories, edu:VideoLessons that are currently popular (high engagement). These cards might feature larger thumbnails or more prominent titles, like featured courses.  
    * "Popular Educators": mat-cards displaying Actor profiles with high follower counts, featuring their mat-avatar, Display Name (mat-subheading-2), and a clear "**Follow**" mat-raised-button with the **Primary 400 (\#3d637b)** color, inviting connection with influential figures in the learning space. This "Follow" button serves as a **primary action** within each educator card.  
    * "Active Learning Groups": mat-cards for as:Group actors, with group names (mat-title), descriptions (mat-body-1), and "Join" or "View Group" mat-buttons, encouraging participation in study groups or academic communities.  
    * "New Content Types": Showcases recently created edu:FlashcardModels or other edu: object definitions within mat-cards, inviting users to explore new learning structures and methodologies.  
  * **Advanced Search & Filter (mat-form-field, mat-select, mat-chip-list):** A comprehensive mat-form-field search bar with advanced filtering options empowers the user to pinpoint specific content. Filters for edu:targetLanguage, edu:level, edu:tags (hashtags), edu:assessmentType, edu:exerciseType are presented as intuitive mat-select dropdowns or mat-chip-list multi-select options, allowing for precise academic searches. The ability to search for specific @username@instance.com addresses provides precision in finding individuals. These are secondary controls to refine discovery.  
  * **Content Cards:** Similar to the home feed, but focused on discoverability, with clear calls to action (e.g., "View Story", "Start Quiz" \- mat-buttons). The cards themselves are the **primary interactive elements** on this page, leading to the detailed content. The user feels like an academic explorer, uncovering hidden gems and expanding their intellectual horizons.  
* **Components:**  
  * mat-card: For all discovery items (primary interactive elements).  
  * mat-grid-list: For flexible grid layouts.  
  * mat-form-field with mat-input, mat-select, mat-chip-list, mat-autocomplete: For search and filtering (secondary).  
  * mat-raised-button (primary within cards like "Follow", using Primary 400), mat-button (secondary).  
  * mat-avatar: For user profiles.

#### **3.5.3. User Profile Page (/profile/:username@instance)**

* **Purpose:** To provide a comprehensive view of a user's public profile and their published edu: content, fostering connection and transparency, much like an academic's faculty page or a student's e-portfolio. The visual hierarchy emphasizes the primary action of following or interacting with the user.  
* **Visual Elements:** The profile page feels like a personal academic portfolio and a window into another learner's journey, structured with Material mat-cards and mat-tab-group.  
  * **Header (mat-card with high elevation):** Dominates the top, featuring a large, circular mat-avatar Profile Picture and a rectangular Header/Banner Image that allows for personal expression, perhaps showcasing their academic interests or a favorite learning quote.  
    * The Display Name (mat-display-1) is prominent, accompanied by the full Fediverse address (@username@instance.com \- mat-caption), clearly indicating the user's identity within the network.  
    * A dynamic "**Follow**" / "**Unfollow**" mat-raised-button with the **Primary 400 (\#3d637b)** color (changing color and text based on follow status) is the **primary action button** on this profile, drawing the eye and inviting connection. A Message mat-button (to send direct messages) is clearly visible as a secondary action.  
    * Bio/About Me text (mat-body-1) provides a personal introduction, often detailing their learning focus or teaching expertise. Location, Website, and other Links (mat-chips or mat-buttons) are neatly organized, like contact information on an academic directory.  
    * Followers and Following counts (mat-subheading-2) are clearly displayed and clickable (mat-button), leading to lists of users in a mat-dialog, fostering a sense of community and academic networking.  
  * **Content Tabs/Sections (mat-tab-group):** A mat-tab-group organizes the user's content, making it easy to navigate their contributions, similar to sections in a comprehensive academic profile.  
    * "Posts" (general as:Note activities and announcements).  
    * "Learning Content" (published edu:Flashcards, edu:Stories, edu:VideoLessons, edu:Exercises, edu:WritingPrompts, edu:SelfAssessments), showcasing their teaching or study materials.  
    * "Objectives" (publicly shared edu:Objectives with their mat-progress-bars), demonstrating their learning goals and achievements.  
    * "Submissions" (publicly shared edu:WritingSubmissions, edu:AssessmentResponses, edu:PeerReviews), offering insight into their learning process and peer interactions.  
    * "Liked Posts" (content the user has liked), revealing their interests and preferred resources.  
  * Content within each tab is displayed in mat-cards or mat-lists, similar to the Home Feed, maintaining visual consistency. The user feels they have a clear overview of another's contributions and interests, fostering a sense of shared academic endeavor.  
* **Components:**  
  * mat-card: For the profile header and content sections.  
  * mat-avatar: For profile pictures.  
  * mat-raised-button (primary for follow/unfollow, using Primary 400), mat-button (secondary for message).  
  * mat-tab-group: For content navigation.  
  * mat-list, mat-list-item: For displaying lists of followers/following and content.  
  * mat-dialog: For follower/following lists.

### **3.6. Settings & Preferences Flow**

**Purpose:** To allow users to customize their experience, providing granular control over notifications, privacy, and display, making the platform truly their own, much like managing preferences in a university's online portal or a language learning app's settings. The visual hierarchy within each settings sub-page directs the user to save their changes.

#### **3.6.1. Settings Dashboard (/settings)**

* **Visual Elements:** The settings dashboard feels organized and empowering, providing a clear control panel for the user's experience. The header, "Settings," is clear and concise, using Material typography. The visual hierarchy here emphasizes navigation to different settings categories.  
  * **Left Sidebar Navigation (mat-list in mat-sidenav):** A clean mat-list of settings categories (e.g., Profile, Account, Notifications, Privacy, Display, More settings) provides a consistent navigation experience within a mat-sidenav. The active category is clearly highlighted with Material's selection styling, offering a visual anchor and a clear sense of location within the settings, similar to navigating different sections of a student information system. These mat-list-items are the **primary interactive elements** for navigating the settings.  
  * **Main Content Area (mat-card):** Displays the content of the selected setting category within a mat-card, ensuring a focused and uncluttered view. The user feels in control of their platform experience, able to tailor it to their academic and personal needs.  
* **Components:**  
  * mat-sidenav with mat-list (primary interactive elements for navigation).  
  * mat-card: For the content panels.

#### **3.6.2. Notifications Settings (/settings/notifications)**

* **Visual Elements:** The page is designed for clarity, making it easy to manage communication and stay informed about academic activities. The header, "Notification Preferences," is direct, using Material typography. The visual hierarchy guides the user to save their notification choices.  
  * **Types of Notifications Section (mat-checkbox or mat-slide-toggle):** Features clear mat-checkboxes or mat-slide-toggles for various notification types (e.g., "New Followers," "Mentions/Replies," "New Content from Followed Users," "Assessment Submissions/Feedback," "Progress Updates"). Each option is accompanied by a brief explanation, allowing users to choose what academic alerts they receive.  
  * **Notification Channels Section (mat-checkbox or mat-radio-group):** Offers mat-checkboxes or mat-radio-group for different delivery channels: "In-App Notifications," "Email Notifications" (with optional mat-form-field for email frequency/summary options), and "Push Notifications" (if supported, with an "Enable Push Notifications" mat-raised-button that prompts browser permissions). This allows users to receive updates in a way that best suits their learning habits, like choosing between email updates or app alerts from a university.  
  * A prominent "**Save Changes**" mat-raised-button with the **Primary 400 (\#3d637b)** color is the **primary action button** on this page, ensuring preferences are applied and drawing the user's eye to confirm their choices.  
* **Components:**  
  * mat-checkbox, mat-slide-toggle: For individual notification types.  
  * mat-radio-group: For channel selection.  
  * mat-form-field with mat-input: For email frequency.  
  * mat-raised-button (primary, using Primary 400).

#### **3.6.3. Privacy Settings (/settings/privacy)**

* **Visual Elements:** The page emphasizes control and transparency over personal data and academic sharing. The header, "Privacy Settings," is clear, using Material typography. The visual hierarchy guides the user to save their privacy choices.  
  * **Default Post Visibility (mat-radio-group or mat-select):** mat-radio-group or mat-select for "Public", "Followers Only", "Unlisted" provide clear choices for content sharing, similar to setting visibility for academic work.  
  * **Profile Visibility (mat-slide-toggle):** mat-slide-toggles for "Discoverable in searches" and "Visible to logged-out users" give granular control over profile exposure, like managing one's academic directory listing.  
  * **Direct Messages (mat-select):** A mat-select for "Who can send me DMs?" ("Anyone", "Followers Only", "No one") allows users to manage their communication boundaries, akin to managing office hours.  
  * A prominent "**Save Changes**" mat-raised-button with the **Primary 400 (\#3d637b)** color is the **primary action button** on this page, ensuring preferences are applied and drawing the user's eye to confirm their choices.  
* **Components:**  
  * mat-radio-group, mat-select: For visibility options.  
  * mat-slide-toggle: For profile visibility.  
  * mat-raised-button (primary, using Primary 400).

### **3.7. Moderation Tools Flow**

**Purpose:** To provide users with accessible tools to manage their personal experience and report unwanted content, fostering a safe and respectful learning environment, much like a university's student conduct office or a platform's community guidelines. The visual hierarchy within dialogs directs the user to confirm their action.

#### **3.7.1. Report Content/User (mat-dialog)**

* **Visual Elements:** Accessed via a discreet mat-icon-button (more\_vert) on posts or user profiles, a mat-dialog overlay appears, focusing attention on the serious nature of the action. The heading, "Report Content" or "Report User," is direct and clear, using Material typography. The visual hierarchy guides the user to submit the report.  
  * A clear list of Reason options (mat-radio-group): "Spam", "Hate Speech", "Harassment", "Inappropriate Content", "Violation of Terms", "Other". These reasons are aligned with common academic and community standards.  
  * An optional Details mat-form-field with textarea allows for providing more context, making the reporting process thorough and helpful for moderators.  
  * A "**Submit Report**" mat-raised-button with the **Primary 400 (\#3d637b)** color (or a neutral color if reporting is not a primary "positive" action) is the **primary action button** within the dialog's actions, ensuring a deliberate decision. The "Cancel" mat-button is clearly presented as a secondary option. The user feels empowered to contribute to community safety and uphold academic integrity.  
* **Components:**  
  * mat-dialog: The primary container for the report interface.  
  * mat-radio-group: For reasons.  
  * mat-form-field with textarea: For details.  
  * mat-raised-button (primary, using Primary 400 or neutral), mat-button (secondary).

#### **3.7.2. Mute/Block User Confirmation (mat-dialog)**

* **Visual Elements:** Accessed via the mat-icon-button (more\_vert) menu, a small, focused mat-dialog appears. The heading, "Mute @username?" or "Block @username?", is direct and personalized, using Material typography. The visual hierarchy guides the user to confirm the mute/block action.  
  * A brief, clear explanation of the action's effect is provided (e.g., "You will no longer see their posts, but they can still interact with you." for mute; "Neither of you will see each other's content or be able to interact." for block). This transparency builds trust and clarifies the impact of their decision, similar to understanding the implications of academic disciplinary actions.  
  * A "**Confirm Mute**" / "**Confirm Block**" mat-raised-button with the **Error 400 (\#ba1a1a)** color (for blocking, to emphasize the destructive nature) or **Primary 400 (\#3d637b)** (for muting) is the **primary action button** within the dialog's actions, ensuring a deliberate decision and drawing the user's eye. The "Cancel" mat-button is clearly visible as a secondary option. The user feels in control of their personal space and interactions, able to curate their learning environment.  
* **Components:**  
  * mat-dialog: The primary container for the confirmation.  
  * mat-raised-button (primary, using Error 400 or Primary 400), mat-button (secondary).

### **3.8. External Sharing & Embedding Flow**

**Purpose:** To enable users to effortlessly share and embed EducationPub content on external platforms, extending the reach of learning materials, much like sharing a research paper or a lecture recording. The visual hierarchy guides the user to copy the most common sharing method (direct link).

#### **3.8.1. Share Content (mat-dialog)**

* **Visual Elements:** Accessed via a prominent "Share" mat-icon-button (share icon) on any edu: content page, a mat-dialog overlay appears. The heading, "Share This Content," is clear and inviting, using Material typography. The visual hierarchy emphasizes copying the direct link.  
  * **Direct Link Section (mat-form-field):** Displays the content's canonical URL in a read-only mat-form-field with mat-input, accompanied by a clear "**Copy Link**" mat-raised-button with the **Primary 400 (\#3d637b)** color that provides immediate visual feedback on click (e.g., a mat-snack-bar "Copied to clipboard\!"), making it easy to reference academic materials. This is the **primary action button** for sharing.  
  * **Embed Code Section (mat-form-field):** Provides a concise explanation of oEmbed. A mat-form-field with textarea displays the oEmbed HTML snippet, and a "Copy Embed Code" mat-button makes it easy to integrate interactive content elsewhere, like embedding a video lecture into a course website. This is a secondary action.  
  * **Social Share Buttons (mat-icon-buttons):** A row of familiar mat-icon-buttons for popular social media platforms (e.g., Twitter, Facebook, LinkedIn) allows for quick, pre-filled sharing, enabling academic dissemination. These are also secondary actions.  
  * A "Close" mat-button provides an easy exit. The user feels empowered to disseminate their learning content widely, contributing to the broader educational ecosystem.  
* **Components:**  
  * mat-dialog: The primary container for the sharing interface.  
  * mat-form-field with mat-input, textarea: For displaying URLs and embed codes.  
  * mat-raised-button (primary for "Copy Link", using Primary 400), mat-button (secondary for "Copy Embed Code"), mat-icon-button (secondary for social share).  
  * mat-snack-bar: For copy confirmation.

## **4\. General UI Components & Interactions**

* **Typography:** The platform will utilize a clean, highly readable sans-serif font (e.g., Roboto, as per Material Design guidelines) across all elements. A clear typographic hierarchy will guide the user's eye, leveraging Material Design's predefined type scales (e.g., mat-display-1 for main page titles, mat-headline-5 for section headers, mat-title for card titles, mat-body-1 for main text, mat-caption for timestamps and subtle details). Font sizes will be responsive, ensuring optimal readability on all devices. The overall impression is one of clarity, intellectual accessibility, and academic professionalism, similar to well-designed textbooks or academic journals.  
* **Color Palette:** A thoughtfully chosen color palette will define the platform's aesthetic, adhering to Material Design's color system (primary, accent, warn, and surface colors).  
  * **Primary Palette (base: \#1A435A):** This palette is derived from the provided \_theme-colors.scss. The **Primary 400 (\#3d637b)** shade will be used for key interactive elements and branding, especially for **primary action buttons** and active states. Other shades will be used for backgrounds, text, and hover states within the primary color scheme.  
  * **Secondary Palette (base: \#4CAF50):** This palette is derived from the provided \_theme-colors.scss. The **Secondary 500 (\#22892f)** shade will serve as an accent color, providing contrast and highlighting secondary actions or successful states.  
  * **Tertiary Palette (base: \#36454F):** This palette is derived from the provided \_theme-colors.scss. Shades from this palette (e.g., **Tertiary 700 (\#9dadb9)** for subtle backgrounds or borders) will be used for complementary elements, adding depth without competing with primary/secondary.  
  * **Neutral Palette:** Derived from \_theme-colors.scss, shades like **Neutral 95 (\#f1f0f2)** for light backgrounds, **Neutral 10 (\#1a1c1d)** for dark text, and **Neutral 50 (\#767779)** for subtle text or icons will be used for general UI elements, ensuring high contrast and readability.  
  * Error Palette (base: \#BA1A1A): Derived from \_theme-colors.scss. The Error 500 (\#de3730) shade will be used for error messages, destructive actions, and warnings, ensuring immediate user attention.  
    The colors will evoke a sense of professionalism, calm, and encouragement, fostering a positive learning atmosphere.  
* **Icons:** A consistent and comprehensive icon set will be drawn from Material Icons, ensuring a unified visual language. Icons will be minimalist, visually clear, and culturally neutral where possible, ensuring universal understanding. They will be used for global navigation, actions (e.g., edit, delete, share), content types, and status indicators, acting as quick visual cues that enhance scannability and intuition, much like universally recognized academic symbols.  
* **Buttons:** All buttons will adhere to Material Design's button types and visual hierarchy, guiding the user's interaction:  
  * mat-raised-button: **Used for primary actions on a page or within a specific context.** Bold and prominent, filled with the **Primary 400 (\#3d637b)** color (or other specified palette colors for specific primary actions like "Start Study Session" or "Confirm Block"). They feature elevation and a distinct shadow, drawing the eye.  
  * mat-stroked-button: Outlined, for less critical actions, like saving a draft or secondary confirmations, providing clear boundaries without competing with the primary.  
  * mat-button: Text-only, for subtle actions or links, like viewing details or cancelling, providing a low-emphasis option.  
  * mat-fab (Floating Action Button): Circular, elevated, and typically positioned for primary actions, often used for "Create" on mobile, serving as a highly prominent, singular call to action.  
  * mat-icon-button: Circular buttons containing only an icon, used for compact actions (e.g., share, close, navigation arrows). Their visual weight is lower than mat-raised-buttons, making them suitable for secondary or tertiary actions.  
    All buttons will feature consistent rounded corners, providing a soft, approachable feel. Crucially, they will all exhibit the Material ripple effect on interaction, providing satisfying visual feedback. Loading indicators (e.g., a small mat-spinner) will be integrated directly into buttons during submission, preventing user uncertainty and providing a sense of active processing.  
* **Forms:** Forms will be designed for clarity and ease of use, making data entry feel like a structured academic task, leveraging mat-form-field components.  
  * **Floating Labels:** All mat-form-fields will utilize floating labels that animate above the input when focused or filled, improving clarity and reducing clutter.  
  * Input fields (mat-input) will have clear focus states (e.g., a subtle border color change or shadow) to indicate active input.  
  * Real-time validation feedback (error messages using mat-error in **Error 500 (\#ba1a1a)**, success indicators using mat-hint or mat-icon in **Secondary 500 (\#22892f)**) will appear immediately, guiding the user to correct input.  
  * Placeholder text will offer helpful guidance.  
  * mat-select (dropdowns), mat-checkbox, mat-radio-buttons, and mat-slide-toggles will be clearly styled and accessible, making complex choices feel simple. The user should feel that filling out forms is a straightforward and supportive process, like completing an online registration.  
* **Modals & Dialogs (mat-dialog):** These will be used judiciously for confirmations, quick actions, or focused tasks (e.g., creating a flashcard without leaving the current page). They will appear as mat-dialog overlays, dimming the background to focus attention, and will have clear titles (Material mat-headline-6), concise content, and distinct action buttons (mat-button, mat-raised-button), ensuring the user understands the context and consequences of their actions, similar to pop-up notifications in an academic system. The primary action within a dialog will always be a mat-raised-button with the **Primary 400 (\#3d637b)** color (or **Error 400 (\#ba1a1a)** for destructive actions).  
* **Notifications (In-App \- mat-snack-bar and mat-list):**  
  * **Toast messages (mat-snack-bar):** Brief, transient feedback for successful actions (e.g., "Flashcard saved\!", "Profile updated\!") will appear temporarily at the bottom of the screen as mat-snack-bars, providing a quick, satisfying confirmation without interrupting the workflow, like a quick notification from a learning management system.  
  * **Dedicated Notifications Center (mat-list):** A comprehensive page (/notifications) will display a history of all alerts within a mat-list, categorized (e.g., "Mentions", "Follows", "System Alerts"), with clear read/unread states (mat-icons for status), allowing users to review their activity at their leisure, like an academic inbox.  
* **Loading States (mat-progress-bar, mat-spinner):** Clear and user-friendly loading indicators will manage user expectations during asynchronous operations:  
  * **Spinners (mat-spinner):** Small, animated circular spinners for short waits, indicating activity.  
  * **Skeleton loaders:** For content areas that are loading, providing a greyed-out preview of the layout, reducing perceived wait times and maintaining a sense of structure.  
  * **Progress bars (mat-progress-bar):** For longer operations (e.g., file uploads, image generation), providing a tangible sense of progress, like a download bar for lecture materials. The color of the progress bar will typically use the **Primary 400 (\#3d637b)** or **Secondary 500 (\#22892f)** shades.  
* **Empty States:** When a section has no content, friendly messages and actionable suggestions will be displayed (e.g., "No objectives yet\! Start by creating your first goal with the 'Create' button above."). These often include a relevant Material icon or illustration, turning a lack of content into an invitation to create and engage, fostering a proactive learning mindset.  
* **Responsiveness:** All components and layouts will be meticulously designed to adapt seamlessly to various screen sizes, from mobile phones to large desktop monitors. This includes flexible grids (mat-grid-list), fluid images, and breakpoint-specific styling, ensuring optimal usability and a consistent, high-quality experience on all devices. The user should feel that the platform is always perfectly fitted to their screen, no matter how they access it, like a versatile digital textbook.