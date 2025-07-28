---
title: Phase 1
sidebar_position: 1
---

# **EducationPub MVP Completion Plan: Phase 1 \- Foundational Corrections and Data Model Refinement**

## **Objective:**

This phase focuses on addressing immediate data integrity issues and enhancing the core data model to correctly support federated interactions and content dereferencing. Successful completion of this phase is a prerequisite for all subsequent development.

## **Tasks:**

### **Task 1.1: Correcting Flashcard View Entity Typo**

* **Problem:** A typo in the Flashcard.view.ts file ('Flashcardd') prevents accurate filtering and retrieval of flashcard data. This will lead to empty or incorrect results when querying flashcards through views.  
* **Location:** src/features/educationpub/views/flashcard.view.ts  
* **Action:**  
  1. Open the file src/features/educationpub/views/flashcard.view.ts.  
  2. Locate the @ViewEntity decorator's expression property.  
  3. Change the string literal where("object.type \= 'Flashcardd'") to where("object.type \= 'Flashcard'").  
* **Expected Outcome:** The file is saved with the corrected string. The application should compile without errors related to this change. Data queries using this view entity will now correctly filter for Flashcard objects.

### **Task 1.2: Enhancing ActivityEntity for Precise Inbox Filtering**

* **Problem:** The existing ActivityEntity lacks a direct mechanism to store the specific local recipient of an incoming ActivityPub activity. This makes precise inbox collection queries challenging, as the current InboxProcessor receives a localActorId (internal UUID) but needs to store the ActivityPub URI for effective querying of who received the activity.  
* **Location:**  
  * src/features/activitypub/entities/activity.entity.ts  
  * src/features/activitypub/services/inbox.processor.ts  
