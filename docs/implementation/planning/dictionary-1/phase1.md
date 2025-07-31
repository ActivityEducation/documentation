---
title: Phase 1
sidebar_position: 1
---

# **Phase 1 Plan: Core Dictionary Foundation**

**Objective:** To establish the basic dictionary functionality, including the core data models and the primary API endpoints for word lookup and content management. The goal of this phase is a functional, albeit not fully featured, dictionary backend.

### **Key Tasks**

1. **Module & Service Scaffolding**:  
   * Create the new, self-contained DictionaryModule in NestJS.  
   * Implement the initial DictionaryService to contain business logic.  
   * Implement the DictionaryController to define and handle API routes.  
2. **Database Schema (Core Lexical)**:  
   * Establish a migration-driven workflow using TypeORM. This is a critical first step to ensure schema changes are version-controlled and repeatable.  
   * Create the first database migration script to set up the following tables (entities):  
     * Language: To store supported languages (e.g., 'de', 'en-US').  
     * Word: The central entity for a lexical entry (lemma).  
     * Meaning: To capture distinct definitions, usage notes, and other sense-specific data.  
     * ExampleSentence: To provide contextual examples for each meaning.  
     * Pronunciation: To store IPA notation and links to audio files.  
     * Etymology: To house the origin description of a word.  
     * PartOfSpeech: A lookup table for grammatical roles (e.g., 'Noun, feminine', 'Strong Verb').  
3. **API Endpoint Implementation**:  
   * **Public (Unauthenticated)**:  
     * GET /languages: A simple endpoint to list all languages supported by the dictionary.  
     * GET /dictionary/`{lang-code}`/`{word}`: The primary lookup endpoint to retrieve a full, aggregated dictionary entry for a specific word.  
   * **Administrative (Protected)**:  
     * These endpoints must be protected by an existing authentication/authorization guard.  
     * POST /words: Creates a new, complete word entry, including its nested meanings, examples, etc.  
     * PATCH /words/`{id}`: Performs a partial update on an existing word entry.  
     * DELETE /words/`{id}`: Removes a word and all its associated data from the database.  
4. **Initial Data Seeding**:  
   * Create a DataSeedingService within the DictionaryModule.  
   * This service will be responsible for populating the database with a small, well-defined sample dataset (e.g., 10-20 German words with full details) to be used for development and testing.

### **Dependencies**

* An existing, functional NestJS application environment.  
* Access to a PostgreSQL database instance.  
* An established authentication system with guards that can be applied to the administrative endpoints.

### **Acceptance Criteria**

* **Code Complete**: All specified modules, services, controllers, and entities are implemented and have passed unit tests.  
* **Database**: The database schema is successfully created and versioned via a TypeORM migration. The seeding script runs successfully and populates the database with valid sample data.  
* **API Functionality**:  
  * A GET request to /languages returns a correct list of the seeded languages.  
  * A GET request to /dictionary/de/Hund (or other sample word) returns a complete and accurate JSON object for the word.  
  * An authenticated administrator can successfully use POST, PATCH, and DELETE on the /words endpoint to manage dictionary content, with changes correctly reflected in the database.  
* **Documentation**: The new API endpoints are documented in Swagger/OpenAPI with correct request/response schemas.