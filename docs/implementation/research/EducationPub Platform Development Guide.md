---
sidebar_position: 4
title: "Development Guide"
---

# **EducationPub Platform Development Guide**

## **1\. Introduction**

This document outlines the architectural considerations, design patterns, and implementation strategies for developing a robust and scalable platform based on the EducationPub specification. The focus is on a backend built with Node.js and the NestJS framework, utilizing PostgreSQL as the primary database, and leveraging Redis for caching and asynchronous task queuing. While acknowledging the benefits of microservices, this guide will primarily focus on a modular monolith approach, which offers a balance of organizational structure and simplified deployment for initial development and growth.

## **2\. Architectural Overview: Modular Monolith**

The chosen architectural style is a **Modular Monolith**. This approach structures a single application into distinct, loosely coupled modules (or "bounded contexts") that communicate through well-defined interfaces, often mimicking the separation found in microservices but within a single deployment unit.

### **2.1. Layered Architecture**

The application will adhere to a classic layered architecture, providing clear separation of concerns:

* **Presentation Layer (Controllers)**:  
  * **Purpose**: Handles incoming HTTP requests (both C2S and S2S ActivityPub inbox), performs initial request validation, and delegates processing to the Application Layer.  
  * **NestJS Implementation**: @Controller() classes, often using @UsePipes() for validation and @UseGuards() for authentication/authorization.  
* **Application Layer (Services)**:  
  * **Purpose**: Contains the core business logic and orchestrates operations across different domain modules. It defines the application's use cases (e.g., "create a flashcard," "process incoming ActivityPub activity"). It interacts with the Domain and Infrastructure Layers.  
  * **NestJS Implementation**: @Injectable() services, often residing in \*.service.ts files, coordinating multiple domain operations.  
* **Domain Layer**:  
  * **Purpose**: Encapsulates the core business rules, entities, value objects, and domain services. It represents the heart of the application's unique logic, independent of specific technologies or frameworks. This is where the EducationPub specification's VocabularyCard, ObjectiveKeyResult, Actor entities, etc., are defined and their behaviors implemented.  
  * **NestJS Implementation**: Plain TypeScript classes for entities, interfaces for repositories, and domain-specific services that operate on these entities. Ideally, this layer has no direct dependencies on NestJS-specific constructs.  
* **Infrastructure Layer (Persistence, External Services)**:  
  * **Purpose**: Deals with external concerns such as database interactions, external API calls (e.g., HTTP requests to other Fediverse instances), file storage, and message queuing. It provides concrete implementations for interfaces defined in the Domain Layer (e.g., repository implementations).  
  * **NestJS Implementation**: Database modules (e.g., TypeORM/Prisma modules), HTTP modules, Redis/BullMQ integration modules, and specific service classes for external interactions.

### **2.2. Bounded Contexts within the Monolith**

To maintain modularity, the application will be logically divided into distinct bounded contexts, each corresponding to a major subdomain of the EducationPub platform. Each context will typically reside in its own NestJS module, encapsulating its controllers, services, domain entities, and infrastructure concerns.  
Potential Bounded Contexts:

* **AuthModule**: Handles user authentication, authorization, and user management.  
* **ActorModule**: Manages ActivityPub Actors (users, applications, groups), their profiles, and WebFinger resolution.  
* **ContentModule**: Manages VocabularyCards, GrammarRules, LessonPlans, CardTypeDefinitions, and other static learning resources.  
* **AssessmentModule**: Manages Assignments, Exercises, Feedback, AssessmentResponses, and WritingPrompts.  
* **ProgressModule**: Manages ObjectiveKeyResults and related progress tracking.  
* **FederationModule**: The core ActivityPub S2S communication layer, responsible for sending and receiving activities, HTTP signature handling, and managing remote Actor data. This module will interact heavily with other domain modules via events.  
* **NotificationModule**: Handles real-time notifications (e.g., WebSockets/SSE) and potentially email/push notifications.

## **3\. Key Technologies**

