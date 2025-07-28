---
title: Phase 2
sidebar_position: 2
---

# **EducationPub MVP Completion Plan: Phase 2 \- Core Module Repository Setup**

## **Objective:**

This crucial phase ensures that all necessary TypeORM repositories are correctly provided to the CoreModule (where AppService resides) *before* they are needed for implementing core features. This prevents runtime dependency injection failures and ensures a smooth development flow.

## **Prerequisites:**

* Completion of **Phase 1: Foundational Corrections and Data Model Refinement**.

## **Tasks:**

### **Task 2.1: Providing Essential Repositories to CoreModule**

* **Problem:** AppService (a core service provided by CoreModule) requires direct access to TypeORM repositories for FlashcardEntity, FlashcardModelEntity, ContentObjectEntity, ActivityEntity, and ActorEntity to implement various public-facing and dereferencing endpoints. These repositories were not explicitly provided to CoreModule via TypeOrmModule.forFeature, leading to potential dependency injection errors when AppService attempts to use them.  
* **Location:** src/core/core.module.ts  
* **Action:**  
  1. Open the file src/core/core.module.ts.  
  2. Add the necessary TypeOrmModule imports and include TypeOrmModule.forFeature within the @Module decorator's imports array. This will make the repositories for these entities injectable within CoreModule's providers (like AppService).  
  ```typescript
     import { Module, Global } from '@nestjs/common';  
     import { TypeOrmModule } from '@nestjs/typeorm'; // NEW: Import TypeOrmModule  
     import { AppService } from './services/app.service';  
     import { KeyManagementService } from './services/key-management.service';  
     import { RemoteObjectService } from './services/remote-object.service';  
     import { WellKnownController } from './controllers/well-known.controller';  
     import { NamespaceController } from './controllers/namespace.controller';  
     import { NodeinfoController } from './controllers/nodeinfo.controller';  
     import { RedisModule } from './redis.module';  
     import { CommonModule } from '../shared/common.module'; // Assuming CommonModule is imported here for LoggerService

     // NEW: Import entities whose repositories are needed by AppService  
     import { FlashcardEntity } from '../features/educationpub/entities/flashcard.entity';  
     import { FlashcardModelEntity } from '../features/educationpub/entities/flashcard-model.entity';  
     import { ContentObjectEntity } from '../features/activitypub/entities/content-object.entity';  
     import { ActivityEntity } from '../features/activitypub/entities/activity.entity';  
     import { ActorEntity } from '../features/activitypub/entities/actor.entity'; // AppService also uses ActorService which needs ActorEntity

     @Global() // CoreModule is typically global for foundational services  
     @Module({  
       imports: [  
         RedisModule,  
         CommonModule, // Provides LoggerService  
         // NEW: Provide repositories needed by AppService and other core services  
         TypeOrmModule.forFeature([  
           FlashcardEntity,  
           FlashcardModelEntity,  
           ContentObjectEntity,  
           ActivityEntity,  
           ActorEntity,  
         ]),  
       ],  
       controllers: [WellKnownController, NamespaceController, NodeinfoController],  
       providers: [  
         AppService,  
         KeyManagementService,  
         RemoteObjectService,  
         // Guards will be moved here in a later phase (Phase 4\)  
       ],  
       exports: [  
         AppService,  
         KeyManagementService,  
         RemoteObjectService,  
         // Guards will be exported here in a later phase (Phase 4\)  
       ],  
     })  
     export class CoreModule {}
     ```

* **Expected Outcome:** The application will compile successfully. The AppService and other core services within CoreModule will now be able to correctly inject and utilize the TypeORM repositories for FlashcardEntity, FlashcardModelEntity, ContentObjectEntity, ActivityEntity, and ActorEntity without runtime errors.

## **Next Steps:**

Proceed to **Phase 3: Implement Missing Core Endpoints and Dereferencing**. This phase will utilize the newly available repositories to implement the core functionalities.