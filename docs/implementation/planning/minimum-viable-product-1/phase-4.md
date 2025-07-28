---
title: Phase 4
sidebar_position: 4
---

# **EducationPub MVP Completion Plan: Phase 4 \- Architectural Refactoring of Module Dependencies**

## **Objective:**

This phase addresses a critical architectural violation and refines module responsibilities to align with the modules.md document. The goal is to ensure a clean, maintainable, and robust NestJS application structure, which is crucial for long-term scalability and development.

## **Prerequisites:**

* Completion of **Phase 1: Foundational Corrections and Data Model Refinement**.  
* Completion of **Phase 2: Core Module Repository Setup**.  
* Completion of **Phase 3: Implement Missing Core Endpoints and Dereferencing**.

## **Tasks:**

### **Task 4.1: Refactoring CommonModule**

* **Problem:** The CommonModule currently violates its core principle (DOES NOT IMPORT ANY OTHER MODULE) by importing CoreModule and registering entities. It also exports guards that should be provided by more specific feature modules. This creates tight coupling and reduces modularity, making the application harder to understand and maintain.  
* **Location:** src/shared/common.module.ts  
* **Action:**  
  1. Open the file src/shared/common.module.ts.  
  2. **Remove the @Global() decorator** from the CommonModule class. This will force explicit imports of CommonModule where its services are needed, improving dependency visibility.  
  3. **Remove all imports**: Delete the imports array (e.g., imports: [forwardRef(() => CoreModule), TypeOrmModule.forFeature([ActorEntity])]).  
  4. **Remove exports of guards**: Delete JwtAuthGuard, HttpSignatureVerificationGuard, and RateLimitGuard from the exports array. These guards will be moved to their appropriate modules in the next task.  
  5. **Remove specific exception providers**: Delete HttpSignatureVerificationError, InvalidSignatureException, and InvalidDigestError from the providers array. These are typically just thrown classes and do not need to be injected as providers.  
  6. Ensure LoggerService and HttpExceptionFilter remain in CommonModule's providers and exports, as they are truly shared, independent utilities.  
  ```typescript
     import { Module, Global } from '@nestjs/common'; // Remove Global after refactor  
     import { LoggerService } from './services/logger.service';  
     import { HttpExceptionFilter } from './filters/http-exception.filter';  
     // Remove imports for guards and entities that are being moved/removed from here  
     // import { JwtAuthGuard } from './guards/jwt-auth.guard';  
     // import { HttpSignatureVerificationGuard } from './guards/http-signature-verification.guard';  
     // import { RateLimitGuard } from './guards/rate-limit.guard';  
     // import { ActorEntity } from '../features/activitypub/entities/actor.entity';  
     // import { TypeOrmModule } from '@nestjs/typeorm';  
     // import { forwardRef } from '@nestjs/common';  
     // import { CoreModule } from '../core/core.module'; // Remove this import

     @Module({ // Remove @Global()  
       imports: [  
         // Remove all imports from here  
         // forwardRef(() => CoreModule),  
         // TypeOrmModule.forFeature([ActorEntity]),  
       ],  
       providers: [  
         LoggerService,  
         HttpExceptionFilter,  
         // Remove guard providers and exception providers from here  
         // JwtAuthGuard,  
         // HttpSignatureVerificationError,  
         // InvalidSignatureException,  
         // InvalidDigestError,  
         // HttpSignatureVerificationGuard,  
         // RateLimitGuard,  
       ],  
       exports: [  
         LoggerService,  
         HttpExceptionFilter,  
         // Remove guard exports from here  
         // JwtAuthGuard,  
         // HttpSignatureVerificationGuard,  
         // RateLimitGuard,  
       ],  
     })  
     export class CommonModule {}
    ```

* **Expected Outcome:** CommonModule will adhere to its single responsibility principle, serving solely as a container for truly shared, independent resources. This will improve overall application modularity and make dependencies more explicit.

### **Task 4.2: Relocating Guards to Appropriate Modules**

* **Problem:** JwtAuthGuard, HttpSignatureVerificationGuard, and RateLimitGuard are currently provided by CommonModule, which is an architectural violation. They should be provided by the modules most logically responsible for their functionality.  
* **Location:**  
  * src/features/auth/auth.module.ts  
  * src/core/core.module.ts  
