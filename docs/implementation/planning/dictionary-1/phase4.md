---
title: Phase 4
sidebar_position: 4
---

<!-- 
   DO NOT IMPLEMENT THIS! 
   The integrate with the flashcard system is not fully flushed 
   out and will lead to issues.
-->

# **Phase 4 Plan: Language Learning Integration**

**Objective:** To connect the dictionary to the user experience by building personalized learning tools that leverage the core dictionary data. This phase transforms the dictionary from a passive repository into an active, integrated learning utility.

### **Key Tasks**

1. **Module Creation & Integration**:  
   * Create the new LearningModule in NestJS.  
   * This module will formally import the DictionaryModule into its imports array to gain access to the DictionaryService.  
   * Create the LearningService and LearningController within this new module.  
2. **Database Schema (User-Centric)**:  
   * Create a new TypeORM migration to add the user-specific learning entities. These tables will have foreign key relationships to both the User and Word tables.  
     * UserVocabularyList: To allow users to create and manage personal word lists (e.g., "Chapter 5 Verbs").  
     * UserFlashcard: To track a user's learning progress with a specific word, forming the basis of a spaced repetition system (SRS). This entity will include fields like nextReviewDate and proficiencyLevel.  
     * UserSearchHistory: To log user search queries for potential future personalization features.  
3. **Authenticated API Endpoints**:  
   * Implement the LearningController to expose a new set of authenticated endpoints, logically prefixed with /me/ to signify they operate on the current user's data.  
   * All endpoints in this controller must be protected by the system's primary authentication guard.  
   * **Endpoint Implementation**:  
     * GET /me/vocabulary-lists: Retrieves all vocabulary lists for the logged-in user.  
     * POST /me/vocabulary-lists: Creates a new, empty vocabulary list.  
     * POST /me/vocabulary-lists/`{listId}`/words: Adds a word (by its ID) to a user's specific list.  
     * DELETE /me/vocabulary-lists/`{listId}`/words/`{wordId}`: Removes a word from a list.  
     * GET /me/flashcards?due=true: Retrieves all flashcards for the user that are scheduled for review today.  
     * PATCH /me/flashcards/`{flashcardId}`: Updates a flashcard's proficiency level and calculates the next review date based on an SRS algorithm.  
4. **Service-Level Integration Logic**:  
   * Implement the core business logic within the LearningService for managing vocabulary lists and the SRS flashcard system.  
   * Enhance the DictionaryService's findOne method (which serves GET /dictionary/`{lang-code}`/`{word}`) to optionally accept an authenticated user context.  
   * If a user is present, the service will perform an additional quick check (e.g., isSaved \= await this.learningService.isWordInUserLists(word.id, user.id)).  
   * The WordResponseDto will be augmented with these boolean flags (e.g., isSaved: true, isLearning: false), allowing the UI to display contextual information.

### **Dependencies**

* Successful completion of **Phases 1, 2, and 3**. A stable, performant, and feature-rich dictionary backend is essential.  
* A fully functional user authentication system that provides the current user's context to controllers and services.

### **Acceptance Criteria**

* **Code Complete**: The LearningModule and all its components are implemented and have passed unit and integration tests.  
* **Database**: The new user-centric tables are created via a migration and correctly link to the users and words tables.  
* **API Functionality**:  
  * An authenticated user can perform all CRUD operations on their vocabulary lists and the words within them via the /me/vocabulary-lists endpoints.  
  * A user can retrieve a list of their flashcards that are due for review.  
  * A user can update a flashcard's status after a review, and the nextReviewDate is correctly recalculated.  
* **Integration**:  
  * When an authenticated user requests a word via GET /dictionary/`{lang-code}`/`{word}`, the response correctly includes user-specific boolean flags (e.g., isSaved).  
  * An unauthenticated user requesting the same word receives the standard response without the user-specific flags.