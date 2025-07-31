---
title: FSRS v4 Algorithm
---

# **The FSRS v4 Algorithm: A Comprehensive Technical Report on its Mechanics, Implementation, and Optimization**

### **Executive Summary**

The Free Spaced Repetition Scheduler (FSRS) is a state-of-the-art, open-source algorithm designed to optimize learning schedules in flashcard-based systems. It represents a paradigm shift from traditional, heuristic-based algorithms like SM-2 to a data-driven, personalized model grounded in cognitive science and machine learning. The core innovation of FSRS is its use of the DSR (Difficulty, Stability, Retrievability) memory model, which describes the state of a memory using three distinct variables. This granular model, combined with a powerful optimization engine, allows FSRS to learn an individual user's memory patterns from their review history and create a highly efficient, personalized schedule.  
Empirical evidence and widespread user adoption have demonstrated FSRS's superior efficiency. For a given level of knowledge retention, users can expect a significant reduction in their daily review workload, often estimated to be between 20–30% compared to Anki's default SM-2 algorithm.1 This efficiency is achieved by more accurately predicting the optimal moment for review, thereby minimizing unnecessary repetitions of well-known material and providing more timely reinforcement for items on the verge of being forgotten.  
This report provides a definitive technical analysis of the FSRS v4 algorithm. It begins by establishing the theoretical foundations of the DSR memory model, contrasting it with the limitations of its predecessors. It then proceeds with a detailed mathematical exploration of the core FSRS v4 mechanics, detailing the formulas that govern memory state updates and interval calculation. A significant portion of the report is dedicated to the personalization engine, explaining how the optimizer uses a user's review history to train a set of parameters that define their unique memory profile.  
For developers and system architects, this report offers a practical guide to implementation, outlining the necessary data structures, the logical flow of the scheduling lifecycle, and a survey of the rich ecosystem of open-source libraries available for integration. A comprehensive comparative analysis against the legacy SM-2 algorithm is provided, examining differences in their memory models, scheduling logic, efficiency, and user experience. Finally, the report discusses practical user considerations, advanced features, and the known limitations of the algorithm, positioning FSRS within the broader context of ongoing research in learning technology.

## **I. Introduction to the Free Spaced Repetition Scheduler (FSRS): An Evolution in Memory Modeling**

### **The Genesis of Spaced Repetition**

The concept of spaced repetition is rooted in the scientific understanding of memory, specifically the phenomenon of the forgetting curve, which describes the exponential decay of memory retention over time. The goal of any spaced repetition system (SRS) is to counteract this decay by scheduling reviews at increasing intervals, reinforcing a memory at the precise moment it is about to be forgotten. This principle was first systematically applied to computer-based learning by Dr. Piotr Wozniak in the 1980s with the development of the SuperMemo (Super Memory) software.3  
The earliest versions, such as SM-0, used a fixed schedule of intervals derived from Wozniak's self-experiments.4 This evolved into the SM-2 algorithm, which introduced a crucial innovation: it broke learning material into atomic question-answer pairs (flashcards) and calculated a unique schedule for each one based on user performance.4 Due to its relative simplicity and effectiveness, the SM-2 algorithm was widely adopted and forms the basis of the default scheduler in many popular SRS applications, including early versions of Anki.4 The core logic of SM-2 involves adjusting a card's "Ease Factor" based on a user's self-rated performance, which in turn multiplies the previous interval to determine the next one.4

### **Limitations of Early Models (SM-2)**

Despite its widespread use and proven benefits over massed repetition (cramming), the SM-2 algorithm possesses several fundamental limitations that FSRS was designed to overcome.  
First, its memory model is oversimplified. SM-2 conflates the concepts of a card's intrinsic difficulty and the stability of the memory into a single variable: the "Ease Factor".5 This is a critical flaw because difficulty (how hard a concept is to learn) and stability (how long a memory of that concept lasts) are distinct cognitive properties. An intrinsically easy card can be forgotten if the review interval is too long, and an intrinsically difficult card can be remembered well if reviewed at the right time. By using a single factor, SM-2 cannot distinguish between these scenarios, often leading to suboptimal scheduling.  
Second, SM-2 is not globally adaptive. It adjusts the schedule for a card based only on the performance history of that specific card.6 It does not learn from the user's performance across their entire collection. This means it cannot develop a generalized model of the individual's memory characteristics. A user who is generally very good at memorizing vocabulary will have their cards scheduled by SM-2 using the same underlying assumptions as a user who struggles, with adjustments happening only on a card-by-card basis.  
Third, SM-2's handling of memory lapses (forgetting a card) is notoriously punitive. When a user fails a mature card, its interval is typically reset to a very short duration, as if it were being learned for the first time.5 This behavior, often termed "ease hell" by users, fails to account for the residual memory strength that still exists even after a lapse. Forgetting a card you last saw a year ago is not the same as never having learned it, yet SM-2 treats these situations too similarly, leading to user frustration and inefficient relearning cycles.8

### **The Emergence of FSRS**

The Free Spaced Repetition Scheduler (FSRS), developed by Jarrett Ye (also known as L-M-Sherlock), emerged as a modern, open-source solution to these challenges.1 FSRS is not merely an incremental improvement; it represents a fundamental rethinking of how to model human memory for the purpose of scheduling. Its development is based on the theoretical foundations of Wozniak's later work, specifically the three-component model of memory, and is enhanced by a stochastic shortest path algorithm described in Ye's academic paper.9  
The defining feature of FSRS is its combination of a more sophisticated memory model—the DSR model—with the power of machine learning.5 Instead of relying on fixed heuristics, FSRS analyzes a user's entire review history to train a set of personalized parameters. These parameters quantify the user's unique memory patterns, allowing the algorithm to make highly accurate predictions about when a memory is likely to be forgotten.5 This predictive power enables a more efficient and flexible scheduling system that adapts not just to individual cards, but to the individual learner. Its proven effectiveness has led to its integration as an official, optional scheduler in major learning platforms such as Anki (since version 23.10) and RemNote, offering users a significant upgrade in learning efficiency.1

## **II. The DSR Memory Model: The Theoretical Core of FSRS**

At the heart of the FSRS algorithm lies the three-component model of memory, commonly referred to as the DSR model. This model, originally proposed by Piotr Wozniak and refined through large-scale data analysis by the FSRS developers, posits that the state of a given memory can be effectively described by three key variables: Difficulty, Stability, and Retrievability.5 Each flashcard in an FSRS-powered system has its own set of DSR values, which collectively form its "memory state".5

### **Defining the Three Components**

The power of the DSR model comes from its separation of concerns, allowing for a more nuanced representation of memory than the single "ease factor" of SM-2.

