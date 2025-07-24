---
sidebar_position: 2
title: "Architecture & Design Paterns"
---

# **EducationPub Platform Module Architecture & Design Patterns**

## **1. Introduction**

This document provides an in-depth architectural breakdown of the individual modules within the EducationPub platform, built using Node.js with NestJS and PostgreSQL. It elaborates on the design patterns, particularly those from the Gang of Four (GoF), and other architectural principles that will guide the implementation of each module. This detailed view aims to ensure a robust, maintainable, and extensible codebase that effectively leverages the modular monolith approach.

## **2. Module Architectural Details**

### **2.1. AuthModule**

The AuthModule is responsible for managing user authentication and authorization within the EducationPub platform. It provides the necessary mechanisms for users to securely access and interact with the system.

* **Purpose**: To provide secure user authentication and authorization services for local users of the EducationPub instance. This includes user registration, login, session management (via JWTs), and basic user profile management.  
* **Key Responsibilities**:  
  * User registration (signup) and account creation.  
  * User login, including credential verification and session establishment.  
  * Generation, signing, and validation of JSON Web Tokens (JWTs) for authenticated sessions.  
  * Secure hashing and comparison of user passwords.  
  * Basic CRUD operations for local user profiles (e.g., updating email, password).  
  * Enforcement of access control rules (e.g., role-based authorization).  
* **Core Components**:  
  * AuthController: Handles HTTP requests related to authentication (e.g., /auth/register, /auth/login).  
  * AuthService: Encapsulates the core business logic for authentication and authorization.  
  * UserService (or UserRepository): Manages persistence operations for User entities.  
  * User Entity: Represents the platform's local user account, mapping to as:Person Actors.  
  * Passport Strategies: Implementations for various authentication flows (e.g., JwtStrategy, LocalStrategy).  
  * Guards: NestJS Guards (e.g., JwtAuthGuard, RolesGuard) for protecting routes and enforcing authorization.  
  * DTOs (Data Transfer Objects): For request validation (e.g., RegisterUserDto, LoginUserDto).  
* **Entity Breakdown**:  
  * User: Represents a local user account on the platform, storing credentials, profile information, and linking to their ActivityPub Actor record.  
* **GoF Design Patterns**:  
  * **Strategy Pattern**: This pattern is inherently used by Passport.js, which is integrated into NestJS. Different authentication mechanisms (e.g., local username/password, JWT validation) are implemented as interchangeable "strategies." The AuthService (or PassportModule internally) acts as the context, dynamically selecting and executing the appropriate strategy based on the authentication flow. This allows for easy extension with new authentication methods (e.g., OAuth2, federated login) without modifying core authentication logic.  
  * **Facade Pattern**: The AuthService can serve as a Facade. It provides a simplified, high-level interface to the complex underlying authentication and user management operations, which might involve coordinating password hashing (bcrypt), JWT generation (passport-jwt), and database interactions (UserService). This abstracts away the complexity for controllers and other modules that need authentication services.  
  * **Singleton Pattern**: While not explicitly coded as a GoF pattern, NestJS providers (services) are singletons by default within their respective module scopes. This ensures that a single instance of AuthService, UserService, etc., is used throughout the application, managing shared resources like database connections efficiently.  
* **Other Architectural Patterns/Principles**:  
  * **Repository Pattern**: The UserService (or a dedicated UserRepository) will abstract away the details of data persistence for User entities, providing a clean interface for AuthService to interact with the database.  
  * **Dependency Injection**: NestJS's core principle, heavily utilized throughout the module to manage dependencies between services, controllers, and strategies, promoting loose coupling and testability.  
  * **Decorator Pattern**: NestJS's @UseGuards(), @Inject(), @Controller(), @Post(), etc., are all examples of decorators used to add metadata and behavior to classes and methods. This is fundamental to NestJS's declarative style.  
* **Inter-Module Communication**:  
  * **Direct Service Calls**: Other modules requiring authentication or user information (e.g., ActorModule needing to link a local user to an ActivityPub Actor) will directly inject and call methods on AuthService or UserService.  
  * **Guards**: AuthModule exports its authentication and authorization guards, which other modules can apply to their routes to protect endpoints.  
  * **Events**: AuthService might publish internal domain events (e.g., UserRegisteredEvent, PasswordChangedEvent) that other modules (e.g., NotificationModule to send a welcome email, ActorModule to create a default Actor profile) can subscribe to for asynchronous reactions.  
* **Key Technologies/Libraries**:  
  * @nestjs/passport: NestJS integration for Passport.js.  
  * passport-jwt: Passport strategy for JWT authentication.  
  * bcrypt: For secure password hashing.  
  * class-validator, class-transformer: For DTO validation.  
  * typeorm: For database interaction with the User entity.  
  * winston: For logging authentication-related events and errors.

### **2.2. ActorModule**

The ActorModule is responsible for managing all ActivityPub Actors within the EducationPub platform, including local users, groups, and applications, as well as handling the discovery and representation of remote Actors. It serves as the central authority for Actor-related data.

* **Purpose**: To manage the creation, retrieval, and persistence of both local and remote ActivityPub Actors (as:Person, as:Group, as:Application). It handles WebFinger discovery, Actor profile fetching, and the management of Follow relationships.  
* **Key Responsibilities**:  
  * Creating and managing local Actor entities (representing as:Person, as:Group, as:Application types).  
  * Storing and retrieving Actor profiles, including their inbox, outbox, and publicKeyPem.  
  * Responding to WebFinger requests for local Actors.  
  * Fetching, parsing, and caching remote Actor profiles from other Fediverse instances.  
  * Managing Follow relationships (representing who follows whom locally).  
  * Generating and managing Actor public/private key pairs for HTTP Signatures.  
  * Linking local User accounts (from AuthModule) to their corresponding as:Person Actors.  
