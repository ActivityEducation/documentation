---
title: Phase 1
sidebar_position: 1
---

# **Phase 1: Configuration & Foundational Data Layer**

### **1\. Summary**

This phase is the foundational prerequisite for the entire project. Its purpose is to prepare the application's infrastructure to support the new intelligent learning features. We will achieve this by first centralizing all new tunable parameters within the existing configuration system, ensuring maintainability. Second, and most critically, we will enhance our core database entities to capture the rich, detailed data required by the FSRS Optimization and CDC algorithms.

### **2\. Goals**

* To establish a single source of truth for all new algorithmic parameters.  
* To modify the database schema to store personalized FSRS data for each actor.  
* To enhance the ReviewLogEntity to capture the complete "before and after" state of every review event.  
* To update the SpacedRepetitionService to correctly populate this new, richer data model.

### **3\. Dependencies**

* **Internal:** src/shared/config/index.ts, src/features/activitypub/entities/actor.entity.ts, src/features/educationpub/entities/review-log.entity.ts, src/features/educationpub/services/spaced-repetition.service.ts.  
* **External:** None. This phase involves changes to existing internal code only.

### **4\. Implementation Details**

Action 1.1: Add New Configuration Parameters  
Modify src/shared/config/index.ts to include a new top-level complexity and fsrs key, centralizing all tunable parameters as recommended by the research.  

```typescript
// In src/shared/config/index.ts  
export const configuration = () => ({  
  // ... existing configuration  
  complexity: {  
    dsignal: { /* ... weights ... */ },  
    reputation: { /* ... weights ... */ },  
    propagationAlpha: 0.85,  
    timeDecayLambda: 0.01,  
  },  
  fsrs: {  
    defaultWeights: [ /* ... */ ],  
    requestRetention: 0.9,  
    decay: \-0.5,  
    minReviewsForOptimization: 200,  
  }  
});
```

Action 1.2: Enhance ActorEntity  
Add two new columns to src/features/activitypub/entities/actor.entity.ts to store the results from the future FSRS Optimization service.  
```typescript
// In src/features/activitypub/entities/actor.entity.ts  
// ...  
@Column({ type: 'jsonb', nullable: true, comment: "Personalized FSRS weights (w0-w16) for this actor." })  
fsrs_parameters: Record<string, any>;

@Column('float', { nullable: true, comment: "The log-loss of the FSRS model fit, indicating review consistency." })  
fsrs_log_loss: number;
```

Action 1.3: Enhance ReviewLogEntity  
Modify src/features/educationpub/entities/review-log.entity.ts to replace the simple state column with two jsonb columns that capture the full before/after snapshot.  
```typescript
// In src/features/educationpub/entities/review-log.entity.ts  
// ...  
@Column({ type: 'jsonb', comment: "Snapshot of the memory state before the review." })  
previousState: {  
  difficulty: number;  
  stability: number;  
  retrievability: number;  
};

@Column({ type: 'jsonb', comment: "Snapshot of the memory state after the review." })  
state: { stability: number; difficulty: number };
```

Action 1.4: Update SpacedRepetitionService  
Modify processReview in src/features/educationpub/services/spaced-repetition.service.ts to populate these new fields.  
```typescript
// In SpacedRepetitionService.ts  
// ... inside processReview  
const logEntry = this.reviewLogRepository.create({ /* ... */ });  
if (!schedule) {  
    // First review  
    logEntry.previousState = { difficulty: 1, stability: 0, retrievability: 1 };  
    // ...  
} else {  
    // Subsequent review  
    const elapsedDays = /* ... calculate elapsed days ... */;  
    logEntry.previousState = {  
        difficulty: schedule.difficulty,  
        stability: schedule.stability,  
        retrievability: this.fsrsLogic.calculateRetrievability(schedule.stability, elapsedDays)  
    };  
    // ...  
}  
logEntry.state = { stability: schedule.stability, difficulty: schedule.difficulty };  
await this.reviewLogRepository.save(logEntry);
```

### **5\. Acceptance Criteria**

* [ ] The new complexity and fsrs configurations are accessible via the ConfigService.  
* [ ] The database schema for the actors and review_logs tables is successfully migrated to include the new columns.  
* [ ] After a user review is processed, the new review_logs entry correctly contains both the previousState and state JSON objects with the appropriate data.