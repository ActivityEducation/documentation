---
title: Phase 1
sidebar_position: 1
---

# Spaced Repetition Feature: Phase 1 Backend Implementation Plan
## 1. Objective

This document provides a detailed, actionable plan for implementing the backend components of the Spaced Repetition Scheduling (SRS) feature, as defined in **Phase 1: Core Backend Engine (MVP)**. The goal is to establish the foundational data structures, business logic, and API endpoints necessary for the SRS to function.

All changes will be implemented within the `src/features/educationpub/` directory, adhering to the existing project architecture.

## 2. Task Breakdown & Implementation Details

### 2.1. Database Schema & Entities

The first step is to define the database schema by creating two new TypeORM entities and updating existing ones.

#### a. Create `ReviewLog` Entity
This entity will create the `review_log` table to store a complete history of every flashcard review.

* **File Location:** `src/features/educationpub/entities/review-log.entity.ts`
* **Implementation:**
    ```typescript
    import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
    import { Flashcard } from './flashcard.entity';
    import { Actor } from '../../activitypub/entities/actor.entity';

    @Entity()
    export class ReviewLog {
      @PrimaryGeneratedColumn('uuid')
      id: string;

      @ManyToOne(() => Flashcard, (flashcard) => flashcard.reviewLogs)
      flashcard: Flashcard;

      @ManyToOne(() => Actor, (actor) => actor.reviewLogs)
      actor: Actor;

      @Column({ type: 'smallint' }) // 1: Again, 2: Hard, 3: Good, 4: Easy
      rating: number;

      @Column({ type: 'jsonb' })
      state: { stability: number; difficulty: number };

      @Column()
      elapsed_time: number; // Seconds since last review

      @CreateDateColumn()
      reviewed_at: Date;

      @Column()
      scheduled_on: Date;
    }
    ```

#### b. Create `SpacedRepetitionSchedule` Entity
This entity creates the `spaced_repetition_schedule` table to track the current learning state for each actor-flashcard pair.

* **File Location:** `src/features/educationpub/entities/spaced-repetition-schedule.entity.ts`
* **Implementation:**
    ```typescript
    import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Unique } from 'typeorm';
    import { Flashcard } from './flashcard.entity';
    import { Actor } from '../../activitypub/entities/actor.entity';

    @Entity()
    @Unique(['actor', 'flashcard'])
    export class SpacedRepetitionSchedule {
      @PrimaryGeneratedColumn('uuid')
      id: string;

      @ManyToOne(() => Actor, { eager: true })
      actor: Actor;

      @ManyToOne(() => Flashcard, { eager: true })
      flashcard: Flashcard;

      @Column({ type: 'timestamp with time zone' })
      due: Date;

      @Column('float')
      stability: number;

      @Column('float')
      difficulty: number;

      @Column({ default: 0 })
      lapses: number;

      @Column({ default: 'New' }) // New, Learning, Review
      state: string;

      @Column({ type: 'timestamp with time zone', nullable: true })
      last_review: Date;
    }
    ```

#### c. Update Existing Entities
Add the `OneToMany` relationships to the `Actor` and `Flashcard` entities.

* **File to Update:** `src/features/activitypub/entities/actor.entity.ts`
* **File to Update:** `src/features/educationpub/entities/flashcard.entity.ts`

#### d. Generate Migration
After creating and updating the entities, a new TypeORM migration must be generated and executed to apply the schema changes to the database.

### 2.2. FSRS Algorithm Logic
Port the FSRS v4 algorithm into a dedicated, testable service.

* **File Location:** `src/features/educationpub/services/fsrs.logic.ts`
* **Implementation:** Create an injectable `FSRSLogic` class. This class will contain the pure mathematical formulas from the FSRS documentation. It will not have any external dependencies (like repositories).
    * **Default Parameters:** Store the default FSRS parameters.
    * **`calculateInitialState(rating)`:** Method to determine the initial stability and difficulty for a new card.
    * **`updateState(schedule, rating, reviewTime)`:** Method that takes the current schedule and a new rating to calculate the next state (`stability`, `difficulty`, `due` date).

### 2.3. Core Service: `SpacedRepetitionService`
This service will orchestrate the entire SRS process.