* **Core Components**:  
  * ActorController: Handles WebFinger requests (/.well-known/webfinger) and potentially C2S endpoints for managing local Actor profiles.  
  * ActorService: Contains the core business logic for Actor management, coordinating between repositories, external services, and potentially other modules.  
  * ActorRepository: Manages persistence operations for Actor entities in the database.  
  * FollowRepository: Manages persistence operations for Follow relationships.  
  * Actor Entity: Represents the database model for ActivityPub Actors (local and cached remote).  
  * Follow Entity: Represents the database model for follow relationships.  
  * RemoteActorFetcherService: Handles fetching and parsing remote Actor profiles via HTTP.  
  * WebFingerService: Handles the logic for responding to WebFinger queries and performing outgoing WebFinger lookups.  
  * DTOs: For creating and updating Actor profiles.  
* **Entity Breakdown**:  
  * Actor: Represents an ActivityPub Actor, storing its URI, type, inbox/outbox URLs, public key, and a reference to the local User if applicable. This entity stores both local and cached remote Actor data.  
  * Follow: Represents a follow relationship between two Actor entities.  
* **GoF Design Patterns**:  
  * **Repository Pattern**: Crucial for abstracting database access for Actor and Follow entities. ActorRepository and FollowRepository provide a clear, persistence-agnostic interface for ActorService to interact with data.  
  * **Factory Method / Abstract Factory**: Could be employed for creating different types of Actor entities (Person, Group, Application). An ActorFactory could encapsulate the logic for initializing these different Actor types with their specific default properties (e.g., setting up initial inbox/outbox URIs based on type). This promotes consistency and extensibility when adding new Actor types.  
  * **Proxy Pattern**: The RemoteActorFetcherService could implement a Proxy pattern for fetching remote Actor profiles. It would act as a proxy to the actual network request, first checking a cache (e.g., Redis) for the Actor's profile before initiating an expensive HTTP call. This improves performance and reduces external network dependencies.  
  * **Strategy Pattern**: Could be applied within WebFingerService or RemoteActorFetcherService if there are different strategies for resolving remote actor profiles (e.g., prioritizing WebFinger, then direct profile fetch, then fallback mechanisms). Each strategy would encapsulate a specific resolution algorithm.  
  * **Singleton Pattern**: NestJS services like ActorService and RemoteActorFetcherService will naturally be singletons, ensuring efficient management of shared resources like database connections and the Redis cache.  
* **Other Architectural Patterns/Principles**:  
  * **Dependency Injection**: Fundamental to NestJS, used throughout the module to manage dependencies, promoting loose coupling and testability.  
  * **Event-Driven**: ActorModule will subscribe to events from AuthModule (e.g., UserRegisteredEvent) to automatically create corresponding as:Person Actors. It will also publish its own events (e.g., ActorCreatedEvent, ActorUpdatedEvent, FollowCreatedEvent, FollowRemovedEvent) for other modules to react to.  
  * **Caching**: Utilizes Redis for caching remote Actor profiles (inbox URLs, public keys) to minimize network overhead and improve performance.  
* **Inter-Module Communication**:  
  * **Depends on AuthModule**: Subscribes to UserRegisteredEvent to create as:Person Actors linked to local user accounts.  
  * **Used by FederationModule**: FederationModule will heavily depend on ActorModule to:  
    * Retrieve local Actor details (e.g., inbox, outbox URIs, public/private keys) for signing outgoing activities.  
    * Resolve remote Actor details (e.g., inbox URIs, public keys) for dispatching activities and verifying incoming signatures.  
    * Manage Follow relationships based on incoming Follow and Accept activities.  
  * **Publishes Events**: ActorCreatedEvent, ActorUpdatedEvent, FollowCreatedEvent, FollowRemovedEvent for other modules (e.g., NotificationModule to send follow notifications).  
* **Key Technologies/Libraries**:  
  * typeorm: For database interaction with Actor and Follow entities.  
  * axios: For making outgoing HTTP requests to fetch remote Actor profiles and WebFinger lookups.  
  * jsonld: For parsing and expanding incoming ActivityPub Actor profiles.  
  * winston: For comprehensive logging of Actor-related operations and federation events.  
  * @nestjs/common: For NestJS core decorators and utilities.  
  * @nestjs/throttler: For rate limiting WebFinger endpoints.

### **2.3. ContentModule**

The ContentModule is dedicated to managing all educational learning resources and materials within the EducationPub platform. This includes the various types of content defined in the EducationPub specification, such as vocabulary cards, grammar rules, and structured lessons.

* **Purpose**: To provide comprehensive CRUD (Create, Read, Update, Delete) and management capabilities for all learning content objects, including VocabularyCards, GrammarRules, LessonPlans, CardTypeDefinitions, Storys, VideoLessons, and WritingPrompts. It ensures the integrity and proper structure of these educational resources.  
* **Key Responsibilities**:  
  * Creation, retrieval, update, and deletion of all defined content types.  
  * Validation of content-specific properties, especially the ll: custom fields, against their respective schemas (e.g., ensuring VocabularyCard fields conform to its CardTypeDefinition).  
  * Management of media attachments (e.g., audio for pronunciation, images for visual cards) by storing their URLs and potentially interacting with a file storage service (though the spec only mentions URLs, implying external storage).  
  * Handling the hierarchical or relational linking of content objects (e.g., a LessonPlan containing multiple VocabularyCards or GrammarRules).  
  * Managing CardTypeDefinitions as blueprints for VocabularyCards, ensuring consistency and enabling flexible rendering on the frontend.  
