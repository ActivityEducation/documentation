---
title: Phase 3
sidebar_position: 3
---

# **EducationPub MVP Completion Plan: Phase 3 - Implement Missing Core Endpoints and Dereferencing**

## **Objective:**

With foundational corrections and repository provisions in place from previous phases, this phase focuses on implementing the primary missing endpoints and ensuring all relevant content types are dereferencable as per the MVP scope.

## **Prerequisites:**

* Completion of **Phase 1: Foundational Corrections and Data Model Refinement**.  
* Completion of **Phase 2: Core Module Repository Setup**.

## **Tasks:**

### **Task 3.1: Implementing "Created Flashcards Collection Endpoint"**

* **Problem:** The endpoints.md document specifies a /actors/&lbrace;preferredUsername&rcub;/flashcards endpoint for listing an actor's created flashcards, which is currently not implemented. This endpoint is crucial for content discoverability within the Fediverse.  
* **Location:**  
  * src/features/activitypub/controllers/activitypub.controller.ts  
  * src/core/services/app.service.ts  
  * src/features/activitypub/services/actor.service.ts (Optional Enhancement)  
* **Action:**  
  1. **Add Endpoint to ActivityPubController:**  
     * Open src/features/activitypub/controllers/activitypub.controller.ts.  
     * Add the following GET endpoint method. Ensure necessary imports (@Get, @Header, @UseGuards, @ApiOperation, @ApiParam, 
     @ApiQuery, @ApiResponse, DefaultValuePipe, ParseIntPipe, RateLimitGuard, LoggerService, AppService) are present.  
     ```typescript
       import { Controller, Get, Post, Param, Body, UseGuards, Header, Query, DefaultValuePipe, ParseIntPipe, NotFoundException } from '@nestjs/common';  
       import { ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';  
       import { AppService } from '../../core/services/app.service';  
       import { LoggerService } from '../../shared/services/logger.service';  
       import { HttpSignatureVerificationGuard } from '../../core/guards/http-signature-verification.guard'; // Will be moved to CoreModule in Phase 4  
       import { RateLimitGuard } from '../../core/guards/rate-limit.guard'; // Will be moved to CoreModule in Phase 4  
       import { Activity } from '../../shared/decorators/activity.decorator';  
       import { CreateActivityDto, FollowActivityDto, AnnounceActivityDto, LikeActivityDto, UndoActivityDto, UpdateActivityDto, DeleteActivityDto, BlockActivityDto, RejectActivityDto, MoveActivityDto, FlagActivityDto, AcceptActivityDto } from '../dto/activity.dto'; // Assuming a consolidated DTO for activities

       @ApiTags('ActivityPub')  
       @Controller('api')  
       export class ActivityPubController {  
         constructor(  
           private readonly appService: AppService,  
           private readonly logger: LoggerService,  
         ) {  
           this.logger.setContext(ActivityPubController.name);  
         }

         // ... (existing methods like .well-known, actors/:username) ...

         @Get('actors/:username/inbox')  
         @ApiOperation({ summary: 'Retrieve an actor\'s inbox (local view, not federated)' })  
         @ApiResponse({ status: 200, description: 'Successfully retrieved inbox.' })  
         @ApiResponse({ status: 404, description: 'Actor not found.' })  
         async getInbox(  
           @Param('username') username: string,  
           @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,  
           @Query('perPage', new DefaultValuePipe(10), ParseIntPipe) perPage: number,  
         ) {  
           this.logger.log(`Fetching inbox for '$&lbrace;username&rcub;'. Page: ${page}, PerPage: ${perPage}.`);  
           return this.appService.getInboxCollection(username, page, perPage);  
         }

         @Get('actors/:username/outbox')  
         @ApiOperation({ summary: 'Retrieve an actor\'s outbox' })  
         @ApiResponse({ status: 200, description: 'Successfully retrieved outbox.' })  
         @ApiResponse({ status: 404, description: 'Actor not found.' })  
         async getOutbox(  
           @Param('username') username: string,  
           @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,  
           @Query('perPage', new DefaultValuePipe(10), ParseIntPipe) perPage: number,  
         ) {  
           this.logger.log(`Fetching outbox for '$&lbrace;username&rcub;'. Page: ${page}, PerPage: ${perPage}.`);  
           return this.appService.getOutboxCollection(username, page, perPage);  
         }

         @Get('actors/:username/followers')  
         @ApiOperation({ summary: 'Retrieve an actor\'s followers collection' })  
         @ApiResponse({ status: 200, description: 'Successfully retrieved followers.' })  
         @ApiResponse({ status: 404, description: 'Actor not found.' })  
         async getFollowersCollection(  
           @Param('username') username: string,  
           @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,  
           @Query('perPage', new DefaultValuePipe(10), ParseIntPipe) perPage: number,  
         ) {  
           this.logger.log(`Fetching followers for '$&lbrace;username&rcub;'. Page: ${page}, PerPage: ${perPage}.`);  
           return this.appService.getFollowersCollection(username, page, perPage);  
         }

         @Get('actors/:username/following')  
         @ApiOperation({ summary: 'Retrieve an actor\'s following collection' })  
         @ApiResponse({ status: 200, description: 'Successfully retrieved following.' })  
         @ApiResponse({ status: 404, description: 'Actor not found.' })  
         async getFollowingCollection(  
           @Param('username') username: string,  
           @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,  
           @Query('perPage', new DefaultValuePipe(10), ParseIntPipe) perPage: number,  
         ) {  
           this.logger.log(`Fetching following for '$&lbrace;username&rcub;'. Page: ${page}, PerPage: ${perPage}.`);  
           return this.appService.getFollowingCollection(username, page, perPage);  
         }

         @Get('actors/:username/liked')  
         @ApiOperation({ summary: 'Retrieve an actor\'s liked collection' })  
         @ApiResponse({ status: 200, description: 'Successfully retrieved liked collection.' })  
         @ApiResponse({ status: 404, description: 'Actor not found.' })  
         async getLikedCollection(  
           @Param('username') username: string,  
           @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,  
           @Query('perPage', new DefaultValuePipe(10), ParseIntPipe) perPage: number,  
         ) {  
           this.logger.log(`Fetching liked collection for '$&lbrace;username&rcub;'. Page: ${page}, PerPage: ${perPage}.`);  
           return this.appService.getLikedCollection(username, page, perPage);  
         }

         // NEW: Created Flashcards Collection endpoint  
         @Get('actors/:username/flashcards')  
         @Header('Content-Type', 'application/activity+json')  
         @UseGuards(RateLimitGuard) // Apply rate limiting  
         @ApiOperation({ summary: 'Retrieve a paginated collection of flashcards created by an actor' })  
         @ApiParam({ name: 'username', description: 'The preferred username of the actor.' })  
         @ApiQuery({ name: 'page', description: 'Page number', required: false, example: 1 })  
         @ApiQuery({ name: 'perPage', description: 'Items per page', required: false, example: 10 })  
         @ApiResponse({ status: 200, description: 'Successfully retrieved the actor\'s flashcard collection.' })  
         @ApiResponse({ status: 404, description: 'Actor not found.' })  
         async createdFlashcardsCollection(  
             @Param('username') username: string,  
             @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,  
             @Query('perPage', new DefaultValuePipe(10), ParseIntPipe) perPage: number,  
         ) {  
             this.logger.log(`Fetching created flashcards for '$&lbrace;username&rcub;'. Page: ${page}, PerPage: ${perPage}.`);  
             return this.appService.getCreatedFlashcardsCollection(username, page, perPage);  
         }

         // ... (existing inbox POST endpoint) ...  
       }
       ```

  2. **Add Method to AppService:**  
     * Open src/core/services/app.service.ts.  
     * Ensure FlashcardEntity and Repository are imported.  
     * Inject FlashcardRepository into AppService's constructor. This should already be possible due to Phase 2.1.  
     ```typescript
       import { Injectable, NotFoundException, Inject } from '@nestjs/common';  
       import { ConfigService } from '@nestjs/config';  
       import { InjectRepository } from '@nestjs/typeorm';  
       import { Repository, IsNull, In } from 'typeorm';  
       import { LoggerService } from '../../shared/services/logger.service';  
       import { normalizeUrl } from '../../shared/utils/url-normalizer';  
       import { ActorEntity } from '../../features/activitypub/entities/actor.entity';  
       import { ActivityEntity } from '../../features/activitypub/entities/activity.entity';  
       import { ContentObjectEntity } from '../../features/activitypub/entities/content-object.entity';  
       import { FlashcardEntity } from '../../features/educationpub/entities/flashcard.entity'; // NEW: Import FlashcardEntity  
       import { FlashcardModelEntity } from '../../features/educationpub/entities/flashcard-model.entity'; // NEW: Import FlashcardModelEntity  
       import { FollowEntity } from '../../features/activitypub/entities/follow.entity'; // Assuming FollowEntity is used for collections  
       import { LikeEntity } from '../../features/activitypub/entities/like.entity'; // Assuming LikeEntity is used for collections  
       import { REDIS_CLIENT, RedisClient } from '../redis.module'; // Assuming RedisClient is used

       @Injectable()  
       export class AppService {  
         private readonly instanceBaseUrl: string;

         constructor(  
           private readonly configService: ConfigService,  
           private readonly logger: LoggerService,  
           @InjectRepository(ActorEntity)  
           private readonly actorRepository: Repository<ActorEntity\>,  
           @InjectRepository(ActivityEntity)  
           private readonly activityRepository: Repository<ActivityEntity\>,  
           @InjectRepository(ContentObjectEntity)  
           private readonly contentObjectRepository: Repository<ContentObjectEntity\>,  
           @InjectRepository(FollowEntity)  
           private readonly followRepository: Repository<FollowEntity\>, // Assuming this is needed for collections  
           @InjectRepository(LikeEntity)  
           private readonly likeRepository: Repository<LikeEntity\>, // Assuming this is needed for collections  
           @InjectRepository(FlashcardEntity) // NEW: Inject FlashcardRepository  
           private readonly flashcardRepository: Repository<FlashcardEntity\>,  
           @InjectRepository(FlashcardModelEntity) // NEW: Inject FlashcardModelRepository  
           private readonly flashcardModelRepository: Repository<FlashcardModelEntity\>,  
           @Inject(REDIS_CLIENT) private readonly redisClient: RedisClient,  
         ) {  
           this.logger.setContext(AppService.name);  
           this.instanceBaseUrl = this.configService.get<string\>('INSTANCE_BASE_URL');  
         }

         // ... (existing methods) ...

         /**  
          * Retrieves a paginated collection of public flashcards created by a given actor.  
          * @param username The preferred username of the actor.  
          * @param page The page number for pagination.  
          * @param perPage The number of items per page.  
          * @returns An ActivityPub OrderedCollection page.  
          */  
         async getCreatedFlashcardsCollection(username: string, page: number, perPage: number): Promise<any> {  
             this.logger.debug(`Fetching created flashcards for actor: $&lbrace;username&rcub;, page: ${page}, perPage: ${perPage}`);  
             const actor = await this.actorRepository.findOne({ where: { preferredUsername: username } });  
             if (!actor) {  
                 throw new NotFoundException(`Actor with username '$&lbrace;username&rcub;' not found.`);  
             }

             const [flashcards, totalItems] = await this.flashcardRepository.findAndCount({  
                 where: {  
                     attributedToActivityPubId: actor.activityPubId,  
                     isPublic: true, // Only include public flashcards  
                     deletedAt: IsNull(), // Ensure not soft-deleted  
                 },  
                 skip: (page - 1) * perPage,  
                 take: perPage,  
                 order: { createdAt: 'DESC' },  
             });

             // The ActivityPub collection should contain the IDs of the objects  
             const items = flashcards.map(fc => fc.activityPubId);

             // Construct the collection URL for this endpoint  
             const collectionId = `${actor.activityPubId}/flashcards`; // Canonical URL for this specific collection  
             const currentPageId = `${collectionId}?page=${page}&perPage=${perPage}`;  
             const firstPageId = `${collectionId}?page=1&perPage=${perPage}`;  
             const totalPages = Math.ceil(totalItems / perPage);  
             const lastPageId = `${collectionId}?page=${totalPages}&perPage=${perPage}`;  
             const prevPageId = page > 1 ? `${collectionId}?page=${page - 1}&perPage=${perPage}` : undefined;  
             const nextPageId = page < totalPages ? `${collectionId}?page=${page + 1}&perPage=${perPage}` : undefined;

             return {  
                 '@context': 'https://www.w3.org/ns/activitystreams',  
                 id: collectionId,  
                 type: 'OrderedCollectionPage',  
                 totalItems: totalItems,  
                 partOf: collectionId, // Reference back to the full collection  
                 first: firstPageId,  
                 last: lastPageId,  
                 prev: prevPageId,  
                 next: nextPageId,  
                 current: currentPageId,  
                 orderedItems: items,  
             };  
         }  
       }
       ```

