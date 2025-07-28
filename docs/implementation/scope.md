---
title: Scope
---

# **EducationPub Platform: Minimum Viable Product (MVP) Scope**

## **1\. Introduction**

This document defines the scope for the Minimum Viable Product (MVP) of the EducationPub platform. The goal of this MVP is to establish a foundational, functional, and federated social and education platform, leveraging ActivityPub and the newly defined EducationPub vocabulary, with a focused initial content type. This document serves as the primary source of truth for what is explicitly in and out of scope for the MVP.

## **2\. Core Vision**

The core vision for the platform is to enable decentralized sharing and interaction with educational materials within the Fediverse. The MVP will specifically validate the technical feasibility and core user workflows for creating, sharing, and consuming a key educational content type: **Flashcards**. This initial focus on Flashcards is strategic because they represent an atomic, widely understood unit of educational content. Their simpler schema allows for rapid validation of core federation patterns, data model flexibility, and fundamental user engagement, ensuring a clear and demonstrable initial value proposition before expanding to more complex content types.

## **3\. Target Audience (MVP Focus)**

The primary target audience for this MVP is **Individual Educators and Self-Learners** who are looking for a decentralized platform to:

* **Create and organize their own flashcards** for personal use or sharing.  
* **Share these flashcards** publicly or with specific connections within the Fediverse.  
* **Discover and utilize flashcards** created and shared by other individuals.

This focused persona allows us to validate the core value proposition and user experience with a specific segment before considering broader use cases like institutional content management or classroom integration.

## **4\. Key Architectural Components for MVP**

The essential architectural components, as detailed in the **Architecture Overview** (architecture.md), will be implemented in the MVP. For domain-specific details, please refer to that document. This includes:

* **Request Lifecycle & Security:** Robust implementation of HTTP Signature verification, data integrity, and authentication guards.  
* **Module Structure:** Establishment of the foundational NestJS module structure, ensuring modularity and maintainability.  
* **Asynchronous Processing & Persistence:** Utilization of BullMQ and Redis for efficient asynchronous job processing (e.g., federated activity delivery), and PostgreSQL with TypeORM for persistent data storage.  
* **Data Model:** The core database schema, as outlined in architecture.md, will support the MVP's functional requirements, with specific emphasis on supporting the ContentObject entity for edu:Flashcard and edu:FlashcardModel.

## **5\. Core Functionality & Features (In Scope for MVP)**

The MVP will focus on delivering the following capabilities. For endpoint specifics, refer to **ActivityPub Endpoints for EducationPub** (endpoints.md). For vocabulary details, consult the **EducationPub Vocabulary Specification** (Draft-EducationPub\_Vocabulary\_Specification.md).

### **5.1. Local User Management**

* **User Registration:**  
  * *User Story:* As a new user, I want to be able to create an account on the EducationPub platform securely, so that I can begin creating and interacting with educational content.  
  * *Definition of Done:* A new user account is successfully created, an associated ActivityPub actor is provisioned, and the user receives confirmation of their successful registration.  
* **User Login:**  
  * *User Story:* As a registered user, I want to be able to log in to my account securely, so that I can access my content and federated features.  
  * *Definition of Done:* Upon successful authentication, the user receives a valid authentication token that can be used for subsequent authenticated requests.  
* **Basic User Profile Management:**  
  * *User Story:* As a logged-in user, I want to be able to view my basic profile information, so that I can verify my account details.  
  * *Definition of Done:* An authenticated user can retrieve their own basic profile data.

### **5.2. Core ActivityPub Federation**

* **Actor Profiles:**  
  * *User Story:* As an actor on the Fediverse (local or remote), I want to have a publicly discoverable profile, so that other actors can find and interact with me.  
  * *Definition of Done:* Each local user has an associated ActivityPub actor profile (/actors/&lcub;preferredUsername&rcub;) that is publicly accessible and provides the necessary ActivityPub metadata (inbox, outbox URLs etc.).  
* **Inbox Functionality:**  
  * *User Story:* As an EducationPub instance, I want to receive and process activities from other federated servers, so that I can keep my local data consistent with the Fediverse.  
  * *Definition of Done:* The platform can successfully receive and process Create activities specifically for edu:FlashcardModel and edu:Flashcard objects via its inbox (/inbox or /actors/&lcub;preferredUsername&rcub;/inbox), persisting the received content.  
* **Outbox Functionality:**  
  * *User Story:* As a local client, I want to publish new activities on behalf of the authenticated user, so that my content and interactions are federated across the network.  
  * *Definition of Done:* Local clients can successfully post Create activities for edu:FlashcardModel and edu:Flashcard objects to the user's outbox (/actors/&lcub;preferredUsername&rcub;/outbox), triggering asynchronous federation.  
* **Follow/Unfollow:**  
  * *User Story:* As a user, I want to be able to follow other actors (local or remote) to receive their content, and unfollow them if I no longer wish to, so that I can curate my feed.  
  * *Definition of Done:* A local user can initiate a follow request to any local or remote actor. The platform correctly sends 'Follow' activities and processes 'Accept' or 'Reject' responses. Correspondingly, the platform can receive and process 'Follow' activities from remote instances, sending appropriate 'Accept' responses. Unfollow (via 'Undo') functions symmetrically for both incoming and outgoing interactions, correctly updating follower/following relationships and associated collections.  
* **Collection Endpoints:**  
  * *User Story:* As a federated actor or client, I want to retrieve lists of who an actor follows or who follows them, so that I can understand their network.  
  * *Definition of Done:* The followers and following collection endpoints (/actors/&lcub;preferredUsername&rcub;/followers, /actors/&lcub;preferredUsername&rcub;/following) are functional and return accurate, federated collections.