* **Action:**  
  1. **Move JwtAuthGuard to AuthModule:**  
     * Open src/features/auth/auth.module.ts.  
     * Ensure JwtAuthGuard is imported from its existing location (src/shared/guards/jwt-auth.guard.ts).  
     * Add JwtAuthGuard to both the providers and exports arrays of AuthModule.  
     ```typescript
       import { Module } from '@nestjs/common';  
       import { TypeOrmModule } from '@nestjs/typeorm';  
       import { PassportModule } from '@nestjs/passport';  
       import { JwtModule } from '@nestjs/jwt';  
       import { ConfigModule, ConfigService } from '@nestjs/config';  
       import { AuthService } from './auth.service';  
       import { AuthController } from './auth.controller';  
       import { UserEntity } from './entities/user.entity';  
       import { ActorEntity } from '../activitypub/entities/actor.entity'; // Assuming ActorEntity is also related to Auth  
       import { JwtStrategy } from './strategies/jwt.strategy';  
       import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard'; // Ensure correct import path  
       import { CommonModule } from '../../shared/common.module'; // NEW: Import CommonModule for LoggerService

       @Module({  
         imports: [  
           TypeOrmModule.forFeature([UserEntity, ActorEntity]),  
           PassportModule,  
           JwtModule.registerAsync({  
             imports: [ConfigModule],  
             inject: [ConfigService],  
             useFactory: async (configService: ConfigService) => ({  
               secret: configService.get<string>('JWT_SECRET'),  
               signOptions: { expiresIn: '60m' },  
             }),  
           }),  
           CommonModule, // NEW: Import CommonModule  
         ],  
         controllers: [AuthController],  
         providers: [  
           AuthService,  
           JwtStrategy,  
           JwtAuthGuard, // NEW: Provide JwtAuthGuard here  
         ],  
         exports: [  
           AuthService,  
           JwtAuthGuard, // NEW: Export JwtAuthGuard here  
           JwtModule, // Export JwtModule if other modules need to verify tokens  
         ],  
       })  
       export class AuthModule {}
       ```

  2. **Move HttpSignatureVerificationGuard and RateLimitGuard to CoreModule:**  
     * Open src/core/core.module.ts.  
     * Ensure HttpSignatureVerificationGuard and RateLimitGuard are imported from their existing locations (src/shared/guards/http-signature-verification.guard.ts and src/shared/guards/rate-limit.guard.ts).  
     * Add both guards to the providers and exports arrays of CoreModule.  
     ```typescript
       import { Module, Global } from '@nestjs/common';  
       import { TypeOrmModule } from '@nestjs/typeorm';  
       import { AppService } from './services/app.service';  
       import { KeyManagementService } from './services/key-management.service';  
       import { RemoteObjectService } from './services/remote-object.service';  
       import { WellKnownController } from './controllers/well-known.controller';  
       import { NamespaceController } from './controllers/namespace.controller';  
       import { NodeinfoController } from './controllers/nodeinfo.controller';  
       import { RedisModule } from './redis.module';  
       import { CommonModule } from '../shared/common.module'; // Ensure CommonModule is imported

       // Entities whose repositories are needed by AppService (from Phase 2.1)  
       import { FlashcardEntity } from '../features/educationpub/entities/flashcard.entity';  
       import { FlashcardModelEntity } from '../features/educationpub/entities/flashcard-model.entity';  
       import { ContentObjectEntity } from '../features/activitypub/entities/content-object.entity';  
       import { ActivityEntity } from '../features/activitypub/entities/activity.entity';  
       import { ActorEntity } from '../features/activitypub/entities/actor.entity';  
       import { FollowEntity } from '../features/activitypub/entities/follow.entity'; // Ensure this is imported if needed by AppService  
       import { LikeEntity } from '../features/activitypub/entities/like.entity'; // Ensure this is imported if needed by AppService

       // NEW: Import the guards  
       import { HttpSignatureVerificationGuard } from '../shared/guards/http-signature-verification.guard';  
       import { RateLimitGuard } from '../shared/guards/rate-limit.guard';

       @Global()  
       @Module({  
         imports: [  
           RedisModule,  
           CommonModule, // Provides LoggerService  
           TypeOrmModule.forFeature([  
             FlashcardEntity,  
             FlashcardModelEntity,  
             ContentObjectEntity,  
             ActivityEntity,  
             ActorEntity,  
             FollowEntity, // Ensure this is here if AppService needs it  
             LikeEntity,   // Ensure this is here if AppService needs it  
           ]),  
         ],  
         controllers: [WellKnownController, NamespaceController, NodeinfoController],  
         providers: [  
           AppService,  
           KeyManagementService,  
           RemoteObjectService,  
           HttpSignatureVerificationGuard, // NEW: Provide HttpSignatureVerificationGuard here  
           RateLimitGuard, // NEW: Provide RateLimitGuard here  
         ],  
         exports: [  
           AppService,  
           KeyManagementService,  
           RemoteObjectService,  
           HttpSignatureVerificationGuard, // NEW: Export HttpSignatureVerificationGuard here  
           RateLimitGuard, // NEW: Export RateLimitGuard here  
         ],  
       })  
       export class CoreModule {}
       ```