* **Action:**  
  1. **Modify ActivityEntity:**  
     * Open src/features/activitypub/entities/activity.entity.ts.  
     * Add a new column definition within the ActivityEntity class:  
     ```typescript
       import { Column, Entity, Index, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';  
       import { normalizeUrl } from '../../shared/utils/url-normalizer';

       @Entity('activities')  
       export class ActivityEntity {  
         @PrimaryGeneratedColumn('uuid')  
         id: string;

         @Column({ type: 'text', unique: true })  
         @Index()  
         activityPubId: string; // Canonical ActivityPub ID (IRI)

         @Column({ type: 'text' })  
         type: string; // ActivityStreams type (e.g., 'Create', 'Follow', 'Like')

         @Column({ type: 'text' })  
         actorActivityPubId: string; // ActivityPub ID of the actor performing the activity

         @Column({ type: 'text', nullable: true })  
         objectActivityPubId?: string; // ActivityPub ID of the object of the activity (e.g., a Note, a Flashcard, another Actor)

         @Column({ type: 'jsonb', nullable: true })  
         data: any; // Full raw JSON-LD payload of the activity

         @Column({ type: 'text', nullable: true })  
         recipientActivityPubId?: string; // NEW: The ActivityPub URI of the local actor who received this activity (if applicable)

         @CreateDateColumn()  
         createdAt: Date;

         @UpdateDateColumn()  
         updatedAt: Date;  
       }
       ```

  2. **Update InboxProcessor:**  
     * Open src/features/activitypub/services/inbox.processor.ts.  
     * **Inject ActorService** into the InboxProcessor's constructor. This service is needed to resolve the internal localActorId to its external activityPubId.  
     ```typescript
       import { Processor, Process } from '@nestjs/bullmq';  
       import { Job } from 'bullmq';  
       import { InjectRepository } from '@nestjs/typeorm';  
       import { Repository, IsNull } from 'typeorm';  
       import { LoggerService } from '../../shared/services/logger.service';  
       import { ActivityEntity } from '../entities/activity.entity';  
       import { ActorService } from '../services/actor.service'; // Import ActorService  
       import { normalizeUrl } from '../../shared/utils/url-normalizer';  
       import { ProcessedActivityEntity } from '../entities/processed-activity.entity';  
       import { HandlerDiscoveryService } from '../activity-handler/handler-discovery.service';

       @Processor('inbox-queue')  
       export class InboxProcessor {  
         constructor(  
           @InjectRepository(ActivityEntity)  
           private readonly activityRepository: Repository\<ActivityEntity\>,  
           @InjectRepository(ProcessedActivityEntity)  
           private readonly processedActivityRepository: Repository\<ProcessedActivityEntity\>,  
           private readonly logger: LoggerService,  
           private readonly handlerDiscoveryService: HandlerDiscoveryService,  
           private readonly actorService: ActorService, // NEW: ActorService injection  
         ) {  
           this.logger.setContext('InboxProcessor');  
         }

         @Process()  
         async process(job: Job<any>) {  
           const { localActorId, data: activityPayload, activityId, actorActivityPubId, objectActivityPubId, type: activityTypeFromJob } = job.data;  
           const jobId = job.id;  
           this.logger.debug(`Processing inbox job ${jobId} for activity type: ${activityTypeFromJob}`);

           if (!activityPayload || !activityPayload.id) {  
             this.logger.error(`Invalid activity payload for job ${jobId}: Missing ID.`, activityPayload);  
             return;  
           }

           const senderActorActivityPubId = activityPayload.actor?.id || actorActivityPubId;  
           if (!senderActorActivityPubId) {  
             this.logger.error(`Missing sender actor ID for activity ${activityPayload.id} in job ${jobId}.`);  
             return;  
           }

           // NEW: Resolve the recipient actor's ActivityPub ID if a localActorId is provided  
           let recipientActorActivityPubId: string | undefined;  
           if (localActorId) {  
               try {  
                   const localActor = await this.actorService.findActorById(localActorId);  
                   if (localActor) {  
                       recipientActorActivityPubId = localActor.activityPubId;  
                       this.logger.debug(`Resolved local actor ID ${localActorId} to ActivityPub ID: ${recipientActorActivityPubId}`);  
                   } else {  
                       this.logger.warn(`Local actor with internal ID ${localActorId} not found for inbox job ${jobId}.`);  
                   }  
               } catch (error) {  
                   this.logger.error(`Error resolving local actor ID ${localActorId} for activity ${jobId}: ${error.message}`, error.stack);  
               }  
           }

           // Check if this activity has already been processed to prevent duplicates  
           const existingProcessedActivity = await this.processedActivityRepository.findOne({  
             where: { activityPubId: normalizeUrl(activityPayload.id) },  
           });

           if (existingProcessedActivity) {  
             this.logger.warn(`Activity ${activityPayload.id} (job ${jobId}) already processed. Skipping.`);  
             return;  
           }

           // Store the raw incoming activity payload for audit/debugging  
           const newActivityRecord = this.activityRepository.create({  
             activityPubId: normalizeUrl(activityPayload.id),  
             type: activityPayload.type,  
             actorActivityPubId: normalizeUrl(senderActorActivityPubId),  
             objectActivityPubId: normalizeUrl(activityPayload.object?.id || activityPayload.object),  
             data: activityPayload,  
             recipientActivityPubId: recipientActorActivityPubId, // NEW: Assign the resolved recipient AP ID  
             createdAt: new Date(activityPayload.published || Date.now()), // Use published date if available  
           });

           try {  
             await this.activityRepository.save(newActivityRecord);  
             this.logger.debug(`Raw incoming activity '${newActivityRecord.activityPubId}' stored.`);  
           } catch (dbError) {  
             // Handle potential unique constraint violation if two jobs try to save the same activity concurrently  
             if (dbError.code === '23505') { // PostgreSQL unique violation error code  
               this.logger.warn(`Activity ${newActivityRecord.activityPubId} already exists in DB. Skipping duplicate save.`);  
             } else {  
               this.logger.error(`Failed to save activity ${newActivityRecord.activityPubId} to DB: ${dbError.message}`, dbError.stack);  
               throw dbError; // Re-throw to mark job as failed  
             }  
           }

           // Mark activity as processed  
           await this.processedActivityRepository.save(  
             this.processedActivityRepository.create({  
               activityPubId: normalizeUrl(activityPayload.id),  
               processedAt: new Date(),  
             }),  
           );

           // Dispatch to specific handler  
           const handler = this.handlerDiscoveryService.getHandler(activityPayload.type);  
           if (handler) {  
             this.logger.log(`Dispatching activity '${activityPayload.id}' to handler for type '${activityPayload.type}'.`);  
             await handler.handle(activityPayload, localActorId);  
           } else {  
             this.logger.warn(`No specific handler found for activity type '${activityPayload.type}'. Activity stored but not processed by handler.`);  
           }  
         }  
       }
      ```