### **5.3. EducationPub \- Flashcard Focus**

The MVP will prioritize the implementation and federation of Flashcards, specifically the edu:FlashcardModel and edu:Flashcard object types as defined in the **EducationPub Vocabulary Specification** (Draft-EducationPub\_Vocabulary\_Specification.md).

* **FlashcardModel Creation:**  
  * *User Story:* As an educator, I want to define reusable structures for my flashcards (e.g., "Front Text", "Back Text", "Image URL") so that I can create consistent study materials.  
  * *Definition of Done:* Local users can create and publish edu:FlashcardModel objects via their outbox, which are then successfully federated.  
* **Flashcard Instance Creation:**  
  * *User Story:* As an educator or learner, I want to create individual flashcards based on a defined model, so that I can populate my study sets.  
  * *Definition of Done:* Local users can create individual edu:Flashcard instances linked to an edu:FlashcardModel via their outbox, and these instances are successfully federated.  
* **Content Dereferencing:**  
  * *User Story:* As a federated client or instance, I want to retrieve the full details of any Flashcard or Flashcard Model, so that I can display or process it correctly.  
  * *Definition of Done:* All edu:FlashcardModel and edu:Flashcard objects (local or federated) are correctly dereferencable via their canonical URIs (e.g., /flashcards/&lcub;id&rcub;).  
* **Listing Created Flashcards:**  
  * *User Story:* As a user or federated client, I want to see a collection of flashcards created by a specific actor, so that I can browse their educational content.  
  * *Definition of Done:* A dedicated endpoint (/actors/&lcub;preferredUsername&rcub;/flashcards) successfully lists flashcards created by a specific actor.  
* **Standard Content Interactions for Flashcards:**  
  * *User Story:* As a user, I want to engage with flashcards similarly to how I interact with other social content (liking, sharing, updating, deleting), so that I can express my preferences and manage my own contributions.  
  * *Definition of Done:* Users can successfully Like, Announce (share), Update, and Delete their own edu:Flashcard and edu:FlashcardModel objects, with these actions correctly federating across instances.

## **6\. Out of Scope for MVP**

The following features, while part of the broader vision, are explicitly **out of scope** for this MVP to maintain focus and accelerate delivery. Any deviation requires a formal change request and re-evaluation of scope.

* **Other EducationPub Object Types:** All edu: object types defined in the **EducationPub Vocabulary Specification** (Draft-EducationPub\_Vocabulary\_Specification.md) other than edu:Flashcard and edu:FlashcardModel (e.g., Story, VideoLesson, SelfAssessment, Rubric, etc.).  
* **Extended EducationPub Activities:** The Submit and Review activity types, as defined in the **EducationPub Vocabulary Specification**, are out of scope.  
* **Advanced Social Features:** Mentions, replies, groups, direct messages, complex content discovery beyond simple collection listing, blocking, muting, and full-text search.  
* **Real-time Notifications:** While the Notification entity exists in the data model, active real-time notification delivery (e.g., push notifications, websockets) is out of scope.  
* **Advanced UI/UX:** The MVP will focus on backend functionality, with a minimal frontend required to demonstrate the core features. User experience beyond basic functionality is out of scope.  
* **Monetization or Complex Analytics.**  
* **Comprehensive Error Reporting/Monitoring beyond basic logging.**  
* **Advanced Identity Management:** Features like password reset, email verification, or multi-factor authentication.

## **7\. Success Criteria for MVP**

The MVP will be considered successful if the following criteria are met. These include both functional completion and initial measurable impact indicators (Key Performance Indicators \- KPIs).

* **Functional Success:**  
  * Local users can register, log in, and manage basic profile settings.  
  * Local users can successfully create, update, and delete edu:FlashcardModel and edu:Flashcard objects.  
  * Flashcard objects created locally are correctly federated to followers on remote ActivityPub instances, and the platform can successfully ingest flashcard objects from remote instances.  
  * Basic ActivityPub interactions (Follow, Like, Announce) function correctly for actors and Flashcard objects (both local and federated).  
  * All federated edu:FlashcardModel and edu:Flashcard objects are dereferencable via their canonical URIs.  
  * The core asynchronous processing with BullMQ and Redis for federation tasks is stable and reliable.  
* **Measurable Impact (Key Performance Indicators \- KPIs):**  
  * **User Activation Rate:** Achieve **60%** of registered users creating at least one edu:FlashcardModel within their first 7 days.  
  * **Content Creation Volume:** Maintain an average of **5 new edu:Flashcard instances** created per active creator per month.  
  * **Federation Health:** Ensure a **\>95% success rate** for outgoing federated activities (e.g., Flashcard Create, Update) with average delivery latency below **5 seconds**.  
  * **User Engagement:** Achieve an average of **30% weekly active users** interacting (liking, announcing, viewing) with federated Flashcard content.  
  * **Interoperability Validation:** Successfully exchange edu:Flashcard and edu:FlashcardModel objects with at least **2-3 pre-selected external ActivityPub instances**.

## **8\. Strategic Outlook & Beyond MVP**

This MVP provides the critical backbone for a decentralized, community-driven educational content ecosystem. By focusing initially on Flashcards, we validate core federation, data model flexibility, and fundamental user interaction patterns within the ActivityPub framework. This foundation uniquely positions EducationPub as an open, interoperable alternative to proprietary learning platforms.  
Future iterations can incrementally extend this foundation to:

* Include other rich edu: vocabulary types (e.g., Story, SelfAssessment, VideoLesson).  
* Introduce more complex learning activities and assessment features.  
* Explore potential monetization models for premium educational content or services, building on the established content and federation capabilities.  
* Enhance UI/UX for a more seamless and engaging user experience.