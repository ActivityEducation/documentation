---
title: Multilingual Vocabulary Categorization
---

# **Multilingual Vocabulary Categorization with Transformers.js in a NestJS Environment**

### **Executive Summary**

This report addresses the challenge of implementing an automated, multilingual vocabulary categorization system for a flashcard application within a NestJS backend. The primary technical constraint is the use of the Transformers.js library for local, server-side model inference, which necessitates an architecture that avoids blocking the Node.js event loop. The analysis evaluates two principal Natural Language Processing (NLP) methodologies: Zero-Shot Classification and Feature Extraction with Semantic Similarity. A comprehensive survey of compatible, state-of-the-art multilingual models from the Hugging Face Hub is presented, focusing on those with available ONNX versions suitable for Transformers.js.  
The core recommendation is an architectural blueprint that offloads CPU-intensive inference tasks to a managed worker thread pool using the piscina library. This approach ensures the main application remains responsive and scalable. For the categorization task itself, this report recommends leveraging a high-performing multilingual Natural Language Inference (NLI) model for zero-shot classification. This method offers unparalleled flexibility for dynamic topic management, a key requirement for a flashcard application where users may define custom categories.  
Key findings indicate that the successful integration of transformer models into a Node.js environment is contingent not only on model selection but, more critically, on a robust architectural pattern that mitigates performance bottlenecks. The report details strategies for performance optimization, such as model quantization and persistent caching, and for accuracy enhancement, including the use of advanced hypothesis templates and confidence thresholding to handle single-word inputs and out-of-domain terms effectively.  

---

## **Foundational Methodologies for Vocabulary Topic Categorization**

The selection of a core NLP methodology is the foundational decision that dictates the application's flexibility, performance characteristics, and implementation complexity. Two primary approaches are viable for this use case: zero-shot classification and feature extraction.

### **Zero-Shot Classification: Dynamic Categorization without Retraining**

Zero-shot classification is a machine learning paradigm that enables a model to categorize text into classes it was not explicitly trained on.1 This capability is typically achieved by reformulating the classification task as a Natural Language Inference (NLI) problem.4 In this setup, the input vocabulary word acts as the "premise," and each potential topic is framed as a "hypothesis." The NLI model then calculates the probability that the premise "entails" the hypothesis. For example, for the word "apple" and the topic "fruit," the model would assess the premise "apple" against the hypothesis "This text is about fruit."  
This method is exceptionally well-suited for a flashcard application where the list of topics is expected to be dynamic. A user could add a new topic, such as "Astronomy," at runtime, and this new topic would simply become a new candidate label in the subsequent inference calls without any need for model retraining.2 This provides significant operational flexibility.  
The Transformers.js library offers direct support for this task through its zero-shot-classification pipeline.7 This pipeline abstracts the underlying NLI formulation, requiring only the input text and a list of candidate labels from the developer.5 Key parameters for this pipeline include:

* **candidate\_labels**: An array of strings representing the topics (e.g., \['business', 'technology', 'science'\]).6  
* **multi\_label**: A boolean parameter that, when set to true, allows a word to be assigned to multiple topics. This is useful for capturing nuance; for instance, the word "server" could be relevant to both 'technology' and 'restaurant' topics.6  
* **hypothesis\_template**: A string template used to frame the candidate labels as hypotheses. The default template, "This example is {}.", is optimized for full sentences and may perform poorly with single-word inputs.9 Customizing this template is critical for this use case and is discussed further in Section 4\.

### **Feature Extraction & Semantic Similarity: A Vector-Based Approach**

An alternative methodology is to use feature extraction to generate semantic vector embeddings for both the vocabulary words and the topics.11 These high-dimensional vectors capture the semantic essence of the text. The categorization is then performed by calculating the similarity (typically cosine similarity) between a word's vector and each topic's vector. The topic with the highest similarity score is assigned to the word.13  
This approach can be highly performant at inference time, especially with a fixed set of topics. Once topic vectors are pre-computed, the categorization process reduces to a series of rapid mathematical comparisons.  
Implementation with Transformers.js involves a two-step process:

1. **Embedding Generation**: The feature-extraction pipeline is used with a sentence-transformer model to generate embeddings. Key options like pooling: 'mean' and normalize: true are used to produce a single, normalized vector for each input text.7  
2. **Similarity Calculation**: A function must be implemented to compute the cosine similarity between the word's embedding and the pre-computed embeddings for each topic.