* **Core Components**:  
  * ContentController: Provides C2S API endpoints for managing content (e.g., /content/flashcards, /content/lesson-plans).  
  * ContentService: Orchestrates the business logic for content management, delegating to specific repositories and validation services.  
  * VocabularyCardService: Handles specific logic for VocabularyCards, including validation against CardTypeDefinition.  
  * CardTypeDefinitionService: Manages the creation, retrieval, and validation of CardTypeDefinitions.  
  * StoryService, GrammarRuleService, LessonPlanService, VideoLessonService, WritingPromptService: Dedicated services for other content types, if their logic warrants it.  
  * Repositories: VocabularyCardRepository, CardTypeDefinitionRepository, StoryRepository, GrammarRuleRepository, LessonPlanRepository, VideoLessonRepository, WritingPromptRepository for persistence operations.  
  * Entities: VocabularyCard, CardTypeDefinition, Story, GrammarRule, LessonPlan, VideoLesson, WritingPrompt (TypeORM entities mapping to database tables).  
  * DTOs: For content creation and update requests (e.g., CreateVocabularyCardDto, UpdateLessonPlanDto).  
  * ContentValidatorService: A utility service for complex content-specific validation, especially for ll: fields.  
* **Entity Breakdown**:  
  * VocabularyCard: Stores individual flashcard data, including its ll:cardType and ll:fields (often as JSONB).  
  * CardTypeDefinition: Defines the structure (fields, templates) for VocabularyCard types.  
  * Story: Represents a narrative text for reading/listening comprehension.  
  * GrammarRule: Represents an explanation of a grammar rule.  
  * LessonPlan: Represents a structured collection of learning materials.  
  * VideoLesson: Represents a video-based learning resource.  
  * WritingPrompt: Represents a prompt for a writing activity.  
* **GoF Design Patterns**:  
  * **Repository Pattern**: Applied extensively for each content entity (e.g., VocabularyCardRepository, LessonPlanRepository). This abstracts the data access logic, making ContentService and other domain services independent of the specific ORM or database implementation.  
  * **Builder Pattern**: Could be beneficial for creating complex content objects like VocabularyCards or LessonPlans, especially if they have many optional fields or nested structures (ll:fields in VocabularyCard, items in LessonPlan). A VocabularyCardBuilder could guide the construction process, ensuring valid combinations of fields based on the CardTypeDefinition.  
  * **Composite Pattern**: LessonPlan and Course objects (as:Collection) are natural candidates for the Composite pattern. A LessonPlan (Composite) can contain individual learning objects (Leafs like VocabularyCard, GrammarRule) or even other LessonPlans (other Composites). This allows clients to treat individual content items and collections of content items uniformly.  
  * **Strategy Pattern**: Can be used for content validation. For instance, a ContentValidationStrategy interface could have different concrete implementations for validating VocabularyCards based on their ll:cardType, or for validating Exercises based on their ll:questionType. The ContentValidatorService would then use the appropriate strategy.  
  * **Flyweight Pattern**: Potentially for CardTypeDefinitions. If there are many VocabularyCard instances, but only a few unique CardTypeDefinition structures, the CardTypeDefinition objects themselves could be managed as flyweights. The CardTypeDefinitionService would ensure that CardTypeDefinition objects are shared and reused by VocabularyCards that reference the same definition, saving memory if many identical definitions exist. This is more of an optimization.  
  * **Singleton Pattern**: All NestJS services within ContentModule will be singletons, managing shared resources and ensuring consistent behavior.  
* **Other Architectural Patterns/Principles**:  
  * **Dependency Injection**: Heavily used by NestJS to manage dependencies between services and repositories.  
  * **Event-Driven**: ContentModule will publish domain events (e.g., VocabularyCardCreatedEvent, LessonPlanUpdatedEvent, CardTypeDefinitionCreatedEvent) to which other modules (especially FederationModule for outgoing ActivityPub Create/Update/Announce activities) can subscribe.  
  * **Validation**: Extensive use of class-validator and class-transformer for robust input validation on DTOs and internal data models.  
* **Inter-Module Communication**:  
  * **Used by FederationModule**: FederationModule will query ContentModule to retrieve content objects for outgoing Announce activities. It will also delegate the persistence and validation of incoming Create/Update activities (for VocabularyCard, GrammarRule, etc.) to the ContentModule's services.  
  * **Publishes Events**: ContentModule publishes events that FederationModule subscribes to for dispatching activities to the Fediverse.  
  * **Depends on ActorModule**: To verify the attributedTo Actor for content objects (e.g., ensuring a VocabularyCard is attributed to a valid local or remote Actor).  
* **Key Technologies/Libraries**:  
  * typeorm: For all database interactions and entity definitions.  
  * winston: For logging content management operations.  
  * class-validator, class-transformer: For robust data validation.  
  * jsonld: For parsing and expanding incoming ActivityPub content objects from the FederationModule.  
  * axios: Potentially for fetching external media URLs if content is stored remotely (though the spec implies URLs are just references).

### **2.4. AssessmentModule**

The AssessmentModule is responsible for managing all aspects related to learner assessments, exercises, and the collection of their responses and feedback. This includes defining assessment structures, processing submissions, and handling peer review mechanisms.