* **Backend Framework**: Node.js with [NestJS](https://nestjs.com/)  
  * **Rationale**: Provides a robust, scalable, and opinionated framework that encourages good architectural practices (modules, dependency injection, decorators). Its TypeScript support is excellent for type safety and developer experience.  
* **Database**: [PostgreSQL](https://www.postgresql.org/)  
  * **Rationale**: A powerful, open-source relational database known for its reliability, extensibility, and strong support for advanced features like JSONB, which is crucial for flexible ActivityPub object storage.  
* **ORM (Object-Relational Mapper)**: [TypeORM](https://typeorm.io/)  
  * **Rationale**: Simplifies database interactions, schema migrations, and provides type-safe queries. NestJS has excellent integration with TypeORM.  
  * **NPM Package**: typeorm, pg (PostgreSQL driver)  
* **Message Queue / Caching**: [Redis](https://redis.io/)  
  * **Rationale**: A high-performance in-memory data store used for:  
    * **Message Queueing**: Enables robust asynchronous job processing for ActivityPub federation and other background tasks.  
    * **Caching**: Stores frequently accessed, immutable data (e.g., CardTypeDefinitions, remote Actor profiles) to reduce database load and improve response times.  
  * **NPM Packages**: bullmq, ioredis (BullMQ's underlying Redis client)  
* **Logging**: [Loki](https://grafana.com/oss/loki/) (with [Grafana](https://grafana.com/) for visualization)  
  * **Rationale**: A log aggregation system designed for cost-effective logging of all application events. Its label-based indexing is efficient for querying structured logs.  
  * **NPM Packages**: winston, winston-loki  
* **ActivityPub & JSON-LD Libraries**:  
  * **Rationale**: Essential for handling ActivityPub payloads, including context resolution, expansion, compaction, and crucial canonicalization for HTTP Signatures.  
  * **NPM Package**: jsonld  
* **HTTP Client**:  
  * **Rationale**: For making outgoing HTTP requests to other Fediverse instances (e.g., dispatching activities, WebFinger lookups).  
  * **NPM Package**: axios  
* **Security Libraries**:  
  * **Rationale**: For robust authentication, authorization, and protection against common web vulnerabilities.  
  * **NPM Packages**: @nestjs/passport, passport-jwt, bcrypt, class-validator, class-transformer, @nestjs/throttler

## **4\. Core Design Patterns & Implementation Details**

### **4.1. ActivityPub Federation Module (FederationModule)**

This module is central to the platform's federated nature.

* **Inbox Processing**:  
  * A dedicated controller (@Controller('/actors/:actorId/inbox')) will receive incoming POST requests.  
  * It SHALL perform immediate HTTP Signature verification (Section 6.1.2 of EducationPub Spec).  
  * It SHALL perform deduplication based on Activity id.  
  * Valid activities SHALL be pushed to a dedicated Redis queue (e.g., inbox-processing-queue) for asynchronous processing by background workers. This prevents blocking the HTTP endpoint.  
  * Graceful handling of unknown activity types or invalid payloads (logging, returning appropriate HTTP status codes).  
  * **Dynamic Activity Handling with DiscoveryService**:  
    * To adhere to the Open/Closed Principle and easily extend the platform to support new ActivityPub types, a reflection-based pattern will be used.  
    * A custom decorator (e.g., @ActivityTypeHandler('Follow')) will be defined to mark specific service methods or classes responsible for handling particular ActivityPub types.  
    * A central ActivityDispatcherService will utilize NestJS's DiscoveryService and MetadataScanner to dynamically discover all registered activity handlers at application startup.  
    * When an activity is pulled from the inbox-processing-queue by a worker, the ActivityDispatcherService will dispatch it to the appropriate handler based on the activity's type. This allows adding new activity handlers without modifying the core dispatching logic.  
* **Outbox Processing**:  
  * When an internal event (e.g., FlashcardCreatedEvent, ObjectiveUpdatedEvent) occurs, a dedicated service (e.g., OutboxService) will listen for these events.  
  * It will construct the appropriate ActivityStreams Activity object (e.g., Create, Update, Announce).  
  * It will determine recipients based on addressing fields (to, cc, bto, bcc), resolving collections (like as:Public or followers collections) into individual inbox URIs.  
  * Each outgoing activity SHALL be canonicalized using jsonld.canonize(), signed with HTTP Signatures, and then added to another Redis queue (e.g., outbox-dispatch-queue) for asynchronous delivery.  
* **HTTP Signature Handling**:  
  * A utility service (e.g., SignatureService) will encapsulate the logic for generating and verifying HTTP Signatures (RFC 9421).  
  * This includes managing Actor public/private keys, performing JSON-LD 1.1 Canonicalization for digest generation (using jsonld), and handling (created)/(expires) timestamps.  
  * **NPM Packages**: http-signature-header for header parsing/construction, and Node.js's built-in crypto module for cryptographic operations (hashing, signing, verification).  
* **WebFinger Implementation**:  
  * A controller (@Controller('/.well-known/webfinger')) will respond to WebFinger requests.  
  * It will query the ActorModule to retrieve Actor profile data and construct the JRD response.  
  * Outgoing WebFinger requests to remote instances will utilize axios.  
* **Handling Custom ll: Objects**:  
  * The FederationModule's inbox processing workers will use jsonld.expand() to fully expand incoming ActivityPub payloads, ensuring all ll: properties are consistently resolved. The raw JSON-LD payload can then be stored in the database (likely in a JSONB column).  
  * Subsequent processing by domain-specific services will then parse and validate the custom ll: properties, allowing for graceful degradation in standard Fediverse clients while providing full functionality in EducationPub-compatible clients.  
  * A similar reflection-based approach (e.g., @ObjectTypeHandler('VocabularyCard')) can be used to dynamically dispatch incoming ActivityPub objects to specific domain services for validation and persistence.

### **4.2. Asynchronous Processing & Background Workers**

This is a critical component for performance and reliability.

* **Redis/BullMQ for Queues**:  
  * NestJS integrates well with bullmq (which uses ioredis for Redis connectivity), providing a robust message broker.  
  * Define separate queues for different types of jobs (e.g., activity-inbox, activity-outbox, ai-analysis, report-generation).  
* **Worker Setup**:  
  * Dedicated NestJS modules or separate Node.js processes will act as bullmq workers.  
  * Each worker process will instantiate a QueueScheduler and Worker for the queues it's responsible for.  
  * Workers will contain the actual logic for processing the jobs (e.g., ActivityOutboxWorker to send HTTP requests using axios, PronunciationAnalysisWorker to call an AI service).  
* **Job Management**:  
  * Implement retry mechanisms with exponential backoff for transient failures (e.g., network issues during ActivityPub dispatch).  
  * Handle permanent failures (e.g., invalid payloads) by moving jobs to a "failed" queue for manual inspection.

### **4.3. Data Persistence (PostgreSQL)**

PostgreSQL will be the backbone of data storage.

* **Schema Design**:  
  * **Core Entities**: Tables for User (mapping to as:Person Actors), Group (mapping to as:Group Actors), VocabularyCard, Assignment, Objective, KeyResult (potentially as a child table to Objective), CardTypeDefinition.  
  * **ActivityPub Payloads (JSONB)**: For VocabularyCards and other custom ll: objects, consider storing the ll:fields or the entire ActivityPub JSON-LD object in a JSONB column. This offers flexibility for schema evolution of custom properties without constant DDL migrations.  
    * Core identifying properties (e.g., id, type, attributedTo) should still be stored in dedicated columns for efficient querying and indexing.  
  * **Federation-Specific Tables**:  
    * Actors: Stores local and remote Actor profiles (including inbox, outbox, publicKeyPem).  
    * Follows: Tracks follow relationships.  
    * Activities: Stores incoming and outgoing ActivityPub activities (often with a JSONB column for the full payload).  
    * ProcessedActivities: A table to store IDs of processed incoming activities for deduplication.  
* **Indexing Strategies**:  
  * Index foreign keys.  
  * Index frequently queried columns (e.g., Actor.preferredUsername, VocabularyCard.attributedTo).  
  * Consider GIN indexes for JSONB columns if you need to query within the JSON structure (e.g., `SELECT * FROM vocabulary_cards WHERE data->'ll:fields' @> '[{"name": "Front", "content": "Bonjour"}]`').  
* **ORM (TypeORM)**:  
  * Use TypeORM entities to define your database models.  
  * Leverage TypeORM's `@Column({ type: 'jsonb' })` for JSONB fields.  
  * Utilize migrations for schema evolution.

### **4.4. Caching (Redis)**

Redis will be used for caching frequently accessed, relatively immutable data.

* **Cacheable Data**:  
  * CardTypeDefinition objects: These define how VocabularyCards are structured and rendered. They are likely static or change infrequently, making them ideal for caching.  
  * Remote Actor profiles: After fetching a remote Actor's profile via WebFinger or their id URI (using axios), cache their inbox URL, publicKeyPem, and other static profile data to avoid repeated network requests.  
* **Caching Strategy**:  
  * **Cache-aside**: The application code checks the cache first. If data is not found, it fetches from the database, then stores it in the cache.  
  * **Time-to-Live (TTL)**: Set appropriate TTLs for cached data to ensure freshness. Remote Actor profiles might have a longer TTL than frequently updated content.  
* **Invalidation**:  
  * For local CardTypeDefinitions, invalidate the cache when a definition is updated.  
  * For remote Actor profiles, invalidate based on HTTP cache headers (e.g., Cache-Control, ETag) or after a certain TTL.

### **4.5. Logging (Loki)**

Comprehensive, structured logging is essential for observability, especially in a distributed system like the Fediverse.

* **Structured Logging**: Use winston configured to output logs in JSON format.  
* **Contextual Logging**:  
  * **Request ID**: Generate a unique ID for each incoming HTTP request and propagate it through all log messages related to that request. This is invaluable for tracing a single request's flow.  
  * **Actor ID**: Include the id of the relevant Actor (local or remote) in logs related to their activities.  
  * **Activity ID**: Include the id of the ActivityPub activity being processed or dispatched.  
  * **Job ID**: For background jobs, include the BullMQ job ID.  
* **Loki Integration**:  
  * Use winston-loki to send structured logs to a Loki instance.  
  * Configure labels (e.g., service=federation, level=info, actorId=...) to allow efficient querying in Loki.  
* **Log Levels**: Utilize different log levels (debug, info, warn, error) appropriately.

### **4.6. Security**

Beyond the HTTP Signatures in the spec, broader application security is paramount.

* **Authentication**:  
  * Implement user authentication (e.g., username/password, OAuth2, SSO).  
  * Use @nestjs/passport with passport-jwt for JWT-based authentication.  
  * bcrypt will be used for securely hashing and comparing passwords.  
* **Authorization**:  
  * Implement Role-Based Access Control (RBAC) or Attribute-Based Access Control (ABAC) to define what authenticated users can do.  
  * NestJS Guards and Decorators are excellent for implementing authorization logic (e.g., @Roles('educator'), @CanUpdateFlashcard()).  
* **Input Validation**:  
  * Rigorous validation of all incoming data (HTTP request bodies, query parameters, ActivityPub payloads).  
  * Use class-validator with class-transformer and NestJS ValidationPipe for declarative validation.  
* **Rate Limiting**: Protect against abuse and DoS attacks by implementing rate limiting on public endpoints (e.g., inbox, WebFinger) using @nestjs/throttler.  
* **CORS**: Properly configure Cross-Origin Resource Sharing (CORS) headers for your API using @nestjs/platform-express.  
* **Environment Variables**: Securely manage sensitive configurations (database credentials, private keys) using environment variables.

### **4.7. Error Handling**

A robust error handling strategy ensures application stability and provides clear feedback.

* **Centralized Exception Filters**: Use NestJS ExceptionFilters to catch and handle exceptions globally, transforming them into consistent HTTP responses (e.g., 400 Bad Request, 401 Unauthorized, 500 Internal Server Error).  
* **Custom Exceptions**: Define custom application-specific exceptions (e.g., ActorNotFoundException, InvalidActivityException) to provide more semantic error information.  
* **Logging Errors**: All errors caught by exception filters should be logged with sufficient context (request ID, relevant data) to Loki using winston.

## **7\. Scalability & Observability**

While starting with a modular monolith, plan for future scaling and ensure visibility into your system.

* **Horizontal Scaling of Node.js Processes**:  
  * Node.js applications can be scaled horizontally by running multiple instances behind a load balancer.  
  * The stateless nature of controllers and services (relying on Redis for stateful operations like queues/cache) facilitates this.  
* **Database Scaling (PostgreSQL)**:  
  * Initially, a single PostgreSQL instance may suffice.  
  * For read-heavy workloads (e.g., fetching content, displaying timelines), consider setting up PostgreSQL read replicas.  
* **Monitoring**:  
  * Collect application metrics (e.g., request latency, error rates, queue depths, job processing times).  
  * Use tools like Prometheus for metric collection and Grafana for dashboards to visualize system health.  
* **Distributed Tracing**:  
  * While more complex for a monolith, consider integrating OpenTelemetry for distributed tracing. This allows you to trace a single request or activity through multiple services and asynchronous jobs, which is invaluable for debugging federation issues across instances.

## **8\. Development Workflow & Best Practices**

* **Testing**:  
  * **Unit Tests**: For individual services, controllers, and utility functions using jest.  
  * **Integration Tests**: For interactions between modules (e.g., ContentModule interacting with PersistenceLayer) using jest.  
  * **End-to-End (E2E) Tests**: For full API flows, including ActivityPub federation (mocking external instances) using jest and supertest.  
* **CI/CD (Continuous Integration/Continuous Deployment)**:  
  * Automate build, test, and deployment processes.  
  * Ensure all code changes pass tests before deployment.  
* **Code Quality**:  
  * Enforce consistent code style with prettier and eslint.  
  * Regular code reviews.  
* **Documentation**: Maintain clear API documentation (e.g., OpenAPI/Swagger) for both C2S and S2S endpoints.