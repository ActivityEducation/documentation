---
title: Phase 2
sidebar_position: 2
---

# **Phase 2 Plan: Advanced Grammar and Search**

**Objective:** To enrich the dictionary with a detailed grammatical framework and implement a powerful, high-performance search functionality, transforming it from a simple glossary into a true linguistic resource.

### **Key Tasks**

1. **Database Schema (Grammar & Advanced Relations)**:  
   * Create a new TypeORM migration to add the **Grammatical Framework Entities**. This involves a highly normalized structure:  
     * **Lookup Tables**: GrammaticalCase, GrammaticalNumber, GrammaticalGender, GrammaticalMood, GrammaticalTense, GrammaticalPerson. These tables will be pre-populated with static data.  
     * **Linking Tables**: Declension (for nouns) and Conjugation (for verbs). These tables will link a Word to its various inflected forms based on the lookup tables.  
   * Create a migration to add other relational entities:  
     * SynonymGroup: To handle many-to-many synonym relationships between word meanings.  
     * FrequencyRank: To store word frequency data from various sources.  
2. **Full-Text Search (FTS) Implementation**:  
   * Modify the Word entity in TypeORM to include a tsvector column. This must be implemented as a **stored generated column** in PostgreSQL to automatically concatenate and process text from multiple source columns (e.g., word.text, meaning.definition, example.sentence).  
   * Create a migration to add a **GIN (Generalized Inverted Index)** on the new tsvector column to ensure millisecond-level query performance.  
   * Implement the search logic within the DictionaryService using TypeORM's QueryBuilder. This is necessary to construct raw SQL fragments that leverage PostgreSQL-specific functions and operators like to\_tsquery(), ts\_rank(), and the @@ match operator.  
3. **API Endpoint and Service Logic Updates**:  
   * Implement the public search endpoint: GET /dictionary/search/`{lang-code}`.  
   * The endpoint must support and validate query parameters: ?q= (search term), ?limit= (pagination), ?offset= (pagination), and ?partOfSpeech= (filtering).  
   * Update the primary GET /dictionary/`{lang-code}`/`{word}` endpoint logic to eagerly load and include the new grammatical and relational data (declensions, conjugations, synonyms, frequency) in its response.  
4. **Data Seeding Extension**:  
   * Extend the DataSeedingService to populate the new grammatical and relational tables for the sample dataset, ensuring the new features can be thoroughly tested.

### **Dependencies**

* Successful completion of **Phase 1**. The core dictionary foundation must be stable and functional.  
* The project must be using a PostgreSQL database to leverage its advanced FTS and indexing capabilities.

### **Acceptance Criteria**

* **Database**: All new tables and indexes are successfully created via migrations. The database contains sample data for grammatical tables and relations.  
* **API Functionality**:  
  * A GET request to /dictionary/`{lang-code}`/`{word}` for a noun or verb now includes a complete declension or conjugation table in the JSON response.  
  * The GET /dictionary/search/`{lang-code}` endpoint is fully functional.  
  * A search query returns a ranked list of relevant results based on the search term.  
  * The search API correctly handles pagination and filtering by part of speech.  
* **Performance**: Basic search queries on the indexed sample dataset return results in under 200ms.  
* **Data Integrity**: Synonym and frequency rank data is correctly associated with word entries and returned by the API.