* **Difficulty (D):** This variable represents the intrinsic, relatively static complexity of the information on a flashcard. It answers the question: "How hard is this concept to grasp and encode into long-term memory?" In FSRS, Difficulty is modeled as a real number on a scale from 1 (easiest) to 10 (hardest).5 A low-difficulty item is one that is easy to form a stable memory of, while a high-difficulty item requires more effort to stabilize. Difficulty is the most stable of the three variables, changing only modestly after each review.  
* **Stability (S):** This variable quantifies the durability of a memory. It answers the question: "How long will this memory last before it starts to fade?" Stability is precisely defined as the length of time, in days, required for the probability of recalling a memory to decay from 100% to 90%.5 A card with a stability of 30 days means that after one month, the user is predicted to have a 90% chance of recalling it. Stability is the primary driver of the review interval; as stability grows, so does the time until the next review. It changes after every review.  
* **Retrievability (R):** This variable represents the probability of successfully recalling a memory at a specific point in time. It answers the question: "What is the chance I can remember this *right now*?" Retrievability is a dynamic value, expressed as a probability between 0 and 1 (or 0% and 100%), that decays over time as a function of the memory's Stability.5 Immediately after a successful review, R is 100%. As time passes, R decreases along a "forgetting curve" whose shape is determined by S. The goal of FSRS is to schedule the next review for when R is predicted to fall to a user-defined threshold, known as the "desired retention."

### **The Interplay of D, S, and R**

The true sophistication of the DSR model lies not just in these definitions, but in the causal relationships and feedback loops that connect them. These relationships, derived from empirical analysis of millions of review logs, form the "laws of memory" that FSRS encodes in its formulas.4

1. **Difficulty's Impact on Stability:** Higher Difficulty (D) inhibits the growth of Stability (S). For two successful reviews performed under identical conditions, the card with the higher D value will see a smaller increase in its S value. This captures the intuitive idea that it is harder to build a lasting memory of complex material.4  
2. **Stability's Impact on Itself (Stabilization Decay):** Higher existing Stability (S) leads to smaller subsequent increases in Stability. This principle, also known as memory saturation, means that as a memory becomes more and more durable, it becomes progressively harder to make it even more durable. The gains in stability diminish with each successful review.4  
3. **Retrievability's Impact on Stability:** The lower the Retrievability (R) at the time of a *successful* review, the greater the resulting increase in Stability (S). This is perhaps the most crucial principle for efficient learning. It means that successfully recalling something that you were on the verge of forgetting provides a much stronger boost to its long-term stability than recalling something you just reviewed. The optimal time to review, therefore, is at the "edge of forgetting".4

These interactions reveal the DSR model as a dynamic feedback system. D acts as a brake on the growth of S. S determines the rate of decay of R and also dampens its own future growth. R, at the moment of review, provides the feedback signal that determines the magnitude of the update to S. This multi-faceted system stands in stark contrast to SM-2's one-dimensional "ease factor." Where SM-2 might punish the ease factor for both a difficult card and a simple card reviewed too late, FSRS can distinguish between the two. It correctly identifies the former as having high D and the latter as having low R. This allows FSRS to correctly interpret a successful recall after a long delay as a sign of a very strong, stable memory, leading to a massive increase in the next interval, whereas SM-2 would provide only a modest, non-adaptive bonus. This ability to correctly model the state of memory is the fundamental reason for FSRS's superior scheduling accuracy and efficiency.

## **III. The Mechanics of FSRS v4: A Mathematical Deep Dive**

The theoretical principles of the DSR model are translated into a practical scheduling algorithm through a set of precise mathematical formulas. FSRS v4 marked a significant evolution from its predecessors, most notably by replacing a simple exponential forgetting curve with a more accurate power-law function, a change that provided a superior fit to large-scale, real-world user data.17 The subsequent FSRS-4.5 version further refined this curve for even better accuracy.20 This section details the core equations that govern the FSRS v4 scheduling process.

### **A. Calculating Retrievability: The Power-Law Forgetting Curve**

Retrievability (R) is the probability of recalling a card after a certain amount of time (t, in days) has passed since the last review. It is a function of time and the card's current Stability (S). In FSRS v4, this relationship is modeled by a power function:  
R(t,S)=(1+S⋅ft​)−p  
Here, p is an optimizable parameter that controls the shape of the forgetting curve, and f is a scaling factor derived from the definition of stability, often expressed as f=(0.9−1/p−1)−1. The key insight is that this power-law relationship better models the observation that the rate of forgetting slows over longer periods, unlike a simple exponential decay.17  
For practical implementation, a simplified but functionally equivalent form is often used, where the constants are combined. For example, the FSRS-4.5 curve is given by 16:  
R(t,S)=(1+St​)−p  
Where p is an optimizable parameter. For the purpose of this report, we will refer to the general power-law structure.

### **B. Updating Memory State: Post-Review Calculations for Stability and Difficulty**

After a user reviews a card and provides a grade (1=Again, 2=Hard, 3=Good, 4=Easy), FSRS updates the card's Difficulty (D) and Stability (S). The formulas differ significantly depending on whether it is the card's first-ever review or a subsequent one.

#### **Initial State (First Review)**

When a card is reviewed for the first time (i.e., it is in the 'New' state), its initial memory state is established based solely on the grade given.

* Initial Stability (S0​): The initial stability is directly assigned from the first four parameters of the optimized weight vector (w).

  S0​(grade)=wgrade−1​

  For example, if the user presses "Good" (grade=3), the initial stability is set to w2​.12  
* Initial Difficulty (D0​): The initial difficulty is calculated using a linear function of the grade, controlled by parameters w4​ and w5​.

  D0​(grade)=w4​−(grade−3)⋅w5​

  This value is then clamped to be within the valid range of .17 This formula means that pressing 'Again' or 'Hard' results in a higher initial difficulty, while 'Easy' results in a lower one.

#### **Subsequent Reviews (Successful \- Hard, Good, Easy)**

For a card that has been seen before and is successfully recalled (grade \> 1), the memory state is updated as follows.

* New Difficulty (D′): The difficulty update incorporates a "mean reversion" component. It adjusts the current difficulty (D) based on the grade, pulling it towards a central value over time if the user consistently rates it as "Good". This is controlled by parameter w6​.

  D′=D−w6​⋅(grade−3)

  The formula is then modified by a "linear damping" function, which reduces the magnitude of the change as D approaches its boundaries (1 or 10), preventing it from ever reaching them exactly.17 This ensures that difficulty remains a dynamic property.  
* New Stability (S′): The new stability is the old stability (S) multiplied by a Stability Increase factor (Sinc​).

  S′=S⋅Sinc​

  The calculation of Sinc​ is the most intricate part of the algorithm, as it encapsulates the core principles of the DSR model 16:

  `$$ S\_{\\text{inc}} \= \\exp(w\_7) \\cdot (11 \- D) \\cdot S^{-w\_8} \\cdot \\left(\\exp((1 \- R) \\cdot w\_9) \- 1\\right) $$`
  Breaking this down:  
  * exp(w7​): A general scaling factor for stability increase.  
  * (11−D): The difficulty penalty. Higher difficulty (larger D) reduces the stability increase.  
  * S−w8​: The stability saturation term. Higher current stability (larger S) reduces the stability increase.  
  * (exp((1−R)⋅w9​)−1): The retrievability effect. Lower retrievability (smaller R) at the time of review leads to a much larger stability increase.

