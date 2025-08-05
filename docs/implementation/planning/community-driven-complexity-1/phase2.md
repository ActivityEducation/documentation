---
title: Phase 2
sidebar_position: 2
---

# **Phase 2: FSRS Parameter Optimization**

### **1\. Summary**

This phase addresses a critical prerequisite identified in the research: the need for personalized FSRS parameters. The goal is to build a new, independent background service that can analyze an individual actor's complete review history and compute the optimal set of FSRS weights that best models their unique memory patterns. The output of this phase—personalized weights and a log-loss score for each actor—is the essential input for the Learner Reputation model in Phase 3\.

### **2\. Goals**

* To create a new, scalable background processing module for FSRS optimization.  
* To integrate the recommended high-performance, Rust-based FSRS optimizer (fsrs-rs).  
* To develop a service that can format review data, run the optimization, and save the results.  
* To implement a scheduling mechanism to periodically run these optimizations for active actors.

### **3\. Dependencies**

* **Internal:** ActorEntity, ReviewLogEntity, ConfigService, BullMQ (@nestjs/bullmq).  
* **External:** fsrs-rs-nodejs (NPM package). This is the Node.js binding for the Rust optimizer and must be added to package.json.

### **4\. Implementation Details**

Action 2.1: Create the FsrsOptimization Module  
Create a new feature module at src/features/fsrs-optimization. This module will define a new BullMQ queue named fsrs-optimization and contain the necessary service, processor, and scheduler.  
```typescript
// In src/features/fsrs-optimization/fsrs-optimization.module.ts  
@Module({  
  imports: [  
    TypeOrmModule.forFeature([ActorEntity, ReviewLogEntity]),  
    BullModule.registerQueue({ name: 'fsrs-optimization' }),  
  ],  
  providers: [FsrsOptimizationService, FsrsOptimizationProcessor, FsrsOptimizationScheduler],  
})  
export class FsrsOptimizationModule {}
```

Action 2.2: Implement FsrsOptimizationService  
This service will contain the core logic. It will be a wrapper around the fsrs-rs-nodejs library.  
```typescript
// In src/features/fsrs-optimization/services/fsrs-optimization.service.ts  
import { FSRS } from 'fsrs-rs-nodejs';

@Injectable()  
export class FsrsOptimizationService {  
  constructor(  
    private readonly configService: ConfigService,  
    @InjectRepository(ActorEntity) private actorRepository: Repository<ActorEntity\>,  
    @InjectRepository(ReviewLogEntity) private reviewLogRepository: Repository<ReviewLogEntity\>,  
  ) {}

  async optimizeForActor(actorId: string) {  
    const minReviews = this.configService.get<number\>('fsrs.minReviewsForOptimization');  
    const reviewHistory = await this.reviewLogRepository.find({ where: { actor: { id: actorId } }, order: { reviewed_at: 'ASC' } });  
    if (reviewHistory.length < minReviews) return;

    // 1\. Format the review history into the structure expected by the fsrs-rs library.  
    const trainingSet = reviewHistory.map(log => ({ /* ... map to FSRS log format ... */ }));

    // 2\. Instantiate the FSRS optimizer and run the computation.  
    const fsrs = new FSRS();  
    const { weights, loss } = fsrs.computeParameters(trainingSet);

    // 3\. Save the results to the ActorEntity.  
    await this.actorRepository.update(actorId, {  
        fsrs_parameters: { weights },  
        fsrs_log_loss: loss,  
    });  
  }  
}
```

**Action 2.3: Implement the BullMQ Processor and Scheduler**

* **FsrsOptimizationProcessor**: A standard BullMQ processor that injects FsrsOptimizationService and calls the optimizeForActor method for each job.  
* **FsrsOptimizationScheduler**: A service that uses @nestjs/schedule (e.g., with a @Cron() decorator) to periodically query for active actors who have completed enough new reviews since their last optimization and adds their IDs to the fsrs-optimization queue.

### **5\. Acceptance Criteria**

* [ ] The fsrs-rs-nodejs package is successfully added as a project dependency.  
* [ ] The new FsrsOptimizationModule is created and integrated into the main AppModule.  
* [ ] The scheduled job successfully adds optimization tasks to the BullMQ queue.  
* [ ] A worker process can consume a job from the queue, execute the optimization, and successfully update the fsrs_parameters and fsrs_log_loss columns for the target ActorEntity in the database.