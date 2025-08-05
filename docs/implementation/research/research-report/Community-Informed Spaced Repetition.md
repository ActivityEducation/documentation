---
title: Community-Informed Spaced Repetition
---

# **A Framework for Community-Informed Spaced Repetition: Calculating and Applying Relative Concept Complexity in a Knowledge Graph**

## **Executive Summary**

Spaced Repetition Systems (SRS), particularly those powered by the Free Spaced Repetition Scheduler (FSRS) algorithm, have demonstrated remarkable efficacy in optimizing individual learning by personalizing review schedules based on memory models. However, these systems operate in an information vacuum when a user first encounters new material—a classic "cold start" problem. They must wait for a user to fail before they can adapt, leading to inefficient initial learning cycles. This report presents a novel framework to transcend this limitation by integrating collective intelligence from an entire community of learners into the FSRS model. By analyzing the aggregated review histories of all users within the context of a structured knowledge graph, the system can proactively identify which concepts are "hard" for the majority of people.  
This report details a complete technical blueprint for a system that calculates and applies a "relative complexity" score to concepts. It introduces two primary, formally-defined algorithms. The first, **Community-Derived Complexity (CDC)**, is a sophisticated, multi-stage process that synthesizes a robust difficulty signal from community-wide FSRS review data. It moves beyond simple averages, employing time-weighted aggregation, a learner reputation model, robust statistical methods like the weighted median, and a graph-based propagation step to compute a nuanced complexity score for every concept in the knowledge graph. The second algorithm, **Complexity-Adjusted Initial Scheduling (CAIS)**, leverages this CDC score to address the cold-start problem directly. It provides a "smart default" by adjusting the initial FSRS parameters for new flashcards based on their community-vetted difficulty, giving learners a more optimized starting point.  
The proposed solution is architected for a NodeJS/NestJS environment with a PostgreSQL backend, utilizing standard SQL features like recursive queries for graph analysis. The framework is designed to be both powerful and practical, decoupling computationally intensive complexity calculations into asynchronous batch jobs while enabling real-time application of the results. By transforming individual memory data into collective insight, this framework represents a paradigm shift from a purely reactive, individual-centric SRS to a proactive, community-enhanced learning ecosystem. It not only promises to make learning more efficient but also provides a powerful analytical lens to understand the inherent difficulty of knowledge itself.

## **Section 1: Foundational Models: FSRS and Knowledge Graphs**

To construct a system that leverages community learning patterns, it is essential to first establish a deep understanding of the two foundational components: the FSRS v4 algorithm, which generates the raw data of individual cognitive performance, and the knowledge graph, which provides the structural context for the information being learned. These two elements, when combined, form a powerful substrate for higher-order analysis.

### **1.1 Deconstructing the FSRS v4 Memory Model: From Scheduling to Signal**

The FSRS algorithm, in its v4 and subsequent iterations, represents a significant advancement over traditional, static-interval SRS like SM-2.1 Its power stems from a dynamic, three-component model of memory, often referred to as the DSR model, which asserts that the state of a memory can be described by three key variables.3 For our purposes, it is crucial to reframe these variables not merely as internal cogs in a scheduling machine, but as a rich, multi-dimensional signal of a user's cognitive engagement with a piece of information.

#### **Core Concepts: Difficulty, Stability, and Retrievability**

* **Difficulty (D):** This parameter represents the inherent complexity of a piece of information for a specific *individual*. It is a value clamped between 1 (easiest) and 10 (hardest).6 When a user reviews a card, the Difficulty is updated based on their self-assessed grade. An "Again" rating causes a large increase in D, "Hard" a small increase, "Good" causes no change, and "Easy" causes a small decrease.6 A crucial nuance of the FSRS model is that Difficulty exhibits mean reversion. If a user consistently rates a card as "Good," its D value will gradually converge toward a default, optimizable parameter.6 This means D reflects a user's  
  *current* assessment of difficulty, which can change over time, rather than a permanent, historical record of struggle. The formula for updating Difficulty after the first review incorporates this mean reversion and a "linear damping" effect that makes updates smaller as D approaches its maximum value.4  
* **Stability (S):** This is arguably the most important variable in FSRS, representing the strength of a memory. It is formally defined as the time, measured in days, required for the probability of recalling an item (Retrievability) to decrease from 100% to 90%.3 A card with an S of 30 days is considered much more stable than one with an S of 2 days. After a successful review (Hard, Good, or Easy), Stability increases; it is multiplied by a factor called  
  SInc (Stability Increase) which is always greater than or equal to 1\.6 The magnitude of this increase is not constant; it is governed by several principles derived from memory research:  
  * Higher Difficulty (D) leads to a smaller increase in Stability.5  
  * Higher current Stability (S) leads to a smaller relative increase, a phenomenon known as stabilization decay.5  
  * Lower Retrievability (R) at the time of a successful review leads to a larger increase in Stability.5

    This complex interaction means that the growth of S is a powerful indirect signal of how well a memory is being consolidated.  
* **Retrievability (R):** This is the calculated probability, from 0 to 1, that a user can successfully recall an item at a specific moment in time.3 It is a function of the time elapsed since the last review and the card's current Stability (S). FSRS v4 and later versions use a power function to model the forgetting curve, as it provides a better fit to real-world data than the exponential functions used in earlier models.6 The formula is approximately  
  R(t)=(1+S⋅kt​)−p, where t is time, S is stability, and k and p are derived from the model's parameters.4 The primary goal of the FSRS scheduler is to schedule the next review for the date when  
  R is predicted to drop to a user-defined *desired retention* level, typically 90%.4

#### **The FSRS Feedback Loop**

The entire system is driven by user feedback in the form of four grades for each review: 1 \= Again, 2 \= Hard, 3 \= Good, 4 \= Easy.4 This feedback is the direct input that triggers the recalculation of a card's Difficulty and Stability. A rating of "Again" is considered a memory lapse and triggers a different, more punitive update formula for Stability than the three "success" grades.3 This establishes a clear, causal link between a user's subjective experience (the grade) and the objective state of their memory model (the D, S, and R values).

#### **FSRS Parameters**

