---
title: Phase 2
sidebar_position: 2
---

# **Spaced Repetition Feature: Phase 2 Frontend Implementation Plan**

## **Prerequisites:**

* [SRS Feature: Phase 1 Backend Implementation Plan](./phase1.md)

## **1\. Objective**

This document provides a detailed, actionable plan for implementing the frontend components for **Phase 2: Frontend Integration & Basic Review UI**. The goal is to build the user-facing interface that consumes the backend APIs created in Phase 1, allowing users to engage in a basic flashcard review session.

## **2\. Task Breakdown & Implementation Details**

This phase focuses on creating a "review session" experience by composing existing components from the library and creating new, stateful components to manage the session's logic.

### **2.1. New Components to be Created**

To create a clean, intuitive, and reusable user experience for the review session, the following new components should be created.

#### **a. ReviewControls Component**

* **Purpose:** To provide a standardized set of rating actions for a user after they have viewed the answer on a flashcard. This component group is the primary mechanism for submitting feedback to the FSRS algorithm.  
* **Justification:** While this could be constructed from four separate Button components on the page, creating a dedicated ReviewControls component encapsulates the specific logic and styling for this critical interaction. It ensures consistency wherever reviews are performed and simplifies the parent ReviewSession component by abstracting away the rating mechanism. It couples the UI action directly to the four specific rating values required by the backend.  
* **Acceptance Criteria:**  
  * \[ \] The component must render a group of four distinct buttons.  
  * \[ \] The buttons must be clearly labeled: "Again", "Hard", "Good", and "Easy".  
  * \[ \] Each button should have a distinct color or style to suggest its meaning (e.g., red for "Again", green for "Easy").  
  * \[ \] The component must accept an onRate callback property.  
  * \[ \] When a user clicks a button, the onRate callback must be invoked with the corresponding rating value (1 for "Again", 2 for "Hard", 3 for "Good", 4 for "Easy").  
  * \[ \] The component should be disabled until the user has revealed the answer on the flashcard.

#### **b. ReviewSession Component**

* **Purpose:** To act as the main container and state machine for a user's review session. It will manage the flow of fetching cards, displaying them one-by-one, and showing a summary at the end.  
* **Justification:** A typical review session is a stateful process. It involves fetching data, tracking the current position in the queue, handling user actions, and displaying a final state. Encapsulating this entire workflow into a ReviewSession component makes the feature modular and easy to embed in different parts of the application. It cleanly separates the session logic from the individual atomic components like Flashcard and Button.  
* **Acceptance Criteria:**  
  * \[ \] On mount, the component must call the /api/edu/srs/due endpoint to fetch the queue of cards to be reviewed.  
  * \[ \] While fetching, it must display the Spinner component.  
  * \[ \] If no cards are due, it must display a message like "You have no cards to review right now."  
  * \[ \] If cards are due, it must display the first card in the queue using the Flashcard component.  
  * \[ \] It must render the ProgressBar component and keep it updated as the user progresses through the queue.  
  * \[ \] It must render the ReviewControls component after the answer is revealed.  
  * \[ \] When a rating is submitted via ReviewControls, the component must call the /api/edu/srs/review endpoint with the correct flashcardId and rating.  
  * \[ \] After a card is rated, it must advance to the next card in the queue.  
  * \[ \] When all cards in the queue have been reviewed, it must display a summary message (e.g., "Session complete\! You reviewed X cards.").

### **2.2. Use of Existing Components**

The new components will be composed of the following existing library components:

* **Flashcard / Flipper**: To display the question and answer.  
* **Button**: As the base for the ReviewControls.  
* **Card**: To wrap the entire review session UI.  
* **ProgressBar**: To show session progress.  
* **Spinner**: To indicate loading states.  
* **Icon**: For visual cues within buttons.

## **3\. Testing Strategy**

* **Unit Tests:**  
  * Create tests for the ReviewControls component to ensure the onRate callback is fired with the correct numeric rating.  
  * Create tests for the ReviewSession component, mocking the API calls. Test all states: loading, no cards due, displaying a card, and the final summary screen.  
* **End-to-End (E2E) / Integration Tests:**  
  * Create a test that runs through a full review session.  
  * The test should log in as a user, navigate to the review page, and verify that API calls are being made correctly.  
  * It should simulate clicking "Show Answer", selecting a rating, and proceeding to the next card, asserting that the UI updates as expected at each step.

## Related Documents
* [The FSRS v4 Algorithm A Comprehensive Technical Report on its Mechanics, Implementation, and Optimization](/docs/implementation/research/research-report/The%20FSRS%20v4%20Algorithm)
* [Spaced Repetition Feature: Planning & Implementation Plan](./summary.md)  
* [SRS Feature: Phase 1 Backend Implementation Plan](./phase1.md)