Finally, this result is multiplied by grade-specific factors: a penalty for "Hard" (a factor based on w15​\<1) and a bonus for "Easy" (a factor based on w16​\>1).17

#### **Subsequent Reviews (Lapse \- Again)**

When a card is forgotten (grade \= 1), the update formulas are different, reflecting the significant event of a memory lapse.

* **New Difficulty (D′):** The same formula for updating difficulty is used, but with grade \= 1, it results in a significant increase in the card's difficulty value.  
* **New Stability (S′):** A lapse does not reset stability to a fixed, small value as in SM-2. Instead, FSRS calculates a new, lower stability based on the card's state before the lapse. This acknowledges that some memory trace remains. The formula for the new stability after a lapse is 16:  
  S′=w10​⋅D−w11​⋅Sw12​⋅exp((1−R)⋅w13​)

  This formula considers the card's difficulty (D), its pre-lapse stability (S), and the predicted retrievability (R) at the moment of failure to calculate a new, more appropriate stability. This is a crucial improvement for user experience, as it prevents the harsh penalties of "ease hell."

### **C. Scheduling the Next Review: From Desired Retention to a Concrete Interval**

The final step is to calculate the next review date. This is done by using the newly calculated stability (S′) and the user's chosen desired\_retention (e.g., 0.9 for 90%).22 The algorithm inverts the retrievability formula to solve for the time  
t (the interval) at which the retrievability will decay to the desired level.  
Interval=S′⋅p1​((desired\_retention)−p−1)  
Using the simplified form from FSRS-4.5 for clarity 16:  
Interval=S′⋅((desired\_retention)−1/p−1)  
This final calculation directly connects the user's high-level learning goal (desired retention) with a concrete scheduling outcome (the next review interval), all mediated by the personalized and dynamically updated memory model (the new S′).

## **IV. Personalization Through Optimization: Training the FSRS Model**

The true power of FSRS lies in its ability to personalize the scheduling algorithm to each individual user. This is accomplished through a process called optimization, where the algorithm's parameters are tuned using machine learning techniques to best fit the user's unique memory patterns as evidenced by their review history.9 This process transforms FSRS from a generic model into a bespoke learning companion.

### **A. The Role of the Optimizer and the Log-Loss Function**

The FSRS optimizer is a distinct software component responsible for training the model's parameters.9 It operates by analyzing a user's complete history of review logs. The fundamental task of the optimizer is to find the set of parameters that minimizes the difference between the algorithm's predictions and the user's actual performance.  
To achieve this, the problem is framed as a binary classification task for each review: was the item successfully recalled (a success, labeled '1') or was it forgotten (a lapse, labeled '0')?.17 The optimizer's goal is to make the algorithm's predicted probability of recall, the Retrievability (  
R), as close as possible to the real-world outcome.  
The "closeness" of this prediction is measured by a **loss function**. FSRS uses **log-loss**, also known as binary cross-entropy, which is a standard and effective loss function for binary classification problems.17 The log-loss for a single review is calculated as:  
Loss=−  
Where y is the actual outcome (1 for recall, 0 for lapse) and R is the predicted probability of recall. This function heavily penalizes confident but incorrect predictions. For example, if the algorithm predicts a 99% chance of recall (R=0.99) but the user forgets the card (y=0), the loss will be very high. The optimizer's objective is to find the parameters that minimize the average log-loss across all reviews in the user's history.

### **B. The Parameter Vector (Weights) Explained**

The FSRS v4 algorithm is defined by a vector of 17 optimizable parameters, commonly referred to as weights and denoted by w.1 These parameters are the numerical representation of a user's memory model and are not intended to be modified manually.5 Each parameter controls a specific aspect of the DSR model's behavior. Understanding their roles is key to demystifying the algorithm.

| Parameter | Role in FSRS v4 Algorithm |  |
| :---- | :---- | :---- |
| w0​ | Initial Stability for a first rating of 'Again' (grade 1\) |  |
| w1​ | Initial Stability for a first rating of 'Hard' (grade 2\) |  |
| w2​ | Initial Stability for a first rating of 'Good' (grade 3\) |  |
| w3​ | Initial Stability for a first rating of 'Easy' (grade 4\) |  |
| w4​ | Component for calculating initial Difficulty |  |
| w5​ | Component for calculating initial Difficulty based on grade |  |
| w6​ | Mean reversion factor for Difficulty (pulls D towards a central value) |  |
| w7​ | General scaling factor for the Stability Increase calculation |  |
| w8​ | Exponent controlling the effect of current Stability on its own increase (saturation) |  |
| w9​ | Exponent controlling the effect of Retrievability on Stability increase |  |
| w10​ | Base factor for calculating new Stability after a lapse (forgetting) |  |
| w11​ | Exponent for Difficulty's effect on post-lapse Stability |  |
| w12​ | Exponent for pre-lapse Stability's effect on post-lapse Stability |  |
| w13​ | Exponent for Retrievability's effect on post-lapse Stability |  |
| w14​ | *Not used in FSRS v4 (legacy/reserved)* |  |
| w15​ | Multiplicative penalty to Stability increase when rating is 'Hard' |  |
| w16​ | Multiplicative bonus to Stability increase when rating is 'Easy' |  |
| Table 1: The FSRS v4 Parameter Vector (w0​ \- w16​) and their functions within the scheduling formulas.16 |  |  |

### **C. The Optimization Process: From Review History to a Personalized Model**

The optimization process takes a user's raw review log data and produces a fine-tuned parameter vector w. This is typically performed either within the learning application itself (like in modern versions of Anki) or via an external tool like a Google Colab notebook.10

#### **Data Requirement**

For the optimization to be effective, a sufficient amount of data is required. The optimizer needs a user's review log, which, for each review, must contain the card\_id, review\_time, review\_rating (1-4), and the review\_state (New, Learning, Review, Relearning).23 It is generally recommended that a user have at least 1,000 reviews in their history before running the optimizer for the first time, though some newer implementations can yield reasonable results with as few as 400 reviews.1 Until this threshold is met, using the default parameters (which are typically the median values from a large, diverse dataset of thousands of users) is more effective.1

#### **The Process**

The optimization follows a sequence of steps to find the best-fitting parameters 12:

1. **Initialization:** The process begins with a set of default parameters.  
2. **Pre-training of Initial Stability:** The first four parameters (w0​ through w3​), which define initial stability, are estimated using a separate, specialized procedure. The optimizer analyzes only the first reviews of cards, grouping them by the interval until the second review. By plotting the actual retention rate for each of these first-interval groups, it can fit the forgetting curve and directly calculate the initial stabilities that would have produced those retention rates. This provides a strong and empirically grounded starting point for these crucial parameters.17  
3. **Iterative Refinement:** The main optimization loop begins for the remaining parameters. Using a gradient descent algorithm (or a more advanced variant like Adam), the optimizer calculates the gradient of the log-loss function with respect to each parameter. This gradient indicates the direction in which each parameter should be adjusted to cause the largest decrease in the overall loss.  
4. **Parameter Update:** The optimizer takes a small step in that direction, updating the parameter values.  
5. **Convergence:** This iterative process of calculating the gradient and updating the parameters is repeated until the loss function no longer decreases significantly. At this point, the algorithm has converged to a local minimum, and the resulting parameter vector is considered "optimal" for that user's review history.