A significant challenge with this method is the creation of a representative vector for each topic. Simply embedding the topic name (e.g., "Science") may not adequately capture the breadth of the topic's semantic space. A more robust technique involves embedding a set of exemplary words for each topic and then averaging their vectors to create a "topic centroid," which serves as a more comprehensive representation of the topic.

### **Comparative Analysis for the Flashcard Use Case**

When comparing these two methodologies, it becomes clear that they are optimized for different operational assumptions. Zero-shot classification is built for flexibility, whereas feature extraction is built for speed against a static set of categories.  
A fundamental challenge for both approaches is the "single-word context deficit." Models for both zero-shot classification (NLI) and feature extraction (sentence similarity) are predominantly trained and optimized for contextualized text, such as full sentences, not isolated words.4 When presented with a single, polysemous word like "bank," a model lacks the context to disambiguate between its meanings (a river bank versus a financial institution). A zero-shot model may produce low confidence scores across all topics, while a feature extraction model will generate a single, blended vector that averages its different meanings. This inherent limitation necessitates strategies to artificially introduce context, which are explored later in this report.  
Furthermore, the choice of methodology presents a trade-off between dynamic flexibility and computational cost. A zero-shot classification requires a full forward pass of the model for the input sequence against *each* candidate label, meaning the computational cost scales linearly with the number of topics.4 In contrast, feature extraction requires only a single forward pass to embed the word, followed by a series of computationally inexpensive vector comparisons. Given that a flashcard application is likely to empower users to create their own custom topics, the flexibility of zero-shot classification is a decisive advantage. The higher computational cost is a necessary trade-off that must be managed architecturally.  
Based on this analysis, **Zero-Shot Classification is the recommended methodology**. Its inherent flexibility is better aligned with the product requirements of a user-driven flashcard application. The associated performance and accuracy challenges can be effectively mitigated through the architectural and implementation strategies detailed in the following sections. 
 
---

## **A Survey of Multilingual Models Compatible with Transformers.js**

The selection of an appropriate pre-trained model is critical for the success of the vocabulary categorization system. The key requirements are strong multilingual performance and compatibility with Transformers.js, which necessitates the availability of model weights in the ONNX format. The "Xenova" user on the Hugging Face Hub is a key resource, having converted a vast number of popular models to this format, making them readily usable in a JavaScript environment.

### **Candidate Models for Zero-Shot Classification**

The models best suited for zero-shot classification are those fine-tuned on Natural Language Inference (NLI) datasets.

* **Primary Candidate: MoritzLaurer/mDeBERTa-v3-base-xnli-multilingual-nli-2mil7**  
  * **Description**: This model is built upon Microsoft's mDeBERTa-v3, a state-of-the-art multilingual base model. It has been fine-tuned on an extensive collection of NLI datasets, including XNLI and a custom multilingual NLI dataset, covering 27 languages in its fine-tuning data and inheriting support for over 100 languages from its base model.19 The use of professionally translated datasets, rather than purely machine-translated ones, suggests a higher quality of cross-lingual understanding.19  
  * **Transformers.js Compatibility**: A compatible ONNX version is available on the Hub as Xenova/mDeBERTa-v3-base-xnli-multilingual-nli-2mil7.22  
  * **Strengths**: Its high performance across a wide range of languages and its robust NLI capabilities make it the top candidate for an accurate and flexible multilingual zero-shot classifier.  
* **Secondary Candidate: facebook/bart-large-mnli**  
  * **Description**: This model is a widely used and extensively benchmarked standard for zero-shot classification in English.5  
  * **Transformers.js Compatibility**: A compatible ONNX version is available.  
  * **Limitations**: The primary drawback is its monolingual nature. While it serves as an excellent performance baseline, it is unsuitable for the core multilingual requirement of the application unless an inefficient multi-model strategy is adopted.

### **Candidate Models for Feature Extraction (Sentence Similarity)**

For the alternative feature-extraction approach, models known as sentence-transformers are the most suitable.

* **Primary Candidate: intfloat/multilingual-e5-large**  
  * **Description**: This is a powerful sentence embedding model that supports 100 languages. It was trained using a sophisticated two-stage process: an initial weakly-supervised contrastive pre-training on billions of text pairs, followed by a supervised fine-tuning stage on high-quality labeled datasets.13  
  * **Transformers.js Compatibility**: An ONNX version is available as Xenova/multilingual-e5-large.13  
  * **Performance**: This model achieves state-of-the-art results on several multilingual retrieval benchmarks, including MIRACL and Mr. TyDi.13 Its instruction-tuned variants can further enhance performance.24 For optimal results, the model's documentation recommends prepending input text with "query: " or "passage: ", a detail that must be handled during implementation.13  