The genius of FSRS lies in its adaptability. The formulas for updating D and S are not fixed; they contain a set of optimizable parameters (often denoted as w\_0, w\_1,..., w\_16 or more in newer versions).4 These parameters are "learned" by analyzing a user's entire review history and finding the values that minimize a loss function (typically log-loss or binary cross-entropy) between the model's predicted recall probabilities and the actual review outcomes.6 This optimization process, often performed using a tool like the FSRS4Anki Optimizer, tunes the algorithm to an individual's unique memory patterns.11 The existence of these personalized parameters confirms that FSRS is fundamentally an individual-centric model, which provides the baseline we seek to enhance with community data. The quality of this fit, measured by the final log-loss, can also serve as a proxy for how "predictable" a learner is, a concept that will become critical in our community aggregation algorithm.

### **1.2 The Knowledge Graph as a Learning Substrate**

The second pillar of the system is the knowledge graph, which provides the structural context for the concepts being learned. While FSRS models the user's interaction with discrete pieces of information (flashcards), the knowledge graph models the relationships *between* those pieces of information.

#### **Data Model in PostgreSQL**

The user's system utilizes a Node and Edge table structure in PostgreSQL, a common and effective way to represent a property graph in a relational database.13

* **Nodes:** These represent the entities in the learning domain, such as individual concepts, facts, or vocabulary words. Each flashcard in the system corresponds to a Node.  
* **Edges:** These represent directed relationships between nodes. Examples could include is\_prerequisite\_for, is\_example\_of, is\_part\_of, or simply is\_related\_to. These relationships are not merely navigational links; they represent a potential flow of cognitive load. Understanding concept B may depend on having first mastered concept A.  
* **Properties:** The use of jsonb columns for properties on both nodes and edges allows for a flexible and schema-less way to store attributes.14

For this project's architecture, a crucial best practice is to separate the transactional review data from the static graph structure. While a flashcard is a Node, a user's review history for that card should not be stored directly in the jsonb column of the Node or the Actor (user) node. Instead, a dedicated ReviewLog table should be created, linking ActorID and NodeID with the details of each review (timestamp, grade, and the resulting D, S, R values). This normalized structure is far more efficient for the large-scale aggregation queries required by the CDC algorithm. The jsonb column on the Node table is the ideal location to store the *output* of our analysis: the final, calculated Community-Derived Complexity score.

#### **Querying the Graph**

A common misconception is that sophisticated graph analysis requires specialized graph databases like Neo4j or extensions like Apache AGE or pgRouting.14 While these tools are powerful, many essential graph operations can be performed directly within standard PostgreSQL using recursive Common Table Expressions (CTEs). A  
WITH RECURSIVE query allows for the traversal of hierarchical or graph-like data, such as finding all concepts connected to a given concept, which is a fundamental prerequisite for the graph-based propagation algorithm proposed in the next section.14 This approach respects the user's technical constraints and avoids introducing additional dependencies until they are strictly necessary for performance at extreme scale. The knowledge graph is thus not a passive repository of content but an active, queryable network that can reveal how the difficulty of one concept might influence another.

## **Section 2: Algorithm for Calculating Community-Derived Complexity (CDC)**

The central challenge is to distill the millions of individual, noisy review events into a single, reliable "complexity" score for each concept node in the knowledge graph. A naive approach, such as averaging the Difficulty parameter across all users, would be deeply flawed. It would ignore the rich, multi-dimensional nature of the FSRS signal and be highly susceptible to statistical artifacts. This section details a novel, four-step algorithm, the Community-Derived Complexity (CDC) algorithm, designed to compute a robust, nuanced, and context-aware complexity score.

### **2.1 Step 1: Defining a Per-Review "Difficulty Signal"**

The FSRS Difficulty (D) parameter is an important but insufficient metric. Its mean-reverting nature means it reflects a user's *current* state of learning, not the cumulative effort or struggle over time.6 A user who initially found a concept extremely difficult but has now mastered it might have a moderate D value, hiding the true learning journey. To capture this history, we must define a more comprehensive signal for each individual review.  
We propose a composite signal, DSignal, calculated for every single review in a user's history for a given card. This signal synthesizes multiple facets of the FSRS model to produce a richer measure of cognitive load at that moment.  
DSignal is a weighted combination of three components:

1. **Grade Penalty:** The user's grade is the most direct and explicit signal of difficulty. A grade of "Again" (value 1\) represents a memory lapse and is a much stronger indicator of difficulty than "Hard" (value 2).4 We can define a penalty function,  
   Grade\_penalty(grade), that maps the four grades to a numerical penalty, with "Again" receiving the highest value.  
2. **Stability Gain Deficit:** The increase in Stability (S) after a successful review is a powerful indicator of memory consolidation. For a given Difficulty and current Stability, FSRS predicts an expected Stability gain. If the actual gain is smaller than expected, it implies the material was harder to consolidate than the model anticipated.4 We can quantify this as a  
   Stability\_gain\_deficit, representing the normalized difference between the expected and actual increase in S. A large deficit is a strong signal of underlying difficulty.  
3. **Retrievability Surprise:** The context of a review matters. Forgetting a card when its Retrievability (R) was predicted to be high (e.g., 95%) is a significant "surprise" and indicates the memory was far weaker than the model believed. Conversely, successfully recalling a card when R was very low (e.g., 60%) is a sign of unexpected ease.8 This  
   Retrievability\_surprise can be modeled as a function of the predicted R and the actual outcome (success/lapse), adding another layer of nuance.

These components can be combined into a formal definition for the difficulty signal of a single review i:  
DSignali​=w1​⋅GradePenalty(gi​)+w2​⋅StabilityGainDeficit(Si−1​,Di−1​,gi​)+w3​⋅RetrievabilitySurprise(Ri​,outcomei​)  
The weights (w1​,w2​,w3​) are heuristic constants that can be tuned to balance the influence of the explicit user grade against the implicit signals from the memory model's state changes. This composite signal provides a far richer and more robust measure of the cognitive load of a single review than any one FSRS parameter alone.

### **2.2 Step 2: Aggregating Signals at the User-Node Level**