* **File Location:** `src/features/educationpub/services/spaced-repetition.service.ts`
* **Implementation:**
    ```typescript
    import { Injectable } from '@nestjs/common';
    import { InjectRepository } from '@nestjs/typeorm';
    import { Repository } from 'typeorm';
    import { SpacedRepetitionSchedule } from '../entities/spaced-repetition-schedule.entity';
    import { ReviewLog } from '../entities/review-log.entity';
    import { FSRSLogic } from './fsrs.logic.ts';
    // ... other imports

    @Injectable()
    export class SpacedRepetitionService {
      constructor(
        @InjectRepository(SpacedRepetitionSchedule)
        private scheduleRepository: Repository<SpacedRepetitionSchedule>,
        @InjectRepository(ReviewLog)
        private reviewLogRepository: Repository<ReviewLog>,
        private fsrsLogic: FSRSLogic,
      ) {}

      async processReview(actorId: string, flashcardId: string, rating: number): Promise<SpacedRepetitionSchedule> {
        // 1. Find existing schedule or create a new one.
        // 2. Use this.fsrsLogic.updateState(...) to get the new D, S, and due date.
        // 3. Create a new ReviewLog entry.
        // 4. Save the updated SpacedRepetitionSchedule.
        // 5. Return the updated schedule.
      }

      async getDueFlashcards(actorId: string): Promise<Flashcard[]> {
        // Query SpacedRepetitionSchedule table for records where actorId matches and `due` <= NOW().
        // Return the associated Flashcard objects.
      }
    }
    ```

### 2.4. API Layer: `SpacedRepetitionController`
Expose the SRS functionality through a new REST controller.

* **File Location:** `src/features/educationpub/controllers/spaced-repetition.controller.ts`
* **DTOs to Create:**
    * `src/features/educationpub/dto/submit-review.dto.ts`
* **Implementation:**
    ```typescript
    import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
    import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
    import { SpacedRepetitionService } from '../services/spaced-repetition.service';
    import { SubmitReviewDto } from '../dto/submit-review.dto';

    @Controller('api/edu/srs')
    @UseGuards(JwtAuthGuard)
    export class SpacedRepetitionController {
      constructor(private readonly srsService: SpacedRepetitionService) {}

      @Post('review')
      async submitReview(@Req() req, @Body() body: SubmitReviewDto) {
        // Assuming actor can be derived from req.user
        const actorId = req.user.actor.id;
        return this.srsService.processReview(actorId, body.flashcardId, body.rating);
      }

      @Get('due')
      async getDueFlashcards(@Req() req) {
        const actorId = req.user.actor.id;
        return this.srsService.getDueFlashcards(actorId);
      }
    }
    ```

### 2.5. Module Integration
Wire up all the new components in the `EducationPubModule`.

* **File to Update:** `src/features/educationpub/educationpub.module.ts`
* **Changes:**
    1.  Add `ReviewLog` and `SpacedRepetitionSchedule` to the `TypeOrmModule.forFeature([...])` array.
    2.  Add `SpacedRepetitionService` and `FSRSLogic` to the `providers` array.
    3.  Add `SpacedRepetitionController` to the `controllers` array.

## 3. Testing Strategy

* **Unit Tests:**
    * `fsrs.logic.spec.ts`: Create tests to validate the FSRS calculations against known input/output pairs from the algorithm's documentation.
    * `spaced-repetition.service.spec.ts`: Mock the repositories and `FSRSLogic` service. Test the `processReview` and `getDueFlashcards` methods to ensure they correctly interact with the mocks and handle different scenarios (e.g., new card vs. existing card).
* **End-to-End (E2E) Tests:**
    * `srs.e2e-spec.ts`: Create a new E2E test suite.
        * Test the `POST /api/edu/srs/review` endpoint, ensuring it requires authentication and correctly creates/updates records in the database.
        * Test the `GET /api/edu/srs/due` endpoint, seeding the database with due and not-due cards to verify it returns the correct set.

## Related Documents
* [The FSRS v4 Algorithm A Comprehensive Technical Report on its Mechanics, Implementation, and Optimization](/docs/implementation/research/research-report/The%20FSRS%20v4%20Algorithm)
* [Spaced Repetition Feature: Planning & Implementation Plan](immersive://srs_frontend_components)