* **Expected Outcome:**  
  * The /api/actors/&lbrace;username&rcub;/flashcards endpoint will be live and accessible.  
  * A GET request to this endpoint with a valid local username will return a paginated ActivityPub OrderedCollectionPage containing the activityPubIds of public flashcards created by that actor.

### **Task 3.2: Enabling Dereferencing for edu:FlashcardModel Objects**

* **Problem:** While edu:Flashcard objects are intended to be dereferencable via /api/objects/&lbrace;id&rcub;, the plan did not explicitly detail the dereferencing for edu:FlashcardModel objects, which are also a core content type for the MVP.  
* **Location:** src/core/services/app.service.ts  
* **Action:**  
  1. Open src/core/services/app.service.ts.  
  2. Ensure FlashcardModelRepository is injected into AppService's constructor. This should already be possible due to Phase 2.1.  
  3. Modify the getLocalContentObject method to first attempt to find the requested objectId as a FlashcardModelEntity. If found, it will map the entity to its ActivityPub JSON-LD representation. If not found as a FlashcardModel, it will proceed to check for FlashcardEntity and then generic ContentObjectEntity.  
  ```typescript
     import { Injectable, NotFoundException, Inject } from '@nestjs/common';  
     import { ConfigService } from '@nestjs/config';  
     import { InjectRepository } from '@nestjs/typeorm';  
     import { Repository, IsNull, In } from 'typeorm';  
     import { LoggerService } from '../../shared/services/logger.service';  
     import { normalizeUrl } from '../../shared/utils/url-normalizer';  
     import { ActorEntity } from '../../features/activitypub/entities/actor.entity';  
     import { ActivityEntity } from '../../features/activitypub/entities/activity.entity';  
     import { ContentObjectEntity } from '../../features/activitypub/entities/content-object.entity';  
     import { FlashcardEntity } from '../../features/educationpub/entities/flashcard.entity';  
     import { FlashcardModelEntity } from '../../features/educationpub/entities/flashcard-model.entity'; // Ensure this is imported  
     import { FollowEntity } from '../../features/activitypub/entities/follow.entity';  
     import { LikeEntity } from '../../features/activitypub/entities/like.entity';  
     import { REDIS_CLIENT, RedisClient } from '../redis.module';

     @Injectable()  
     export class AppService {  
       private readonly instanceBaseUrl: string;

       constructor(  
         private readonly configService: ConfigService,  
         private readonly logger: LoggerService,  
         @InjectRepository(ActorEntity)  
         private readonly actorRepository: Repository<ActorEntity\>,  
         @InjectRepository(ActivityEntity)  
         private readonly activityRepository: Repository<ActivityEntity\>,  
         @InjectRepository(ContentObjectEntity)  
         private readonly contentObjectRepository: Repository<ContentObjectEntity\>,  
         @InjectRepository(FollowEntity)  
         private readonly followRepository: Repository<FollowEntity\>,  
         @InjectRepository(LikeEntity)  
         private readonly likeRepository: Repository<LikeEntity\>,  
         @InjectRepository(FlashcardEntity)  
         private readonly flashcardRepository: Repository<FlashcardEntity\>,  
         @InjectRepository(FlashcardModelEntity) // Ensure this is injected  
         private readonly flashcardModelRepository: Repository<FlashcardModelEntity\>,  
         @Inject(REDIS_CLIENT) private readonly redisClient: RedisClient,  
       ) {  
         this.logger.setContext(AppService.name);  
         this.instanceBaseUrl = this.configService.get<string\>('INSTANCE_BASE_URL');  
       }

       // ... (existing methods like getActorProfile, getPublicTimeline, getInboxCollection, etc.) ...

       /**  
        * Retrieves the local JSON-LD representation of a content object by its ActivityPub ID.  
        * This method attempts to find the object in specific entity repositories (Flashcard, FlashcardModel)  
        * before falling back to a generic ContentObjectEntity.  
        * @param objectId The ActivityPub ID (IRI) of the object to retrieve.  
        * @returns The JSON-LD representation of the object.  
        * @throws NotFoundException if the object is not found locally.  
        */  
       async getLocalContentObject(objectId: string): Promise<any> { // Updated return type to `any` for flexibility  
           this.logger.debug(`Fetching local content object from DB for ID: ${objectId}`);

           // First, try to find it as a FlashcardEntity  
           const flashcard = await this.flashcardRepository.findOne({  
               where: { activityPubId: normalizeUrl(objectId), deletedAt: IsNull() },  
               relations: ['eduModel', 'creator'], // Ensure relations are loaded if needed for mapping  
           });

           if (flashcard) {  
               // Map FlashcardEntity to its ActivityPub JSON-LD representation  
               // This mapping should be consistent with the EducationPub Vocabulary Specification  
               return {  
                   '@context': [  
                       'https://www.w3.org/ns/activitystreams',  
                       'https://social.bleauweb.org/ns/education-pub', // Our custom context  
                   ],  
                   id: flashcard.activityPubId,  
                   type: ['edu:Flashcard', 'Document'], // Consistent with edu:Flashcard definition  
                   name: flashcard.name,  
                   summary: flashcard.summary,  
                   url: flashcard.activityPubId, // Canonical URL is its ID  
                   attributedTo: flashcard.attributedToActivityPubId,  
                   'edu:model': flashcard.eduModelActivityPubId, // Link to FlashcardModel  
                   'edu:fieldsData': flashcard.eduFieldsData,  
                   'edu:tags': flashcard.eduTags,  
                   published: flashcard.createdAt.toISOString(),  
                   updated: flashcard.updatedAt.toISOString(),  
                   // Include raw data for internal debugging/completeness, but not strictly part of AP spec  
                   // data: flashcard,  
               };  
           }

           // Second, try to find it as a FlashcardModelEntity  
           const flashcardModel = await this.flashcardModelRepository.findOne({  
               where: { activityPubId: normalizeUrl(objectId) },  
           });

           if (flashcardModel) {  
               // Map FlashcardModelEntity to its ActivityPub JSON-LD representation  
               // This mapping should be consistent with the EducationPub Vocabulary Specification  
               return {  
                   '@context': [  
                       'https://www.w3.org/ns/activitystreams',  
                       'https://social.bleauweb.org/ns/education-pub', // Our custom context  
                   ],  
                   id: flashcardModel.activityPubId,  
                   type: ['edu:FlashcardModel', 'Object'], // FlashcardModel is also a generic Object  
                   name: flashcardModel.name,  
                   summary: flashcardModel.summary,  
                   url: flashcardModel.activityPubId, // Canonical URL is its ID  
                   'edu:fields': flashcardModel.eduFields,  
                   'edu:cardTemplates': flashcardModel.eduCardTemplates,  
                   'edu:stylingCSS': flashcardModel.eduStylingCSS,  
                   published: flashcardModel.createdAt.toISOString(),  
                   updated: flashcardModel.updatedAt.toISOString(),  
                   // data: flashcardModel,  
               };  
           }

           // If not a Flashcard or FlashcardModel, try to find it as a generic ContentObjectEntity  
           const contentObject = await this.contentObjectRepository.findOne({  
               where: { activityPubId: normalizeUrl(objectId) },  
           });

           if (contentObject) {  
               // For generic ContentObject, return its stored data  
               return contentObject.data; // Assuming `data` column already holds the full JSON-LD  
           }

           this.logger.warn(`Local content object '${objectId}' not found in local DB.`);  
           throw new NotFoundException(`Local content object with ID '${objectId}' not found.`);  
       }  
     }
     ```