For each user-node pair (i.e., each user's history with a specific flashcard), we must aggregate their time-series of DSignal values into a single summary score, the UserNodeDifficulty. A simple arithmetic mean is problematic because it treats a review from a year ago with the same importance as a review from yesterday. A user may have struggled initially but has since achieved mastery; their current understanding is more relevant than their past struggles.  
To account for this, we propose a **time-weighted aggregation** using an exponential decay function. More recent reviews should contribute more significantly to the final UserNodeDifficulty score. This principle of recency weighting is already used in some advanced FSRS optimization techniques to allow the model to adapt more quickly to a user's evolving memory patterns.10  
The formula for UserNodeDifficulty for a user u and node n would be:  
UserNodeDifficultyu,n​=∑i=1k​e−λ(tnow​−ti​)∑i=1k​DSignali​⋅e−λ(tnow​−ti​)​  
Where:

* k is the total number of reviews for that user-node pair.  
* DSignali​ is the difficulty signal of the i-th review.  
* tnow​ is the current timestamp.  
* ti​ is the timestamp of the i-th review.  
* λ is a decay constant that controls how quickly the influence of older reviews diminishes. A larger λ places more emphasis on recent activity.

This aggregation method produces a score that reflects a user's *current, time-evolved* difficulty with a concept, rather than a simple historical average.

### **2.3 Step 3: Robustly Aggregating Community-Wide Difficulty**

The next step is to aggregate the UserNodeDifficulty scores from all users for a given node into a single, community-wide metric. As established in extensive literature on aggregating online reviews and user ratings, the simple arithmetic mean is a poor choice for this task.16 It is highly sensitive to outliers; a small number of users who struggle immensely for idiosyncratic reasons could dramatically inflate a concept's perceived complexity, making the metric unreliable.16  
To overcome this, we propose a more sophisticated aggregation strategy: the **Weighted Median**. This approach combines two powerful statistical ideas.

1. **Median for Robustness:** The median, which is the value that separates the higher half from the lower half of a data set, is inherently robust to outliers.17 An extremely high or low  
   UserNodeDifficulty score from one user will not skew the final result, providing a more accurate representation of the "typical" user experience.16  
2. **Weighting for Merit:** Not all user data is equally valuable or reliable. The principles of reputation systems suggest that feedback from more experienced and consistent participants should be given more weight.20 We therefore propose weighting each user's  
   UserNodeDifficulty score by a calculated **"Learner Reputation"** score. This score is a composite metric reflecting the quality and quantity of a user's data, derived from:  
   * **Total Reviews:** Users with a longer review history provide a more stable and reliable signal. Their data is based on more evidence.23  
   * **FSRS Model Fit:** The final log-loss from the user's personalized FSRS parameter optimization serves as an excellent proxy for their consistency. A lower log-loss indicates that the user's review behavior is highly predictable and consistent with the FSRS memory model, making their difficulty signals more trustworthy.6  
   * **User Tenure:** The length of time a user has been active on the platform can serve as a simple proxy for experience.

The final aggregated score for a node, its InitialNodeComplexity, is the weighted median of all UserNodeDifficulty scores for that node, where the weights are the LearnerReputation scores. This creates a meritocratic aggregation where the difficulty assessments of experienced, consistent learners have more influence, filtering out noise from new or erratic users and producing a much more reliable community signal.  
The following table illustrates the dramatic difference between using a simple mean and a weighted median for aggregation, demonstrating how the latter is robust to outliers.

| User ID | UserNodeDifficulty | Learner Reputation | Aggregation Method | Result |
| :---- | :---- | :---- | :---- | :---- |
| User A | 0.4 | 0.9 | **Simple Mean** | **0.55** |
| User B | 0.5 | 1.0 |  |  |
| User C | 0.45 | 0.8 |  |  |
| User D | 0.95 (Outlier) | 0.2 |  |  |
| User E | 0.42 | 0.85 |  |  |
| User A | 0.4 | 0.9 | **Median** | **0.45** |
| User B | 0.5 | 1.0 |  |  |
| User C | 0.45 | 0.8 |  |  |
| User D | 0.95 (Outlier) | 0.2 |  |  |
| User E | 0.42 | 0.85 |  |  |
| User A | 0.4 | 0.9 | **Weighted Median** | **\~0.44** |
| User B | 0.5 | 1.0 |  |  |
| User C | 0.45 | 0.8 |  |  |
| User D | 0.95 (Outlier) | 0.2 |  |  |
| User E | 0.42 | 0.85 |  |  |

*Table 2.1: Comparison of Aggregation Strategies for UserNodeDifficulty. The simple mean is heavily skewed by the outlier (User D). The median correctly identifies the central tendency. The weighted median further refines this by down-weighting the outlier's already minimal influence and giving more credence to the scores of high-reputation users (A and B).*

### **2.4 Step 4: Refining Complexity via Graph Propagation**

A concept's difficulty is not purely an intrinsic property; it is also contextual. A concept that depends on several difficult prerequisites is likely to be perceived as difficult itself. The knowledge graph's structure contains this crucial contextual information. The final step of the CDC algorithm is to refine the statistically derived complexity score by propagating influence through the graph.  
This step uses an iterative refinement algorithm inspired by graph-based ranking algorithms like PageRank 24 and message-passing systems like Belief Propagation.26 The core idea is that a node's final complexity is a blend of its own "intrinsic" difficulty (from Step 3\) and the difficulty "messages" it receives from its neighbors.  
The algorithm proceeds as follows:

1. **Initialization:** Each node n in the graph is assigned an initial complexity score, CDC0​(n), equal to the InitialNodeComplexity calculated in Step 3\.  
2. **Iteration:** For a fixed number of iterations, or until the scores converge, the complexity score of each node is updated based on its previous score and the scores of its neighbors. The update rule for node n at iteration k+1 is:  
   CDCk+1​(n)=(1−α)⋅CDC0​(n)+α⋅∑m∈Neighbors(n)​(∑j∈Neighbors(n)​w(m,j)w(m,n)​⋅CDCk​(m))  
   Where:  
   * CDCk​(m) is the complexity score of a neighboring node m at iteration k.  
   * α is a damping factor (analogous to the one in PageRank 25) between 0 and 1\. It controls the balance between a node's intrinsic complexity and the influence of its neighbors. A value of  
     α=0.3 might mean that 70% of the final score comes from the node's own aggregated review data and 30% comes from its graph context.  
   * w(m,n) is the weight of the edge from neighbor m to node n. This weight can be uniform (all neighbors have equal influence) or, more powerfully, can depend on the edge type stored in the edge's jsonb properties. For example, an edge of type is\_prerequisite\_for could have a higher weight than one of type is\_related\_to, signifying that prerequisite difficulty propagates more strongly. The term is normalized by the sum of weights of all outgoing edges from the neighbor m to ensure conservation of influence.  
3. **Final Score:** After the iterations complete, the resulting CDC(n) value for each node is the final **Community-Derived Complexity** score. This score is then normalized to a range of and stored in the node's jsonb properties for use by other parts of the system.

This propagation step is what fully integrates the FSRS data with the knowledge graph structure, producing a final complexity score that is both statistically robust and contextually aware.

### **2.5 The Complete Community-Derived Complexity (CDC) Algorithm Specification**

The complete CDC algorithm is a batch process that combines the four steps into a single data pipeline.

* **Inputs:**  
  1. The complete user ReviewLog table.  
  2. The Node and Edge tables defining the knowledge graph.  
  3. User metadata for calculating LearnerReputation.  
* **Process:**  
  1. **For each review in ReviewLog:** Calculate the DSignal score using the formula from Step 2.1.  
  2. **For each unique user-node pair:** Aggregate the historical DSignal scores into a single UserNodeDifficulty score using the time-weighted formula from Step 2.2.  
  3. For each node in the graph:  
     a. Calculate the LearnerReputation for every user who has reviewed that node.  
     b. Compute the InitialNodeComplexity by taking the weighted median of the UserNodeDifficulty scores, as described in Step 2.3.  
  4. **Initialize Graph Propagation:** Set the initial complexity of every node, CDC0​(n), to its InitialNodeComplexity.  
  5. **Run Iterative Refinement:** Execute the graph propagation algorithm from Step 2.4 for a set number of iterations.  
  6. **Finalize and Store:** Normalize the final CDC scores to a range and update the jsonb properties of each node in the Node table.  
* **Output:** An updated Node table where every node has a cdc\_score property reflecting its community-derived relative complexity.

## **Section 3: Algorithm for Complexity-Adjusted Initial Scheduling (CAIS)**

With a robust Community-Derived Complexity (CDC) score calculated for every concept node, the next step is to apply this knowledge to solve a practical problem. The most significant opportunity lies in addressing the "new item" cold-start problem inherent in FSRS. The Complexity-Adjusted Initial Scheduling (CAIS) algorithm is designed to use the community's collective experience to provide a more intelligent and personalized starting point for learners encountering new material.

### **3.1 Framing the Challenge: The "New Item" Cold Start Problem**

When a user reviews a flashcard for the very first time, the FSRS algorithm has no prior data for that specific user-card pair. By design, the initial state of the memory model—specifically the Initial Stability (S0​) and Initial Difficulty (D0​)—is determined solely by the user's very first grade on that card.4 For example, the initial stability is calculated as  
S0​(G)=wG−1​, where G is the grade and w are the user's personalized parameters.4  
This is a classic cold-start scenario, common in recommender systems where the system lacks sufficient data about a new user or new item to make personalized predictions.30 The FSRS system is purely  
*reactive*. It cannot know that the card "Pointer Arithmetic in C" is notoriously difficult for most beginners; it must wait for the user to rate it "Again" to learn this fact and adjust the schedule accordingly. This can lead to suboptimal first intervals: intervals that are too long for difficult concepts (leading to forgetting) or too short for easy ones (leading to unnecessary reviews).  
Our opportunity is to use the CDC score as a source of prior knowledge. The community has already learned, collectively, that "Pointer Arithmetic in C" is hard. The CAIS algorithm leverages this prior to make the FSRS model *proactive*, giving the user a better-tuned initial schedule from the very first review.

### **3.2 Mapping Community Complexity to FSRS Initial Parameters**

The CAIS algorithm works by modifying the initial FSRS parameters, S0​ and D0​, at the moment of the first review. The standard FSRS algorithm calculates these values based on the first grade; CAIS applies an adjustment factor to this result based on the card's CDC score.  
The mapping logic is intuitive:

* **High CDC Score (Difficult Concept):** A concept that the community finds difficult should be treated with more caution. This translates to:  
  * **Lowering Initial Stability (S0​):** A lower S0​ results in a shorter first review interval. The system schedules the card to be seen again sooner, reinforcing the fragile new memory before it is likely to be forgotten.  
  * **Increasing Initial Difficulty (D0​):** A higher initial D0​ tells the FSRS model that this card is inherently harder to learn. This has downstream effects, as higher Difficulty dampens future Stability increases, reflecting the principle that difficult material is harder to consolidate.5  
* **Low CDC Score (Easy Concept):** A concept the community finds easy can be scheduled more aggressively. This translates to:  
  * **Increasing Initial Stability (S0​):** A higher S0​ results in a longer first review interval, reducing the user's review burden for material they are likely to retain easily.  
  * **Lowering Initial Difficulty (D0​):** A lower initial D0​ signals that the material is easy to consolidate, allowing for larger Stability gains in subsequent reviews.

This mapping can be implemented either as a continuous function or, more simply and robustly, as a tier-based system. The continuous CDC score is mapped to discrete complexity tiers (e.g., Low, Medium, High), each with a predefined set of adjustment modifiers. This approach is easier to tune and interpret.  
The following table provides a concrete example of such a mapping. It shows how the abstract CDC score translates into tangible modifiers and, ultimately, a different user experience in the form of the first review interval.

| CDC Score Range | Complexity Tier | Initial D0​ Modifier | Initial S0​ Modifier | Example First "Good" Interval (days) |
| :---- | :---- | :---- | :---- | :---- |
| 0.0 – 0.3 | Low | D0,base​⋅0.8 | S0,base​⋅1.5 | \~4 |
| 0.3 – 0.7 | Medium | D0,base​⋅1.0 | S0,base​⋅1.0 | \~2.5 |
| 0.7 – 1.0 | High | D0,base​⋅1.2 | S0,base​⋅0.7 | \~1 |

*Table 3.1: Example Mapping of CDC Scores to FSRS Parameter Adjustments. D0,base​ and S0,base​ refer to the initial values calculated by the standard FSRS algorithm based on the user's first grade. The CAIS algorithm applies these modifiers to the base values. The example intervals are illustrative, based on typical default FSRS parameters.*  
A critical design principle of the CAIS algorithm is that it functions as a **"smart default," not a permanent override.** FSRS is powerful precisely because it personalizes to an individual's demonstrated memory patterns.3 The community data is an invaluable tool for the first step, but it must not supplant the user's own data in the long run. An expert in a field might find a "difficult" concept trivial, and a novice might struggle with an "easy" one. Therefore, the CAIS adjustment is applied  
*only* to the calculation of the very first review interval. From the second review onwards, the standard FSRS algorithm takes over completely, using the user's own history of grades to update D and S. This approach respects both the power of collective intelligence and the necessity of individual personalization.

### **3.3 The Complexity-Adjusted Initial Scheduling (CAIS) Algorithm Specification**

The CAIS algorithm is a lightweight, real-time process that integrates seamlessly into the existing review workflow.

* **Trigger:** A user initiates the first-ever review of a card corresponding to Node\_X.  
* **Process:**  
  1. **Lookup:** The system performs a fast lookup to retrieve the pre-calculated cdc\_score from the jsonb properties of Node\_X.  
  2. **User Action:** The user studies the card and provides their first grade (e.g., "Good").  
  3. **Base Calculation:** The standard FSRS v4 logic is executed to calculate the base initial difficulty (D0,base​) and base initial stability (S0,base​) based on the user's grade and their personal FSRS parameters.  
  4. **Map and Modify:** The cdc\_score is passed to the mapping function (as defined in Table 3.1) to determine the appropriate adjustment modifiers for D0​ and S0​.  
  5. **Apply Adjustment:** The final initial parameters are calculated:  
     * D0,final​=D0,base​⋅ModifierD​  
     * S0,final​=S0,base​⋅ModifierS​  
  6. **Schedule:** The next review interval is calculated using S0,final​ and the user's desired retention rate. The card's memory state is initialized with D0,final​ and S0,final​.  
* **Continuation:** For all subsequent reviews of this card, the system uses the standard FSRS update rules without any modification from the CAIS algorithm. The system reverts to being purely personalized based on that user's own feedback.  
* **Output:** A more appropriately scheduled first review interval that accounts for the concept's known difficulty, improving learning efficiency and reducing initial frustration.

## **Section 4: Implementation Architecture and Best Practices**

Translating the CDC and CAIS algorithms from theory into a robust, scalable production system requires careful architectural design. The proposed implementation is tailored for the user's specified technology stack of NodeJS/NestJS and PostgreSQL, emphasizing a clean separation of concerns and adherence to best practices for performance and maintainability.

### **4.1 System Architecture in NodeJS/NestJS**

The CDC and CAIS algorithms have fundamentally different computational profiles and operational requirements. CDC is a heavy, global, analytical process, while CAIS is a light, local, transactional one. A successful architecture must decouple these two functions.

#### **CDC Calculation: Asynchronous Batch Processing**

The CDC algorithm involves querying the entire user review history and performing iterative calculations across the knowledge graph. Executing this in real-time upon a user request is infeasible and would lead to a poor user experience. Therefore, the CDC calculation should be implemented as an **asynchronous background job**.

* **Scheduling:** Within a NestJS application, this can be achieved by creating a dedicated ComplexityModule. This module would use a scheduler like node-cron to trigger the CDC calculation process on a periodic basis (e.g., nightly or weekly).  
* **Execution:** The scheduled job would execute the full four-step CDC algorithm as defined in Section 2.5. It will read from the ReviewLog, User, Node, and Edge tables, perform all calculations, and write the final, normalized cdc\_score back to the jsonb property of the corresponding nodes in the Node table.  
* **Resilience:** The job should be designed with resilience in mind, including robust error handling, logging, and potentially checkpointing for very large datasets to allow resumption on failure.

#### **CAIS Application: Real-time Service Integration**

In contrast, the CAIS algorithm is a simple, fast lookup and modification that must happen in real-time during a user's review session.

* **Service Layer:** The logic for CAIS should reside within the core service responsible for handling card reviews and scheduling. This could be a ReviewService or SchedulingService in the NestJS application.  
* **Workflow:** When this service processes the *first* review for a card, it reads the pre-calculated cdc\_score directly from the Node's jsonb property. It then applies the adjustment logic from Section 3.3 to the initial FSRS parameters. This entire operation adds negligible latency to the review process.

This decoupled architecture ensures that the heavy analytical workload of the CDC calculation does not impact the performance of the user-facing application. The system benefits from up-to-date complexity scores without paying a real-time performance penalty.

#### **Data Flow Diagram**

The overall data flow can be visualized as follows:

1. **User Reviews (Real-time):** Users perform reviews. Each review event (user ID, node ID, grade, timestamp, D/S/R state) is written to a ReviewLog table.  
2. **CDC Batch Job (Asynchronous):** The scheduled background job wakes up.  
3. **Data Aggregation:** The job reads from the ReviewLog, User, and Node tables to perform steps 1-3 of the CDC algorithm (Signal \-\> User-Node Aggregation \-\> Community Aggregation).  
4. **Graph Propagation:** The job executes the iterative graph refinement (Step 4\) using the Node and Edge tables.  
5. **Update Knowledge Graph:** The job writes the final cdc\_score to the jsonb column of the Node table.  
6. **CAIS Application (Real-time):** A user reviews a new card. The ReviewService reads the cdc\_score from the Node table and applies the CAIS logic to generate the first interval.

### **4.2 PostgreSQL Query Patterns for Graph Analysis**

The entire system can be implemented using standard PostgreSQL, leveraging its powerful query capabilities, particularly for graph traversal.

#### **Accessing FSRS History and JSONB**

Querying the necessary data for the CDC algorithm involves standard SQL joins across the ReviewLog, User, and Node tables. If properties are stored in jsonb, they can be accessed using the \-\>\> operator.  
*Pseudo-SQL for fetching review data:*

SQL

SELECT  
  r.user\_id,  
  r.node\_id,  
  r.grade,  
  r.timestamp,  
  (r.fsrs\_state \-\>\> 'difficulty')::float AS difficulty,  
  (r.fsrs\_state \-\>\> 'stability')::float AS stability  
FROM  
  review\_logs AS r  
WHERE  
  r.node\_id \= :target\_node\_id;

#### **Graph Traversal with Recursive CTEs**

The graph propagation step of the CDC algorithm (Section 2.4) can be implemented efficiently using a WITH RECURSIVE common table expression. This avoids the need for external graph database extensions for moderately sized graphs.14  
*Pseudo-SQL for iterative graph propagation:*

SQL

WITH RECURSIVE TmpGraphPropagation(iteration, node\_id, cdc\_score) AS (  
  \-- Base Case: Initial complexity scores at iteration 0  
  SELECT  
    0 AS iteration,  
    id AS node\_id,  
    (properties \-\>\> 'initial\_complexity')::float AS cdc\_score  
  FROM  
    nodes  
  UNION ALL  
  \-- Recursive Step: Update scores based on neighbors from the previous iteration  
  SELECT  
    p.iteration \+ 1,  
    n.id AS node\_id,  
    \-- The CDC update formula from Section 2.4  
    (1 \- :alpha) \* (n.properties \-\>\> 'initial\_complexity')::float \+  
    :alpha \* (  
      SELECT SUM(p\_neighbor.cdc\_score \* e.weight)  
      FROM TmpGraphPropagation p\_neighbor  
      JOIN edges e ON e.source\_id \= p\_neighbor.node\_id AND e.target\_id \= n.id  
      WHERE p\_neighbor.iteration \= p.iteration  
    ) AS cdc\_score  
  FROM  
    TmpGraphPropagation p  
  JOIN  
    nodes n ON p.node\_id \= n.id  
  WHERE  
    p.iteration \< :max\_iterations  
)  
\-- Final SELECT to get the converged scores  
SELECT node\_id, cdc\_score FROM TmpGraphPropagation WHERE iteration \= :max\_iterations;

This SQL structure provides a clear template for implementing the core graph analysis directly within the database.

#### **Performance Optimization**

To ensure the performance of these potentially large queries, especially for the CDC batch job, database indexing is critical.14

* **B-Tree Indexes:** Standard B-tree indexes should be created on all foreign key columns (user\_id, node\_id in ReviewLog; source\_id, target\_id in Edge).  
* **GIN Indexes:** If specific keys within the jsonb properties are frequently used in WHERE clauses, a GIN (Generalized Inverted Index) can be created on the jsonb column to significantly speed up those lookups.

### **4.3 Data Integrity and Scalability**

As the system grows, maintaining data integrity and ensuring scalability become paramount.

* **CDC Versioning:** The CDC score for a node will change over time as more review data is collected. It is good practice to store the score along with a timestamp or a version number (e.g., `{"cdc_score": 0.75, "cdc_version": "2025-01-15"}`). This allows for historical analysis of how a concept's perceived complexity evolves and aids in debugging.  
* **Handling New Nodes:** The CDC batch job must include a step to identify nodes that have been added to the graph since the last run but have not yet accumulated enough review data for a reliable score. For these "cold start" nodes, a default complexity could be assigned, or they could inherit a score from their nearest neighbors in the graph.  
* **Scalability Path:** For systems with hundreds of millions of reviews or nodes, running the CDC calculation within the primary PostgreSQL database may become a bottleneck. The architectural design allows for a clear scalability path. The CDC batch job can be migrated to a dedicated data processing framework like Apache Spark. Spark can connect to PostgreSQL as a data source, perform the distributed computations in memory across a cluster, and then write the results back to the Node table. This preserves the overall architecture while scaling out the most computationally intensive component.

## **Section 5: Knowns, Unknowns, and Avenues for Future Research**

The proposed framework provides a robust and immediately implementable solution. However, it also serves as a foundation for a much deeper, more intelligent learning system. Acknowledging the boundaries of current knowledge and defining clear paths for future research is the hallmark of a mature engineering and data science strategy.

### **5.1 Knowns (Established Foundations)**

The design of this framework rests on several well-established principles, providing a high degree of confidence in its core efficacy:

* **FSRS Predictive Power:** The FSRS v4/4.5 algorithm is one of the most accurate spaced repetition schedulers available, with its DSR memory model having been extensively benchmarked against large datasets.10 Our system leverages the high-quality, personalized data generated by this proven model.  
* **Graph-based Influence Modeling:** The use of graph algorithms like PageRank to model influence and importance in a network is a foundational concept in computer science and data analysis.24 Our application of a similar propagation model to "difficulty" is a logical extension of this principle.  
* **Cold-Start Problem Patterns:** The "cold start" problem is a well-defined challenge in machine learning, particularly in recommender systems. The strategy of using aggregated community data or content features as a "smart default" is a standard and effective solution pattern.30 Our CAIS algorithm directly implements this pattern in the context of spaced repetition.

### **5.2 Known Unknowns (Directions for R\&D)**

The initial implementation opens up several compelling questions. These "known unknowns" represent exciting avenues for future research and development that could significantly enhance the system's intelligence and utility.

#### **Disentangling Inherent vs. Instructional Difficulty**

* **The Question:** A high CDC score for a concept is a powerful signal, but what is its root cause? Is the concept itself intrinsically difficult (e.g., recursion), or is the specific flashcard used to teach it (the "instructional material") poorly designed, ambiguous, or confusing? The current system cannot distinguish between these two possibilities. This relates to the observation that blindly memorizing things is not always useful.34  
* **Research Path:** Develop a secondary "Card Quality" metric to run alongside the CDC. This could be achieved by isolating the performance of high-reputation learners. If a cohort of top-performing, highly consistent users suddenly struggles with one specific card, while performing well on all its neighboring concepts, it strongly suggests a flaw in the card itself, not the underlying concept. The system could automatically flag such cards for review by content creators. This transforms the system from a simple scheduler into a powerful, data-driven content quality assurance platform.

#### **Dynamic Complexity and Concept Drift**

* **The Question:** The CDC score is calculated as a periodic snapshot. But the learning environment is dynamic. What happens when new, much better learning materials (e.g., a clearer explanation, a better diagram) are added for a concept that was previously considered difficult? Over time, the community's perception of its complexity should decrease. How can the system detect and adapt to this "concept drift"?  
* **Research Path:** Evolve the CDC algorithm to more heavily weight very recent review data. More ambitiously, treat the sequence of calculated CDC scores for a node as a time series. The system could perform trend analysis on this time series. A node with a consistently and significantly decreasing CDC score over several months is a powerful indicator that instructional improvements for that concept are having a positive impact. This provides a quantitative measure of content efficacy.

#### **The Personalization-Community Trade-off**

* **The Question:** The CAIS algorithm provides a community-informed starting point, after which the personalized FSRS model takes over. But what is the optimal balance? How much "weight" should be given to the community's opinion versus the individual's immediate feedback? Should an expert user's first "Good" rating be treated the same as a novice's?  
* **Research Path:** This is an ideal problem for A/B testing. Different cohorts of new users could be created, each with a different "strength" for the CAIS adjustment (i.e., different modifier values in Table 3.1). By logging and comparing the long-term performance (e.g., retention rates, review load, user engagement) of these cohorts, it's possible to empirically determine an optimal balance. This could even lead to a dynamic, meta-learning system where the influence of community data is higher for new users and gradually fades as a user builds up their own review history and demonstrates expertise.

#### **Advanced Learner Reputation and Clustering**

* **The Question:** The current model uses a single, global LearnerReputation score. But do distinct "types" of learners exist within the community? For example, are there clusters of "fast learners" who grasp concepts quickly, "methodical learners" who require more repetitions but achieve high stability, or learners who respond better to visual vs. textual information?  
* **Research Path:** Apply unsupervised clustering algorithms (e.g., K-Means) to vectors representing user learning behavior (e.g., average D, S growth rate, grade distribution). This could identify distinct learner archetypes.32 The CDC score could then be calculated on a per-cluster basis, resulting in "cluster-specific complexity" scores. When a new user joins, the system could use their initial demographics and first few reviews to assign them to the most likely cluster, providing an even more tailored and relevant cold-start schedule. This moves from a single community model to a more nuanced collaborative filtering approach.35

#### **Leveraging Edge Properties for Propagation**

* **The Question:** The proposed graph propagation algorithm uses edge weights based on static types (e.g., is\_prerequisite\_for). Can we create more dynamic, data-driven weights for the edges themselves?  
* **Research Path:** The edges in the graph can also store community-derived properties in their jsonb columns. For a directed edge from Node A to Node B, we can analyze the review logs to measure the conditional probability of failure: "Given that a user failed card B, what is the probability they also recently failed card A?" A high probability suggests a strong cognitive dependency. This data-driven "difficulty transfer" score could be used as the edge weight (w(m,n)) in the propagation algorithm. This would make the graph propagation step significantly more precise, as it would be based on the community's demonstrated patterns of confusion transfer, a concept related to node property prediction in graphs.37

## **Conclusion**

This report has laid out a comprehensive framework for evolving a spaced repetition system from a collection of isolated, individual learning models into a cohesive, intelligent ecosystem that learns from its community. By systematically defining the Community-Derived Complexity (CDC) and Complexity-Adjusted Initial Scheduling (CAIS) algorithms, we have provided a clear, actionable blueprint for identifying difficult concepts and using that knowledge to solve the critical cold-start problem.  
The proposed architecture, designed for a NodeJS and PostgreSQL stack, is both powerful and pragmatic, separating heavy data processing from real-time application to ensure a scalable and performant system. The methodology is grounded in the established principles of the FSRS memory model, robust statistical aggregation, and foundational graph theory.  
More importantly, this framework is not an endpoint but a beginning. The avenues for future research outlined—from disentangling instructional quality to modeling concept drift and clustering learner types—point toward a future where the learning platform is not just a passive tool but an active participant in the educational process. It becomes a self-aware system that understands the structure and difficulty of its own content, learns from the collective cognitive experience of its users, and leverages that vast repository of knowledge to create a more effective, efficient, and personalized learning path for every individual who engages with it. The implementation of this framework is a foundational step towards that future.

#### **Works cited**

1. The NEW Best Anki Settings 2024\! New FSRS vs Anki default algorithm (SM-2) \- YouTube, accessed August 2, 2025, [https://www.youtube.com/watch?v=OqRLqVRyIzc\&pp=0gcJCfwAo7VqN5tD](https://www.youtube.com/watch?v=OqRLqVRyIzc&pp=0gcJCfwAo7VqN5tD)  
2. Spaced repetition \- Wikipedia, accessed August 2, 2025, [https://en.wikipedia.org/wiki/Spaced\_repetition](https://en.wikipedia.org/wiki/Spaced_repetition)  
3. What spaced repetition algorithm does Anki use?, accessed August 2, 2025, [https://faqs.ankiweb.net/what-spaced-repetition-algorithm](https://faqs.ankiweb.net/what-spaced-repetition-algorithm)  
4. Implementing FSRS in 100 Lines \- Fernando Borretti, accessed August 2, 2025, [https://borretti.me/article/implementing-fsrs-in-100-lines](https://borretti.me/article/implementing-fsrs-in-100-lines)  
5. open-spaced-repetition/free-spaced-repetition-scheduler: A ... \- GitHub, accessed August 2, 2025, [https://github.com/open-spaced-repetition/free-spaced-repetition-scheduler](https://github.com/open-spaced-repetition/free-spaced-repetition-scheduler)  
6. A technical explanation of FSRS | Expertium's Blog, accessed August 2, 2025, [https://expertium.github.io/Algorithm.html](https://expertium.github.io/Algorithm.html)  
7. Spaced Repetition Systems Have Gotten Way Better | Domenic ..., accessed August 2, 2025, [https://domenic.me/fsrs/](https://domenic.me/fsrs/)  
8. A technical explanation of the FSRS algorithm : r/Anki \- Reddit, accessed August 2, 2025, [https://www.reddit.com/r/Anki/comments/18tnp22/a\_technical\_explanation\_of\_the\_fsrs\_algorithm/](https://www.reddit.com/r/Anki/comments/18tnp22/a_technical_explanation_of_the_fsrs_algorithm/)  
9. Understanding stability and retrievability : r/Anki \- Reddit, accessed August 2, 2025, [https://www.reddit.com/r/Anki/comments/1fk2lvb/understanding\_stability\_and\_retrievability/](https://www.reddit.com/r/Anki/comments/1fk2lvb/understanding_stability_and_retrievability/)  
10. Benchmark of Spaced Repetition Algorithms \- Expertium's Blog, accessed August 2, 2025, [https://expertium.github.io/Benchmark.html](https://expertium.github.io/Benchmark.html)  
11. How to use the next-generation spaced repetition algorithm FSRS on Anki? | by Jarrett Ye, accessed August 2, 2025, [https://medium.com/@JarrettYe/how-to-use-the-next-generation-spaced-repetition-algorithm-fsrs-on-anki-5a591ca562e2](https://medium.com/@JarrettYe/how-to-use-the-next-generation-spaced-repetition-algorithm-fsrs-on-anki-5a591ca562e2)  
12. How to use the next-generation spaced repetition algorithm FSRS on Anki? \- Reddit, accessed August 2, 2025, [https://www.reddit.com/r/Anki/comments/zncitr/how\_to\_use\_the\_nextgeneration\_spaced\_repetition/](https://www.reddit.com/r/Anki/comments/zncitr/how_to_use_the_nextgeneration_spaced_repetition/)  
13. Knowledge Graphs vs. Property Graphs – Part I \- TDAN.com, accessed August 2, 2025, [https://tdan.com/knowledge-graphs-vs-property-graphs-part-1/27140](https://tdan.com/knowledge-graphs-vs-property-graphs-part-1/27140)  
14. PostgreSQL Graph Database: Everything You Need To Know, accessed August 2, 2025, [https://www.puppygraph.com/blog/postgresql-graph-database](https://www.puppygraph.com/blog/postgresql-graph-database)  
15. Postgres as a Graph Database: (Ab)using pgRouting \- Supabase, accessed August 2, 2025, [https://supabase.com/blog/pgrouting-postgres-graph-database](https://supabase.com/blog/pgrouting-postgres-graph-database)  
16. Comparison of aggregation methods used in online reviews: a ... \- Eiris, accessed August 2, 2025, [https://eiris.it/ojs/index.php/ratiomathematica/article/download/1674/pdf](https://eiris.it/ojs/index.php/ratiomathematica/article/download/1674/pdf)  
17. 4.4.2 Calculating the median \- Statistique Canada, accessed August 2, 2025, [https://www150.statcan.gc.ca/n1/edu/power-pouvoir/ch11/median-mediane/5214872-eng.htm](https://www150.statcan.gc.ca/n1/edu/power-pouvoir/ch11/median-mediane/5214872-eng.htm)  
18. Medians – Institutional Assessment & Evaluation \- University of Washington, accessed August 2, 2025, [https://www.washington.edu/assessment/course-evaluations/reports/course-reports/medians/](https://www.washington.edu/assessment/course-evaluations/reports/course-reports/medians/)  
19. Using average or median aggregators \- Zendesk help, accessed August 2, 2025, [https://support.zendesk.com/hc/en-us/articles/4408839402906-Using-average-or-median-aggregators](https://support.zendesk.com/hc/en-us/articles/4408839402906-Using-average-or-median-aggregators)  
20. Aggregation of Consumer Ratings: An Application to Yelp.com \- National Bureau of Economic Research, accessed August 2, 2025, [https://www.nber.org/system/files/working\_papers/w18567/w18567.pdf](https://www.nber.org/system/files/working_papers/w18567/w18567.pdf)  
21. Reputation system \- Wikipedia, accessed August 2, 2025, [https://en.wikipedia.org/wiki/Reputation\_system](https://en.wikipedia.org/wiki/Reputation_system)  
22. Reputation Systems in Social Computing \- Number Analytics, accessed August 2, 2025, [https://www.numberanalytics.com/blog/reputation-systems-in-social-computing](https://www.numberanalytics.com/blog/reputation-systems-in-social-computing)  
23. FSRS is one of the most accurate spaced repetition algorithms in the world (updated benchmark) : r/Anki \- Reddit, accessed August 2, 2025, [https://www.reddit.com/r/Anki/comments/1c29775/fsrs\_is\_one\_of\_the\_most\_accurate\_spaced/](https://www.reddit.com/r/Anki/comments/1c29775/fsrs_is_one_of_the_most_accurate_spaced/)  
24. Graph-Based Ranking Algorithms in Text Mining \- GeeksforGeeks, accessed August 2, 2025, [https://www.geeksforgeeks.org/nlp/graph-based-ranking-algorithms-in-text-mining/](https://www.geeksforgeeks.org/nlp/graph-based-ranking-algorithms-in-text-mining/)  
25. PageRank :: Graph Data Science Library \- TigerGraph Documentation, accessed August 2, 2025, [https://docs.tigergraph.com/graph-ml/3.10/centrality-algorithms/pagerank](https://docs.tigergraph.com/graph-ml/3.10/centrality-algorithms/pagerank)  
26. Belief propagation \- Wikipedia, accessed August 2, 2025, [https://en.wikipedia.org/wiki/Belief\_propagation](https://en.wikipedia.org/wiki/Belief_propagation)  
27. krashkov/Belief-Propagation \- GitHub, accessed August 2, 2025, [https://github.com/krashkov/Belief-Propagation](https://github.com/krashkov/Belief-Propagation)  
28. PageRank \- Neo4j Graph Data Science, accessed August 2, 2025, [https://neo4j.com/docs/graph-data-science/current/algorithms/page-rank/](https://neo4j.com/docs/graph-data-science/current/algorithms/page-rank/)  
29. About FSRS algorithm's "first rating" \- Anki Forums, accessed August 2, 2025, [https://forums.ankiweb.net/t/about-fsrs-algorithms-first-rating/50055](https://forums.ankiweb.net/t/about-fsrs-algorithms-first-rating/50055)  
30. 6 Strategies to Solve Cold Start Problem in Recommender Systems, accessed August 2, 2025, [https://web.tapereal.com/blog/6-strategies-to-solve-cold-start-problem-in-recommender-systems/](https://web.tapereal.com/blog/6-strategies-to-solve-cold-start-problem-in-recommender-systems/)  
31. How we solve the “cold start problem” in an ML recommendation system \- Reddit, accessed August 2, 2025, [https://www.reddit.com/r/ProductManagement/comments/1j5rss9/how\_we\_solve\_the\_cold\_start\_problem\_in\_an\_ml/](https://www.reddit.com/r/ProductManagement/comments/1j5rss9/how_we_solve_the_cold_start_problem_in_an_ml/)  
32. Addressing the Cold-Start Problem in Recommender Systems Based on Frequent Patterns, accessed August 2, 2025, [https://www.mdpi.com/1999-4893/16/4/182](https://www.mdpi.com/1999-4893/16/4/182)  
33. FSRS is now the most accurate spaced repetition algorithm in the world\* : r/Anki \- Reddit, accessed August 2, 2025, [https://www.reddit.com/r/Anki/comments/18csuer/fsrs\_is\_now\_the\_most\_accurate\_spaced\_repetition/](https://www.reddit.com/r/Anki/comments/18csuer/fsrs_is_now_the_most_accurate_spaced_repetition/)  
34. FSRS: A modern, efficient spaced repetition algorithm | Hacker News, accessed August 2, 2025, [https://news.ycombinator.com/item?id=39002138](https://news.ycombinator.com/item?id=39002138)  
35. How does collaborative filtering work with implicit data? \- Zilliz Vector Database, accessed August 2, 2025, [https://zilliz.com/ai-faq/how-does-collaborative-filtering-work-with-implicit-data](https://zilliz.com/ai-faq/how-does-collaborative-filtering-work-with-implicit-data)  
36. (PDF) Collaborative Filtering for Implicit Feedback Datasets \- ResearchGate, accessed August 2, 2025, [https://www.researchgate.net/publication/220765111\_Collaborative\_Filtering\_for\_Implicit\_Feedback\_Datasets](https://www.researchgate.net/publication/220765111_Collaborative_Filtering_for_Implicit_Feedback_Datasets)  
37. Node Property Prediction | Open Graph Benchmark, accessed August 2, 2025, [https://ogb.stanford.edu/docs/nodeprop/](https://ogb.stanford.edu/docs/nodeprop/)  
38. Node property prediction \- Neo4j Graph Data Science, accessed August 2, 2025, [https://neo4j.com/docs/graph-data-science/current/machine-learning/node-property-prediction/](https://neo4j.com/docs/graph-data-science/current/machine-learning/node-property-prediction/)