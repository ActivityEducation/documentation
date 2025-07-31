---
title: Plan Summary
sidebar_position: 0
---

# **Spaced Repetition Feature: Planning & Implementation Plan**

**Feature Directory:** src/features/educationpub

## Phase Breakout Documents
* [SRS Feature: Phase 1 Backend Implementation Plan](./phase1.md)
* [SRS Feature: Phase 2 Frontend Implementation Plan](./phase2.md)
* [SRS Feature: Phase 3 Advanced Features & Analytics Plan](./phase3.md)

## **1\. Feature Overview**

This document outlines the plan for integrating a **Spaced Repetition Scheduling (SRS)** feature into the EducationPub platform. This feature will leverage the **Free Spaced Repetition Scheduler (FSRS) v4 algorithm** to provide an intelligent and personalized flashcard review system for users.  
The core goal is to help users learn more efficiently by scheduling flashcard reviews at the optimal time—just before they are likely to forget the information. This enhances long-term retention and reduces unnecessary study time.  
When a user reviews a flashcard, they will grade their recall with one of four ratings: "Again", "Hard", "Good", or "Easy". The FSRS algorithm will use this feedback, along with the user's review history for that card, to calculate the next optimal review date.

## **2\. Phased Implementation Approach**

The development of the Spaced Repetition feature will be rolled out in distinct phases to ensure a manageable and iterative process.

### **Phase 1: Core Backend Engine (MVP)**

* **Focus:** Establish the foundational backend logic and data structures.  
* **Tasks:**  
  * Implement the ReviewLog and SpacedRepetitionSchedule entities and database migrations.  
  * Port the FSRS v4 algorithm into a SpacedRepetitionService.  
  * Create the internal API endpoints (/api/edu/srs/review, /api/edu/srs/due) for processing reviews and fetching due cards for an actor.  
  * Develop comprehensive unit and e2e tests for the core service and API.

### **Phase 2: Frontend Integration & Basic Review UI**

* **Focus:** Create the user-facing interface for reviewing flashcards.  
* **Tasks:**  
  * Develop a simple "review session" UI that fetches due cards from the /api/edu/srs/due endpoint.  
  * Allow users to view a flashcard's question, reveal the answer, and submit a rating (Again, Hard, Good, Easy).  
  * Submitting a rating will call the /api/edu/srs/review endpoint.  
  * Provide basic feedback to the user after a review session (e.g., "You have completed all reviews for now").

### **Phase 3: Advanced Features & Analytics**

* **Focus:** Enhance the user experience with more control and insights.  
* **Tasks:**  
  * Implement a user-facing dashboard to display learning analytics (e.g., retention rate, review workload forecast).  
  * Allow users to configure FSRS parameters, such as their desired retention rate.  
  * Introduce the ability to study specific collections of flashcards, rather than just the primary collection.

## **3\. Architecture & Design**

The SRS feature will be built within the existing educationpub module, following the established architectural patterns (NestJS, TypeORM, PostgreSQL with JSONB).

### **3.1. New Database Entities**

We will introduce two new TypeORM entities to store the necessary data for spaced repetition.

#### **a. ReviewLog Entity**

This entity will record every single review an actor performs on a flashcard. It serves as the historical data source for the FSRS algorithm.

* **File:** src/features/educationpub/entities/review-log.entity.ts  
* **Description:** Records an actor's interaction with a flashcard at a specific point in time.

| Column | Type | Description |
| :---- | :---- | :---- |
| id | uuid | Primary Key. |
| flashcard | Flashcard | ManyToOne relationship to the Flashcard entity. |
| actor | Actor | ManyToOne relationship to the Actor entity performing the review. |
| rating | integer | The user's rating for the review (1: Again, 2: Hard, 3: Good, 4: Easy). |
| scheduled\_on | Date | The date the review was scheduled for. |
| reviewed\_at | Date | The timestamp when the user performed the review. |
| state | jsonb | Stores the FSRS memory state (Difficulty, Stability) at the time of this review. |
| elapsed\_time | integer | Time in seconds since the previous review. |

#### **b. SpacedRepetitionSchedule Entity**

This entity will store the current FSRS state and the next scheduled review date for each flashcard an actor is studying. This table provides a quick lookup for cards due for review, avoiding recalculation on every request.

* **File:** src/features/educationpub/entities/spaced-repetition-schedule.entity.ts  
* **Description:** Tracks the current learning state and next review date for an actor-flashcard pair.

| Column | Type | Description |
| :---- | :---- | :---- |
| id | uuid | Primary Key. |
| flashcard | Flashcard | ManyToOne relationship to the Flashcard entity. |
| actor | Actor | ManyToOne relationship to the Actor entity. |
| due | Date | The timestamp when the flashcard is next due for review. |
| stability | float | FSRS 'S' parameter (memory stability). |
| difficulty | float | FSRS 'D' parameter (difficulty). |
| lapses | integer | The number of times the user has forgotten the card. |
| state | string | The current learning phase (e.g., 'New', 'Learning', 'Review'). |
| last\_review | Date | The timestamp of the last review. |

### **3.2. New Services**

#### **a. SpacedRepetitionService**

This will be the core service containing the business logic for the SRS feature.

