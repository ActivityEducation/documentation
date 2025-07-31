---
title: A Framework for Content-Aware SRS
---

# **A Framework for Content-Aware Spaced Repetition Systems: Design, Analysis, and Application**

## **I. The Cognitive Foundations and Algorithmic Core of Spaced Repetition**

The efficacy of Spaced Repetition Systems (SRS) is not an artifact of software design but a direct application of fundamental principles of human memory. To understand the evolution and future of SRS, one must first grasp the cognitive science that underpins them. These systems are engineered solutions to the biological problem of forgetting.

### **1.1 The Psychology of Forgetting and Remembering**

At the heart of spaced repetition lies a collection of well-documented psychological phenomena that describe how memories are formed, strengthened, and lost over time.  
The Ebbinghaus Forgetting Curve  
In the late 19th century, psychologist Hermann Ebbinghaus conducted seminal research on himself, meticulously tracking his ability to recall lists of nonsense syllables over various periods. His work produced the "forgetting curve," a graph illustrating the exponential decay of memory retention over time.1 Ebbinghaus discovered that without reinforcement, a significant portion of newly learned information is lost within hours or days.3 This curve is not fixed; its slope can be flattened through repeated review. Spaced repetition is, in essence, a method for systematically counteracting this natural decay by scheduling reviews at moments when a memory is about to be forgotten, thereby reinforcing it for a longer duration.3  
The Spacing Effect  
The core principle derived from Ebbinghaus's work is the "spacing effect," which posits that learning is more durable and efficient when study sessions are distributed over time rather than massed together in a single session, a practice commonly known as "cramming".5 Research has consistently shown that expanding the intervals between successive reviews leads to a greater percentage of accuracy at later test points.1 This is because each time a memory is retrieved after a longer interval, it becomes more difficult to recall, necessitating a deeper level of cognitive processing that strengthens its encoding in long-term memory.1  
Active Recall and the Testing Effect  
Spaced repetition systems operationalize the spacing effect through the mechanism of active recall. This is distinct from passive review, such as re-reading a text or listening to a lecture. Active recall, also called retrieval practice, forces the learner to actively retrieve information from their own memory, for example, by answering a question on a flashcard.5 This process is more cognitively demanding and, consequently, more effective at strengthening the neural pathways associated with the memory.5 The "testing effect" is the observation that the mere act of testing one's memory enhances long-term retention, even more so than an equivalent amount of time spent studying.6 SRS is, therefore, a continuous, low-stakes testing engine designed to maximize this effect.  
Neurocognitive Basis  
On a biological level, these principles have a plausible basis in synaptic plasticity. The process of learning and memory is associated with the strengthening of connections between neurons. Repetition of specific memories can fortify existing synaptic connections and even generate new ones, a process crucial for long-term encoding. This long-lasting enhancement of synaptic signaling is known as long-term potentiation (LTP), which is widely considered a primary cellular mechanism underlying long-term memory formation.8 Spaced repetition, with its pattern of repeated stimuli at increasing intervals, is thought to be an effective method for inducing and maintaining LTP.8

### **1.2 The Foundational Algorithm: SuperMemo 2 (SM-2)**

The first widely adopted, computer-based implementation of these cognitive principles was the SuperMemo 2 (SM-2) algorithm, developed by Dr. Piotr Woźniak in 1987\.9 SM-2 provided a simple, rule-based heuristic that approximated an optimal review schedule, laying the groundwork for nearly all subsequent SRS software.11  
A technical deconstruction of the SM-2 algorithm reveals its core mechanics, which rely on a few key variables tracked for each learning item.13

* **Inputs:** The algorithm requires four pieces of information for each review:  
  1. **Quality of Response (q):** A user-provided integer score from 0 to 5, indicating the ease of recall for the current review. A score of 5 represents a perfect response, while 0 signifies a complete failure to recall.10  
  2. **Repetitions (n):** The number of consecutive successful reviews (where q≥3) for the item. This is initialized to 0\.  
  3. **Ease Factor (EF):** A floating-point number, typically initialized to 2.5, that represents the "easiness" of an item. It is used to calculate the growth of the review interval.13  
  4. **Previous Interval (I):** The number of days between the last review and the current one.  
* **Outputs:** After a review, the algorithm calculates and returns updated values for the item's state: a new interval, an updated repetitions count, and a new ease factor.  
* **Core Logic:** The algorithm's behavior is determined by the user's quality score 13:  
  * **If the response is correct (q≥3):**  
    * The repetition counter (n) is incremented.  
    * The review interval (I) is calculated. For the first successful review (n=1), the interval is set to 1 day. For the second (n=2), it is set to 6 days. For all subsequent reviews (n\>2), the new interval is calculated by multiplying the previous interval by the current ease factor: I(n):=I(n−1)×EF.  
    * The ease factor (EF) is adjusted using the formula: EF′:=EF+(0.1−(5−q)×(0.08+(5−q)×0.02)). This formula increases the EF for perfect scores (q=5), leaves it unchanged for q=4, and decreases it for q=3.  
  * **If the response is incorrect (q\<3):**  
    * The repetition counter (n) is reset to 0, effectively treating the item as if it is being learned for the first time.  
    * The interval is reset to 1 day.  
    * The ease factor (EF) remains unchanged.13  
* **Parameter Guardrails:** The algorithm includes a critical safeguard: the ease factor is never allowed to fall below 1.3.14 This prevents review intervals from becoming excessively short or even shrinking, which would be counterproductive.13

### **1.3 Evolution and Refinement: Anki and FSRS**

While SM-2 was revolutionary, its rigid, heuristic nature led to practical issues for users. Anki, one of the most popular open-source SRS platforms, implemented a modified version of SM-2 to address these shortcomings, and more recently has adopted a far more advanced algorithm, FSRS.9  
Anki's Modified SM-2  
Anki's implementation introduces several user-centric adjustments to the classic SM-2 algorithm 14:

* **Flexible Learning Steps:** Instead of the fixed 1-day and 6-day initial intervals, Anki allows users to define a series of shorter "learning steps" (e.g., 1 minute, 10 minutes, 1 day). This acknowledges that new material may require several rapid reviews before it can be retained for a full day.14  
* **Reduced Response Options:** Anki simplifies the user input from a 0-5 scale to four buttons: "Again," "Hard," "Good," and "Easy." This is based on the rationale that failures are a minority of reviews, and sufficient ease adjustment can be achieved by varying the positive responses.14  
* **Overdue Bonus:** The algorithm accounts for reviews that are completed later than scheduled. If a user successfully recalls an overdue card, the next interval is calculated based on the actual time elapsed, giving a "bonus" for retaining the information longer than predicted.15  
* **"Ease Hell" Prevention:** A common complaint with SM-2 is that difficult items can get stuck in "ease hell," where repeated "Hard" ratings drive the ease factor down, leading to frustratingly frequent reviews. Anki mitigates this by not reducing the ease factor for failures that occur during the initial learning steps.14

These modifications in Anki's SM-2 are primarily user-centric patches. They address the *symptoms* of the algorithm's rigidity—such as its punishing nature for difficult items—but they do not alter its fundamental content-agnostic design. They are quality-of-life improvements on a model that still treats every piece of information as a black box.  
The FSRS (Free Spaced Repetition Scheduler) Paradigm Shift  
A more fundamental evolution, now available as an alternative scheduler in Anki, is FSRS.14 This algorithm represents a significant conceptual leap from rule-based heuristics to a data-driven, cognitive state model. The evolution from SM-2 to FSRS is a critical transition from a purely  
*behavioral* model to a *cognitive state* model, a crucial stepping stone toward content-awareness. SM-2's core input is the user's subjective report on a single recall event. FSRS, in contrast, attempts to model the abstract, latent properties of the memory itself. It changes the question from "How well did you recall this just now?" to "What is the current state of this memory, and how will it decay?"  
FSRS models three key variables for each learning item 14:

