---
title: Phase 3
sidebar_position: 3
---

# **Phase 3: Community-Derived Complexity (CDC) Algorithm**

### **1\. Summary**

This phase is the analytical core of the project. We will build the background service that implements the Community-Derived Complexity (CDC) algorithm as described in the research. This service will consume the vast amount of data from the review_logs table and the personalized actor data from Phase 2\. It will execute a sophisticated, multi-step pipeline to distill this information into a single, robust "difficulty score" (cdc_score) for every concept in the knowledge graph.

### **2\. Goals**

* To create a new, scalable background processing module for the CDC calculation.  
* To implement the DSignal formula to quantify the difficulty of a single review.  
* To implement the LearnerReputation model to weight the quality of each actor's data.  
* To implement the time-weighted aggregation and weighted median statistics to combine signals robustly.  
* To implement the in-memory graph propagation algorithm to add contextual difficulty.  
* To successfully save the final cdc_score as a property on the appropriate Node entities.

### **3\. Dependencies**

* **Internal:** ActorEntity, ReviewLogEntity, Node, Edge, ConfigService, BullMQ.  
* **External:** None. This phase involves complex algorithmic logic but relies on existing libraries.

### **4\. Implementation Details**

Action 3.1: Create the Complexity Module  
Create a new feature module at src/features/complexity. This module will define a BullMQ queue named complexity and contain the ComplexityService, ComplexityProcessor, and ComplexityScheduler.  
Action 3.2: Implement ComplexityService  
This service will orchestrate the full CDC pipeline.  
```typescript
// In src/features/complexity/services/complexity.service.ts  
@Injectable()  
export class ComplexityService {  
  constructor(  
    private readonly configService: ConfigService,  
    private readonly dataSource: DataSource,  
    // ... Repositories  
  ) {}

  async calculateAndApplyCDC() {  
    // 1\. Fetch all review logs within a relevant time window.  
    // 2\. For each log, calculate its DSignal score.  
    const dSignalScores = await this.calculateAllDSignals();

    // 3\. Aggregate DSignal scores per actor-node pair using time-weighted average.  
    const actorNodeDifficulties = this.aggregateDSignals(dSignalScores);

    // 4\. Calculate the InitialNodeComplexity for each node using the Learner Reputation model and weighted median.  
    const initialComplexities = await this.calculateInitialNodeComplexity(actorNodeDifficulties);  
      
    // 5\. Fetch the knowledge graph into memory.  
    const graph = await this.fetchGraphInMemory();

    // 6\. Run the iterative graph propagation algorithm.  
    const finalCdcScores = this.runGraphPropagation(graph, initialComplexities);

    // 7\. Save the final scores back to the Node entities.  
    await this.saveCdcScoresToNodes(finalCdcScores);  
  }

  private calculateDSignal(log: ReviewLogEntity): number { /* ... */ }  
  private calculateReputation(actor: ActorEntity, reviewCount: number): number { /* ... */ }  
  // ... other helper methods  
}
```

Action 3.3: Implement In-Memory Graph Propagation  
As per the research recommendation, the graph traversal will be done in the application tier.  
```typescript
// In ComplexityService.ts  
private runGraphPropagation(graph: { nodes: Node[], edges: Edge[] }, initialScores: Map<string, number\>): Map<string, number\> {  
    const alpha = this.configService.get<number\>('complexity.propagationAlpha');  
    let currentScores = new Map(initialScores);

    // Create efficient lookups for graph traversal  
    const adjacencyList = new Map<string, { targetId: string, weight: number }[]\>();  
    for (const edge of graph.edges) {  
        // ... build adjacency list ...  
    }

    for (let i = 0; i < 10; i++) { // Iterate a fixed number of times or until convergence  
        const nextScores = new Map<string, number\>();  
        for (const node of graph.nodes) {  
            const initialScore = initialScores.get(node.id) || 0;  
            let neighborInfluence = 0;  
            const neighbors = adjacencyList.get(node.id) || [];  
            if (neighbors.length \> 0\) {  
                const totalWeight = neighbors.reduce((sum, n) => sum \+ n.weight, 0);  
                neighborInfluence = neighbors.reduce((sum, n) => {  
                    return sum \+ (currentScores.get(n.targetId) || 0\) \* (n.weight / totalWeight);  
                }, 0);  
            }  
            const newScore = (1 \- alpha) \* initialScore \+ alpha \* neighborInfluence;  
            nextScores.set(node.id, newScore);  
        }  
        currentScores = nextScores;  
    }  
    return currentScores;  
}
```

### **5\. Acceptance Criteria**

* [ ] The new ComplexityModule is created and integrated into the main AppModule.  
* [ ] The scheduled job successfully adds a CDC calculation task to the complexity queue.  
* [ ] A worker process can consume the job and execute the full CDC pipeline without errors.  
* [ ] After the job completes, the properties field of the relevant Node entities in the database are updated with a cdc_score (e.g., `{ "cdc_score": 0.78 }`).