* **Purpose**: To manage the lifecycle of assessments and exercises, from creation to submission and feedback. This module handles Assignments, Exercises, SelfAssessments, Questions (embedded), AssessmentResponses, WritingPrompts, WritingSubmissions, and PeerReviews. It ensures that learning progress can be effectively measured and feedback provided.  
* **Key Responsibilities**:  
  * Creation, retrieval, update, and deletion of assessment definitions (Assignment, SelfAssessment, WritingPrompt, Exercise, PronunciationExercise).  
  * Processing and storing learner submissions and responses (AssessmentResponse, WritingSubmission).  
  * Facilitating and recording peer review feedback (PeerReview).  
  * Validation of submissions against expected formats and criteria.  
  * Calculating scores or correctness for objective assessment types.  
  * Managing the relationships between prompts, submissions, and feedback.  
* **Core Components**:  
  * AssessmentController: Provides C2S API endpoints for managing assessments (e.g., /assessments/quizzes, /assessments/submissions).  
  * AssessmentService: Orchestrates the overall assessment workflow, delegating to specific services and repositories.  
  * AssignmentService, SelfAssessmentService, WritingPromptService, ExerciseService, PronunciationExerciseService: Dedicated services for managing each specific assessment or exercise type.  
  * SubmissionService: Handles the logic for processing and storing AssessmentResponses and WritingSubmissions.  
  * PeerReviewService: Manages the creation and retrieval of PeerReview objects.  
  * Repositories: AssignmentRepository, SelfAssessmentRepository, WritingPromptRepository, ExerciseRepository, PronunciationExerciseRepository, AssessmentResponseRepository, WritingSubmissionRepository, PeerReviewRepository.  
  * Entities: Assignment, SelfAssessment, WritingPrompt, Exercise, PronunciationExercise, AssessmentResponse, WritingSubmission, PeerReview (TypeORM entities).  
  * DTOs: For creating assessments, submitting responses, and providing reviews.  
  * QuestionProcessorService: A utility service for evaluating answers to edu:Question objects (e.g., checking multiple-choice answers, basic fill-in-the-blank).  
* **Entity Breakdown**:  
  * Assignment: Represents a learning task or exercise given by an educator.  
  * SelfAssessment: Represents a collection of questions for self-assessment.  
  * Exercise: A generic learning exercise.  
  * PronunciationExercise: A specific type of exercise focusing on pronunciation.  
  * AssessmentResponse: Stores a learner's answers to an Assessment or Question.  
  * WritingPrompt: Represents a prompt for a writing activity.  
  * WritingSubmission: Stores a learner's submitted written work.  
  * PeerReview: Represents feedback provided by a peer on a submission.  
* **GoF Design Patterns**:  
  * **Repository Pattern**: Applied for each assessment-related entity, ensuring clean separation of data access logic.  
  * **Strategy Pattern**: Highly applicable for QuestionProcessorService and SubmissionService.  
    * QuestionProcessorService could use different strategies for evaluating answers based on edu:questionType (e.g., MultipleChoiceEvaluationStrategy, FillInTheBlankEvaluationStrategy).  
    * SubmissionService could use strategies for processing different edu:assessmentTypes or edu:expectedSubmission types.  
  * **Command Pattern**: Submitting an assessment response or a writing submission could be modeled as a Command. A SubmitAssessmentCommand or SubmitWritingCommand would encapsulate the request details, allowing for decoupled execution, logging, and potential undo/redo mechanisms (though undo/redo might be complex for federated submissions).  
  * **Observer Pattern**: When a WritingSubmission is created, it could emit a WritingSubmissionCreatedEvent. The PeerReviewService could then act as an Observer, listening for this event to identify submissions available for peer review and potentially notify eligible reviewers. Similarly, when a PeerReview is completed, it could notify the original submitter.  
  * **Singleton Pattern**: All NestJS services within AssessmentModule will be singletons, managing shared resources and ensuring consistent behavior.  
* **Other Architectural Patterns/Principles**:  
  * **Dependency Injection**: Fundamental for structuring the module and managing dependencies.  
  * **Event-Driven**: AssessmentModule will publish events (e.g., AssessmentSubmittedEvent, WritingSubmissionCreatedEvent, PeerReviewCompletedEvent) that the FederationModule will subscribe to for dispatching ActivityPub Submit or Review activities. It might also subscribe to events from ContentModule (e.g., LessonPlanUpdatedEvent if an assignment is part of a lesson plan).  
  * **Validation**: Extensive use of class-validator and class-transformer for validating incoming assessment definitions and learner responses.  
* **Inter-Module Communication**:  
  * **Depends on ActorModule**: To verify the attributedTo Actor for submissions and reviews, and to manage relationships with learners and educators.  
  * **Depends on ContentModule**: To link Assignments and Exercises to relevant learning content (e.g., a Story or VideoLesson).  
  * **Used by FederationModule**: FederationModule will delegate the processing of incoming Submit and Review activities to AssessmentModule services. AssessmentModule will also provide data to FederationModule for outgoing Create/Update activities related to assessments and submissions.  
  * **Publishes Events**: AssessmentSubmittedEvent, WritingSubmissionCreatedEvent, PeerReviewCompletedEvent for FederationModule and NotificationModule.  
* **Key Technologies/Libraries**:  
  * typeorm: For all database interactions and entity definitions.  
  * winston: For logging assessment workflows, submissions, and feedback.  
  * class-validator, class-transformer: For robust data validation.  
  * jsonld: For parsing and expanding incoming ActivityPub assessment objects from FederationModule.  
  * axios: If external services are used for automated assessment (e.g., AI grading APIs).

### **2.5. ProgressModule**

