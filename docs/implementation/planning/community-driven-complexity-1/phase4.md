---
title: Phase 4
sidebar_position: 4
---

# **Phase 4: Complexity-Adjusted Initial Scheduling (CAIS)**

### **1\. Summary**

This phase is where the analytical work from the preceding phases translates into a direct, tangible benefit for the user. We will implement the Complexity-Adjusted Initial Scheduling (CAIS) algorithm. This involves making minor but critical modifications to the existing Spaced Repetition System. When an actor reviews a flashcard for the first time, the system will now look up the concept's cdc_score from the knowledge graph and use it to adjust the initial FSRS parameters, providing a more intelligent and appropriate first review interval.

### **2\. Goals**

* To modify the FSRSLogic service to accept an optional cdc_score.  
* To implement the logic that maps a cdc_score to FSRS parameter modifiers.  
* To update the SpacedRepetitionService to fetch the cdc_score for new cards.  
* To ensure the system gracefully handles cases where a cdc_score is not yet available for a concept.

### **3\. Dependencies**

* **Internal:** FSRSLogic, SpacedRepetitionService, KnowledgeGraphService.  
* **External:** None.

### **4\. Implementation Details**

Action 4.1: Modify FSRSLogic  
Update the calculateInitialState method in src/features/educationpub/services/fsrs.logic.ts to accept the optional cdc_score and personalized parameters.  
```typescript
// In src/features/educationpub/services/fsrs.logic.ts  
public calculateInitialState(rating: Rating, cdc_score?: number, params?: Record<string, any\>): { stability: number; difficulty: number } {  
    const weights = params?.weights || this.configService.get<number[]\>('fsrs.defaultWeights');  
    let initialDifficulty = weights[4] \- (rating \- 3\) \* weights[5];  
    let initialStability = weights[rating \- 1];

    if (cdc_score !== undefined) {  
        const { d_modifier, s_modifier } = this.getComplexityModifiers(cdc_score);  
        initialDifficulty \*= d_modifier;  
        initialStability \*= s_modifier;  
    }

    const clampedDifficulty = Math.min(Math.max(initialDifficulty, 1), 10);  
    return { stability: initialStability, difficulty: clampedDifficulty };  
}

private getComplexityModifiers(cdc_score: number): { d_modifier: number, s_modifier: number } {  
    if (cdc_score \> 0.7) return { d_modifier: 1.2, s_modifier: 0.7 }; // High Complexity  
    if (cdc_score < 0.3) return { d_modifier: 0.8, s_modifier: 1.5 }; // Low Complexity  
    return { d_modifier: 1.0, s_modifier: 1.0 }; // Medium Complexity  
}
```

Action 4.2: Integrate CAIS into SpacedRepetitionService  
Modify the processReview method in src/features/educationpub/services/spaced-repetition.service.ts to fetch the cdc_score when a card is new.  
```typescript
// In SpacedRepetitionService  
// Make sure KnowledgeGraphService is injected in the constructor  
constructor(private readonly knowledgeGraphService: KnowledgeGraphService, /* ... */) {}

// ... inside processReview  
if (!schedule) { // This is the first review for this actor-flashcard pair.  
    let cdc_score: number | undefined;  
    try {  
        // Find the corresponding node in the knowledge graph  
        const node = await this.knowledgeGraphService.findNodeByProperties('Flashcard', { flashcardId: flashcard.activityPubId });  
        if (node && node.properties.cdc_score) {  
            cdc_score = node.properties.cdc_score;  
        }  
    } catch (error) {  
        this.logger.warn(\`Could not retrieve cdc_score for flashcard ${flashcard.activityPubId}. Using default schedule.\`);  
    }  
      
    const params = actor.fsrs_parameters || undefined;  
    const initialState = this.fsrsLogic.calculateInitialState(rating, cdc_score, params);  
    // ... create new schedule using initialState ...  
}
```

### **5\. Acceptance Criteria**

* [ ] The FSRSLogic.calculateInitialState method is updated to correctly apply modifiers based on a given cdc_score.  
* [ ] When an actor reviews a card for the first time, the SpacedRepetitionService attempts to fetch the cdc_score.  
* [ ] If a cdc_score is found, the initial stability and difficulty of the SpacedRepetitionScheduleEntity are different from the default values.  
* [ ] If a cdc_score is not found (e.g., for a brand new concept), the review process completes successfully using the default FSRS logic without errors.