The result of this process is a set of 17 numbers that encapsulate the user's personal memory dynamics. These optimized parameters are then fed back into the FSRS scheduler to generate future review intervals.  
Beyond its primary function of improving scheduling, the optimization process serves as a powerful diagnostic tool. The final parameter values are a quantitative fingerprint of a user's learning and reviewing behaviors. For instance, if a user's optimized parameters for initial stability after a "Good" rating (w2​) and an "Easy" rating (w3​) are nearly identical, it strongly suggests that the user does not meaningfully differentiate between these two grades when reviewing new cards.26 Similarly, an unusually high penalty for the 'Hard' grade (  
w15​) might indicate that the user is incorrectly using 'Hard' for items they have actually forgotten, instead of 'Again'. An application integrating FSRS could leverage this by building a "parameter health check" feature, providing users with actionable feedback on their card creation and grading habits, thus transforming the optimizer from a passive scheduling engine into an active coach for more effective learning.

## **V. A Developer's Guide to Implementing FSRS**

Integrating the FSRS algorithm into a flashcard application requires careful consideration of data storage, the logical flow of the scheduling process, and leveraging the existing open-source ecosystem. This section provides a practical guide for developers aiming to add FSRS capabilities to their software.

### **A. Essential Data Structures: The Card and ReviewLog**

At a minimum, two primary data structures are required to support FSRS: one to hold the current state of a flashcard and another to log its review history.

#### **Card Object**

Each flashcard in the system must store its own DSR memory state. This object is updated after every review. The essential fields are 16:

* id: A unique identifier for the card.  
* due: A timestamp indicating when the card is next scheduled for review.  
* stability: A floating-point number representing the card's current Stability (S).  
* difficulty: A floating-point number representing the card's current Difficulty (D).  
* state: An enumeration or integer representing the card's current learning phase. Common states include:  
  * New: The card has never been reviewed.  
  * Learning: The card is in the initial, short-term acquisition phase.  
  * Review: The card has graduated from the learning phase and is in long-term review.  
  * Relearning: The card was forgotten during a review and is now in a short-term relearning phase.

#### **ReviewLog Object**

A persistent, append-only log of every single review action is critical. This history is the raw data fed into the FSRS optimizer to personalize the algorithm. Each log entry should capture the state of a card at the moment of review.23

* id: A unique identifier for the log entry.  
* card\_id: A foreign key referencing the Card that was reviewed.  
* review\_datetime: A precise timestamp (ideally in UTC milliseconds) of when the review occurred.  
* rating: The integer grade provided by the user (1 for Again, 2 for Hard, 3 for Good, 4 for Easy).  
* state\_before: The state of the card *before* this review took place.  
* stability\_before: The stability of the card *before* this review.  
* difficulty\_before: The difficulty of the card *before* this review.  
* elapsed\_days: The actual number of days that have passed since the previous review. This is a crucial input for the FSRS calculations.  
* scheduled\_days: The number of days the card was scheduled for (the interval).  
* review\_duration: The time, in seconds or milliseconds, the user spent on the review.

### **B. The Scheduling Lifecycle: From New Card to Mature Review**

The core logic of an FSRS implementation revolves around a state machine that transitions a card through its lifecycle based on user ratings.

1. **New Card Creation:** When a user creates a new flashcard, it is initialized with stability \= 0, difficulty \= 0, and state \= New. Its due date is set to the current time, making it immediately available for study.28  
2. **First Review:**  
   * The user is presented with the new card and provides a rating (1-4).  
   * The application calls the FSRS scheduler function, passing in the rating and indicating that this is a first review (e.g., by providing null for the previous memory state).  
   * The scheduler calculates the initial Stability (S0​) and Difficulty (D0​) using the first-review formulas and the optimized parameters w0​ through w5​.  
   * It then calculates the first review interval based on S0​ and the user's configured desired\_retention.  
   * The card's due date is updated by adding the interval. Its stability and difficulty are updated to the newly calculated values, and its state is changed to Review.  
   * A comprehensive ReviewLog entry is created and saved to the database.  
3. **Subsequent Review:**  
   * When a card becomes due, the application calculates the elapsed\_days since its last review timestamp.  
   * The scheduler is called with the card's current memory state (stability, difficulty), the elapsed\_days, and the new rating from the user.  
   * The scheduler first calculates the predicted Retrievability (R) at the moment of review using the card's current S and the elapsed\_days.  
   * Based on the rating, it uses either the "success" or "lapse" formulas to compute the new stability (S′) and difficulty (D′).  
   * If the rating was a lapse (rating \= 1), the card's state is set to Relearning. Otherwise, it remains Review.  
   * The next interval is calculated based on the new S′ and the desired\_retention.  
   * The card's due, stability, and difficulty are updated, and a new ReviewLog is saved.

### **C. Best Practices for Handling Lapses and Relearning**

A critical architectural consideration for any developer is that the core FSRS algorithm is designed for long-term scheduling (intervals of days, months, and years). It does not, by itself, manage the very short-term steps involved in initially learning or relearning a card within a single study session.12 This responsibility falls to the host application.  
The strong recommendation from the FSRS community is that these application-level learning and relearning steps should be short and designed to be completed within the same day.8 For example, a new card might have steps of  
10 minutes and 1 hour. A lapsed card might have a single relearning step of 20 minutes.  
Using learning steps that span multiple days (e.g., 1d 3d) interferes with FSRS's model. FSRS assumes that when a card "graduates" from its learning steps, it is ready for long-term scheduling, and it calculates the first interval based on the review that happened *on that same day*.30 If the graduation happens days later, the time delta is misaligned with the model's assumptions, leading to suboptimal first intervals.  
When a card lapses, the FSRS algorithm calculates its new, lower stability and higher difficulty. The host application should then put the card into its Relearning queue to be reviewed after the short, configured relearning step. Once the user successfully reviews it again and it graduates from the relearning queue, FSRS takes over scheduling for the next long-term interval, using the already-updated (and appropriately penalized) DSR values.

### **D. Leveraging the FSRS Ecosystem: Open-Source Libraries and Tools**

Developers are strongly encouraged not to implement the FSRS mathematical formulas from scratch. The open-source community, led by the Open Spaced Repetition group, maintains a robust ecosystem of libraries and tools that provide well-tested and up-to-date implementations of the algorithm.31