The ProgressModule is dedicated to tracking and managing learners' progress towards their educational goals, primarily through the Objective-Key Result (OKR) framework. It provides mechanisms for defining objectives, updating key results, and reporting on overall progress.

* **Purpose**: To manage the creation, tracking, and reporting of learners' ObjectiveKeyResults. This module enables learners and educators to set measurable goals and monitor progress over time, facilitating a goal-oriented learning experience.  
* **Key Responsibilities**:  
  * Creation, retrieval, update, and deletion of ObjectiveKeyResult objects.  
  * Updating ll:currentValue and ll:progressPercentage for individual Key Results.  
  * Aggregating progress to determine the overall status of an Objective.  
  * Linking Objectives and Key Results to relevant learning activities or content (e.g., completion of exercises, mastery of vocabulary cards).  
  * Providing reporting capabilities on individual and group progress.  
* **Core Components**:  
  * ProgressController: Provides C2S API endpoints for managing OKRs (e.g., /progress/objectives, /progress/key-results).  
  * ProgressService: Orchestrates the business logic for OKR management, including validation, calculation, and persistence.  
  * ObjectiveKeyResultService: Handles the specific logic for ObjectiveKeyResult objects.  
  * ObjectiveRepository, KeyResultRepository: Repositories for persistence operations (assuming KeyResults are managed as a child entity of Objective in the database).  
  * Entities: Objective, KeyResult (TypeORM entities).  
  * DTOs: For creating and updating OKRs (e.g., CreateObjectiveDto, UpdateKeyResultDto).  
  * ProgressCalculatorService: A utility service responsible for calculating ll:progressPercentage and overall ll:status based on ll:currentValue and ll:targetValue.  
* **Entity Breakdown**:  
  * Objective: Represents a high-level learning goal.  
  * KeyResult: Represents a measurable outcome contributing to an Objective.  
* **GoF Design Patterns**:  
  * **Repository Pattern**: Applied for Objective and KeyResult entities, abstracting database interactions.  
  * **Strategy Pattern**: The ProgressCalculatorService could use different strategies for calculating progress based on ll:metricType (e.g., PercentageMetricStrategy, CountMetricStrategy). This allows for flexible calculation logic for various key result types.  
  * **Command Pattern**: Updating a Key Result's value could be modeled as a UpdateKeyResultCommand, encapsulating the data and the operation, which could then be queued for asynchronous processing.  
  * **Observer Pattern**: When an ObjectiveKeyResult is updated (especially its ll:currentValue), it could emit an ObjectiveUpdatedEvent or KeyResultProgressedEvent. Other modules (e.g., NotificationModule to alert an educator, FederationModule to dispatch an as:Update activity) could act as Observers, reacting to these changes.  
  * **Singleton Pattern**: NestJS services within ProgressModule will be singletons, managing shared resources and ensuring consistent behavior.  
* **Other Architectural Patterns/Principles**:  
  * **Dependency Injection**: Fundamental to NestJS, used throughout the module.  
  * **Event-Driven**: ProgressModule will subscribe to events from other modules (e.g., AssessmentSubmittedEvent from AssessmentModule, VocabularyCardMasteredEvent from a hypothetical LearningEngineModule) to automatically update relevant ll:currentValues in Key Results. It will publish ObjectiveUpdatedEvents and KeyResultProgressedEvents for federation and notification.  
  * **Validation**: class-validator and class-transformer for validating incoming OKR data.  
* **Inter-Module Communication**:  
  * **Depends on ActorModule**: To verify the attributedTo Actor for Objectives and to link OKRs to specific learners or groups.  
  * **Subscribes to Events from AssessmentModule and ContentModule**: To automatically update progress based on completed assignments, exercises, or mastered content.  
  * **Used by FederationModule**: FederationModule will delegate the processing of incoming Create/Update activities for ObjectiveKeyResults to ProgressModule services. ProgressModule will also provide data to FederationModule for outgoing Create/Update activities related to OKRs.  
  * **Publishes Events**: ObjectiveUpdatedEvent, KeyResultProgressedEvent for FederationModule and NotificationModule.  
* **Key Technologies/Libraries**:  
  * typeorm: For database interaction with Objective and KeyResult entities.  
  * winston: For logging progress updates and OKR management.  
  * class-validator, class-transformer: For robust data validation.  
  * jsonld: For parsing and expanding incoming ActivityPub ObjectiveKeyResult objects from FederationModule.

### **2.6. FederationModule**

The FederationModule is the core communication hub for the EducationPub platform, enabling server-to-server (S2S) interactions with other Fediverse instances. It is responsible for sending and receiving ActivityPub activities, ensuring secure and reliable data exchange according to the EducationPub specification.

* **Purpose**: To manage all inbound and outbound ActivityPub S2S communication. This includes receiving activities in the inbox, dispatching activities from the outbox, handling HTTP Signatures for security, and resolving remote Actors via WebFinger. It acts as the gateway to the broader Fediverse.  
* **Key Responsibilities**:  
  * Receiving and processing incoming ActivityPub activities via the inbox endpoint.  
  * Verifying HTTP Signatures of incoming activities for authenticity and integrity.  
  * Deduplicating incoming activities to prevent reprocessing.  
  * Asynchronously dispatching outgoing ActivityPub activities to remote inboxes.  
  * Generating HTTP Signatures for outgoing activities.  
  * Resolving remote Actor profiles and their inbox/outbox URLs via WebFinger and direct profile fetches.  
  * Canonicalizing JSON-LD payloads for cryptographic hashing.  
  * Handling and logging federation-specific errors (e.g., network failures, signature mismatches).  