* **Expected Outcome:**  
  * The activities database table will have the new recipientActivityPubId column.  
  * Incoming activities will now correctly populate this field with the ActivityPub URI of the local recipient actor.  
  * The application will compile and run without errors related to these changes.

### **Task 1.3: Streamlining Entity Registrations in AppModule**

* **Problem:** The AppModule currently lists many entities explicitly in its TypeOrmModule.forRootAsync configuration. This is redundant and violates modularity principles, as these entities are already registered via TypeOrmModule.forFeature within their respective feature modules (ActivityPubModule, EducationPubModule, AuthModule).  
* **Location:** src/app.module.ts  
* **Action:**  
  1. Open the file src/app.module.ts.  
  2. Locate the entities array within the TypeOrmModule.forRootAsync configuration.  
  3. Remove all explicit entity listings from this array. The array should become empty.  
  ```typescript
     import { Module } from '@nestjs/common';  
     import { TypeOrmModule } from '@nestjs/typeorm';  
     import { ConfigModule, ConfigService } from '@nestjs/config';  
     import { CoreModule } from './core/core.module';  
     import { AuthModule } from './features/auth/auth.module';  
     import { ActivityPubModule } from './features/activitypub/activitypub.module';  
     import { EducationPubModule } from './features/educationpub/educationpub.module';  
     import { HealthModule } from './features/health/health.module';  
     import { ModerationModule } from './features/moderation/moderation.module';  
     import { CommonModule } from './shared/common.module'; // Ensure CommonModule is imported

     // Import entities only if they are truly global and not registered by feature modules' forFeature  
     // import { ActorEntity } from './features/activitypub/entities/actor.entity';  
     // ... (remove all other entity imports here) ...

     @Module({  
       imports: [  
         ConfigModule.forRoot({  
           isGlobal: true, // Makes ConfigService available globally  
         }),  
         TypeOrmModule.forRootAsync({  
           imports: [ConfigModule],  
           inject: [ConfigService],  
           useFactory: async (configService: ConfigService) => ({  
             type: 'postgres', // or 'mysql'  
             host: configService.get<string>('DB_HOST'),  
             port: configService.get<number>('DB_PORT'),  
             username: configService.get<string>('DB_USERNAME'),  
             password: configService.get<string>('DB_PASSWORD'),  
             database: configService.get<string>('DB_DATABASE'),  
             entities: [], // ACTION: This array should now be empty  
             synchronize: configService.get<boolean>('DB_SYNCHRONIZE', false), // Set to true only for development  
             logging: configService.get<boolean>('DB_LOGGING', false),  
           }),  
         }),  
         CoreModule,  
         AuthModule,  
         ActivityPubModule,  
         EducationPubModule,  
         HealthModule,  
         ModerationModule,  
         CommonModule, // Ensure this is present in imports  
       ],  
       controllers: [],  
       providers: [],  
     })  
     export class AppModule {}
    ```

* **Expected Outcome:** The application will compile and run correctly. The database schema will be managed by the TypeOrmModule.forFeature calls within individual feature modules, improving modularity and reducing redundancy.

## **Next Steps:**

Proceed to **Phase 2: Core Module Repository Setup** to ensure CoreModule has access to all necessary TypeORM repositories before implementing features that depend on them.