1. **Difficulty (D):** A measure of the inherent complexity of the information itself.  
2. **Stability (S):** The length of time (in days) it takes for the probability of recalling an item to drop from 100% to 90%.  
3. **Retrievability (R):** The probability that the user can successfully recall the item at a given moment.

By modeling these underlying cognitive variables, FSRS moves beyond simply reacting to user feedback and begins to build a predictive model of the memory trace itself. This proactive modeling approach directly anticipates the goal of content-aware systems, which is to predict these cognitive state variables (especially Difficulty) from the content *before* the first review, rather than inferring them slowly over many repetitions.

## **II. The Content-Agnostic Barrier: Inherent Limitations of Traditional SRS**

Despite their proven effectiveness for certain types of learning, traditional Spaced Repetition Systems like SM-2 and its variants are built on a foundation that is fundamentally "content-agnostic." They operate on learning items without any knowledge of their meaning, complexity, or relationship to other items. This blindness creates an "information bottleneck" that imposes significant limitations on their efficiency, applicability, and pedagogical sophistication.

### **2.1 The "Black Box" Problem: Treating All Knowledge as Uniform**

The core limitation of traditional SRS is that it treats every piece of knowledge as a uniform, interchangeable "item" or "flashcard".9 The algorithm has no access to the text, images, or concepts contained within the item. A flashcard for a simple arithmetic fact like "  
2+2=4" is processed using the exact same logic as a card summarizing a complex scientific theory like general relativity.  
The only signal the algorithm receives about the item's nature is the user's subjective quality rating after a review session.13 This is an extremely low-bandwidth communication channel. The entire complexity, nuance, and context of a piece of knowledge must be compressed into a single number between 0 and 5\. This fundamental flaw—the reliance on a single, low-bandwidth feedback signal—forces the system into a slow, inefficient, trial-and-error discovery process for each item's intrinsic difficulty. It is akin to determining the weight of different objects solely by dropping them and listening to the sound they make; while one might eventually discern differences, it is vastly less efficient than using a scale from the outset. This "information bottleneck" is the primary driver for all subsequent innovations that seek to provide the algorithm with more upfront information about the content itself.

### **2.2 Inefficiency and "Ease Hell"**

This information bottleneck leads directly to practical problems for the learner. For concepts that are intrinsically difficult, a user may repeatedly fail or rate them as "Hard." In a classic SM-2 system, this feedback loop can drive the item's ease factor down towards its floor of 1.3. This results in the item being scheduled for review with excessive and frustrating frequency, a state colloquially known as "ease hell" or "low interval hell".14 While this ensures the item is not forgotten, it does so at a high cost in terms of user time and motivation.  
Anki's modifications, such as not penalizing the ease factor during initial learning steps, are designed to mitigate this issue.14 However, they are patches that address the symptom rather than the root cause. The underlying problem remains: the algorithm must slowly and painfully  
*discover* that an item is difficult through repeated user failure, rather than being able to recognize its complexity from the start.

### **2.3 The Cold Start Problem and Lack of Generalization**

The content-agnostic nature of traditional SRS is most apparent when a new, unseen card is introduced. The system has zero information about this item and therefore cannot make an intelligent initial scheduling decision.16 The initial intervals, such as 1 day and 6 days in SM-2, are arbitrary, hard-coded heuristics that are applied uniformly to all new items.10  
This "cold start" problem is not merely an initial inconvenience; it represents a persistent failure to model knowledge transfer, which is a cornerstone of human learning. Humans learn new concepts by relating them to what they already know. A content-agnostic SRS, however, treats the learner as a blank slate with respect to each new item, ignoring the vast network of related knowledge the learner may have already built within the system.16 For example, after a user has successfully learned ten Italian vocabulary words for different fruits, the system has no basis to assume that an eleventh Italian fruit word might be easier to learn than a new word about quantum mechanics. This failure to model and leverage semantic relationships between items is a major missed opportunity for optimizing the learning process.

### **2.4 Context-Dependence and Oversimplification**

The design of traditional SRS makes it exceptionally effective for memorizing discrete, context-free facts, such as vocabulary, historical dates, or simple definitions.1 This is the domain where the "black box" approach works reasonably well, as the items are largely independent and have a clear right or wrong answer.  
However, the utility of this approach diminishes when applied to more complex, nuanced, or skill-based knowledge domains.6 Learning to program, understanding a philosophical argument, or mastering a complex medical diagnosis involves grasping context, understanding relationships, and applying principles—not just blindly memorizing isolated facts. For these domains, spaced repetition is often best viewed as a  
*complement* to, not a *substitute* for, deeper learning practices like extensive reading, problem-solving, and practical application.18 The oversimplification inherent in the content-agnostic model prevents it from effectively supporting these richer forms of learning.

## **III. The Frontier of Intelligent Recall: A Critical Analysis of Content-Aware SRS Implementations**

The inherent limitations of content-agnostic algorithms have spurred a new wave of research and development aimed at creating "content-aware" Spaced Repetition Systems. These systems leverage techniques from machine learning and natural language processing (NLP) to analyze the learning material itself, moving beyond the simple user-feedback loop of traditional models. This section provides a critical analysis of the leading approaches, revealing a fundamental split between statistical and semantic methodologies.

### **3.1 The Statistical Approach: Feature-Based and Data-Driven Models**

This approach, pioneered by large-scale learning platforms like Duolingo, treats content awareness as a statistical prediction problem. It works by identifying features of the learning content and correlating them with learning outcomes across massive datasets, without necessarily performing deep semantic analysis.  
Duolingo's Half-Life Regression (HLR)  
The Half-Life Regression (HLR) model was a landmark development in data-driven SRS.2 It frames the learning problem as predicting the "half-life" of a memory—the point at which the recall probability drops to 50%.