* **Expected Outcome:** Guards will be provided by the modules most logically responsible for their functionality (AuthModule for authentication, CoreModule for foundational security and rate limiting). The application should still compile, though dependency errors will arise in the next task if imports are not updated.

### **Task 4.3: Adjusting Module Imports Across the Application**

* **Problem:** Due to the refactoring of CommonModule (no longer @Global()) and the relocation of guards, many modules will have broken dependencies, leading to compilation errors.  
* **Location:**  
  * src/app.module.ts  
  * src/features/auth/auth.module.ts  
  * src/features/activitypub/activitypub.module.ts  
  * src/features/educationpub/educationpub.module.ts  
  * src/features/health/health.module.ts  
  * src/features/moderation/moderation.module.ts  
  * All controllers using @UseGuards() decorators.  
* **Action:**  
  1. **src/app.module.ts:**  
     * Ensure CommonModule is explicitly imported in the imports array.  
     ```typescript
       import { CommonModule } from './shared/common.module'; // Ensure this import is present  
       // ...  
       @Module({  
         imports: [  
           // ...  
           CoreModule,  
           AuthModule,  
           ActivityPubModule,  
           EducationPubModule,  
           HealthModule,  
           ModerationModule,  
           CommonModule, // Ensure this is explicitly imported  
         ],  
         // ...  
       })  
       export class AppModule {}
       ```

  2. **src/features/activitypub/activitypub.module.ts:**  
     * Ensure CoreModule is imported (for HttpSignatureVerificationGuard, RateLimitGuard, AppService, RemoteObjectService, KeyManagementService).  
     * Ensure CommonModule is imported (for LoggerService, Activity decorator).  
    ```typescript
       import { Module } from '@nestjs/common';  
       import { TypeOrmModule } from '@nestjs/typeorm';  
       import { ActivityPubController } from './controllers/activitypub.controller';  
       import { ActorService } from './services/actor.service';  
       import { InboxProcessor } from './services/inbox.processor';  
       import { OutboxProcessor } from './services/outbox.processor';  
       import { ActorEntity } from './entities/actor.entity';  
       import { ActivityEntity } from './entities/activity.entity';  
       import { ContentObjectEntity } from './entities/content-object.entity';  
       import { FollowEntity } from './entities/follow.entity';  
       import { LikeEntity } from './entities/like.entity';  
       import { AnnounceEntity } from './entities/announce.entity';  
       import { BlockEntity } from './entities/block.entity';  
       import { ProcessedActivityEntity } from './entities/processed-activity.entity';  
       import { HandlerModule } from './activity-handler/handler.module';  
       import { BullModule } from '@nestjs/bullmq';  
       import { CommonModule } from '../../shared/common.module'; // NEW: Import CommonModule  
       import { CoreModule } from '../../core/core.module'; // NEW: Import CoreModule  
       import { AuthModule } from '../auth/auth.module'; // Assuming ActivityPubModule depends on AuthModule

       @Module({  
         imports: [  
           TypeOrmModule.forFeature([  
             ActorEntity,  
             ActivityEntity,  
             ContentObjectEntity,  
             FollowEntity,  
             LikeEntity,  
             AnnounceEntity,  
             BlockEntity,  
             ProcessedActivityEntity,  
           ]),  
           BullModule.registerQueue({  
             name: 'inbox-queue',  
           }),  
           BullModule.registerQueue({  
             name: 'outbox-queue',  
           }),  
           HandlerModule,  
           CommonModule, // NEW: Explicitly import CommonModule  
           CoreModule, // NEW: Explicitly import CoreModule  
           AuthModule, // Ensure this is present if it's a dependency  
         ],  
         controllers: [ActivityPubController],  
         providers: [ActorService, InboxProcessor, OutboxProcessor],  
         exports: [ActorService, InboxProcessor, OutboxProcessor],  
       })  
       export class ActivityPubModule {}
    ```

  3. **src/features/educationpub/educationpub.module.ts:**  
     * Ensure CoreModule is imported (for AppService).  
     * Ensure CommonModule is imported (for LoggerService, User decorator).  
    ```typescript
       import { Module } from '@nestjs/common';  
       import { TypeOrmModule } from '@nestjs/typeorm';  
       import { FlashcardModelEntity } from './entities/flashcard-model.entity';  
       import { FlashcardEntity } from './entities/flashcard.entity';  
       import { FlashcardModelService } from './services/flashcard-model.service';  
       import { FlashcardService } from './services/flashcard.service';  
       import { FlashcardModelController } from './controllers/flashcard-model.controller';  
       import { FlashcardController } from './controllers/flashcard.controller';  
       import { CommonModule } from '../../shared/common.module'; // NEW: Import CommonModule  
       import { CoreModule } from '../../core/core.module'; // NEW: Import CoreModule  
       import { AuthModule } from '../auth/auth.module'; // Assuming EducationPubModule depends on AuthModule

       @Module({  
         imports: [  
           TypeOrmModule.forFeature([FlashcardModelEntity, FlashcardEntity]),  
           CommonModule, // NEW: Explicitly import CommonModule  
           CoreModule, // NEW: Explicitly import CoreModule  
           AuthModule, // Ensure this is present if it's a dependency  
         ],  
         controllers: [FlashcardModelController, FlashcardController],  
         providers: [FlashcardModelService, FlashcardService],  
         exports: [FlashcardModelService, FlashcardService],  
       })  
       export class EducationPubModule {}
    ```

  4. **src/features/health/health.module.ts:**  
     * Ensure CoreModule is imported (for AppService, RedisModule health check).  
     * Ensure CommonModule is imported (for LoggerService). 
    ```typescript 
       import { Module } from '@nestjs/common';  
       import { TerminusModule } from '@nestjs/terminus';  
       import { HealthController } from './controllers/health.controller';  
       import { CoreModule } from '../../core/core.module'; // NEW: Import CoreModule  
       import { CommonModule } from '../../shared/common.module'; // NEW: Import CommonModule

       @Module({  
         imports: [  
           TerminusModule,  
           CoreModule, // NEW: Explicitly import CoreModule  
           CommonModule, // NEW: Explicitly import CommonModule  
         ],  
         controllers: [HealthController],  
         providers: [],  
       })  
       export class HealthModule {}
    ```

  5. **src/features/moderation/moderation.module.ts:**  
     * Ensure CommonModule is imported (for LoggerService).  
     ```typescript
       import { Module } from '@nestjs/common';  
       import { TypeOrmModule } from '@nestjs/typeorm';  
       import { FlaggedObjectEntity } from './entities/flagged-object.entity';  
       import { ModerationService } from './moderation.service';  
       import { CommonModule } from '../../shared/common.module'; // NEW: Import CommonModule

       @Module({  
         imports: [  
           TypeOrmModule.forFeature([FlaggedObjectEntity]),  
           CommonModule, // NEW: Explicitly import CommonModule  
         ],  
         providers: [ModerationService],  
         exports: [ModerationService],  
       })  
       export class ModerationModule {}
    ```

  6. **Update @UseGuards() decorators in Controllers:**  
     * Go through src/features/activitypub/controllers/activitypub.controller.ts, src/features/auth/auth.controller.ts, src/features/educationpub/controllers/flashcard.controller.ts, src/features/educationpub/controllers/flashcard-model.controller.ts.  
     * Update import paths for JwtAuthGuard, HttpSignatureVerificationGuard, RateLimitGuard to reflect their new module origins.  
       * JwtAuthGuard will be imported from src/features/auth/guards/jwt-auth.guard.ts.  
       * HttpSignatureVerificationGuard and RateLimitGuard will be imported from src/core/guards/http-signature-verification.guard.ts and src/core/guards/rate-limit.guard.ts respectively.  
       * Example for ActivityPubController:  
        ```typescript
         import { HttpSignatureVerificationGuard } from '../../core/guards/http-signature-verification.guard';  
         import { RateLimitGuard } from '../../core/guards/rate-limit.guard';  
         // ...  
         @UseGuards(HttpSignatureVerificationGuard, RateLimitGuard) // Ensure guards are used correctly  
         @Post(':username/inbox')  
         async handleInboxActivity(...) { ... }
        ```

* **Expected Outcome:** The application will compile successfully after all import paths and @UseGuards() decorators are updated. The dependency graph will be explicit, correct, and aligned with the established modular architecture, resolving all compilation and runtime dependency issues.

## **Next Steps:**

Proceed to **Phase 5: Final Verification and End-to-End Validation**. This final phase will ensure the entire system is stable, functional, and meets all MVP success criteria.