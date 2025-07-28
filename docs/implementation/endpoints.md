---
title: Endpoints
---

# ActivityPub Endpoints for EducationPub

This document details the essential ActivityPub endpoints required to implement an education platform within the fediverse. The core principle is to use standard ActivityPub endpoints and extend their functionality by handling custom edu: vocabulary types and activities, specifically focusing on edu:Flashcard and edu:FlashcardModel.

## **1\. Introduction to Federated Endpoints**

The ActivityPub protocol defines a set of standard endpoints for decentralized communication. We will primarily utilize these existing endpoints, with the application's Activity Handlers being responsible for parsing and acting upon the specific edu: vocabulary types within the standard ActivityPub messages.  
The main interaction points for federated communication will be:

* **Actor Endpoints:** For discovering and interacting with individual persons, groups, or applications represented as ActivityPub actors, typically using their preferredUsername.  
* **Inbox Endpoints:** For receiving activities from other federated servers.  
* **Outbox Endpoints:** For publishing activities to other federated servers and allowing them to discover published content.  
* **Object Dereferencing Endpoints:** For directly retrieving the JSON-LD representation of any federated object, including our custom edu: types.

## **2\. Core ActivityPub Endpoints (Federated Interaction)**

These endpoints are fundamental to any ActivityPub instance.

### **2.1. Actor Profile Endpoint**

* **Path:** /actors/&lbrace;preferredUsername&rcub;  
* **Method:** GET  
* **Purpose:** This endpoint serves the public profile of a local actor (e.g., a person, a group, or an application). It uses the actor's preferredUsername for human-readable and federated identification. When a remote server or client requests this URL, it should return the actor's JSON-LD representation, which includes their inbox, outbox, followers, following, and liked collection URLs. This is crucial for other instances to discover and interact with our platform's actors.  
* **Relevance:** Enables basic actor discovery and federated interaction with our educational platform's actors.

### **2.2. Inbox Endpoint**

* **Path:** /inbox (for shared inbox) or /actors/&lbrace;preferredUsername&rcub;/inbox  
* **Method:** POST  
* **Purpose:** This is the primary endpoint for receiving *all* incoming federated activities from other ActivityPub servers, often directed to a specific actor's inbox or a shared inbox.  
  * The Http Signature Guard will verify the request.  
  * The Data Integrity Guard will validate the incoming Activity/Payload body schema.  
  * The InboxService and ActivityHandlerRegistry will dispatch the activity to the appropriate ActivityHandler (e.g., CreateActivityHandler, LikeActivityHandler, FollowActivityHandler).  
* **Relevance:**  
  * Receiving Create activities for new edu:Flashcard and edu:FlashcardModel objects published by remote actors.  
  * Standard ActivityPub activities like Follow, Like, Announce, Update, Delete relevant to any content.

### **2.3. Outbox Endpoint**

* **Path:** /actors/&lbrace;preferredUsername&rcub;/outbox  
* **Methods:** GET, POST  
* **Purpose:**  
  * **GET:** Serves the public collection of activities published by the local actor (e.g., all posts, shares, likes, creates). Remote servers will dereference this URL to fetch activities published by our actors.  
  * **POST:** This is the endpoint used by local clients (our frontend UI) to publish new activities on behalf of the authenticated local actor. The system then federates these activities to relevant remote inboxes (followers, mentions, etc.) via asynchronous BullMQ jobs.  
* **Relevance (for POST by local client):**  
  * Publishing Create activities for new edu:FlashcardModel and edu:Flashcard objects created by local educators or other actors.  
  * Publishing standard Like, Announce, Follow activities from local actors.

### **2.4. Followers Collection Endpoint**

* **Path:** /actors/&lbrace;preferredUsername&rcub;/followers  
* **Method:** GET  
* **Purpose:** This endpoint serves an OrderedCollection of all actors that follow the specified local actor. When a remote server or client requests this URL, it should return the collection's JSON-LD representation, including links to the actors in the collection.  
* **Relevance:** Essential for federated social graph management, allowing other instances to discover who follows a local actor.

### **2.5. Following Collection Endpoint**

* **Path:** /actors/&lbrace;preferredUsername&rcub;/following  
* **Method:** GET  
* **Purpose:** This endpoint serves an OrderedCollection of all actors that the specified local actor is following. When a remote server or client requests this URL, it should return the collection's JSON-LD representation.  
* **Relevance:** Essential for federated social graph management, allowing other instances to discover who a local actor is following.

### **2.6. Liked Collection Endpoint**

* **Path:** /actors/&lbrace;preferredUsername&rcub;/liked  
* **Method:** GET  
* **Purpose:** This endpoint serves an OrderedCollection of all objects that the specified local actor has "liked" or otherwise expressed a positive preference for.  
* **Relevance:** Allows other instances to discover content a local actor has engaged with positively.