* **Secondary Candidate: sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2**  
  * **Description**: This is a highly popular and efficient model that maps sentences to a 384-dimensional vector space across more than 50 languages.16 It is smaller and faster than the E5 model.  
  * **Transformers.js Compatibility**: An ONNX version is available as Xenova/paraphrase-multilingual-MiniLM-L12-v2.16  
  * **Performance**: This model provides an excellent balance of speed and performance, making it a strong contender, particularly in resource-constrained environments or where inference latency is a primary concern.17

### **Model Selection Matrix**

To facilitate an informed decision, the following table provides a comparative analysis of the top candidate models. The choice of model involves a trade-off between architectural flexibility (Zero-Shot), raw performance (Feature Extraction), model size, and language coverage.  
**Table 1: Comparative Analysis of Multilingual Transformer Models for Topic Categorization**

| Model ID (Xenova ONNX Version) | Base Model | Primary Task | Parameters | Languages | Embedding Dim. | Key Considerations |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| Xenova/mDeBERTa-v3-base-xnli-multilingual-nli-2mil7 | mDeBERTa-v3-base | Zero-Shot Classification | \~278M | 100+ | N/A | State-of-the-art multilingual NLI performance. Ideal for dynamic topic lists. Requires careful prompt engineering for single words. |
| Xenova/multilingual-e5-large | XLM-RoBERTa-large | Feature Extraction | \~560M | 100 | 1024 | Top-tier performance on multilingual retrieval benchmarks. Requires prepending "query: " to inputs. Larger model size. |
| Xenova/paraphrase-multilingual-MiniLM-L12-v2 | MiniLM | Feature Extraction | \~118M | 50+ | 384 | Excellent balance of speed and performance. Smaller and faster than E5, but with less language coverage and potentially lower accuracy. |

---

## **Architectural Blueprint for Server-Side Inference in NestJS**

Integrating a transformer model into a NestJS backend requires a carefully considered architecture that prioritizes performance, stability, and maintainability. A naive implementation will quickly run into performance bottlenecks due to the nature of the Node.js runtime.

### **Integrating Transformers.js into a NestJS Service**

The integration process begins with installing the library (npm i @huggingface/transformers) and creating a dedicated service to encapsulate the machine learning logic.28  
A critical performance optimization is to manage the model loading process effectively. Loading a model from disk and initializing a pipeline is a time-consuming, one-time operation that should not be repeated for every API request. The **Singleton pattern** is the standard solution for this. A PipelineSingleton class can be implemented to lazily initialize the classification pipeline on its first use and then return the cached instance for all subsequent requests. This ensures that the expensive model-loading process occurs only once in the application's lifecycle.  
This singleton can then be wrapped in a standard NestJS injectable service, such as CategorizationService, making the model's functionality available throughout the application via NestJS's dependency injection system.29

### **Mitigating Event Loop Blocking with Worker Threads**

The most significant architectural challenge when running ML models in Node.js is its single-threaded event loop. Any CPU-intensive task, such as model inference, will block this loop, preventing the server from handling any other incoming requests and leading to a complete loss of responsiveness.32  
The native worker\_threads module in Node.js provides the solution by enabling the execution of JavaScript code in parallel on separate threads, thereby offloading the heavy computation from the main event loop.32 However, managing individual worker threads—including creation, destruction, task distribution, and error handling—is complex.  
A **worker pool** library abstracts this complexity. For this use case, piscina is a highly recommended choice due to its speed, efficiency, and rich feature set, which includes support for task queues, cancellation, and flexible pool sizing.39  
The proposed architecture is as follows:

1. The main NestJS application will instantiate a PiscinaService, a custom provider that manages the worker pool. The model itself will not be loaded on the main thread.  
2. The CategorizationService, when called by a controller, will not perform inference directly. Instead, it will use the PiscinaService to dispatch a categorization job to an available worker in the pool. The vocabulary word and list of topics will be passed as workerData.  
3. A dedicated worker script (e.g., categorization.worker.ts) will contain the PipelineSingleton and the inference logic. Upon receiving a job, it will perform the classification and use parentPort.postMessage() to return the result to the main thread.