* **Methodology:** HLR uses a logistic regression model that incorporates not only user interaction data (e.g., time since last practice, number of correct/incorrect attempts) but also, crucially, *lexical features* of the words being learned. These features can include simple properties like word length, part-of-speech tags, and whether a word is a cognate (similar to a word in the learner's native language).2  
* **Impact:** When trained on Duolingo's vast dataset, HLR demonstrated a remarkable ability to improve recall predictions, reducing error by over 45% compared to baselines. Furthermore, the learned weights of the model provided empirical insights into what linguistic features make concepts systematically more or less difficult for second-language learners.2

Duolingo's MEMORIZE Algorithm  
Building on this success, the MEMORIZE algorithm represents a more theoretically sophisticated approach, framing SRS as a problem of stochastic optimal control.11

* **Methodology:** This model uses the mathematical framework of marked temporal point processes to model the dynamics of a learner's memory state. It then solves for an optimal review schedule that maximizes recall probability subject to a cost for the frequency of reviews. The key finding is that the optimal review intensity for an item is given by a simple function of its current recall probability.11  
* **Impact:** In large-scale natural experiments on the Duolingo platform, MEMORIZE was shown to be significantly superior to heuristic-based scheduling algorithms, leading to lower forgetting rates and more effective memorization.11

These statistical approaches are triumphs of large-scale data analysis. They work by finding powerful correlations between observable features (both lexical and behavioral) and learning outcomes. They do not necessarily "understand" the content in a human-like way but are highly effective at prediction when sufficient data is available.

### **3.2 The Semantic Approach: NLP and Deep Knowledge Tracing**

A contrasting approach focuses on leveraging modern NLP models to achieve a deeper, more semantic understanding of the learning content. This methodology is less reliant on massive datasets of user interactions and more focused on the inherent meaning and structure of the information itself.  
AllAI: Automated Sentence Generation  
The AllAI system represents a novel approach that redefines the learning item itself to enhance context.20

* **Methodology:** Instead of scheduling the review of isolated vocabulary words, AllAI dynamically generates new, grammatically correct sentences that incorporate multiple words that are currently due for review. This is achieved using advanced NLP techniques, such as few-shot prompting of large language models or retrieving suitable sentences from a large corpus.20 This method forces the learner to process words in a meaningful context rather than as standalone facts.  
* **Impact:** An evaluation with Danish language learners found that this sentence-based method led to a four-fold increase in the speed of new word acquisition compared to conventional, single-item SRS, demonstrating the profound benefit of contextualized learning.20

KAR3L: Knowledge-Aware Deep Knowledge Tracing  
The KAR3L model directly tackles the "cold start" and knowledge transfer limitations of traditional SRS by integrating Deep Knowledge Tracing (DKT) with semantic retrieval.16

* **Methodology:** DKT models predict student knowledge by encoding their entire study history. KAR3L enhances this by making it content-aware. When predicting a user's recall on a given flashcard, KAR3L first uses a BERT-based retriever to find the most semantically similar cards from the user's past study history. It then uses the interaction data from these similar cards to inform its prediction. This explicitly models the idea that "if a student knows concept X, and concept Y is semantically similar to X, they are more likely to know Y".16  
* **Impact:** KAR3L achieved state-of-the-art accuracy in offline recall prediction benchmarks. To translate this to real-world benefit, the researchers designed a novel "delta-based" teaching policy that schedules items predicted to have the greatest increase in recall probability over a set time, demonstrating that the model's superior predictions could lead to more efficient online learning.16

These semantic approaches are more computationally intensive per-item but are more flexible, less reliant on enormous historical datasets, and more aligned with cognitive theories of how humans learn by making connections. This analysis reveals a schism between the *statistical* (big data) and *semantic* (deep understanding) philosophies. The ideal future system will likely need to fuse the predictive power of statistical models with the contextual flexibility of semantic ones.

### **3.3 Emerging Paradigms: Retrieval-Augmented Generation (RAG)**

A new paradigm emerging from the field of large language models (LLMs) is Retrieval-Augmented Generation (RAG). While not yet a full SRS, its application in educational contexts has direct implications for the future of these systems. RAG-based systems can generate detailed comments or explanations for learning items (e.g., medical board exam questions) by first retrieving relevant information from a verified knowledge base, such as textbooks or research papers, and then using an LLM to synthesize an answer.21  
This points to a future where the "learning item" is no longer a static, fixed entity. The content of a flashcard—its question, answer, or explanation—could be dynamically generated or updated. For example, if a user struggles with a concept, a RAG-based SRS could generate a new, more detailed explanation tailored to their specific misunderstanding, or update an item's content to reflect the latest scientific findings. This trend suggests a significant shift from merely *scheduling* static "cards" to dynamically *managing* and *presenting* fluid "concepts." The atomic unit of learning becomes the concept itself, stored in a knowledge base, from which various learning experiences can be instantiated on the fly.

### **Table 1: Comparative Analysis of Spaced Repetition Algorithms**

| Algorithm | Core Principle | Content-Awareness Level | Key Parameters | Strengths | Weaknesses |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **SM-2** | Rule-based heuristic approximation of the forgetting curve.10 | None. Treats all items as identical black boxes.9 | quality, repetitions, ease\_factor, interval.13 | Simple to implement, computationally cheap, effective for simple facts.9 | Rigid, prone to "ease hell," suffers from cold-start problem, inefficient for complex topics.14 |
| **Anki-SM2** | User-centric modifications to SM-2 for improved flexibility and usability.14 | None. Still fundamentally content-agnostic. | Learning steps, ease factor, interval modifier, overdue bonus.15 | More flexible than SM-2, mitigates "ease hell," handles overdue reviews better.14 | Still a heuristic, does not model knowledge transfer, relies on slow trial-and-error adjustment.14 |
| **FSRS** | Data-driven cognitive state modeling.14 | Low. Models item Difficulty but infers it from user history, not content. | Difficulty (D), Stability (S), Retrievability (R).14 | More accurate and personalized than heuristics, based on a cognitive model. | Requires data to optimize parameters, still treats new items uniformly initially. |
| **HLR** | Statistical prediction of memory "half-life" using content features.2 | Medium (Lexical). Uses surface-level features of text (e.g., word length, cognates).2 | Lexical features, interaction history, time lag.19 | Proven high prediction accuracy at scale, provides insights into linguistic difficulty.2 | Requires massive datasets, features are shallow (not deep semantic), may not generalize well to new domains. |
| **KAR3L** | Deep Knowledge Tracing enhanced with semantic retrieval.16 | High (Semantic). Uses BERT to understand content similarity between items.16 | Study history, BERT embeddings, retrieval scores.16 | Solves the cold-start problem, models knowledge transfer, high prediction accuracy.16 | Computationally expensive, retrieval adds complexity, requires curated dataset for training.16 |

## **IV. Architecting a Content-Aware SRS: A Multi-Layered Framework**

Synthesizing the lessons learned from both traditional and modern Spaced Repetition Systems, it becomes clear that a next-generation, truly content-aware SRS is not merely a new scheduling algorithm. Rather, it must be a complete, end-to-end pedagogical pipeline that transforms raw information into an optimized, personalized learning curriculum. This section proposes a novel, multi-layered framework for such a system. The architecture is designed to ingest content, understand its structure and meaning, generate diverse learning items, and schedule them using a dynamic, content-informed algorithm. At the heart of this framework lies the Knowledge Graph, a central, unifying data structure that enables true content awareness by providing the context and relationships that inform every other layer of the system.

### **4.1 Layer 1: Ingestion and Parsing Engine**

The first layer is responsible for taking raw source material and converting it into a structured, machine-readable format. The choice of tools for this layer depends heavily on the nature of the input content.

* **For Unstructured Text:** Content such as articles, textbooks, or web pages requires a robust NLP pipeline. Libraries like **winkNLP** for JavaScript/TypeScript environments or the **Hugging Face Transformers** library for Python are excellent choices. WinkNLP is noted for its high performance, comprehensive feature set including TypeScript support, and lack of external dependencies, making it ideal for web-based applications.22 Hugging Face provides access to a vast ecosystem of state-of-the-art pre-trained models for various NLP tasks.24 The primary task at this stage is accurate tokenization (breaking text into words or sub-words) and sentence boundary detection.  
* **For Structured Content (e.g., Domain-Specific Languages):** When the input is code or another format with a formal grammar, a dedicated parser is far more effective. A parser generator like **ANTLR (ANother Tool for Language Recognition)** can take a formal grammar specification and generate a parser in multiple target languages, including Java, Python, and JavaScript/TypeScript.26 For projects primarily in the JavaScript ecosystem, native libraries like  
  **Ohm** or **Nearley** provide powerful toolkits for building parsers for custom languages.28 The output of this process is typically an  
  **Abstract Syntax Tree (AST)**, a hierarchical tree representation of the input's grammatical structure, which is an ideal input for the next layer.

### **4.2 Layer 2: Knowledge Graph Generation**

This layer is the conceptual core of the system. It takes the structured output from the Ingestion Engine and builds a semantic blueprint of the knowledge domain—a Knowledge Graph (KG).

* **Entity and Concept Identification:** The first step is to identify the key nouns of the domain. For text, this involves applying **Named Entity Recognition (NER)** to extract predefined categories like persons, organizations, and locations, as well as domain-specific terms.31 For more general concepts that are not named entities,  
  **Keyphrase Extraction** algorithms such as TextRank, RAKE (Rapid Automatic Keyword Extraction), or YAKE (Yet Another Keyword Extractor) can be used to identify important multi-word phrases.34 These entities and keyphrases become the  
  **nodes** in our Knowledge Graph.  
* **Relationship Extraction:** Identifying the connections between nodes is what gives the graph its power. For text, techniques like dependency parsing and semantic role labeling can help identify grammatical relationships (e.g., subject-verb-object). For more complex semantic relationships (e.g., "is a type of," "is a prerequisite for"), fine-tuning transformer-based models on relationship extraction tasks is a more advanced option. For code, these relationships are often explicit in the AST (e.g., a function call creates a "calls" relationship). These relationships become the directed, labeled **edges** in the Knowledge Graph.  
* **Graph Construction:** The final step is to store these nodes and edges in a suitable graph data structure. Nodes can be augmented with metadata, such as their frequency in the source text or their centrality within the graph, which can later be used as a proxy for importance or complexity.

### **4.3 Layer 3: Atomic Item Generation Engine**

With a rich Knowledge Graph in place, this layer's purpose is to automatically generate a diverse and pedagogically sound set of learning items. This moves beyond simple question-answer pairs to create a variety of assessments.

* **Methodology:** The engine will leverage **Automatic Question Generation (AQG)** models, which are typically based on fine-tuned sequence-to-sequence transformers like T5 or BART.37 By providing the model with a piece of context from the Knowledge Graph (e.g., a node and its immediate neighbors), it can be prompted to generate a question.  
* **Item Variety:** The structure of the Knowledge Graph enables the generation of different types of questions, targeting different levels of understanding 40:  
  * **Factual/Definitional Questions:** Generated from the attributes of a single node (e.g., "What is the definition of \[Concept X\]?").  
  * **Relational Questions:** Generated from the edges between two nodes (e.g., "How does \[Concept A\] differ from?").  
  * **Inferential/Deep Questions:** Requiring the traversal of multiple nodes and edges to synthesize an answer.  
  * **Cloze Deletions (Fill-in-the-blank):** Created by taking a definition or code snippet from the source and masking a key term (a node in the KG).  
  * **Problem-Solving/Application Questions:** For domains like programming, this could involve generating small code snippets and asking the user to predict the output or debug an error.  
* **Answer Assessment:** For questions requiring free-form text input, the system can use semantic similarity models (e.g., sentence-BERT) to compare the user's answer against the ground-truth answer stored in or derived from the Knowledge Graph, allowing for more flexible assessment than exact string matching.

### **4.4 Layer 4: Dynamic Scheduling Algorithm**

This layer is the "engine" of the SRS, deciding which item to show the user and when. The proposed framework uses a hybrid algorithm that combines the strengths of cognitive modeling with the rich information from the content-centric layers.

* **Model: A "Content-Boosted FSRS"**  
  * **Foundation:** The algorithm will use the **FSRS (Difficulty, Stability, Retrievability) model** as its core scheduling logic, due to its proven foundation in cognitive modeling.14  
  * **Content-Aware Seeding:** The "cold start" problem is solved by seeding the initial Difficulty parameter of a new item based on features derived from the Knowledge Graph. Instead of using a generic default, the initial difficulty can be a function of:  
    * **Graph Centrality:** A concept with many connections is likely more fundamental and potentially more complex.  
    * **Conceptual Density:** An item generated from a dense, highly interconnected cluster of nodes in the KG is likely more challenging.  
    * **Prerequisite Mastery:** An item's initial difficulty can be dynamically increased if the concepts it depends on (as defined by prerequisite edges in the KG) have not yet been mastered by the user.  
  * **Dynamic Difficulty Adjustment:** The standard update rules are modified. A correct response to an item that the KG identifies as "difficult" should result in a larger increase in its Stability parameter than a correct response to an "easy" item. This provides a more principled and granular adjustment than a simple "Easy Bonus".14  
  * **Inter-Item Knowledge Transfer:** Inspired by KAR3L's retrieval mechanism 16, the system can model knowledge transfer. When a user successfully reviews an item associated with a concept node in the KG, a small "learning boost" can be propagated to adjacent, semantically similar nodes. This could manifest as a slight preemptive decrease in the initial  
    Difficulty of items related to those neighboring concepts, reflecting the idea that learning one thing makes it easier to learn related things.

### **4.5 Layer 5: Data Persistence and Architecture**

A robust and scalable backend is required to store the various components of this complex system. A single database model is unlikely to be optimal; therefore, a hybrid approach is recommended.

* **Proposed Schema:**  
  * **Graph Database (e.g., Neo4j, Amazon Neptune):** This is the ideal choice for storing the **Knowledge Graph**. The native node-and-edge structure allows for efficient traversal and complex queries that are essential for tasks like finding prerequisites, identifying related concepts, or calculating graph-based metrics like centrality.  
  * **Relational (e.g., PostgreSQL) or Document Database (e.g., MongoDB, DynamoDB):** This is better suited for storing user data, item states, and the voluminous review log.41 A potential schema would include:  
    * Users: user\_id, authentication details, profile settings.  
    * Concepts: concept\_id, source\_content, pointers to its representation in the graph database.  
    * Items: item\_id, concept\_id, item\_type (e.g., Q\&A, cloze), generated\_content.  
    * UserItemState: user\_id, item\_id, stability, difficulty, retrievability, last\_reviewed\_date, next\_due\_date. This table holds the core SRS state for each user and each item.44  
    * ReviewLog: log\_id, user\_id, item\_id, timestamp, response\_quality, time\_taken\_ms. This table is critical for analytics and for periodically retraining the scheduling models. It is expected to grow very large and should be optimized for fast, append-only writes.41

This hybrid architecture leverages the strengths of each database type: graph databases for modeling complex relationships and relational/document databases for handling transactional user data and massive, structured logs efficiently.45

### **Table 2: NLP Toolkit for Content-Aware SRS**

| Layer | NLP Task | Purpose in SRS | Recommended Libraries/Models | Key Implementation Considerations |
| :---- | :---- | :---- | :---- | :---- |
| **Ingestion & Parsing** | Parsing DSLs/Code | Convert structured code into an Abstract Syntax Tree (AST) for analysis. | ANTLR 26, Ohm 28, Nearley 29 | Requires a formal grammar definition for the target language. The AST is a high-fidelity input for the KG. |
|  | Tokenization / SBD | Break unstructured text into sentences and words for processing. | winkNLP 22, Hugging Face Tokenizers 24 | Choice of tokenizer (e.g., WordPiece, BPE) can impact downstream model performance. |
| **Knowledge Graph Generation** | Named Entity Recognition (NER) | Identify key, domain-specific entities (functions, variables, people, places) to serve as KG nodes. | spaCy, winkNLP 23, Fine-tuned BERT/RoBERTa models 32 | Pre-trained models may need fine-tuning on domain-specific data to recognize specialized entities accurately. |
|  | Keyphrase Extraction | Identify multi-word concepts that are not named entities to serve as KG nodes. | TextRank, RAKE 36, YAKE 36 | These are often unsupervised and fast, but may be less accurate than supervised methods. |
|  | Relationship Extraction | Identify semantic links between entities (e.g., is\_a, uses, causes) to form KG edges. | Dependency Parsing, Fine-tuned Transformer models (e.g., on TACRED dataset) | A challenging task. Rule-based approaches can work for simple relations; deep learning is needed for complex ones. |
| **Atomic Item Generation** | Automatic Question Generation (AQG) | Create diverse learning items (factual, relational, cloze) from KG content. | Fine-tuned T5 38, BART, GPT models 37 | Requires a high-quality dataset of (context, question) pairs for fine-tuning. Chain-of-thought prompting can improve higher-order question generation.37 |
|  | Semantic Answer Scoring | Evaluate free-text user answers by meaning rather than exact match. | Sentence-Transformers (SBERT), Cosine Similarity on embeddings | Crucial for accepting conceptually correct but differently phrased answers. |

## **V. Case Study: Applying the Framework to the Karel Programming Language**

To demonstrate the practical application and value of the proposed multi-layered framework, this section provides a concrete, step-by-step walkthrough using the Karel programming language as the learning domain. This case study will illustrate how the system transforms raw source code into a personalized, adaptive learning experience that transcends simple memorization and fosters genuine skill acquisition.

### **5.1 The Domain: Karel as a DSL**

Karel is a simple programming language created specifically for educational purposes. Its primary goal is to introduce beginners to the fundamental concepts of programming—such as commands, control flow, and problem decomposition—within a simplified, visual, and non-intimidating environment.46 Karel programs control a robot in a grid-based world, instructing it to move, turn, and interact with objects called "beepers".47  
Because it is a computer language specialized for a particular application domain (introductory programming education), Karel is a classic example of a Domain-Specific Language (DSL).50 Its limited scope and expressive, high-level abstractions make it an ideal subject for a content-aware SRS. The language's structure is well-defined, making it perfectly suited for formal parsing, which yields a much higher-fidelity representation of its logic than statistical NLP techniques applied to unstructured natural language text. The Abstract Syntax Tree (AST) generated by a formal parser provides a guaranteed-correct blueprint of a program's structure and dependencies, serving as a perfect foundation for the Knowledge Graph.

### **Table 3: Karel Language Syntax and Primitives**

| Category | Construct | Description | Source(s) |
| :---- | :---- | :---- | :---- |
| **Primitive Commands** | move() | Moves the robot forward one space in the direction it is facing. | 47 |
|  | turn\_left() | Rotates the robot 90 degrees to the left (counter-clockwise). | 47 |
|  | pick\_beeper() | Picks up one beeper from the current corner. | 47 |
|  | put\_beeper() | Puts down one beeper on the current corner. | 47 |
|  | turnoff() | Halts program execution. | 54 |
| **Control Structures** | IF \[test\] THEN \[instruction\] | Executes instruction(s) only if the test condition is true. Can include an ELSE block. | 54 |
|  | WHILE \[test\] DO \[instruction\] | Repeatedly executes instruction(s) as long as the test condition is true. | 55 |
|  | ITERATE \[N\] TIMES \[instruction\] | Repeats an instruction or block of instructions a fixed number of times. | 55 |
| **Conditional Tests** | front\_is\_clear() | Returns true if there is no wall directly in front of the robot. | 53 |
|  | next\_to\_a\_beeper() | Returns true if the robot is on the same corner as one or more beepers. | 53 |
|  | facing\_north() | Returns true if the robot is currently facing north. (Similar for south, east, west). | 53 |
|  | any\_beepers\_in\_beeper\_bag() | Returns true if the robot's beeper bag is not empty. | 54 |
| **Program Structure** | BEGINNING-OF-PROGRAM | Marks the start of the entire program file. | 55 |
|  | DEFINE-NEW-INSTRUCTION | Allows the programmer to define a new command as a sequence of existing ones. | 55 |
|  | BEGINNING-OF-EXECUTION | Marks the start of the main block of executable code. | 55 |

### **5.2 Step-by-Step Implementation Walkthrough**

Let us consider a simple Karel program designed to make the robot turn right, a function not provided as a primitive.  
**Sample Input Program:**

Delphi

```
{ A simple program to define and use turn\_right }  
BEGINNING-OF-PROGRAM  
    DEFINE-NEW-INSTRUCTION turn\_right AS  
    BEGIN  
        ITERATE 3 TIMES  
            turn\_left;  
    END;

    BEGINNING-OF-EXECUTION  
        move;  
        turn\_right;  
        turnoff;  
    END-OF-EXECUTION  
END-OF-PROGRAM
```

Step 1: Ingestion & Parsing (Layer 1\)  
The system ingests the raw .kl source file. The Parsing Engine, configured with a formal ANTLR grammar for the Karel language, processes this text.26 The ANTLR toolset is known to include a grammar for Karel, making this a feasible starting point.57 The parser validates the syntax and generates an Abstract Syntax Tree (AST) that precisely represents the program's logical structure. The AST would look something like this:

* A root Program node.  
* A DefineInstruction node for turn\_right.  
  * This node has a child Iterate node with a value of 3\.  
    * The Iterate node has a child Command node for turn\_left.  
* An ExecutionBlock node.  
  * This block has three children: a Command node for move, a Command node for turn\_right, and a Command node for turnoff.

Step 2: Building the Karel Knowledge Graph (Layer 2\)  
The system traverses the AST to populate the Knowledge Graph.

* **Node Creation:** Each unique command, control structure, and condition from the Karel language specification (Table 3\) becomes a node in the KG (e.g., move, turn\_left, ITERATE, DEFINE-NEW-INSTRUCTION). The newly defined turn\_right instruction also becomes a node.  
* **Edge Creation:** The relationships from the AST are translated into labeled edges in the KG.  
  * The turn\_right node gets a defined\_using edge pointing to the DEFINE-NEW-INSTRUCTION node.  
  * The turn\_right node gets three composed\_of edges pointing to the turn\_left node. This explicitly captures the prerequisite relationship: to understand turn\_right, one must first understand turn\_left.  
  * The ITERATE node gets a controls edge pointing to the turn\_left node.

Step 3: Generating Karel Learning Items (Layer 3\)  
The Item Generation Engine queries this new KG to create a variety of learning items.

* **Factual/Definitional:**  
  * Querying the turn\_left node: "What does the turn\_left() command do?"  
  * Querying the ITERATE node: "What is the purpose of the ITERATE command?"  
* **Compositional/Relational:**  
  * Querying the turn\_right node and its composed\_of edges: "Write the Karel code to define a turn\_right instruction."  
* **Problem-Solving/Predictive:**  
  * The engine generates a small world state (e.g., Karel at corner (1,1) facing East) and a code block (move; turn\_right; move;). The question is: "What will be Karel's final position and orientation?"  
* **Debugging:**  
  * The engine generates a faulty program, for example, defining turn\_right with only two turn\_left calls. The question is: "This program is intended to make Karel turn right, but it does not. Find and fix the error."

Step 4: Scheduling Karel Concepts (Layer 4\)  
The "Content-Boosted FSRS" scheduler now uses this rich, content-derived information to create a personalized learning path.

* **Initial Scheduling:** For a new user, the system identifies nodes with no incoming composed\_of or prerequisite edges, such as move and turn\_left. It prioritizes generating and scheduling items for these fundamental, primitive concepts first.  
* **Difficulty Seeding:** The initial Difficulty for an item testing the ITERATE loop is seeded at a higher value than an item for the move command, reflecting its greater conceptual complexity (a control structure vs. a simple action).  
* **Adaptive Progression:** Once the user demonstrates mastery of turn\_left (i.e., the Stability of the turn\_left concept is high), the scheduler begins to introduce items related to turn\_right. It recognizes the prerequisite link and can even slightly lower the initial Difficulty of the turn\_right concept, hypothesizing that the user will learn it faster now that the component skill is known.  
* **Remediation:** If a user consistently fails a problem-solving question that involves a turn\_right call, the scheduler can trace the dependencies in the KG. It can identify that turn\_right is composed of turn\_left and automatically re-schedule a review for the more fundamental turn\_left concept to reinforce the user's foundational knowledge before re-attempting the more complex item.

This case study demonstrates that for a skill-based domain like programming, a content-aware SRS can evolve beyond a simple memorization tool to become a powerful *deliberate practice* engine. By understanding the building blocks of the skill and their interdependencies, the system can generate targeted practice, build complexity incrementally, and intelligently remediate weaknesses, aligning perfectly with the principles of effective skill acquisition.

## **VI. Future Trajectories and Advanced Recommendations**

The proposed framework for a content-aware SRS represents a significant leap beyond traditional systems. However, the trajectory of technological advancement in AI and cognitive science points toward even more sophisticated and integrated learning systems in the future. This section explores these forward-looking possibilities, outlining the next frontiers in intelligent, personalized education.

### **6.1. Conversational and Interactive Learning**

The current paradigm of SRS, even in its advanced forms, is largely based on discrete, asynchronous interactions with "flashcards" or "items." The future likely involves a shift toward more fluid, interactive, and conversational learning experiences.  
An SRS could be built around a conversational AI agent powered by a large language model (LLM).58 Instead of presenting a static card, this agent could engage the user in a natural dialogue to probe their understanding of a concept. For example, after teaching a concept, the agent could ask a series of follow-up questions. If the user answers incorrectly or shows confusion, the agent could immediately adapt its strategy. It could re-teach the concept using a different analogy, provide a simpler example, or break the idea down into smaller components, all within the flow of a single conversation.58 This approach transforms the review process from a simple binary pass/fail event into a rich, diagnostic, and remedial interaction, closing the learning loop in real-time.

### **6.2. Multi-Modal and Cross-Domain Learning**

Human knowledge is not confined to text. Future learning systems must be able to ingest, understand, and generate questions about multiple modalities. Research is already underway to develop evaluation frameworks for video-based reasoning, where models are tasked with answering fine-grained questions about entities and actions depicted in videos.59 An advanced SRS could incorporate this capability, allowing it to:

* Show a user a diagram from a physics textbook and ask them to explain the forces at play.  
* Play a short video of a historical event and ask about the key figures involved.  
* Present a graph of economic data and ask the user to identify the trend.

Furthermore, a truly comprehensive system would build a unified knowledge graph that spans multiple domains. For instance, it could explicitly link concepts in advanced physics to their foundational prerequisites in calculus and linear algebra. When a user begins learning about tensor calculus in the context of general relativity, the system could recognize this dependency and proactively schedule review sessions for the underlying mathematical concepts, even if they were learned in a different "deck" or "course." This cross-domain reinforcement would ensure that foundational knowledge remains fresh and accessible when needed for higher-level learning.

### **6.3. The SRS as a Continual Learning Mechanism for AI**

A fascinating and powerful convergence is emerging between the challenges of human learning and machine learning. Deep neural networks, particularly large models, suffer from a phenomenon known as "catastrophic forgetting," where learning a new task can cause a rapid degradation in performance on previously learned tasks. This is analogous to a human forgetting old information as they acquire new knowledge.  
Recent research has begun to explore the application of cognitive science principles, including spaced repetition, to mitigate this issue in AI systems.60 A novel approach called Task Focused Consolidation with Spaced Recall (TFC-SR) uses a periodic, task-aware "probe" to evaluate a model's memory and stabilize its representations of past knowledge, directly inspired by active recall and spaced repetition.60  
This opens the door for a dual-purpose learning system. An SRS could simultaneously teach a human learner while using the very same scheduling principles to "rehearse" knowledge for its own internal AI models. The human's performance data (e.g., which concepts are most quickly forgotten) could provide a powerful, real-world signal to the AI about which of its own "memories" are most fragile and in need of reinforcement. In this symbiotic relationship, the act of teaching a human becomes a mechanism for the AI's own continual learning and maintenance.

### **6.4. Ethical Considerations and Algorithmic Bias**

As these systems become more powerful and autonomous, their ethical implications become more acute. Several key areas demand careful consideration:

* **Data Privacy:** A content-aware SRS, by its nature, collects extremely detailed and sensitive data about a user's cognitive processes, including their knowledge strengths, weaknesses, and learning pace. Ensuring robust data privacy, security, and user control over this information is not just a technical requirement but an ethical imperative.61  
* **Algorithmic Bias:** The NLP and machine learning models at the core of the system (e.g., for NER, AQG) are trained on vast datasets. These datasets can contain societal biases, which the models can learn and perpetuate. For example, an AQG model trained on historical texts might generate questions that reinforce outdated gender or cultural stereotypes. It is critical to audit these models for bias, use diverse and representative training data, and implement fairness-aware machine learning techniques.  
* **Pedagogical Responsibility:** As the SRS takes on more pedagogical roles—designing curricula via the knowledge graph, authoring lessons via the item generator—the responsibility for its educational effectiveness and fairness grows. An over-reliance on a fully automated system could lead to significant gaps in a student's education if the system's knowledge graph is incomplete, its item generator is flawed, or its scheduling algorithm optimizes for a narrow, easily measurable metric at the expense of deep understanding. Human oversight, expert validation of generated content, and a clear understanding of the system's limitations are essential for responsible deployment in educational settings.

## **Conclusion**

The evolution of Spaced Repetition Systems is at a critical inflection point. The journey from the simple, rule-based heuristics of SM-2 to the data-driven cognitive modeling of FSRS and HLR has laid the groundwork for a more profound transformation. The future of effective learning technology lies in the development of truly content-aware systems that move beyond scheduling abstract "items" and begin to understand, structure, and interact with the knowledge itself.  
This report has demonstrated that the limitations of traditional, content-agnostic SRS—namely the information bottleneck of user feedback, the inefficiency of "ease hell," and the persistent "cold start" problem—are not merely inconveniences but fundamental barriers to creating more sophisticated pedagogical tools. The analysis of pioneering content-aware systems like Duolingo's HLR, AllAI, and KAR3L reveals a clear trajectory: the integration of modern NLP and machine learning to analyze content provides a richer, higher-bandwidth signal that enables more accurate prediction, better personalization, and the modeling of crucial cognitive phenomena like knowledge transfer.  
The proposed multi-layered framework synthesizes these advancements into a cohesive architecture. By establishing an end-to-end pipeline—from ingestion and parsing, through knowledge graph generation and automatic item creation, to a dynamic, content-boosted scheduling algorithm—this framework re-envisions the SRS not as a mere memory aid, but as an automated intelligent tutoring system. The Knowledge Graph stands as the central innovation, providing the semantic backbone that allows the system to understand relationships, infer complexity, and generate a diverse range of learning experiences tailored to the structure of the domain. The case study of the Karel programming language illustrates how this architecture can transcend rote memorization to foster genuine skill acquisition, functioning as a deliberate practice engine that adaptively builds complexity and remediates weaknesses.  
Looking forward, the potential for these systems is immense. The integration of conversational interfaces, multi-modal content, and cross-domain knowledge graphs will make learning more interactive, comprehensive, and effective. Furthermore, the surprising parallel between human learning and AI continual learning suggests a future where the systems that teach us can also learn from us in a symbiotic cycle. However, this power comes with significant responsibility. The ethical challenges of data privacy, algorithmic bias, and pedagogical oversight must be addressed with the same rigor and ingenuity applied to the technical design. By embracing a principled, content-centric approach, the next generation of Spaced Repetition Systems can unlock new levels of educational efficacy and truly personalize the path to mastery for every learner.

#### **Works cited**

1. Spaced repetition \- Wikipedia, accessed July 30, 2025, [https://en.wikipedia.org/wiki/Spaced\_repetition](https://en.wikipedia.org/wiki/Spaced_repetition)  
2. A Trainable Spaced Repetition Model for Language Learning \- ACL Anthology, accessed July 30, 2025, [https://aclanthology.org/anthology-files/pdf/P/P16/P16-1174.pdf](https://aclanthology.org/anthology-files/pdf/P/P16/P16-1174.pdf)  
3. Spaced Repetition: The Ultimate Guide to Remembering What You Learn, accessed July 30, 2025, [https://www.growthengineering.co.uk/spaced-repetition/](https://www.growthengineering.co.uk/spaced-repetition/)  
4. What is spaced repetition method? – Focuskeeper Glossary, accessed July 30, 2025, [https://focuskeeper.co/glossary/what-is-spaced-repetition-method](https://focuskeeper.co/glossary/what-is-spaced-repetition-method)  
5. Spaced repetition (article) | Learn to Learn | Khan Academy, accessed July 30, 2025, [https://www.khanacademy.org/science/learn-to-learn/x141050afa14cfed3:learn-to-learn/x141050afa14cfed3:spaced-repetition/a/l2l-spaced-repetition](https://www.khanacademy.org/science/learn-to-learn/x141050afa14cfed3:learn-to-learn/x141050afa14cfed3:spaced-repetition/a/l2l-spaced-repetition)  
6. Spaced Repetition for Efficient Learning \- Gwern.net, accessed July 30, 2025, [https://gwern.net/spaced-repetition](https://gwern.net/spaced-repetition)  
7. The Spacing Effect: How to Improve Learning and Maximize Retention \- Farnam Street, accessed July 30, 2025, [https://fs.blog/spacing-effect/](https://fs.blog/spacing-effect/)  
8. Evidence of the Spacing Effect and Influences on Perceptions of Learning and Science Curricula \- PubMed Central, accessed July 30, 2025, [https://pmc.ncbi.nlm.nih.gov/articles/PMC8759977/](https://pmc.ncbi.nlm.nih.gov/articles/PMC8759977/)  
9. Top 5 Spaced Repetition Algorithms Compared \- Quizcat AI, accessed July 30, 2025, [https://www.quizcat.ai/blog/top-5-spaced-repetition-algorithms-compared](https://www.quizcat.ai/blog/top-5-spaced-repetition-algorithms-compared)  
10. SuperMemo \- Wikipedia, accessed July 30, 2025, [https://en.wikipedia.org/wiki/SuperMemo](https://en.wikipedia.org/wiki/SuperMemo)  
11. (PDF) Enhancing human learning via spaced repetition optimization, accessed July 30, 2025, [https://www.researchgate.net/publication/330563027\_Enhancing\_human\_learning\_via\_spaced\_repetition\_optimization](https://www.researchgate.net/publication/330563027_Enhancing_human_learning_via_spaced_repetition_optimization)  
12. Enhancing human learning via spaced repetition optimization \- PNAS, accessed July 30, 2025, [https://www.pnas.org/doi/10.1073/pnas.1815156116](https://www.pnas.org/doi/10.1073/pnas.1815156116)  
13. thyagoluciano/sm2: SM-2 is a simple spaced repetition algorithm. It calculates the number of days to wait before reviewing a piece of information based on how easily the the information was remembered today. \- GitHub, accessed July 30, 2025, [https://github.com/thyagoluciano/sm2](https://github.com/thyagoluciano/sm2)  
14. What spaced repetition algorithm does Anki use? \- Anki FAQs, accessed July 30, 2025, [https://faqs.ankiweb.net/what-spaced-repetition-algorithm](https://faqs.ankiweb.net/what-spaced-repetition-algorithm)  
15. The Anki SM-2 Spaced Repetition Algorithm | RemNote Help Center, accessed July 30, 2025, [https://help.remnote.com/en/articles/6026144-the-anki-sm-2-spaced-repetition-algorithm](https://help.remnote.com/en/articles/6026144-the-anki-sm-2-spaced-repetition-algorithm)  
16. KAR3L: Knowledge-Aware Retrieval and ... \- ACL Anthology, accessed July 30, 2025, [https://aclanthology.org/2024.emnlp-main.784.pdf](https://aclanthology.org/2024.emnlp-main.784.pdf)  
17. FSRS: A modern, efficient spaced repetition algorithm | Hacker News, accessed July 30, 2025, [https://news.ycombinator.com/item?id=39002138](https://news.ycombinator.com/item?id=39002138)  
18. How to use spaced repetition for language learning : r/Anki \- Reddit, accessed July 30, 2025, [https://www.reddit.com/r/Anki/comments/11xjdnx/how\_to\_use\_spaced\_repetition\_for\_language\_learning/](https://www.reddit.com/r/Anki/comments/11xjdnx/how_to_use_spaced_repetition_for_language_learning/)  
19. A Trainable Spaced Repetition Model for Language Learning, accessed July 30, 2025, [https://aclanthology.org/P16-1174.pdf](https://aclanthology.org/P16-1174.pdf)  
20. Automated Sentence Generation for a Spaced Repetition Software ..., accessed July 30, 2025, [https://aclanthology.org/2024.bea-1.29/](https://aclanthology.org/2024.bea-1.29/)  
21. \[2503.01859\] Optimizing Retrieval-Augmented Generation of Medical Content for Spaced Repetition Learning \- arXiv, accessed July 30, 2025, [https://arxiv.org/abs/2503.01859](https://arxiv.org/abs/2503.01859)  
22. winkNLP \- NLP in Node.js, accessed July 30, 2025, [https://winkjs.org/wink-nlp/](https://winkjs.org/wink-nlp/)  
23. wink-nlp \- NPM, accessed July 30, 2025, [https://www.npmjs.com/package/wink-nlp](https://www.npmjs.com/package/wink-nlp)  
24. Question answering \- Hugging Face, accessed July 30, 2025, [https://huggingface.co/docs/transformers/tasks/question\_answering](https://huggingface.co/docs/transformers/tasks/question_answering)  
25. Transformers.js \- Hugging Face, accessed July 30, 2025, [https://huggingface.co/docs/transformers.js/index](https://huggingface.co/docs/transformers.js/index)  
26. ANTLR, accessed July 30, 2025, [https://www.antlr.org/](https://www.antlr.org/)  
27. Parsing your own language with ANTLR4 \- François Wouts, accessed July 30, 2025, [https://fwouts.com/articles/parsing-with-antlr-intro](https://fwouts.com/articles/parsing-with-antlr-intro)  
28. Ohm: a user-friendly parsing toolkit for JavaScript and Typescript, accessed July 30, 2025, [https://ohmjs.org/](https://ohmjs.org/)  
29. Home \- nearley.js \- JS Parsing Toolkit, accessed July 30, 2025, [https://nearley.js.org/](https://nearley.js.org/)  
30. ohmjs/ohm: A library and language for building parsers, interpreters, compilers, etc. \- GitHub, accessed July 30, 2025, [https://github.com/ohmjs/ohm](https://github.com/ohmjs/ohm)  
31. Understanding named entity recognition & text classification \- Kili Technology, accessed July 30, 2025, [https://kili-technology.com/data-labeling/nlp/understanding-named-entity-recognition-text-classification](https://kili-technology.com/data-labeling/nlp/understanding-named-entity-recognition-text-classification)  
32. Named-entity recognition \- Wikipedia, accessed July 30, 2025, [https://en.wikipedia.org/wiki/Named-entity\_recognition](https://en.wikipedia.org/wiki/Named-entity_recognition)  
33. Named Entity Recognition (NER): An introductory guide \- Sigma AI, accessed July 30, 2025, [https://sigma.ai/named-entity-recognition/](https://sigma.ai/named-entity-recognition/)  
34. Mastering keyphrase extraction for text analysis \- Telnyx, accessed July 30, 2025, [https://telnyx.com/learn-ai/keyphrase-extraction](https://telnyx.com/learn-ai/keyphrase-extraction)  
35. Complete Guide to Keywords/Phrase Extraction \- Kaggle, accessed July 30, 2025, [https://www.kaggle.com/code/akashmathur2212/complete-guide-to-keywords-phrase-extraction](https://www.kaggle.com/code/akashmathur2212/complete-guide-to-keywords-phrase-extraction)  
36. Keyphrase Extraction in NLP \- GeeksforGeeks, accessed July 30, 2025, [https://www.geeksforgeeks.org/nlp/keyphrase-extraction-in-nlp/](https://www.geeksforgeeks.org/nlp/keyphrase-extraction-in-nlp/)  
37. The Future of Learning in the Age of Generative AI: Automated Question Generation and Assessment with Large Language Models \- arXiv, accessed July 30, 2025, [https://arxiv.org/html/2410.09576v1](https://arxiv.org/html/2410.09576v1)  
38. ThomasSimonini/t5-end2end-question-generation \- Hugging Face, accessed July 30, 2025, [https://huggingface.co/ThomasSimonini/t5-end2end-question-generation](https://huggingface.co/ThomasSimonini/t5-end2end-question-generation)  
39. Generating Questions Using Transformers | Adam Montgomerie, accessed July 30, 2025, [https://amontgomerie.github.io/2020/07/30/question-generator.html](https://amontgomerie.github.io/2020/07/30/question-generator.html)  
40. Automatic question generation: a review of methodologies, datasets ..., accessed July 30, 2025, [https://pmc.ncbi.nlm.nih.gov/articles/PMC9886210/](https://pmc.ncbi.nlm.nih.gov/articles/PMC9886210/)  
41. Best database solution for a spaced repetition system using Drizzle ORM \- Reddit, accessed July 30, 2025, [https://www.reddit.com/r/PostgreSQL/comments/1h441a7/best\_database\_solution\_for\_a\_spaced\_repetition/](https://www.reddit.com/r/PostgreSQL/comments/1h441a7/best_database_solution_for_a_spaced_repetition/)  
42. Top 10 NoSQL Databases for Data Science \- Noble Desktop, accessed July 30, 2025, [https://www.nobledesktop.com/classes-near-me/blog/top-nosql-databases-for-data-science](https://www.nobledesktop.com/classes-near-me/blog/top-nosql-databases-for-data-science)  
43. Best Online NoSQL Courses and Programs \- edX, accessed July 30, 2025, [https://www.edx.org/learn/nosql](https://www.edx.org/learn/nosql)  
44. Spaced repetition (SRS) for learning \- sql \- Stack Overflow, accessed July 30, 2025, [https://stackoverflow.com/questions/2964526/spaced-repetition-srs-for-learning](https://stackoverflow.com/questions/2964526/spaced-repetition-srs-for-learning)  
45. How to Remember and Not Forget: Implementing and Automating the Spaced Repetition System | by Doubletapp, accessed July 30, 2025, [https://doubletapp.medium.com/how-to-remember-and-not-forget-implementing-and-automating-the-spaced-repetition-system-4c011afff83e](https://doubletapp.medium.com/how-to-remember-and-not-forget-implementing-and-automating-the-spaced-repetition-system-4c011afff83e)  
46. Robot Karel, accessed July 30, 2025, [https://karel1981.com/](https://karel1981.com/)  
47. Karel Reader, accessed July 30, 2025, [https://compedu.stanford.edu/karel-reader/docs/python/en/chapter1.html](https://compedu.stanford.edu/karel-reader/docs/python/en/chapter1.html)  
48. Thoughts on using Karel the Robot as a tool to teach newbies in programming. \- Reddit, accessed July 30, 2025, [https://www.reddit.com/r/learnprogramming/comments/9fq1v6/thoughts\_on\_using\_karel\_the\_robot\_as\_a\_tool\_to/](https://www.reddit.com/r/learnprogramming/comments/9fq1v6/thoughts_on_using_karel_the_robot_as_a_tool_to/)  
49. Introducing Karel \- Willamette University, accessed July 30, 2025, [https://people.willamette.edu/\~esroberts/pykarel/reader/01-IntroducingKarel.html](https://people.willamette.edu/~esroberts/pykarel/reader/01-IntroducingKarel.html)  
50. Domain-specific language \- Wikipedia, accessed July 30, 2025, [https://en.wikipedia.org/wiki/Domain-specific\_language](https://en.wikipedia.org/wiki/Domain-specific_language)  
51. What are Domain-Specific Languages (DSL) | MPS by JetBrains, accessed July 30, 2025, [https://www.jetbrains.com/mps/concepts/domain-specific-languages/](https://www.jetbrains.com/mps/concepts/domain-specific-languages/)  
52. Domain Specific Language \- Martin Fowler, accessed July 30, 2025, [https://martinfowler.com/bliki/DomainSpecificLanguage.html](https://martinfowler.com/bliki/DomainSpecificLanguage.html)  
53. Karel (programming language) \- Wikipedia, accessed July 30, 2025, [https://en.wikipedia.org/wiki/Karel\_(programming\_language)](https://en.wikipedia.org/wiki/Karel_\(programming_language\))  
54. Summary of Karel's Programming Language, accessed July 30, 2025, [https://homepage.cs.uri.edu/faculty/wolfe/tutorials/csc101/karel/lang.html](https://homepage.cs.uri.edu/faculty/wolfe/tutorials/csc101/karel/lang.html)  
55. Karel The Robot \- SourceForge, accessed July 30, 2025, [https://karel.sourceforge.net/doc/html\_mono/karel.html](https://karel.sourceforge.net/doc/html_mono/karel.html)  
56. ANTLR Lab: learn, test, and experiment with ANTLR grammars online\!, accessed July 30, 2025, [http://lab.antlr.org/](http://lab.antlr.org/)  
57. antlr4-grammars/Makefile at master \- GitHub, accessed July 30, 2025, [https://github.com/bramp/antlr4-grammars/blob/master/Makefile](https://github.com/bramp/antlr4-grammars/blob/master/Makefile)  
58. Conversational Spaced Repetition \- David Bieber, accessed July 30, 2025, [https://davidbieber.com/snippets/2024-03-04-conversational-spaced-repetition/](https://davidbieber.com/snippets/2024-03-04-conversational-spaced-repetition/)  
59. FingER: Content Aware Fine-grained Evaluation with Reasoning for AI-Generated Videos \- arXiv, accessed July 30, 2025, [https://arxiv.org/pdf/2504.10358](https://arxiv.org/pdf/2504.10358)  
60. \[2507.21109\] Task-Focused Consolidation with Spaced Recall: Making Neural Networks learn like college students \- arXiv, accessed July 30, 2025, [https://arxiv.org/abs/2507.21109](https://arxiv.org/abs/2507.21109)  
61. Named Entity Recognition in Education: Transforming Learning with Intelligent Technology, accessed July 30, 2025, [https://www.byteplus.com/en/topic/491130](https://www.byteplus.com/en/topic/491130)