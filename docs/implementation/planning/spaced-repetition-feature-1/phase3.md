---
title: Phase 3
sidebar_position: 3
---

# Spaced Repetition Feature: Phase 3 Advanced Features & Analytics Plan

## **Prerequisites:**

* [SRS Feature: Phase 1 Backend Implementation Plan](./phase1.md)
* [SRS Feature: Phase 2 Frontend Implementation Plan](./phase2.md)

## 1. Objective

This document provides a detailed, actionable plan for implementing the backend components for **Phase 3: Advanced Features & Analytics**. The goal of this phase is to enhance the core SRS engine by giving users more control over their learning process and providing them with valuable insights into their progress.

All changes will be implemented within the `src/features/educationpub/` directory.

## 2. Task Breakdown & Implementation Details

### 2.1. Collection-Based Reviews

This feature will allow users to study specific sets of flashcards, such as those belonging to a particular `FlashcardModel` (i.e., a "deck").

#### a. API Endpoint Modification

The existing `GET /api/edu/srs/due` endpoint will be updated to accept an optional query parameter to filter by collection.

* **Endpoint:** `GET /api/edu/srs/due`
* **Query Parameter:** `?collectionId=<uuid>` (optional)
* **Logic:**
    * If `collectionId` is provided, the service will return only due cards that belong to the specified `FlashcardModel`.
    * If `collectionId` is omitted, the service will return all due cards for the actor, maintaining the original MVP behavior.

#### b. Service Layer Update

The `SpacedRepetitionService` will be updated to handle the new filtering logic.

* **File to Update:** `src/features/educationpub/services/spaced-repetition.service.ts`
* **Method to Update:** `getDueFlashcards`
* **Implementation:**
    ```typescript
    // In SpacedRepetitionService
    async getDueFlashcards(actorId: string, collectionId?: string): Promise<Flashcard[]> {
      const queryBuilder = this.scheduleRepository.createQueryBuilder('schedule')
        .innerJoinAndSelect('schedule.flashcard', 'flashcard')
        .where('schedule.actor.id = :actorId', { actorId })
        .andWhere('schedule.due <= :now', { now: new Date() });

      if (collectionId) {
        queryBuilder.andWhere('flashcard.flashcardModel.id = :collectionId', { collectionId });
      }

      const schedules = await queryBuilder.getMany();
      return schedules.map(s => s.flashcard);
    }
    ```

### 2.2. User-Configurable FSRS Parameters

This feature will allow users to customize the FSRS algorithm to better suit their personal learning style.

#### a. Create `ActorFsrsParameters` Entity

A new entity will be created to store custom FSRS parameters on a per-actor basis.

* **File Location:** `src/features/educationpub/entities/actor-fsrs-parameters.entity.ts`
* **Implementation:**
    ```typescript
    import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
    import { Actor } from '../../activitypub/entities/actor.entity';

    @Entity()
    export class ActorFsrsParameters {
      @PrimaryGeneratedColumn('uuid')
      id: string;

      @OneToOne(() => Actor)
      @JoinColumn()
      actor: Actor;

      @Column('float', { default: 0.9 })
      request_retention: number;

      @Column({ default: 36500 })
      maximum_interval: number;
      
      // Add other FSRS parameters as needed
    }
    ```

#### b. Update `FSRSLogic` and `SpacedRepetitionService`

The `FSRSLogic` service will be updated to accept an optional parameters object. The `SpacedRepetitionService` will be responsible for fetching these parameters for an actor and passing them to the logic layer.

#### c. Create New API Endpoints

New endpoints will be created for managing these settings.

* **Controller:** `SpacedRepetitionController`
* **Endpoints:**
    * `GET /api/edu/srs/parameters`: Fetches the current actor's FSRS parameters.
    * `PUT /api/edu/srs/parameters`: Updates the current actor's FSRS parameters.
* **DTO to Create:** `src/features/educationpub/dto/update-fsrs-params.dto.ts`

### 2.3. Learning Analytics Dashboard

This feature provides the backend endpoints needed to power a user-facing analytics dashboard.

#### a. New Service Methods

New methods will be added to the `SpacedRepetitionService` to compute analytics data.

* **File to Update:** `src/features/educationpub/services/spaced-repetition.service.ts`
* **New Methods:**
    * `getWorkloadForecast(actorId: string)`: Queries the `SpacedRepetitionSchedule` table to count the number of cards due on each of the next 30 days.
    * `getRetentionRate(actorId: string)`: Analyzes the `ReviewLog` to calculate the percentage of "Good" and "Easy" ratings over different time periods.
    * `getAnalyticsSummary(actorId: string)`: A composite method that calls the other analytics methods to return all data in a single payload.

#### b. New API Endpoint

A new endpoint will expose the analytics data.

* **Controller:** A new `AnalyticsController` could be created or it could be added to the `SpacedRepetitionController`.
* **Endpoint:** `GET /api/edu/srs/analytics/summary`
* **Response Shape:**
    ```json
    {
      "retention": {
        "past_7_days": 0.92,
        "past_30_days": 0.88
      },
      "forecast": [
        { "date": "2025-07-31", "count": 15 },
        { "date": "2025-08-01", "count": 22 }
      ],
      "totalCardsInLearning": 250
    }
    ```

### 2.4. Module Integration

* **File to Update:** `src/features/educationpub/educationpub.module.ts`
* **Changes:**
    * Add `ActorFsrsParameters` to the `TypeOrmModule.forFeature([...])` array.

## 3. Testing Strategy

* **Unit Tests:**
    * Update `spaced-repetition.service.spec.ts` to test the new collection filtering logic and the new analytics calculation methods.
    * Create tests for the new `PUT /api/edu/srs/parameters` logic, ensuring custom parameters are correctly passed to the `FSRSLogic` service.
* **End-to-End (E2E) Tests:**
    * Update the `GET /due` test to verify that the `collectionId` query parameter correctly filters the results.
    * Add new E2E tests for the `GET /parameters`, `PUT /parameters`, and `GET /analytics/summary` endpoints to ensure they are secure and return data in the expected format.

## Related Documents
* [The FSRS v4 Algorithm A Comprehensive Technical Report on its Mechanics, Implementation, and Optimization](/docs/implementation/research/research-report/The%20FSRS%20v4%20Algorithm)
* [Spaced Repetition Feature: Planning & Implementation Plan](./summary.md)
* [SRS Feature: Phase 1 Backend Implementation Plan](./phase1.md)
* [SRS Feature: Phase 2 Frontend Implementation Plan](./phase2.md)