A common challenge when using worker threads with TypeScript is the build process. The worker's TypeScript file must be compiled to JavaScript, and the filename option in the Piscina constructor must point to the compiled .js file located in the dist directory.43  
One advanced consideration for a production-grade NestJS application is bridging the dependency injection (DI) container with the worker's isolated context. A worker thread does not inherit the main application's DI container. To access shared services like logging or configuration within a worker, a separate, lightweight NestJS application context must be bootstrapped *inside* the worker script using NestFactory.createApplicationContext(AppModule). This creates a "headless" instance of the application, providing access to the DI container without starting a new HTTP server, thus preventing code duplication and maintaining architectural consistency.43  
Finally, because a worker pool consists of long-running processes, it is crucial to implement a graceful shutdown mechanism. The main application must listen for termination signals (e.g., SIGTERM in a Docker environment) and explicitly command the worker pool to terminate. In NestJS, this can be handled within the onModuleDestroy lifecycle hook of the PiscinaService. This ensures that all worker threads are properly closed and resources are released, preventing orphaned processes and resource leaks.47

### **Resource Optimization Strategies**

To ensure the system is efficient and cost-effective, two key optimization strategies should be employed: model quantization and effective caching.

* **Model Quantization**: Quantization is a technique that reduces the numerical precision of a model's weights (e.g., from 32-bit floating-point numbers to 8-bit integers). This process can dramatically reduce the model's file size and memory footprint, and it often leads to faster inference speeds, particularly on CPUs.7 Transformers.js supports quantized models, which can be loaded either by referencing a pre-quantized version from the Hugging Face Hub or by specifying the  
  dtype option during pipeline creation.7 This is a vital optimization for deploying large models in a server environment.  
* **Effective Caching**: Transformers.js automatically downloads and caches models on their first use. For a server-side application, especially one deployed in a container, this cache must be persisted. If it is not, the application will re-download the multi-gigabyte model files every time the container restarts, leading to slow startup times and unnecessary network traffic. The cache location can be configured using the env.cacheDir property. In a Dockerized environment, this directory should be mounted as a persistent volume to ensure the cache survives across container restarts.

---

## **Advanced Implementation and Strategic Recommendations**

With the foundational methodology and architecture established, this section provides advanced strategies to enhance the system's accuracy and robustness, culminating in a final set of recommendations.

### **Enhancing Classification Accuracy for Single Words**

As established previously, the primary challenge is the "single-word context deficit." This can be mitigated through careful prompt engineering, specifically by designing more effective hypothesis templates for the zero-shot classification task.  
The default template, "This example is {}.", is poorly suited for single words. More effective templates can provide the necessary semantic context to guide the model. For example, when classifying the word "apple" with the candidate topic "fruit":

* **Default Template**: "This example is apple." (Ambiguous and grammatically awkward)  
* **Improved Template**: "This text is about the topic of {}." → "This text is about the topic of apple." (Better, but still generic)  
* **Task-Specific Template**: "The word 'apple' belongs to the category of {}." → "The word 'apple' belongs to the category of fruit." (Optimal, as it explicitly frames the task)

This practice of prompt engineering is essential for steering the model's inference process toward the desired outcome.10 For polysemous words (e.g., "bank"), the most robust solution is to augment the input by providing an example sentence along with the word, giving the model the context required for disambiguation.

### **Handling Ambiguity and Out-of-Domain Inputs**

A zero-shot classifier will always attempt to classify an input, producing a probability distribution across all provided candidate labels. This presents a problem for out-of-domain inputs—words that do not fit any of the available topics. A naive implementation would incorrectly assign the topic with the highest score, even if that score is objectively low.57  
The solution is to implement **confidence thresholding**. After receiving the classification scores from the model, the application should check if the highest score exceeds a predefined threshold (e.g., 0.70). If it does not, the word should be marked as "Uncategorized" or flagged for manual review. This prevents the system from making low-confidence, and likely incorrect, classifications.59 The ideal threshold value should be determined empirically by running a validation set of vocabulary against the topics and analyzing the score distributions to find a balance between precision and recall.

### **Final Recommendations**

Based on the comprehensive analysis, the following recommendations are provided for implementing the vocabulary categorization feature.

* **Primary Recommendation: Zero-Shot Classification with Xenova/mDeBERTa-v3-base-xnli-multilingual-nli-2mil7**  
  * **Justification**: This approach offers the maximum flexibility required for a user-centric flashcard application, allowing for the dynamic creation and management of topics without model retraining. The mDeBERTa-v3 model provides state-of-the-art multilingual performance, ensuring broad language support.  
  * **Required Architecture**: The implementation must utilize a piscina-managed worker pool to offload inference and maintain API responsiveness. Production-grade accuracy and robustness will depend on the implementation of advanced hypothesis templates and a confidence thresholding mechanism.  