* **Core Components**:  
  * InboxController: The public endpoint (/actors/:actorId/inbox) for receiving incoming ActivityPub POST requests.  
  * WebFingerController: Handles /.well-known/webfinger requests for local Actor discovery.  
  * ActivityDispatcherService: A central service that orchestrates the processing of incoming activities by dynamically dispatching them to specific handlers based on ActivityPub type and object.type.  
  * ActivityHandler interfaces/classes: Specific implementations for handling different ActivityPub verbs (e.g., FollowActivityHandler, CreateActivityHandler, UpdateActivityHandler). These will use the reflection pattern (@ActivityTypeHandler).  
  * ObjectHandler interfaces/classes: Specific implementations for handling different ll: object types within Create/Update activities (e.g., VocabularyCardObjectHandler, ObjectiveKeyResultObjectHandler). These will use the reflection pattern (@ObjectTypeHandler).  
  * OutboxService: Manages the construction and queuing of outgoing ActivityPub activities.  
  * SignatureService: Encapsulates the logic for generating and verifying HTTP Signatures, leveraging jsonld for canonicalization and Node.js's crypto module.  
  * RemoteActorResolverService: Handles caching and fetching of remote Actor profiles (using axios and jsonld).  
  * InboxProcessor, OutboxDispatcher: BullMQ workers responsible for asynchronous processing of inbound and outbound queues.  
  * ActivityRepository: Stores raw incoming and outgoing ActivityPub payloads for auditing and debugging.  
  * ProcessedActivityRepository: Stores IDs of processed activities for deduplication.  
* **Entity Breakdown**:  
  * Activity: Stores the raw JSON-LD payload of incoming and outgoing ActivityPub activities for auditing and debugging.  
  * ProcessedActivity: Stores the id of processed incoming activities to prevent reprocessing (deduplication).  
* **GoF Design Patterns**:  
  * **Strategy Pattern**:  
    * **Activity Handling**: The ActivityDispatcherService uses the Strategy pattern to delegate to different ActivityHandler implementations (e.g., FollowActivityHandler, CreateActivityHandler) based on the incoming activity's type.  
    * **Object Handling**: Within CreateActivityHandler or UpdateActivityHandler, a nested Strategy pattern can be used to dispatch to specific ObjectHandler implementations (e.g., VocabularyCardObjectHandler, ObjectiveKeyResultObjectHandler) based on the object.type.  
    * **Remote Actor Resolution**: RemoteActorResolverService could use strategies for fetching remote actor data (e.g., WebFingerStrategy, DirectProfileFetchStrategy).  
  * **Command Pattern**: Each outgoing ActivityPub activity could be encapsulated as a DispatchActivityCommand and pushed to the outbox-dispatch-queue. This decouples the activity creation from its actual sending, allowing for retries and background processing.  
  * **Observer Pattern**: The FederationModule acts as a central Observer, subscribing to various domain events (e.g., VocabularyCardCreatedEvent, ObjectiveUpdatedEvent, AssessmentSubmittedEvent) from other modules. When these events occur, the OutboxService observes them and initiates the creation and dispatch of corresponding ActivityPub activities.  
  * **Facade Pattern**: The FederationModule itself can be seen as a Facade to the complexities of the ActivityPub protocol for the rest of the application. Other modules simply publish domain events or call high-level federation services, without needing to understand HTTP Signatures, JSON-LD canonicalization, or retry logic.  
  * **Singleton Pattern**: All core services within FederationModule (e.g., ActivityDispatcherService, OutboxService, SignatureService) will be singletons.  
* **Other Architectural Patterns/Principles**:  
  * **Dependency Injection**: Extensively used by NestJS.  
  * **Event-Driven Architecture (Internal)**: Relies heavily on internal events published by other modules to trigger outgoing federation activities.  
  * **Asynchronous Messaging**: Uses bullmq (with Redis) for robust, asynchronous processing of both inbound and outbound ActivityPub messages. This is crucial for handling network latencies and ensuring responsiveness.  
  * **Reflection (NestJS DiscoveryService)**: Used for dynamically discovering and registering ActivityHandler and ObjectHandler implementations, promoting extensibility and adherence to the Open/Closed Principle.  
  * **Caching**: Uses Redis to cache remote Actor profiles to reduce redundant network requests.  
* **Inter-Module Communication**:  
  * **Subscribes to Events**: Listens for domain events from AuthModule, ActorModule, ContentModule, AssessmentModule, and ProgressModule to trigger outgoing ActivityPub activities.  
  * **Delegates Processing**: Delegates the actual persistence and domain-specific validation of incoming ActivityPub objects to ActorModule, ContentModule, AssessmentModule, and ProgressModule services.  
  * **Depends on ActorModule**: For retrieving local Actor details (keys, inbox/outbox URLs) and resolving/caching remote Actor details.  
  * **Uses NotificationModule**: To trigger real-time notifications about incoming activities (e.g., new follows, new posts).  
* **Key Technologies/Libraries**:  
  * jsonld: For all JSON-LD processing (expansion, canonicalization).  
  * http-signature-header: For HTTP Signature header parsing and construction.  
  * Node.js crypto module: For cryptographic operations (hashing, signing, verification).  
  * axios: For making all outgoing HTTP requests to other Fediverse instances.  
  * bullmq, ioredis: For asynchronous message queuing and background workers.  
  * typeorm: For persisting raw ActivityPub activities and processed activity IDs.  
  * winston, winston-loki: For comprehensive, structured logging of all federation events.  
  * @nestjs/common, @nestjs/core (DiscoveryService, MetadataScanner): For NestJS core functionalities and reflection.  
  * @nestjs/throttler: For rate limiting incoming inbox requests.