* **Expected Outcome:**  
  * A GET request to /api/objects/&lbrace;flashcardModelId&rcub; will return the correct JSON-LD representation of the edu:FlashcardModel object.  
  * Both edu:Flashcard and edu:FlashcardModel objects will be fully dereferencable via their canonical URIs.

### **Task 3.3: Refining AppService.getPublicTimeline for MVP Scope**

* **Problem:** The getPublicTimeline method in AppService requires refinement to strictly adhere to the MVP's focus on edu:Flashcard content and specific public activities (Announce, Like), avoiding the inclusion of generic ContentObjectEntity types not explicitly part of the MVP's creation/federation scope for the timeline.  
* **Location:** src/core/services/app.service.ts  
* **Action:**  
  1. Open src/core/services/app.service.ts.  
  2. Ensure ContentObjectRepository and ActivityRepository are injected into AppService's constructor. This should already be possible due to Phase 2.1.  
  3. Modify the getPublicTimeline method to focus on fetching public FlashcardEntity objects and public Announce/Like ActivityEntity types. Explicitly exclude generic ContentObjectEntity types (like 'Note', 'Article', 'Image', 'Video') from direct inclusion in the timeline unless they are the *object* of an Announce or Like activity (which would be handled by the ActivityEntity query).  
  ```typescript
     import { Injectable, NotFoundException, Inject } from '@nestjs/common';  
     import { ConfigService } from '@nestjs/config';  
     import { InjectRepository } from '@nestjs/typeorm';  
     import { Repository, IsNull, In } from 'typeorm';  
     import { LoggerService } from '../../shared/services/logger.service';  
     import { normalizeUrl } from '../../shared/utils/url-normalizer';  
     import { ActorEntity } from '../../features/activitypub/entities/actor.entity';  
     import { ActivityEntity } from '../../features/activitypub/entities/activity.entity';  
     import { ContentObjectEntity } from '../../features/activitypub/entities/content-object.entity';  
     import { FlashcardEntity } from '../../features/educationpub/entities/flashcard.entity';  
     import { FlashcardModelEntity } from '../../features/educationpub/entities/flashcard-model.entity';  
     import { FollowEntity } from '../../features/activitypub/entities/follow.entity';  
     import { LikeEntity } from '../../features/activitypub/entities/like.entity';  
     import { REDIS_CLIENT, RedisClient } from '../redis.module';

     @Injectable()  
     export class AppService {  
       private readonly instanceBaseUrl: string;

       constructor(  
         private readonly configService: ConfigService,  
         private readonly logger: LoggerService,  
         @InjectRepository(ActorEntity)  
         private readonly actorRepository: Repository<ActorEntity\>,  
         @InjectRepository(ActivityEntity)  
         private readonly activityRepository: Repository<ActivityEntity\>,  
         @InjectRepository(ContentObjectEntity)  
         private readonly contentObjectRepository: Repository<ContentObjectEntity\>,  
         @InjectRepository(FollowEntity)  
         private readonly followRepository: Repository<FollowEntity\>,  
         @InjectRepository(LikeEntity)  
         private readonly likeRepository: Repository<LikeEntity\>,  
         @InjectRepository(FlashcardEntity)  
         private readonly flashcardRepository: Repository<FlashcardEntity\>,  
         @InjectRepository(FlashcardModelEntity)  
         private readonly flashcardModelRepository: Repository<FlashcardModelEntity\>,  
         @Inject(REDIS_CLIENT) private readonly redisClient: RedisClient,  
       ) {  
         this.logger.setContext(AppService.name);  
         this.instanceBaseUrl = this.configService.get<string\>('INSTANCE_BASE_URL');  
       }

       /**  
        * Retrieves a paginated public timeline, focusing on MVP content types (Flashcards)  
        * and relevant public activities (Announce, Like).  
        * @param page The page number for pagination.  
        * @param perPage The number of items per page.  
        * @returns An ActivityPub OrderedCollection page representing the public timeline.  
        */  
       async getPublicTimeline(page: number, perPage: number): Promise<any> {  
           this.logger.debug(`Fetching public timeline, page: ${page}, perPage: ${perPage}`);

           // Fetch public flashcards  
           const [publicFlashcards, totalFlashcards] = await this.flashcardRepository.findAndCount({  
               where: { isPublic: true, deletedAt: IsNull() },  
               order: { createdAt: 'DESC' },  
               relations: ['eduModel', 'creator'], // Include relations if needed for full object mapping later  
           });

           // Fetch recent public activities (Announce, Like)  
           // For MVP, we assume Announce/Like activities are public if they don't have explicit private recipients.  
           // A more robust solution for 'public' would involve checking `to`/`cc` fields in `data` JSONB  
           // or having a dedicated `isPublic` column on ActivityEntity.  
           const [publicActivities, totalActivities] = await this.activityRepository.findAndCount({  
               where: {  
                   type: In(['Announce', 'Like']),  
                   // Additional filtering for public visibility (e.g., no 'to' or 'cc' fields, or 'to' includes Public)  
                   // This is a simplification for MVP.  
               },  
               order: { createdAt: 'DESC' },  
           });

           // Combine all items  
           const rawCombinedItems = [  
               ...publicFlashcards.map(fc => ({ type: 'edu:Flashcard', id: fc.activityPubId, data: fc, createdAt: fc.createdAt })),  
               ...publicActivities.map(act => ({ type: act.type, id: act.activityPubId, data: act.data, createdAt: act.createdAt })),  
           ];

           // Sort by creation date (newest first)  
           const sortedItems = rawCombinedItems.sort((a, b) => {  
               const dateA = new Date(a.createdAt);  
               const dateB = new Date(b.createdAt);  
               return dateB.getTime() - dateA.getTime();  
           });

           // Apply pagination after sorting  
           const paginatedItems = sortedItems.slice((page - 1) * perPage, page * perPage);

           const totalCombinedItems = totalFlashcards + totalActivities; // More accurate total for MVP scope  
           const collectionId = `${this.instanceBaseUrl}/public`;  
           const currentPageId = `${collectionId}?page=${page}&perPage=${perPage}`;  
           const firstPageId = `${collectionId}?page=1&perPage=${perPage}`;  
           const totalPages = Math.ceil(totalCombinedItems / perPage);  
           const lastPageId = `${collectionId}?page=${totalPages}&perPage=${perPage}`;  
           const prevPageId = page \> 1 ? `${collectionId}?page=${page - 1}&perPage=${perPage}` : undefined;  
           const nextPageId = page < totalPages ? `${collectionId}?page=${page + 1}&perPage=${perPage}` : undefined;

           return {  
               '@context': 'https://www.w3.org/ns/activitystreams',  
               id: collectionId,  
               type: 'OrderedCollectionPage',  
               totalItems: totalCombinedItems,  
               partOf: collectionId,  
               first: firstPageId,  
               last: lastPageId,  
               prev: prevPageId,  
               next: nextPageId,  
               current: currentPageId,  
               orderedItems: paginatedItems.map(item => item.id), // Return just the IDs for the collection  
           };  
       }

       // ... (other methods like getInboxCollection, getOutboxCollection, getFollowersCollection, getFollowingCollection, getLikedCollection) ...  
     }
     ```

* **Expected Outcome:**  
  * A GET request to /api/public will return a paginated ActivityPub OrderedCollectionPage.  
  * The collection will accurately reflect the MVP's content focus, displaying only relevant edu:Flashcard objects and public Announce/Like activities, sorted by creation date. Generic Note or Article objects (if they exist in the ContentObjectEntity table) should *not* appear directly in this timeline unless they are the object of an Announce or Like activity.

## **Next Steps:**

Proceed to **Phase 4: Architectural Refactoring of Module Dependencies**. This phase will address the structural improvements identified.