| Language | Key Libraries | Repository Link(s) |  |
| :---- | :---- | :---- | :---- |
| **Rust** | fsrs-rs (Scheduler \+ Optimizer), rs-fsrs (Scheduler) | [github.com/open-spaced-repetition/fsrs-rs](https://github.com/open-spaced-repetition/fsrs-rs) |  |
| **Python** | py-fsrs (Scheduler \+ Optimizer), fsrs-optimizer | [github.com/open-spaced-repetition/py-fsrs](https://github.com/open-spaced-repetition/py-fsrs) |  |
| **TypeScript/JS** | ts-fsrs, fsrs-browser | [github.com/open-spaced-repetition/ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) |  |
| **Go** | go-fsrs | [github.com/open-spaced-repetition/go-fsrs](https://github.com/open-spaced-repetition/go-fsrs) |  |
| **Dart/Flutter** | dart-fsrs | [github.com/open-spaced-repetition/dart-fsrs](https://github.com/open-spaced-repetition/dart-fsrs) |  |
| **Swift** | swift-fsrs | [github.com/open-spaced-repetition/swift-fsrs](https://github.com/open-spaced-repetition/swift-fsrs) |  |
| **Java** | rs-fsrs-java (bindings to Rust library) | [github.com/open-spaced-repetition/rs-fsrs-java](https://github.com/open-spaced-repetition/rs-fsrs-java) |  |
| **C\#/.NET** | dotnet-fsrs | [github.com/tukao89/dotnet-fsrs](https://github.com/tukao89/dotnet-fsrs) |  |
| Table 2: A selection of key open-source FSRS implementation libraries. A more exhaustive list can be found in the awesome-fsrs repository.3 |  |  |  |

For optimization, developers can integrate the standalone fsrs-optimizer Python package into their backend. The application would periodically export the user's review logs in the specified format, run the optimizer, and then store the resulting personalized parameter vector to be used by the scheduler for that user.23 This modular approach separates the concerns of real-time scheduling and periodic, computationally-intensive training.

## **VI. Comparative Analysis: FSRS v4 vs. Anki's SM-2 Algorithm**

A thorough understanding of FSRS requires a direct comparison with its most widely used predecessor, the SM-2 algorithm, which serves as the default scheduler in many versions of Anki. The differences are not merely incremental; they represent fundamentally distinct approaches to modeling memory and scheduling reviews.

### **A. Foundational Differences in Memory Models and Adaptability**

The most significant divergence lies in the underlying memory models and their capacity for adaptation.

* **Memory Model:** As previously discussed, SM-2 employs a simplistic, one-dimensional model centered on the "ease factor." This single variable attempts to capture all properties of a memory, leading to an inability to distinguish between intrinsic difficulty and memory stability.5 In contrast, FSRS utilizes the multi-dimensional DSR model (Difficulty, Stability, Retrievability), which provides a more granular and physiologically plausible representation of a memory's state. This allows FSRS to make more nuanced and accurate scheduling decisions.5  
* **Adaptability:** SM-2's adaptation is purely local and reactive. It adjusts the ease factor of a single card based only on that card's review history, without any knowledge of the user's performance on other cards.6 FSRS, through its optimization process, is globally adaptive. It analyzes the user's performance across their  
  *entire collection* to build a unified, personalized model of that individual's memory. This means that learning a new set of easy cards can inform the model about the user's general learning ability, which can then be applied to the scheduling of all other cards.6

### **B. Empirical Comparison of Scheduling Efficiency and Workload**

The theoretical advantages of FSRS's model translate into measurable real-world benefits in terms of learning efficiency and user workload.

* **Workload Reduction:** The most commonly cited benefit of FSRS is its ability to achieve a target level of retention with fewer reviews. Because its predictions are more accurate, it can schedule longer intervals without compromising recall, eliminating many of the unnecessary reviews that SM-2 would schedule. Multiple sources, including user reports and simulations, suggest that FSRS can reduce the daily review burden by 20-30% or more compared to SM-2, for the same level of knowledge retention.1  
* **Predictive Accuracy:** The primary objective of a modern SRS algorithm is to accurately predict the probability of recall (R). This accuracy can be measured empirically using metrics like Log-Loss and Root Mean Square Error (RMSE) on large datasets of review logs. Benchmarks consistently show that FSRS significantly outperforms SM-2 in predictive accuracy.20 In fact, the original SM-2 algorithm does not natively predict recall probability at all, making a direct comparison of its predictive power impossible without adding a probabilistic layer on top of it for benchmarking purposes.33 FSRS is designed from the ground up as a predictive model, which is the source of its efficiency.

### **C. Contrasting User Experience, Control, and Intuitiveness**

Beyond the numbers, the two algorithms offer distinctly different user experiences.

* **Simplicity vs. "Black Box":** SM-2's logic is simple and transparent. A user can readily understand the formula: new\_interval \= old\_interval \* ease\_factor.4 This transparency can provide a sense of control and predictability.35 FSRS, on the other hand, is a "black box" to most users. Its behavior is dictated by a complex interplay of 17 optimized parameters and the DSR state variables, making its decisions opaque and less intuitive.35  
* **Handling Irregularity:** FSRS demonstrates far greater robustness when dealing with real-world study habits, such as taking breaks or having large backlogs of overdue cards. Because its calculations are based on the *actual elapsed time* since the last review, it can accurately assess the current memory state and schedule the next review appropriately.5 SM-2 is less flexible, typically applying a simple, non-adaptive bonus for overdue cards that fails to capture the true strength of the memory.  
* **Lapse Handling:** The user experience during relearning is a major point of differentiation. SM-2's tendency to create "ease hell" by severely punishing the ease factor of a lapsed card is a significant pain point for many users.8 FSRS's approach is more forgiving and realistic. It recognizes that a lapse reduces memory stability but does not erase it, calculating a new, shorter interval that is still informed by the card's previous maturity. This results in a much smoother and less frustrating relearning process, especially for difficult subjects.7

| Feature | FSRS v4 | Anki SM-2 Algorithm |  |
| :---- | :---- | :---- | :---- |
| **Memory Model** | Three-component DSR model: Difficulty, Stability, Retrievability. | Single-component model: "Ease Factor." |  |
| **Adaptability** | Global: Learns from the entire review history to create a personalized model for the user. | Local: Adapts only on a per-card basis. |  |
| **Main User Setting** | Desired Retention (e.g., 90%): Directly controls the trade-off between workload and recall. | Interval Modifier, Graduating Intervals, etc. Less direct control over retention. |  |
| **Handling of Lapses** | Reduces Stability based on pre-lapse DSR state. Avoids "ease hell." | Resets interval to a short duration and penalizes Ease Factor, often severely. |  |
| **Handling Overdue Reviews** | Highly robust. Uses the actual elapsed time to accurately calculate current Retrievability and next interval. | Less flexible. Applies a simple bonus that doesn't fully account for the memory's increased strength. |  |
| **Customization** | Personalization is automated via the optimizer. Manual tweaking of the 17 parameters is discouraged. | Relies on manual tweaking of multiple settings (e.g., Starting Ease, Easy Bonus) to optimize. |  |
| **Typical Workload** | 20-30% fewer reviews to achieve the same retention level as SM-2. | Higher review load for a given retention level due to less optimal scheduling. |  |
| Table 3: Head-to-Head Comparison of the FSRS v4 and SM-2 Algorithms.1 |  |  |  |

## **VII. Practical Considerations and Advanced Features**

While the core FSRS algorithm is complex, its implementation in user-facing applications like Anki has been designed to be manageable through a few key settings and a rich ecosystem of supplementary tools. Understanding these practical aspects is crucial for both users and developers to get the most out of FSRS.

### **A. Key User-Facing Settings: Desired Retention and Maximum Interval**

Unlike SM-2, which requires users to juggle multiple abstract settings, FSRS centralizes control into one primary, intuitive setting.

* **Desired Retention:** This is the single most important user-configurable parameter in FSRS.22 It represents the target probability of recall (Retrievability) that the user wants to have when a card becomes due. By setting a desired retention of 0.90 (or 90%), the user is instructing the algorithm to schedule cards so that they appear for review when there is a predicted 90% chance of remembering them. This setting allows users to make a direct and explicit trade-off between their daily workload and their level of mastery. A higher desired retention (e.g., 95%) will result in shorter intervals and more reviews, while a lower value (e.g., 85%) will reduce the workload at the cost of forgetting more often.24 The recommended range for most users and learning materials is between 80% and 95%.22  
* **Maximum Interval:** This setting places an upper limit on how long an interval can be. While FSRS can theoretically schedule reviews decades into the future for extremely stable memories, a user might want to set a ceiling (e.g., 5 years, 10 years, or 20 years) to ensure they see even the most well-known material periodically. This can act as a safeguard or align with long-term learning goals where indefinite retention is desired.38

### **B. The FSRS Helper Ecosystem: Load Balancing, Easy Days, and Manual Scheduling**

The core FSRS scheduler is complemented by a suite of features, often implemented in tools like the FSRS4Anki Helper add-on, that provide additional flexibility and quality-of-life improvements.9

* **Load Balancing (Fuzz):** To prevent reviews from clustering on specific days and creating unmanageable spikes in workload, a "fuzz" factor is applied. This feature slightly randomizes the final due date of a card around its calculated optimal interval, smoothing the distribution of future reviews without significantly impacting learning efficiency.19  
* **Easy Days:** This feature allows users to designate specific days of the week (e.g., weekends) as having a reduced or minimal review load. The scheduler will then attempt to avoid scheduling cards on these days, pushing them slightly earlier or later to accommodate the user's schedule.19 This is possible due to FSRS's ability to calculate the impact of such small delays.  
* **Advance and Postpone:** FSRS's predictive model enables the intelligent rescheduling of cards. The "Advance" feature allows a user to review cards ahead of schedule (e.g., before an exam), prioritizing cards that would suffer the least "damage" to their long-term stability from being reviewed early. Conversely, the "Postpone" feature can be used to manage a large backlog of reviews by pushing cards back, prioritizing the delay of cards that are least likely to be forgotten.19  
* **Disperse Siblings:** For flashcard systems that generate multiple cards from a single piece of source material (e.g., cloze deletions), this feature prevents these related "sibling" cards from being scheduled too close together, which can cause interference and make them artificially easy to answer.19

### **C. Known Limitations and Future Directions in Spaced Repetition Research**

Despite its advancements, FSRS v4 is not without limitations, and the field of spaced repetition research continues to evolve.

* **Data Requirement:** The most significant practical limitation is the need for a substantial review history to train the optimizer. New users must rely on default parameters, which are a one-size-fits-all solution and may not be optimal for their individual memory patterns.1  
* **Model Imperfections:** The creators of FSRS have acknowledged that the FSRS v4 model for Difficulty (D) has weaknesses. Specifically, the algorithm's predicted Retrievability (R) deviates most significantly from measured, real-world retention at the extremes of the difficulty scale (for cards with D≈1 or D≈10).12 This indicates that the formulas governing difficulty can still be improved.  
* **Short-Term Memory:** FSRS v4 and FSRS-4.5 do not explicitly model the dynamics of short-term memory within a single study session. This is why they rely on the host application's learning/relearning steps.35 Later versions, such as FSRS-5, begin to incorporate same-day review data into the optimization process, but modeling the transition from initial encoding to long-term storage remains an active area of development.21  
* **Content-Aware Scheduling:** The next frontier in SRS is the development of algorithms that are "content-aware." FSRS, like SM-2, is content-agnostic; it schedules cards based only on their review history (timestamps and grades), not the information they contain. Emerging research models like KAR3L use natural language processing (NLP) techniques like BERT to analyze the textual content of flashcards.20 This allows them to infer semantic relationships between cards. For example, if a user knows "Paris is the capital of France," a content-aware model could predict a higher probability of them also knowing "What is the capital of France?" even if they have never seen the second card before. This capability to predict recall for new or unseen cards based on content is a significant potential advancement that FSRS currently lacks.42

## **VIII. Conclusion and Recommendations**

The Free Spaced Repetition Scheduler v4 represents a monumental advancement in the field of computer-assisted learning. By replacing the simple, heuristic-based approach of legacy algorithms like SM-2 with a data-driven, personalized predictive model, FSRS has fundamentally elevated the standard for efficiency and effectiveness in spaced repetition systems. Its foundation on the DSR memory model provides a more granular and accurate representation of cognitive processes, while its machine learning-based optimizer ensures that the scheduling is continuously tailored to the individual user's memory patterns. The result is a system that demonstrably reduces user workload while maintaining or even improving knowledge retention.  
**For developers and platform architects,** the primary recommendation is to embrace and integrate FSRS. The path to implementation is made highly accessible by the vibrant and well-maintained open-source ecosystem surrounding the algorithm.

* **Leverage Existing Libraries:** Instead of attempting a from-scratch implementation of the complex mathematical core, developers should utilize the official, community-vetted libraries available for a wide range of programming languages (Rust, Python, TypeScript, etc.). This ensures correctness, maintainability, and access to the latest algorithmic updates.  
* **Prioritize Data Logging:** The personalization power of FSRS is entirely dependent on the quality and completeness of the user's review log. From day one, any new implementation should prioritize the creation of a robust, persistent logging system that captures the essential data points for each review: card ID, timestamp, rating, and pre-review memory state.  
* **Integrate the Optimizer:** The most effective FSRS implementation will provide users with a seamless way to run the optimizer on their review data. This can be achieved by integrating a backend process that utilizes the fsrs-optimizer package to periodically generate and update personalized parameter vectors for each user.

**For users of spaced repetition systems,** adopting FSRS offers a clear path to more efficient and sustainable learning.

* **Trust the Process and Grade Honestly:** The accuracy of FSRS personalization hinges on honest user feedback. Users should focus on consistently applying the rating buttons (Again, Hard, Good, Easy) to reflect their true recall experience. Misusing buttons, such as pressing 'Hard' for a forgotten card, will contaminate the data and lead to suboptimal scheduling.  
* **Use Desired Retention as the Primary Control:** Users should resist the urge to micromanage intervals and instead use the "Desired Retention" setting as their main lever of control. This single, intuitive parameter allows for a direct and transparent trade-off between daily study time and the desired level of mastery.  
* **Accumulate Data Before Optimizing:** New users should begin with the default FSRS parameters and focus on accumulating a sufficient review history (at least 400-1,000 reviews) before running the optimizer. The default parameters, derived from a large dataset, provide a strong baseline that is superior to SM-2, and personalized optimization will only become more effective once enough data is available.

In conclusion, FSRS should not be viewed as the final, perfect solution to spaced repetition, but rather as a powerful, open, and continuously evolving platform. It has definitively raised the bar for what users and developers should expect from a learning algorithm. As research progresses into areas like short-term memory modeling and content-aware scheduling, the principles of data-driven personalization and open-source collaboration pioneered by FSRS will undoubtedly form the foundation for the next generation of intelligent learning tools.

#### **Works cited**

1. The FSRS Spaced Repetition Algorithm \- RemNote Help Center, accessed July 30, 2025, [https://help.remnote.com/en/articles/9124137-the-fsrs-spaced-repetition-algorithm](https://help.remnote.com/en/articles/9124137-the-fsrs-spaced-repetition-algorithm)  
2. Compare Anki SM-2 vs FSRS for video · Issue \#486 · open-spaced-repetition/fsrs4anki, accessed July 30, 2025, [https://github.com/open-spaced-repetition/fsrs4anki/issues/486](https://github.com/open-spaced-repetition/fsrs4anki/issues/486)  
3. open-spaced-repetition/awesome-fsrs \- GitHub, accessed July 30, 2025, [https://github.com/open-spaced-repetition/awesome-fsrs](https://github.com/open-spaced-repetition/awesome-fsrs)  
4. Spaced Repetition Algorithm: A Three‐Day Journey from Novice to Expert : r/Anki \- Reddit, accessed July 30, 2025, [https://www.reddit.com/r/Anki/comments/17u01ge/spaced\_repetition\_algorithm\_a\_threeday\_journey/](https://www.reddit.com/r/Anki/comments/17u01ge/spaced_repetition_algorithm_a_threeday_journey/)  
5. What spaced repetition algorithm does Anki use?, accessed July 30, 2025, [https://faqs.ankiweb.net/what-spaced-repetition-algorithm](https://faqs.ankiweb.net/what-spaced-repetition-algorithm)  
6. What are the main differences between SM-2 and FSRS? : r/Anki, accessed July 30, 2025, [https://www.reddit.com/r/Anki/comments/10ajq3t/what\_are\_the\_main\_differences\_between\_sm2\_and\_fsrs/](https://www.reddit.com/r/Anki/comments/10ajq3t/what_are_the_main_differences_between_sm2_and_fsrs/)  
7. Anki SRS Algorithm : Spaced repetition explained with code | Hacker News, accessed July 30, 2025, [https://news.ycombinator.com/item?id=34152100](https://news.ycombinator.com/item?id=34152100)  
8. Think that I may have messed up FSRS \- Support \- AnkiHub Community, accessed July 30, 2025, [https://community.ankihub.net/t/think-that-i-may-have-messed-up-fsrs/489434](https://community.ankihub.net/t/think-that-i-may-have-messed-up-fsrs/489434)  
9. open-spaced-repetition/fsrs4anki: A modern Anki custom scheduling based on Free Spaced Repetition Scheduler algorithm \- GitHub, accessed July 30, 2025, [https://github.com/open-spaced-repetition/fsrs4anki](https://github.com/open-spaced-repetition/fsrs4anki)  
10. How to use the next-generation spaced repetition algorithm FSRS on Anki? | by Jarrett Ye, accessed July 30, 2025, [https://medium.com/@JarrettYe/how-to-use-the-next-generation-spaced-repetition-algorithm-fsrs-on-anki-5a591ca562e2](https://medium.com/@JarrettYe/how-to-use-the-next-generation-spaced-repetition-algorithm-fsrs-on-anki-5a591ca562e2)  
11. How did I publish a paper in ACMKDD as an undergraduate? A fantastic research experience on spaced repetition algorithm. Open source the code and dataset \- Anki Forums, accessed July 30, 2025, [https://forums.ankiweb.net/t/how-did-i-publish-a-paper-in-acmkdd-as-an-undergraduate-a-fantastic-research-experience-on-spaced-repetition-algorithm-open-source-the-code-and-dataset/23387](https://forums.ankiweb.net/t/how-did-i-publish-a-paper-in-acmkdd-as-an-undergraduate-a-fantastic-research-experience-on-spaced-repetition-algorithm-open-source-the-code-and-dataset/23387)  
12. FSRS explained, part 1: What it is and how it works : r/Anki \- Reddit, accessed July 30, 2025, [https://www.reddit.com/r/Anki/comments/15mab3r/fsrs\_explained\_part\_1\_what\_it\_is\_and\_how\_it\_works/](https://www.reddit.com/r/Anki/comments/15mab3r/fsrs_explained_part_1_what_it_is_and_how_it_works/)  
13. Add Anki's new Free Spaced Repetition Scheduler (FSRS) algorithm to Remnote, accessed July 30, 2025, [https://feedback.remnote.com/p/add-anki-s-new-free-spaced-repetition-scheduler-fsrs-algorithm-to-remnote](https://feedback.remnote.com/p/add-anki-s-new-free-spaced-repetition-scheduler-fsrs-algorithm-to-remnote)  
14. Anki FSRS Overview and Setup Guide \- YouTube, accessed July 30, 2025, [https://www.youtube.com/watch?v=NMLxc06l-Co](https://www.youtube.com/watch?v=NMLxc06l-Co)  
15. Free Spaced Repetition Scheduler algorithm \- GitHub, accessed July 30, 2025, [https://github.com/open-spaced-repetition/free-spaced-repetition-scheduler](https://github.com/open-spaced-repetition/free-spaced-repetition-scheduler)  
16. Implementing FSRS in 100 Lines \- Fernando Borretti, accessed July 30, 2025, [https://borretti.me/article/implementing-fsrs-in-100-lines](https://borretti.me/article/implementing-fsrs-in-100-lines)  
17. A technical explanation of FSRS | Expertium's Blog \- GitHub Pages, accessed July 30, 2025, [https://expertium.github.io/Algorithm.html](https://expertium.github.io/Algorithm.html)  
18. A technical explanation of the FSRS algorithm : r/Anki \- Reddit, accessed July 30, 2025, [https://www.reddit.com/r/Anki/comments/18tnp22/a\_technical\_explanation\_of\_the\_fsrs\_algorithm/](https://www.reddit.com/r/Anki/comments/18tnp22/a_technical_explanation_of_the_fsrs_algorithm/)  
19. The History of FSRS for Anki — LessWrong, accessed July 30, 2025, [https://www.lesswrong.com/posts/G7fpGCi8r7nCKXsQk/the-history-of-fsrs-for-anki](https://www.lesswrong.com/posts/G7fpGCi8r7nCKXsQk/the-history-of-fsrs-for-anki)  
20. FSRS is one of the most accurate spaced repetition algorithms in the world (updated benchmark) : r/Anki \- Reddit, accessed July 30, 2025, [https://www.reddit.com/r/Anki/comments/1c29775/fsrs\_is\_one\_of\_the\_most\_accurate\_spaced/](https://www.reddit.com/r/Anki/comments/1c29775/fsrs_is_one_of_the_most_accurate_spaced/)  
21. Benchmark of Spaced Repetition Algorithms \- Expertium's Blog, accessed July 30, 2025, [https://expertium.github.io/Benchmark.html](https://expertium.github.io/Benchmark.html)  
22. How to use the next-generation spaced repetition algorithm FSRS on Anki? \- Page 19, accessed July 30, 2025, [https://forums.ankiweb.net/t/how-to-use-the-next-generation-spaced-repetition-algorithm-fsrs-on-anki/25415?page=19](https://forums.ankiweb.net/t/how-to-use-the-next-generation-spaced-repetition-algorithm-fsrs-on-anki/25415?page=19)  
23. open-spaced-repetition/fsrs-optimizer: FSRS Optimizer ... \- GitHub, accessed July 30, 2025, [https://github.com/open-spaced-repetition/fsrs-optimizer](https://github.com/open-spaced-repetition/fsrs-optimizer)  
24. Guide to FSRS4Anki Integration \- Quizcat AI, accessed July 30, 2025, [https://www.quizcat.ai/blog/guide-to-fsrs4anki-integration](https://www.quizcat.ai/blog/guide-to-fsrs4anki-integration)  
25. How and by how much is FSRS better than Anki's SM-2? \- Reddit, accessed July 30, 2025, [https://www.reddit.com/r/Anki/comments/1gi0qzm/how\_and\_by\_how\_much\_is\_fsrs\_better\_than\_ankis\_sm2/](https://www.reddit.com/r/Anki/comments/1gi0qzm/how_and_by_how_much_is_fsrs_better_than_ankis_sm2/)  
26. FSRS parameters hitting boundries(?) after optimization \- Anki Forums, accessed July 30, 2025, [https://forums.ankiweb.net/t/fsrs-parameters-hitting-boundries-after-optimization/40777](https://forums.ankiweb.net/t/fsrs-parameters-hitting-boundries-after-optimization/40777)  
27. open-spaced-repetition/dart-fsrs: Dart Package for FSRS \- GitHub, accessed July 30, 2025, [https://github.com/open-spaced-repetition/dart-fsrs](https://github.com/open-spaced-repetition/dart-fsrs)  
28. fsrs · PyPI, accessed July 30, 2025, [https://pypi.org/project/fsrs/](https://pypi.org/project/fsrs/)  
29. How to use the next-generation spaced repetition algorithm FSRS on Anki?, accessed July 30, 2025, [https://forums.ankiweb.net/t/how-to-use-the-next-generation-spaced-repetition-algorithm-fsrs-on-anki/25415](https://forums.ankiweb.net/t/how-to-use-the-next-generation-spaced-repetition-algorithm-fsrs-on-anki/25415)  
30. fsrs4anki/docs/tutorial2.md at main \- GitHub, accessed July 30, 2025, [https://github.com/open-spaced-repetition/fsrs4anki/blob/main/docs/tutorial2.md](https://github.com/open-spaced-repetition/fsrs4anki/blob/main/docs/tutorial2.md)  
31. Open Spaced Repetition \- GitHub, accessed July 30, 2025, [https://github.com/open-spaced-repetition](https://github.com/open-spaced-repetition)  
32. FSRS Algorithm: Next-Gen Spaced Repetition \- Quizcat AI, accessed July 30, 2025, [https://www.quizcat.ai/blog/fsrs-algorithm-next-gen-spaced-repetition](https://www.quizcat.ai/blog/fsrs-algorithm-next-gen-spaced-repetition)  
33. FSRS vs SM2 in 2 seperate profiles \- Anki Forums, accessed July 30, 2025, [https://forums.ankiweb.net/t/fsrs-vs-sm2-in-2-seperate-profiles/52171](https://forums.ankiweb.net/t/fsrs-vs-sm2-in-2-seperate-profiles/52171)  
34. Should everyone switch to FSRS? \- Anki Forums, accessed July 30, 2025, [https://forums.ankiweb.net/t/should-everyone-switch-to-fsrs/45382](https://forums.ankiweb.net/t/should-everyone-switch-to-fsrs/45382)  
35. To people still using SM2 instead of FSRS: why? : r/Anki \- Reddit, accessed July 30, 2025, [https://www.reddit.com/r/Anki/comments/1h2k4m2/to\_people\_still\_using\_sm2\_instead\_of\_fsrs\_why/](https://www.reddit.com/r/Anki/comments/1h2k4m2/to_people_still_using_sm2_instead_of_fsrs_why/)  
36. Fsrs changes to be done if not reviewed for 5 months.? \- Help \- Anki Forums, accessed July 30, 2025, [https://forums.ankiweb.net/t/fsrs-changes-to-be-done-if-not-reviewed-for-5-months/44668](https://forums.ankiweb.net/t/fsrs-changes-to-be-done-if-not-reviewed-for-5-months/44668)  
37. Question About Handling New Cards \- Help \- Anki Forums, accessed July 30, 2025, [https://forums.ankiweb.net/t/question-about-handling-new-cards/45436](https://forums.ankiweb.net/t/question-about-handling-new-cards/45436)  
38. FSRS: Guide to dealing with crazy-long intervals : r/Anki \- Reddit, accessed July 30, 2025, [https://www.reddit.com/r/Anki/comments/1feiblg/fsrs\_guide\_to\_dealing\_with\_crazylong\_intervals/](https://www.reddit.com/r/Anki/comments/1feiblg/fsrs_guide_to_dealing_with_crazylong_intervals/)  
39. open-spaced-repetition/fsrs4anki-helper: An Anki add-on that supports Postpone & Advance & Load Balance & Easy Days & Disperse Siblings & Flatten \- GitHub, accessed July 30, 2025, [https://github.com/open-spaced-repetition/fsrs4anki-helper](https://github.com/open-spaced-repetition/fsrs4anki-helper)  
40. FSRS Helper (Postpone & Advance & Load Balance & Easy Days & Disperse Siblings), accessed July 30, 2025, [https://ankiweb.net/shared/info/759844606](https://ankiweb.net/shared/info/759844606)  
41. About FSRS algorithm's "first rating" \- Anki Forums, accessed July 30, 2025, [https://forums.ankiweb.net/t/about-fsrs-algorithms-first-rating/50055](https://forums.ankiweb.net/t/about-fsrs-algorithms-first-rating/50055)  
42. arXiv:2402.12291v3 \[cs.CL\] 28 Oct 2024, accessed July 30, 2025, [https://arxiv.org/pdf/2402.12291](https://arxiv.org/pdf/2402.12291)