### **2.7. NotificationModule**

The NotificationModule is responsible for delivering real-time and asynchronous notifications to users based on various events occurring within the EducationPub platform, including both local actions and federated activities.

* **Purpose**: To provide a flexible and extensible system for delivering notifications to users. This includes real-time notifications (e.g., via WebSockets/SSE) for immediate alerts and potentially other channels like email or push notifications for asynchronous updates.  
* **Key Responsibilities**:  
  * Subscribing to internal domain events from other modules.  
  * Translating domain events into user-friendly notification messages.  
  * Delivering real-time notifications to connected clients.  
  * Managing notification preferences for users.  
  * Storing notification history for users.  
  * Potentially integrating with external notification services (e.g., email APIs, push notification services).  
* **Core Components**:  
  * NotificationGateway (WebSockets): Handles real-time client connections and sends notifications over WebSockets.  
  * NotificationService: Orchestrates the notification process, subscribing to events, formatting messages, and dispatching them to appropriate channels.  
  * NotificationRepository: Manages persistence of notification history.  
  * Notification Entity: Represents a stored notification.  
  * NotificationFormatterService: A utility service for transforming raw event data into human-readable notification messages.  
  * NotificationChannelStrategy implementations: Concrete strategies for sending notifications via different channels (e.g., WebSocketNotificationStrategy, EmailNotificationStrategy, PushNotificationStrategy).  
* **Entity Breakdown**:  
  * Notification: Represents a stored notification record, including its content, recipient, status, and timestamp.  
* **GoF Design Patterns**:  
  * **Observer Pattern**: This is the fundamental pattern for the NotificationModule. It acts as a central observer, subscribing to a wide array of domain events (e.g., FollowCreatedEvent, FlashcardCreatedEvent, AssessmentSubmittedEvent, ObjectiveUpdatedEvent, PeerReviewCompletedEvent, ActivityReceivedEvent from FederationModule). When an observed event occurs, the NotificationService is triggered to create and dispatch a notification.  
  * **Strategy Pattern**: The NotificationService will utilize the Strategy pattern for sending notifications. It will inject and use different NotificationChannelStrategy implementations (e.g., WebSocketNotificationStrategy, EmailNotificationStrategy) based on user preferences or the nature of the notification. This allows adding new notification channels easily.  
  * **Builder Pattern**: Could be used within NotificationFormatterService to construct complex notification messages, especially if they involve multiple data points from an event or require different formats for various channels.  
  * **Singleton Pattern**: NestJS services within NotificationModule will be singletons, managing shared resources like WebSocket connections and ensuring consistent event handling.  
* **Other Architectural Patterns/Principles**:  
  * **Dependency Injection**: Heavily used by NestJS.  
  * **Event-Driven**: The entire module is driven by events published by other modules.  
  * **Asynchronous Processing**: While real-time notifications are immediate, sending emails or push notifications might be offloaded to a background queue (via bullmq) to avoid blocking the main thread.  
