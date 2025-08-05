---
title: Phase 5
sidebar_position: 5
---

# **Phase 5: Deployment, Monitoring & Future Iteration**

### **1\. Summary**

This final phase ensures that the powerful new features are deployed smoothly, are observable in production, and have a clear path for future improvement. The primary activities include creating a database migration plan, establishing a monitoring and alerting strategy for the new background jobs, and formally creating a backlog of future research items to continue evolving the platform's intelligence.

### **2\. Goals**

* To define a safe and reliable database migration strategy.  
* To implement a monitoring solution to track the health and performance of the new background queues and jobs.  
* To create a project backlog for the advanced features and research paths identified in the source documents.

### **3\. Dependencies**

* **Internal:** All new modules (FsrsOptimizationModule, ComplexityModule).  
* **External:** A monitoring tool like **Prometheus** and a visualization tool like **Grafana** are highly recommended. A library like prom-client can be used to expose metrics from the NestJS application.

### **4\. Implementation Details**

**Action 5.1: Database Migration and Scalability Plan**

* **Schema Migrations:** Create TypeORM migration scripts for the changes to ActorEntity and ReviewLogEntity. These scripts must be tested thoroughly in a staging environment.  
* **Table Partitioning:** This is a critical, non-trivial database operation. A detailed plan must be created to partition the existing review_logs table. This will likely involve:  
  1. Creating a new partitioned table with the desired monthly partitions.  
  2. Setting up a trigger to copy new writes to both the old and new tables.  
  3. Back-filling the new partitioned table with historical data from the old table in batches.  
  4. Once in sync, switching the application to read/write exclusively to the new table in a single atomic deployment.  
  5. Dropping the old table.

**Action 5.2: Monitoring and Alerting**

* **Expose Metrics:** Integrate the prom-client library into the application. Create a /metrics endpoint that Prometheus can scrape.  
* **Key Metrics to Track:**  
  * `bullmq_queue_size{queue="fsrs-optimization"}`
  * `bullmq_queue_size{queue="complexity"}`
  * `fsrs_optimization_jobs_processed_total (Counter)`  
  * `fsrs_optimization_job_duration_seconds (Histogram)`  
  * `cdc_calculation_job_duration_seconds (Histogram)`  
  * `jobs_failed_total{queue="fsrs-optimization"} (Counter)`  
* **Grafana Dashboard:** Create a new dashboard in Grafana to visualize these metrics.  
* **Alerting:** Set up alerts in Prometheus/Alertmanager to notify the team of critical issues, such as a queue growing uncontrollably or a high rate of job failures.

Action 5.3: Create Project Backlog  
Formally create tickets or user stories in your project management tool for the "Avenues for Future Research" identified in the research documents. This ensures these valuable ideas are not lost.

* **Backlog Item 1:** Disentangling Inherent vs. Instructional Difficulty.  
* **Backlog Item 2:** Modeling Dynamic Complexity and Concept Drift.  
* **Backlog Item 3:** A/B Testing the Personalization-Community Trade-off.  
* **Backlog Item 4:** Advanced Learner Clustering.  
* **Backlog Item 5:** Leveraging Edge Properties for Dynamic Graph Propagation.

### **5\. Acceptance Criteria**

* [ ] All database schema changes are successfully applied to the production database via migration scripts.  
* [ ] The review_logs table is successfully partitioned by month without data loss.  
* [ ] A Grafana dashboard is created and is successfully displaying real-time metrics from the new BullMQ queues.  
* [ ] Alerts are configured and tested to ensure they fire under failure conditions.  
* [ ] At least five new items corresponding to the future research paths have been created in the project backlog.