### **2.7. Created Flashcards Collection Endpoint**

* **Path:** /actors/&lbrace;preferredUsername&rcub;/flashcards  
* **Method:** GET  
* **Purpose:** This endpoint serves an OrderedCollection of edu:Flashcard objects that the specified local actor has created and published. This allows other federated instances or clients to discover the flashcard content produced by a specific educator or actor on our platform.  
* **Relevance:** Directly supports the primary educational content type, allowing for discoverability of flashcards.

### **2.8. Object Dereferencing Endpoints (Content Object Serving)**

* **Path:** Canonical URI for each object (e.g., /objects/&lbrace;id&rcub;, /flashcards/&lbrace;id&rcub;). It is common for the id field of an ActivityPub object to also be its dereferencing URL.  
* **Method:** GET  
* **Purpose:** When a remote server needs to resolve the full JSON-LD representation of an object (e.g., a Flashcard, or an Actor Profile) referenced in an activity, it will send an HTTP GET request to its id URI. This endpoint must return the complete JSON-LD structure of the requested object.  
* **Relevance:**  
  * Serving edu:FlashcardModel objects.  
  * Serving edu:Flashcard objects.  
  * Serving other standard Note, Article, Image, etc., objects (if relevant in the context of flashcards, e.g., images embedded in flashcards).

## **2.9. Core Authentication Endpoints (Local User Management)**

These endpoints are *internal* to your platform and are essential for local user authentication and account management. They are not part of the ActivityPub federation protocol but are critical for enabling local users to interact with your platform and their associated actors. These endpoints will typically be secured by local authentication mechanisms (e.g., JWT, session cookies) and handle user credential validation.

### **2.9.1. User Registration Endpoint**

* **Path:** /auth/register  
* **Method:** POST  
* **Purpose:** Allows new users to create an account on your local platform. This typically involves providing a username, email, and password. Upon successful registration, a new User record is created in your database, and an associated Actor record is often automatically provisioned for federated interactions.

### **2.9.2. User Login Endpoint**

* **Path:** /auth/login  
* **Method:** POST  
* **Purpose:** Allows existing users to sign in to their local account. Upon successful authentication, the server typically issues an authentication token (e.g., JWT) that the client can use for subsequent authenticated requests to internal API endpoints.

### **2.9.3. User Profile Management Endpoint**

* **Path:** /users/me (for the authenticated user's own profile) or /users/&lbrace;id&rcub; (for managing a specific user's profile, typically by an administrator)  
* **Method:** GET, PUT, DELETE  
* **Purpose:** Allows an authenticated user to view, update, or delete their own profile information (e.g., password, email, display name). The /users/&lbrace;id&rcub; path allows for administrative actions on a specific user's account by their unique ID. Note that changes to the user's *actor* profile (like preferredUsername, summary) would typically be handled through updates to the associated Actor object and then federated.

## **3\. EducationPub Specific Integrations (Within Existing Endpoints)**

EducationPub integration will focus solely on edu:Flashcard and edu:FlashcardModel object types. The ActivityHandler and Application Services will specifically handle the persistence and federation of these types.

### **3.1. Handling edu: Object Types**

When a Create activity arrives via the /inbox (from remote) or is posted to /actors/&lbrace;preferredUsername&rcub;/outbox (from local client), the object field of that activity might be one of the following edu: types:

* edu:FlashcardModel  
* edu:Flashcard

The Data Integrity Guard and subsequent ActivityHandler for Create activities (e.g., an EducationContentHandler) will be responsible for validating the specific edu: schema for flashcards and persisting the data into the ContentObject table with the correct type (e.g., 'edu:Flashcard') and the full JSON-LD data stored in the jsonLD data column.

### **3.2. Handling edu: Extended Activities**

We are not introducing new Activity types like Submit or Review for EducationPub specific interactions. Standard ActivityPub activities (e.g., Create, Update, Delete, Like, Announce) will be used to manage edu:Flashcard and edu:FlashcardModel objects.

## **4\. Summary of Endpoint Usage**

The focus is on enabling:

* **Creation and Distribution of Flashcards:** Local actors can create edu:FlashcardModel and edu:Flashcard objects via their /outbox, which are then federated. Remote instances can send Create activities for these objects to our /inbox.  
* **Content Dereferencing:** All edu:FlashcardModel and edu:Flashcard objects created or received must be dereferencable via their canonical URIs.  
* **Standard Social Interactions:** Follow, Like, Announce, Update, Delete activities will function as per standard ActivityPub.  
* **Local User Authentication:** Users can register, log in, and manage their personal account settings.