* **Inter-Module Communication**:  
  * **Subscribes to Events**: Listens for events from AuthModule (UserRegisteredEvent), ActorModule (FollowCreatedEvent, ActorUpdatedEvent), ContentModule (VocabularyCardCreatedEvent, LessonPlanUpdatedEvent), AssessmentModule (AssessmentSubmittedEvent, WritingSubmissionCreatedEvent, PeerReviewCompletedEvent), ProgressModule (ObjectiveUpdatedEvent, KeyResultProgressedEvent), and FederationModule (ActivityReceivedEvent for general incoming activities).  
  * **Depends on ActorModule**: To retrieve user-specific information for notification targeting (e.g., user's preferred language, notification preferences).  
* **Key Technologies/Libraries**:  
  * winston: For logging notification delivery status and errors.  
  * bullmq, ioredis: If asynchronous email/push notification jobs are queued.  
  * typeorm: For persisting notification history.  
  * @nestjs/platform-socket.io or @nestjs/platform-ws: For WebSocket integration.  
  * socket.io: The underlying WebSocket library.  
  * class-validator, class-transformer: For validating notification preferences or DTOs.  
  * axios: If integrating with external email or push notification APIs.

## **3. Inner-Module Communication & Events**

Inter-module communication within the modular monolith primarily occurs through **direct service calls** (for synchronous dependencies) and **internal domain events** (for asynchronous, decoupled interactions). The event-driven approach is crucial for maintaining modularity and enabling efficient background processing.  
Here's a breakdown of key events and their publishers/subscribers:

### **3.1. AuthModule Events**

* **Published Events**:  
  * UserRegisteredEvent: Emitted when a new user successfully registers on the platform.  
  * PasswordChangedEvent: Emitted when a user's password is successfully updated.  
* **Subscribed Events**: None directly within the module, but other modules subscribe to its events.

### **3.2. ActorModule Events**

* **Published Events**:  
  * ActorCreatedEvent: Emitted when a new local or remote ActivityPub Actor is successfully created/persisted.  
  * ActorUpdatedEvent: Emitted when an Actor's profile information (local or cached remote) is updated.  
  * FollowCreatedEvent: Emitted when a new follow relationship is established (local user follows another, or another user follows a local Actor).  
  * FollowRemovedEvent: Emitted when a follow relationship is terminated.  
* **Subscribed Events**:  
  * UserRegisteredEvent (from AuthModule): Triggers the creation of an as:Person Actor for the new local user.  
  * ActivityReceivedEvent (from FederationModule): Specifically for Follow, Accept, Reject activities, which ActorModule processes.

### **3.3. ContentModule Events**

* **Published Events**:  
  * VocabularyCardCreatedEvent: Emitted when a new VocabularyCard is successfully created.  
  * VocabularyCardUpdatedEvent: Emitted when a VocabularyCard is updated.  
  * LessonPlanCreatedEvent: Emitted when a new LessonPlan is created.  
  * LessonPlanUpdatedEvent: Emitted when a LessonPlan is updated.  
  * CardTypeDefinitionCreatedEvent: Emitted when a new CardTypeDefinition is created.  
  * CardTypeDefinitionUpdatedEvent: Emitted when a CardTypeDefinition is updated.  
  * (Similar events for other content types like Story, GrammarRule, VideoLesson, WritingPrompt when they are created/updated/deleted).  
* **Subscribed Events**:  
  * ActivityReceivedEvent (from FederationModule): Specifically for Create or Update activities where the object is a content type (e.g., VocabularyCard, GrammarRule).

### **3.4. AssessmentModule Events**

* **Published Events**:  
  * AssignmentCreatedEvent: Emitted when a new Assignment is created.  
  * AssessmentSubmittedEvent: Emitted when a learner successfully submits an AssessmentResponse or PronunciationRecording.  
  * WritingSubmissionCreatedEvent: Emitted when a learner successfully submits a WritingSubmission.  
  * PeerReviewCompletedEvent: Emitted when a PeerReview is finalized.  
  * ExerciseCompletedEvent: Emitted when an Exercise is completed (e.g., all questions answered).  
* **Subscribed Events**:  
  * ActivityReceivedEvent (from FederationModule): Specifically for Submit or Review activities, and Create/Update activities where the object is an assessment type (e.g., Assignment, Exercise).  
  * (Potentially from ContentModule): To link assessments to specific content items.

### **3.5. ProgressModule Events**

* **Published Events**:  
  * ObjectiveCreatedEvent: Emitted when a new ObjectiveKeyResult is created.  
  * ObjectiveUpdatedEvent: Emitted when an ObjectiveKeyResult (or its KeyResults) is updated, especially when ll:currentValue changes.  
  * KeyResultProgressedEvent: A more granular event indicating progress on a specific KeyResult.  
* **Subscribed Events**:  
  * AssessmentSubmittedEvent (from AssessmentModule): To update relevant Key Results based on assessment completion.  
  * VocabularyCardMasteredEvent (hypothetical, from a LearningEngineModule): To update Key Results related to vocabulary mastery.  
  * ActivityReceivedEvent (from FederationModule): Specifically for Create or Update activities where the object is an ObjectiveKeyResult.

### **3.6. FederationModule Events**

* **Published Events**:  
  * ActivityReceivedEvent: A general event emitted when any valid, deduplicated ActivityPub activity is successfully received and parsed from the inbox. This event carries the raw ActivityPub payload and is a key entry point for other modules to react to federated data.  
  * ActivityDispatchedEvent: Emitted after an ActivityPub activity has been successfully sent to remote inboxes.  
* **Subscribed Events**:  
  * UserRegisteredEvent (from AuthModule): Triggers Create activity for the new as:Person Actor.  
  * ActorCreatedEvent, ActorUpdatedEvent, FollowCreatedEvent, FollowRemovedEvent (from ActorModule): Triggers corresponding ActivityPub Create, Update, Follow, Undo activities.  
  * VocabularyCardCreatedEvent, VocabularyCardUpdatedEvent, LessonPlanCreatedEvent, LessonPlanUpdatedEvent, CardTypeDefinitionCreatedEvent, CardTypeDefinitionUpdatedEvent (from ContentModule): Triggers ActivityPub Create, Update, Announce activities for content.  
  * AssignmentCreatedEvent, AssessmentSubmittedEvent, WritingSubmissionCreatedEvent, PeerReviewCompletedEvent, ExerciseCompletedEvent (from AssessmentModule): Triggers ActivityPub Create, Submit, Review activities.  
  * ObjectiveCreatedEvent, ObjectiveUpdatedEvent, KeyResultProgressedEvent (from ProgressModule): Triggers ActivityPub Create, Update activities for OKRs.

### **3.7. NotificationModule Events**

* **Published Events**: None (it's primarily a consumer of events).  
* **Subscribed Events**:  
  * UserRegisteredEvent (from AuthModule): Send welcome notification.  
  * FollowCreatedEvent (from ActorModule): Notify user of new follower.  
  * ActivityReceivedEvent (from FederationModule): General notification for incoming posts, likes, announces, etc.  
  * AssessmentSubmittedEvent (from AssessmentModule): Notify educators of new submissions.  
  * PeerReviewCompletedEvent (from AssessmentModule): Notify submitter of completed review.  
  * ObjectiveUpdatedEvent, KeyResultProgressedEvent (from ProgressModule): Notify users/educators of progress updates.  
  * (Any other module's event that warrants a user notification).

## **4. Conclusion**

This document has provided a detailed architectural and design pattern breakdown for each core module of the EducationPub platform. By adhering to these principles and leveraging the identified GoF patterns, the Node.js/NestJS and PostgreSQL-based modular monolith can be developed as a robust, maintainable, and extensible system. The strategic use of patterns like Strategy, Observer, Repository, and Facade, combined with NestJS's inherent dependency injection and modularity, will facilitate clear separation of concerns, ease of testing, and adaptability to future requirements, including potential migration to a microservices architecture if needed. The emphasis on asynchronous processing via Redis/BullMQ and comprehensive logging with Winston/Loki will ensure the platform's reliability and observability in a federated environment.