* **File:** src/features/educationpub/services/spaced-repetition.service.ts  
* **Responsibilities:**  
  * Implement the FSRS v4 algorithm logic in TypeScript.  
  * Calculate initial D and S values for new cards.  
  * Update D and S values based on user's review rating.  
  * Calculate the next due date for a flashcard.  
  * Persist ReviewLog and SpacedRepetitionSchedule entities.  
  * Provide a method to get a list of flashcards due for review for a given actor.

### **3.3. New Controller & DTOs**

To expose the SRS functionality via the API, we will create a new controller and associated Data Transfer Objects (DTOs).

#### **a. SpacedRepetitionController**

* **File:** src/features/educationpub/controllers/spaced-repetition.controller.ts  
* **Endpoints:**  
  * POST /api/edu/srs/review: Submit a review for a flashcard.  
  * GET /api/edu/srs/due: Get a list of flashcards currently due for review for the authenticated user's active actor.

#### **b. DTOs**

* **SubmitReviewDto**:  
  * flashcardId: string  
  * rating: number (1-4)  
* **DueFlashcardView**: A view model representing a flashcard due for review.

## **4\. API Endpoints**

### **POST /api/edu/srs/review**

* **Description:** A user submits their review for a single flashcard.  
* **Auth:** JwtAuthGuard \- Requires an authenticated user.  
* **Body:** SubmitReviewDto  
* **Workflow:**  
  1. The controller receives the flashcardId and rating. The active actorId is determined from the user's session or an explicit header, representing the persona (e.g., 'German Student') performing the action.  
  2. It calls SpacedRepetitionService.processReview(actorId, flashcardId, rating).  
  3. The service:  
     * Retrieves the current SpacedRepetitionSchedule for the actor/card pair.  
     * Calculates the new FSRS parameters (D, S) and the next due date.  
     * Creates a new ReviewLog entry.  
     * Updates the existing SpacedRepetitionSchedule or creates a new one.  
  4. Returns a success response, perhaps with the next due date.

### **GET /api/edu/srs/due**

* **Description:** Fetches all flashcards that are due for review for the current user's active actor.  
* **Auth:** JwtAuthGuard  
* **Workflow:**  
  1. The controller determines the active actorId and calls SpacedRepetitionService.getDueFlashcards(actorId).  
  2. The service queries the SpacedRepetitionSchedule table for records where actorId matches and due \<= NOW().  
  3. It returns an array of DueFlashcardView objects.

## **5\. Federation & ActivityPub Integration**

For the initial MVP of this feature, **spaced repetition data will be considered local and private to the user and instance**.

* **No Federation:** ReviewLog and SpacedRepetitionSchedule data will **not** be federated. There is no current standard in the fediverse for exchanging review data, and this information is highly personal.  
* **No New Activities:** We will not create new ActivityPub activity types (e.g., Review). The feature operates on top of the existing edu:Flashcard objects.

This approach simplifies the initial implementation and avoids introducing non-standard extensions into the federated ecosystem.

## **6\. Implementation Plan**

The implementation will be broken down into the following steps:

1. **Database Schema:**  
   * \[ \] Create the ReviewLog entity file (review-log.entity.ts).  
   * \[ \] Create the SpacedRepetitionSchedule entity file (spaced-repetition-schedule.entity.ts).  
   * \[ \] Update the Flashcard and Actor entities to include the new relationships.  
   * \[ \] Generate and run a new TypeORM migration to create the tables.  
2. **FSRS Algorithm Porting:**  
   * \[ \] Create a new utility or service file (fsrs.logic.ts) within the spaced-repetition.service.ts or as a separate helper.  
   * \[ \] Port the core FSRS v4 mathematical formulas from the provided documentation into TypeScript functions. This will be a pure, state-less implementation of the algorithm itself.  
3. **Backend Service Development:**  
   * \[ \] Create spaced-repetition.service.ts.  
   * \[ \] Implement the processReview method, which will use the FSRS logic.  
   * \[ \] Implement the getDueFlashcards method.  
   * \[ \] Add the new service to the EducationPubModule.  
4. **API Layer:**  
   * \[ \] Create spaced-repetition.controller.ts.  
   * \[ \] Implement the POST /review and GET /due endpoints.  
   * \[ \] Create the necessary DTOs (SubmitReviewDto) and View Models.  
5. **Integration & Testing:**  
   * \[ \] Write unit tests for the SpacedRepetitionService, especially for the FSRS calculations.  
   * \[ \] Write e2e tests for the new API endpoints.  
   * \[ \] Manually test the full workflow: creating a flashcard, reviewing it multiple times with different ratings, and verifying the due dates are calculated as expected.

## **7\. Future Enhancements**

* **User-configurable Parameters:** Allow users to tweak their FSRS parameters (e.g., desired retention rate).  
* **Learning Analytics:** Provide users with a dashboard showing their learning progress, retention rates, and future review workload.  
* **Collection-Based Reviews:** For the MVP, the SRS will operate on the user's primary flashcard collection (all cards associated with their actor). A future enhancement will allow users to select specific collections for focused review sessions. This will enable studying subsets of cards, such as those from a particular course or topic.

## Related Documents
* [The FSRS v4 Algorithm A Comprehensive Technical Report on its Mechanics, Implementation, and Optimization](/docs/implementation/research/research-report/The%20FSRS%20v4%20Algorithm)
* [EducationPub Platform Module Architecture & Design Patterns](/docs/implementation/research/EducationPub%20Platform%20Module%20Architecture%20&%20Design%20Patterns)