* **Secondary Recommendation: Feature Extraction with Xenova/paraphrase-multilingual-MiniLM-L12-v2**  
  * **Justification**: This approach is a viable alternative if the application's topics are guaranteed to be fixed and inference speed is the highest priority. The MiniLM model provides an excellent balance of performance and resource efficiency.  
  * **Architectural Considerations**: While per-request inference would be faster, a worker pool would still be beneficial for the initial, one-time embedding of a large vocabulary set. The primary implementation challenge would be the development and maintenance of high-quality topic centroid vectors.  
* **Future Roadmap**: The recommended path is to begin with the zero-shot classification approach. If, over time, performance analytics reveal that a specific subset of fixed, high-traffic topics becomes a bottleneck, a hybrid system could be developed. In such a system, these core topics would be handled by a more performant feature-extraction model, while user-defined custom topics would continue to leverage the flexibility of the zero-shot model.

#### **Works cited**

1. What is Zero-Shot Classification? \- Hugging Face, accessed August 1, 2025, [https://huggingface.co/tasks/zero-shot-classification](https://huggingface.co/tasks/zero-shot-classification)  
2. Zero-Shot Classification Using Transformers: Unlocking the Power of AI for Text-Based Tasks \- KoshurAI, accessed August 1, 2025, [https://koshurai.medium.com/zero-shot-classification-using-transformers-unlocking-the-power-of-ai-for-text-based-tasks-e5118398ef17](https://koshurai.medium.com/zero-shot-classification-using-transformers-unlocking-the-power-of-ai-for-text-based-tasks-e5118398ef17)  
3. Zero-shot Classification \[Top 6 Models, How To & Alternatives\] \- Spot Intelligence, accessed August 1, 2025, [https://spotintelligence.com/2023/08/01/zero-shot-classification/](https://spotintelligence.com/2023/08/01/zero-shot-classification/)  
4. Zero-shot Text Classification with Hugging Face on Gradient \- Paperspace Blog, accessed August 1, 2025, [https://blog.paperspace.com/zero-shot-text-classification-with-hugging-face-on-gradient/](https://blog.paperspace.com/zero-shot-text-classification-with-hugging-face-on-gradient/)  
5. How does Huggingface's zero-shot classification work in production/webapp, do I need to train the model first? \- Stack Overflow, accessed August 1, 2025, [https://stackoverflow.com/questions/75866093/how-does-huggingfaces-zero-shot-classification-work-in-production-webapp-do-i](https://stackoverflow.com/questions/75866093/how-does-huggingfaces-zero-shot-classification-work-in-production-webapp-do-i)  
6. Zero-Shot Topic Classification. Using Language Transformers for Natural… \- Jed Lee, accessed August 1, 2025, [https://jedleee.medium.com/zero-shot-topic-classification-fb92d1b33cfb](https://jedleee.medium.com/zero-shot-topic-classification-fb92d1b33cfb)  
7. Transformers.js \- Hugging Face, accessed August 1, 2025, [https://huggingface.co/docs/transformers.js/index](https://huggingface.co/docs/transformers.js/index)  
8. xenova/transformers \- NPM, accessed August 1, 2025, [https://www.npmjs.com/package/@xenova/transformers](https://www.npmjs.com/package/@xenova/transformers)  
9. Zero-Shot Classification \- TransformersPHP, accessed August 1, 2025, [https://transformers.codewithkyrian.com/zero-shot-classification](https://transformers.codewithkyrian.com/zero-shot-classification)  
10. Source code for transformers.pipelines.zero\_shot\_classification \- Hugging Face, accessed August 1, 2025, [https://huggingface.co/transformers/v4.6.0/\_modules/transformers/pipelines/zero\_shot\_classification.html](https://huggingface.co/transformers/v4.6.0/_modules/transformers/pipelines/zero_shot_classification.html)  
11. Text Feature Extraction using HuggingFace Model \- GeeksforGeeks, accessed August 1, 2025, [https://www.geeksforgeeks.org/nlp/text-feature-extraction-using-huggingface-model/](https://www.geeksforgeeks.org/nlp/text-feature-extraction-using-huggingface-model/)  
12. Semantic similarity \- Wikipedia, accessed August 1, 2025, [https://en.wikipedia.org/wiki/Semantic\_similarity](https://en.wikipedia.org/wiki/Semantic_similarity)  
13. Xenova/multilingual-e5-large · Hugging Face, accessed August 1, 2025, [https://huggingface.co/Xenova/multilingual-e5-large](https://huggingface.co/Xenova/multilingual-e5-large)  
14. Zero-Shot Topic Labeling for Hazard Classification \- MDPI, accessed August 1, 2025, [https://www.mdpi.com/2078-2489/13/10/444](https://www.mdpi.com/2078-2489/13/10/444)  
15. how to do embeddings? · Issue \#203 · huggingface/transformers.js \- GitHub, accessed August 1, 2025, [https://github.com/xenova/transformers.js/issues/203](https://github.com/xenova/transformers.js/issues/203)  
16. Xenova/paraphrase-multilingual-MiniLM-L12-v2 · Hugging Face, accessed August 1, 2025, [https://huggingface.co/Xenova/paraphrase-multilingual-MiniLM-L12-v2](https://huggingface.co/Xenova/paraphrase-multilingual-MiniLM-L12-v2)  
17. arXiv:2208.09715v2 \[cs.CL\] 6 Feb 2023, accessed August 1, 2025, [https://arxiv.org/pdf/2208.09715](https://arxiv.org/pdf/2208.09715)  
18. From zero to semantic search embedding model | by Roman Grebennikov \- Metarank, accessed August 1, 2025, [https://blog.metarank.ai/from-zero-to-semantic-search-embedding-model-592e16d94b61](https://blog.metarank.ai/from-zero-to-semantic-search-embedding-model-592e16d94b61)  
19. MoritzLaurer/mDeBERTa-v3-base-mnli-xnli \- Hugging Face, accessed August 1, 2025, [https://huggingface.co/MoritzLaurer/mDeBERTa-v3-base-mnli-xnli](https://huggingface.co/MoritzLaurer/mDeBERTa-v3-base-mnli-xnli)  
20. README.md · MoritzLaurer/mDeBERTa-v3-base-xnli-multilingual-nli-2mil7 at main, accessed August 1, 2025, [https://huggingface.co/MoritzLaurer/mDeBERTa-v3-base-xnli-multilingual-nli-2mil7/blame/main/README.md](https://huggingface.co/MoritzLaurer/mDeBERTa-v3-base-xnli-multilingual-nli-2mil7/blame/main/README.md)  
21. arXiv:2409.13735v1 \[cs.CL\] 10 Sep 2024, accessed August 1, 2025, [https://arxiv.org/pdf/2409.13735](https://arxiv.org/pdf/2409.13735)  
22. Xenova/mDeBERTa-v3-base-xnli-multilingual-nli-2mil7 · Hugging ..., accessed August 1, 2025, [https://huggingface.co/Xenova/mDeBERTa-v3-base-xnli-multilingual-nli-2mil7](https://huggingface.co/Xenova/mDeBERTa-v3-base-xnli-multilingual-nli-2mil7)  
23. facebook/bart-large-mnli · Hugging Face, accessed August 1, 2025, [https://huggingface.co/facebook/bart-large-mnli](https://huggingface.co/facebook/bart-large-mnli)  
24. MMTEB: Massive Multilingual Text Embedding Benchmark \- arXiv, accessed August 1, 2025, [https://arxiv.org/html/2502.13595v1](https://arxiv.org/html/2502.13595v1)  
25. Multilingual E5 Text Embeddings: A Technical Report \- arXiv, accessed August 1, 2025, [https://arxiv.org/html/2402.05672v1](https://arxiv.org/html/2402.05672v1)  
26. arXiv:2309.08469v2 \[cs.CL\] 22 Feb 2024, accessed August 1, 2025, [https://arxiv.org/pdf/2309.08469](https://arxiv.org/pdf/2309.08469)  
27. Whats the best Sentence Transformer to use for a semantic search? : r/LlamaIndex \- Reddit, accessed August 1, 2025, [https://www.reddit.com/r/LlamaIndex/comments/1agh10a/whats\_the\_best\_sentence\_transformer\_to\_use\_for\_a/](https://www.reddit.com/r/LlamaIndex/comments/1agh10a/whats_the_best_sentence_transformer_to_use_for_a/)  
28. Server-side Inference in Node.js \- Hugging Face, accessed August 1, 2025, [https://huggingface.co/docs/transformers.js/tutorials/node](https://huggingface.co/docs/transformers.js/tutorials/node)  
29. NestJS Tutorial \- GeeksforGeeks, accessed August 1, 2025, [https://www.geeksforgeeks.org/javascript/nestjs/](https://www.geeksforgeeks.org/javascript/nestjs/)  
30. Best Practices for Structuring a NestJS Application | by @rnab ..., accessed August 1, 2025, [https://arnab-k.medium.com/best-practices-for-structuring-a-nestjs-application-b3f627548220](https://arnab-k.medium.com/best-practices-for-structuring-a-nestjs-application-b3f627548220)  
31. Nest.Js best practice \- DEV Community, accessed August 1, 2025, [https://dev.to/bsachref/nestjs-best-practice-85](https://dev.to/bsachref/nestjs-best-practice-85)  
32. Worker Threads in Node.js: A Complete Guide for Multithreading in JavaScript, accessed August 1, 2025, [https://nodesource.com/blog/worker-threads-nodejs-multithreading-in-javascript](https://nodesource.com/blog/worker-threads-nodejs-multithreading-in-javascript)  
33. Node.js Worker Threads: Unlocking Server-Side Parallel Processing | by Artem Khrienov, accessed August 1, 2025, [https://medium.com/@artemkhrenov/node-js-worker-threads-unlocking-server-side-parallel-processing-8713b6814bf4](https://medium.com/@artemkhrenov/node-js-worker-threads-unlocking-server-side-parallel-processing-8713b6814bf4)  
34. Task Parallelism with NestJS \- Medium, accessed August 1, 2025, [https://medium.com/@pp.palinda/parallel-processing-in-nestjs-6ecdbc533e1f](https://medium.com/@pp.palinda/parallel-processing-in-nestjs-6ecdbc533e1f)  
35. Multi-threading in Node.js & NestJS: worker\_threads, cluster \- ZHOST Consulting, accessed August 1, 2025, [https://www.bithost.in/blog/tech-2/multi-threading-in-nestjs-or-nodejs-95](https://www.bithost.in/blog/tech-2/multi-threading-in-nestjs-or-nodejs-95)  
36. Worker threads | Node.js v24.4.1 Documentation, accessed August 1, 2025, [https://nodejs.org/api/worker\_threads.html](https://nodejs.org/api/worker_threads.html)  
37. Using worker\_threads in Node.js \- Medium, accessed August 1, 2025, [https://medium.com/@Trott/using-worker-threads-in-node-js-80494136dbb6](https://medium.com/@Trott/using-worker-threads-in-node-js-80494136dbb6)  
38. Worker Threads : Multitasking in NodeJS | by Manik Mudholkar | Medium, accessed August 1, 2025, [https://medium.com/@manikmudholkar831995/worker-threads-multitasking-in-nodejs-6028cdf35e9d](https://medium.com/@manikmudholkar831995/worker-threads-multitasking-in-nodejs-6028cdf35e9d)  
39. piscinajs/piscina: A fast, efficient Node.js Worker Thread Pool implementation \- GitHub, accessed August 1, 2025, [https://github.com/piscinajs/piscina](https://github.com/piscinajs/piscina)  
40. Learning to Swim with Piscina, the node.js worker pool | Nearform, accessed August 1, 2025, [https://nearform.com/insights/learning-to-swim-with-piscina-the-node-js-worker-pool/](https://nearform.com/insights/learning-to-swim-with-piscina-the-node-js-worker-pool/)  
41. Node.js multithreading with worker threads: pros and cons | Snyk, accessed August 1, 2025, [https://snyk.io/blog/node-js-multithreading-worker-threads-pros-cons/](https://snyk.io/blog/node-js-multithreading-worker-threads-pros-cons/)  
42. Piscina: Introduction, accessed August 1, 2025, [https://piscinajs.dev/](https://piscinajs.dev/)  
43. NestJS Dependency Injection in Worker Threads \- DEV Community, accessed August 1, 2025, [https://dev.to/zenstok/nestjs-dependency-injection-in-worker-threads-5deh](https://dev.to/zenstok/nestjs-dependency-injection-in-worker-threads-5deh)  
44. Node.js TypeScript \#12. Introduction to Worker Threads with TypeScript \- Marcin Wanago Blog, accessed August 1, 2025, [https://wanago.io/2019/05/06/node-js-typescript-12-worker-threads/](https://wanago.io/2019/05/06/node-js-typescript-12-worker-threads/)  
45. Node js worker threads for multithreading (typescript) | by Aarsh Patel \- Medium, accessed August 1, 2025, [https://aarshpatel73.medium.com/node-js-worker-threads-for-multithreading-typescript-1e5b88fa76b5](https://aarshpatel73.medium.com/node-js-worker-threads-for-multithreading-typescript-1e5b88fa76b5)  
46. NestJS Dependency Injection in Worker Threads \- Rabbit Byte Club, accessed August 1, 2025, [https://rabbitbyte.club/nestjs-dependency-injection-in-worker-threads/](https://rabbitbyte.club/nestjs-dependency-injection-in-worker-threads/)  
47. Graceful Shutdown in Node.js | by Juliano Firme \- Medium, accessed August 1, 2025, [https://medium.com/@julianofirme23/graceful-shutdown-in-node-js-78ed2e0d107f](https://medium.com/@julianofirme23/graceful-shutdown-in-node-js-78ed2e0d107f)  
48. Graceful Shutdown in NodeJS \- nairihar \- Medium, accessed August 1, 2025, [https://nairihar.medium.com/graceful-shutdown-in-nodejs-2f8f59d1c357](https://nairihar.medium.com/graceful-shutdown-in-nodejs-2f8f59d1c357)  
49. Graceful Shutdown of Node.js Workers | by Gaurav Lahoti \- Medium, accessed August 1, 2025, [https://medium.com/@gaurav.lahoti/graceful-shutdown-of-node-js-workers-dd58bbff9e30](https://medium.com/@gaurav.lahoti/graceful-shutdown-of-node-js-workers-dd58bbff9e30)  
50. Graceful shutdown with Node.js and Kubernetes \- RisingStack Engineering, accessed August 1, 2025, [https://blog.risingstack.com/graceful-shutdown-node-js-kubernetes/](https://blog.risingstack.com/graceful-shutdown-node-js-kubernetes/)  
51. A Comprehensive Study on Quantization Techniques for Large Language Models \- arXiv, accessed August 1, 2025, [https://arxiv.org/html/2411.02530v1](https://arxiv.org/html/2411.02530v1)  
52. A Guide to Quantization in LLMs | Symbl.ai, accessed August 1, 2025, [https://symbl.ai/developers/blog/a-guide-to-quantization-in-llms/](https://symbl.ai/developers/blog/a-guide-to-quantization-in-llms/)  
53. What is Quantization? Quantizing LLMs | Exxact Blog, accessed August 1, 2025, [https://www.exxactcorp.com/blog/deep-learning/what-is-quantization-and-llms](https://www.exxactcorp.com/blog/deep-learning/what-is-quantization-and-llms)  
54. transformers.js/docs/source/pipelines.md at main · huggingface/transformers.js · GitHub, accessed August 1, 2025, [https://github.com/huggingface/transformers.js/blob/main/docs/source/pipelines.md](https://github.com/huggingface/transformers.js/blob/main/docs/source/pipelines.md)  
55. Zero-shot cross-lingual sequence tagging as Seq2Seq generation for joint intent classification and slot filling \- Amazon Science, accessed August 1, 2025, [https://www.amazon.science/publications/zero-shot-cross-lingual-sequence-tagging-as-seq2seq-generation-for-joint-intent-classification-and-slot-filling](https://www.amazon.science/publications/zero-shot-cross-lingual-sequence-tagging-as-seq2seq-generation-for-joint-intent-classification-and-slot-filling)  
56. Zero-Shot Prompting: Examples, Theory, Use Cases \- DataCamp, accessed August 1, 2025, [https://www.datacamp.com/tutorial/zero-shot-prompting](https://www.datacamp.com/tutorial/zero-shot-prompting)  
57. Zero Shot Domain Generalization \- BMVA Archive, accessed August 1, 2025, [https://www.bmva-archive.org.uk/bmvc/2020/assets/papers/0673.pdf](https://www.bmva-archive.org.uk/bmvc/2020/assets/papers/0673.pdf)  
58. What Is Zero Shot Learning in Image Classification? \[Examples\] \- V7 Labs, accessed August 1, 2025, [https://www.v7labs.com/blog/zero-shot-learning-guide](https://www.v7labs.com/blog/zero-shot-learning-guide)  
59. Selective Zero-Shot Classification with Augmented Attributes \- CVF Open Access, accessed August 1, 2025, [https://openaccess.thecvf.com/content\_ECCV\_2018/papers/Jie\_Song\_Selective\_Zero-Shot\_Classification\_ECCV\_2018\_paper.pdf](https://openaccess.thecvf.com/content_ECCV_2018/papers/Jie_Song_Selective_Zero-Shot_Classification_ECCV_2018_paper.pdf)  
60. Test-Time Prompt Tuning for Zero-Shot Generalization in Vision-Language Models \- OpenReview, accessed August 1, 2025, [https://openreview.net/pdf?id=e8PVEkSa4Fq](https://openreview.net/pdf?id=e8PVEkSa4Fq)  
61. LLM Confidence Evaluation Measures in Zero-Shot CSS Classification \- arXiv, accessed August 1, 2025, [https://arxiv.org/html/2410.13047v2](https://arxiv.org/html/2410.13047v2)