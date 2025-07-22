---
sidebar_position: 4
title: "EducationPub Specification"
---

# **Educational ActivityPub and Activity Streams Specification**

This document defines an extension vocabulary for Activity Streams 2.0 and ActivityPub, specifically designed to represent and facilitate the sharing of educational materials and learning activities within the Fediverse. The goal is to provide a robust, flexible, and interoperable schema that supports various learning modalities, with a particular focus on four pillars: Reading, Writing, Listening, and Speaking.

## **1\. Introduction**

The Fediverse, powered by ActivityPub, offers a decentralized network for social interaction. By extending its capabilities, we can enable a new paradigm for educational content, allowing learners, educators, and institutions to publish, discover, and interact with learning resources in a federated manner. This specification introduces new Activity Streams object types and properties under a dedicated namespace, ensuring compatibility with existing ActivityPub implementations while enabling rich, domain-specific functionality for educational applications.

## **2\. Namespace and Context**

To introduce new types and properties without conflicting with the core Activity Streams vocabulary, this specification defines a new namespace, edu:. All custom types and properties defined herein will be prefixed with edu:.  
Consumers of these objects will need to include the edu: namespace URI in their JSON-LD @context to properly interpret the extended vocabulary. For the purpose of this specification, we will use https://example.com/edu-ns as a placeholder URI for the edu: namespace. Implementers are encouraged to use a stable, resolvable URI for their deployed vocabulary.  
**Example Context:**  
```JSON
{  
  "@context": [  
    "https://www.w3.org/ns/activitystreams",  
    "https://example.com/edu-ns"  
  ]  
}
```

## **3\. Core Concepts**

This specification aims to provide granular and flexible representations for common educational materials and activities, particularly those relevant to language acquisition. The defined objects support:

* **Reading:** Stories, articles, and comprehension questions.  
* **Writing:** Prompts for creative or analytical writing.  
* **Listening:** Audio stories, video lessons, and pronunciation exercises.  
* **Speaking:** Pronunciation exercises and discussion prompts.  
* **Assessment:** Flexible self-assessments with various question types.  
* **Recall:** Highly customizable spaced repetition flashcards system.  
* **Progress Tracking:** Objectives and Key Results (OKRs) for measurable learning goals.  
* **Exercises:** Generic structure for various practice activities.  
* **Responses & Submissions:** Objects for capturing learner answers and submitted work.  
* **Peer Review:** Mechanisms for peer feedback on writing or speaking activities.

## **4\. Object Definitions**

This section defines the new Activity Streams object types introduced by this specification. Each definition includes its type, properties, and examples.

### **4.1. FlashcardModel**

Represents the structural definition of a type of flashcard, analogous to an "Anki Note Type." It defines the fields that instances of edu:Flashcard will contain and how those fields should be presented on a card.

* **Type:** edu:FlashcardModel  
* **Extends:** as:Object

**Properties:**

* **@id**: (Required) A unique URI for this specific flashcard model.  
  * **Type:** xsd:anyURI  
  * **Description:** A globally unique identifier for the flashcard model.  
* **name**: (Required) A human-readable name for the flashcard model.  
  * **Type:** xsd:string  
  * **Description:** Examples: "Basic Vocabulary", "Image Occlusion", "Kana Reading Practice".  
* **summary**: (Optional) A brief description of what this flashcard model is for.  
  * **Type:** xsd:string  
  * **Description:** Provides a short summary of the model's purpose.  
* **edu:fields**: (Required) An ordered array of objects, each defining a field that edu:Flashcard instances using this model will contain.  
  * **Type:** xsd:Array of objects  
  * **Description:** Each object in the array represents a field and has the following properties:  
    * **edu:fieldName**: (Required) A unique identifier for the field within this model (e.g., "Front", "Back", "Image", "Audio Pronunciation").  
      * **Type:** xsd:string  
    * **edu:fieldType**: (Required) Specifies the expected content type for the field.  
      * **Type:** xsd:string  
      * **Description:** Examples: text/plain, text/markdown, image/\*, audio/\*, video/\*, text/html. This is crucial for rendering.  
    * **edu:required**: (Optional) Boolean indicating if this field must have content. Defaults to false.  
      * **Type:** xsd:boolean  
* **edu:cardTemplates**: (Required) An array of objects, each defining a "card" generated from this model. This specifies the presentation logic for different views of the flashcard.  
  * **Type:** xsd:Array of objects  
  * **Description:** Each object in the array represents a card template and has the following properties:  
    * **edu:templateName**: (Required) A name for this specific card template (e.g., "Word to Definition", "Back to Front").  
      * **Type:** xsd:string  
    * **edu:frontTemplate**: (Required) A string containing a template for how the front of the card should be rendered. This uses placeholders for field names (e.g., &#123;&#123;Word&#125;&#125;, &#123;&#123;Image&#125;&#125;). It can support a simplified HTML/CSS subset for styling.  
      * **Type:** xsd:string  
    * **edu:backTemplate**: (Required) A string containing a template for how the back of the card should be rendered, typically revealing the answer and potentially other related fields.  
      * **Type:** xsd:string  
    * **edu:cardDirection**: (Optional) Specifies the learning direction for this card.  
      * **Type:** xsd:string  
      * **Description:** Recommended values: forward, reverse.  
* **edu:stylingCSS**: (Optional) A string containing CSS that applies to all cards generated by this model.  
  * **Type:** xsd:string  
  * **Description:** Allows for consistent styling across cards of this model.

**Example edu:FlashcardModel (Basic Vocabulary):**  
```JSON
{  
  "@context": [  
    "https://www.w3.org/ns/activitystreams",  
    "https://example.com/edu-ns"  
  ],  
  "@type": "edu:FlashcardModel",  
  "@id": "https://example.com/flashcard-models/basic-vocab",  
  "name": "Basic Vocabulary Card",  
  "summary": "A simple flashcard for learning vocabulary.",  
  "edu:fields": [  
    {  
      "edu:fieldName": "Word",  
      "edu:fieldType": "text/plain",  
      "edu:required": true  
    },  
    {  
      "edu:fieldName": "Definition",  
      "edu:fieldType": "text/plain",  
      "edu:required": true  
    },  
    {  
      "edu:fieldName": "Audio",  
      "edu:fieldType": "audio/\*",  
      "edu:required": false  
    },  
    {  
      "edu:fieldName": "Example Sentence",  
      "edu:fieldType": "text/plain",  
      "edu:required": false  
    }  
  ],  
  "edu:cardTemplates": [  
    {  
      "edu:templateName": "Word to Definition",  
      "edu:frontTemplate": "<h1>&#123;&#123;Word&#125;&#125;</h1><div class="audio-player">&#123;&#123;Audio&#125;&#125;</div>",  
      "edu:backTemplate": "<p>&#123;&#123;Definition&#125;&#125;</p><p><em>Example:</em> &#123;&#123;Example Sentence&#125;&#125;</p>"  
    },  
    {  
      "edu:templateName": "Definition to Word",  
      "edu:frontTemplate": "<h3>&#123;&#123;Definition&#125;&#125;</h3>",  
      "edu:backTemplate": "<h1>&#123;&#123;Word&#125;&#125;</h1><div class="audio-player">&#123;&#123;Audio&#125;&#125;</div><p><em>Example:</em> &#123;&#123;Example Sentence&#125;&#125;</p>"  
    }  
  ],  
  "edu:stylingCSS": "h1 { color: #333; } .audio-player { margin-top: 10px; }"  
}
```

### **4.2. Flashcard**

Represents an individual instance of a flashcard, containing the actual data for the fields defined by its associated edu:FlashcardModel.

* **Type:** edu:Flashcard  
* **Extends:** as:Document

**Properties:**

* **@id**: (Required) A unique URI for this specific flashcard instance.  
  * **Type:** xsd:anyURI  
  * **Description:** A globally unique identifier for the flashcard instance.  
* **name**: (Required) A human-readable identifier for this specific flashcard.  
  * **Type:** xsd:string  
  * **Description:** Can be automatically generated from a field, e.g., "Apple Vocabulary Card".  
* **edu:model**: (Required) A URI reference to the edu:FlashcardModel that defines this flashcard's structure.  
  * **Type:** as:Link or xsd:anyURI  
  * **Description:** Crucial for rendering and understanding the flashcard's data.  
* **edu:fieldsData**: (Required) An object where keys are the edu:fieldName from the associated model, and values are the actual content for that field.  
  * **Type:** xsd:Object  
  * **Description:** The content type of each value should align with edu:fieldType defined in the model.  
    * For text fields, the value is a string.  
    * For media fields (image/\*, audio/\*, video/\*), the value should be an as:Link object or a URL string, potentially with mediaType specified.  
* **edu:tags**: (Optional) An array of tags for categorization.  
  * **Type:** xsd:Array of xsd:string  
  * **Description:** Examples: vocabulary, fruit, French, A1.  
* **edu:relatedTo**: (Optional) An array of as:Link objects to other related educational materials.  
  * **Type:** xsd:Array of as:Link  
  * **Description:** Helps establish context, e.g., linking to an edu:Story or edu:VideoLesson.  
* **edu:targetLanguage**: (Optional) The target language of the educational content.  
  * **Type:** xsd:string  
  * **Description:** Uses BCP 47 language tags, e.g., en, fr, es.  
* **edu:sourceLanguage**: (Optional) The source language, typically for translation-focused cards.  
  * **Type:** xsd:string  
  * **Description:** Uses BCP 47 language tags, e.g., en, fr, es.

**Example edu:Flashcard Instance:**  
```JSON
{  
  "@context": [  
    "https://www.w3.org/ns/activitystreams",  
    "https://example.com/edu-ns"  
  ],  
  "@type": "edu:Flashcard",  
  "@id": "https://example.com/flashcards/apple-fr-123",  
  "name": "French Vocabulary: Pomme",  
  "edu:model": "https://example.com/flashcard-models/basic-vocab",  
  "edu:fieldsData": {  
    "Word": "pomme",  
    "Definition": "apple",  
    "Audio": {  
      "@type": "Link",  
      "href": "https://example.com/audio/pomme.mp3",  
      "mediaType": "audio/mpeg"  
    },  
    "Example Sentence": "J'aime manger une pomme."  
  },  
  "edu:tags": ["fruit", "food", "French", "A1"],  
  "edu:targetLanguage": "fr",  
  "edu:sourceLanguage": "en"  
}
```

### **4.3. Story**

Represents a narrative text, typically for reading and listening comprehension, potentially accompanied by a glossary and comprehension questions.

* **Type:** edu:Story  
* **Extends:** as:Article

**Properties:**

* **@id**: (Required) A unique URI for this specific story.  
  * **Type:** xsd:anyURI  
  * **Description:** A globally unique identifier for the story.  
* **name**: (Required) The title of the story.  
  * **Type:** xsd:string  
* **content**: (Required) The main text content of the story.  
  * **Type:** xsd:string or xsd:html  
* **edu:audio**: (Optional) A link to an audio recording of the story.  
  * **Type:** as:Link or xsd:anyURI  
  * **Description:** For listening comprehension.  
* **edu:glossary**: (Optional) An array of objects, each representing a term within the story.  
  * **Type:** xsd:Array of objects  
  * **Description:** Each object has the following properties:  
    * **term**: (Required) The word or phrase from the story.  
      * **Type:** xsd:string  
    * **definition**: (Required) The definition of the term.  
      * **Type:** xsd:string  
    * **edu:audio**: (Optional) A link to an audio pronunciation of the term.  
      * **Type:** as:Link or xsd:anyURI  
    * **edu:exampleSentence**: (Optional) An example sentence using the term.  
      * **Type:** xsd:string  
* **edu:comprehensionQuestions**: (Optional) An array of edu:Question objects (see edu:SelfAssessment for question structure details).  
  * **Type:** xsd:Array of edu:Question  
* **edu:level**: (Optional) The estimated proficiency level of the story.  
  * **Type:** xsd:string  
  * **Description:** Examples: CEFR:A2, Lexile:800L.  
* **edu:targetLanguage**: (Optional) The language of the story.  
  * **Type:** xsd:string  
  * **Description:** Uses BCP 47 language tags, e.g., en, fr, es.

**Example edu:Story:**  
```JSON
{  
  "@context": [  
    "https://www.w3.org/ns/activitystreams",  
    "https://example.com/edu-ns"  
  ],  
  "@type": "edu:Story",  
  "@id": "https://example.com/stories/little-red-hen",  
  "name": "The Little Red Hen",  
  "content": "Once upon a time, there was a little red hen who lived on a farm...",  
  "edu:audio": {  
    "@type": "Link",  
    "href": "https://example.com/audio/red-hen.mp3",  
    "mediaType": "audio/mpeg"  
  },  
  "edu:glossary": [  
    {  
      "term": "hen",  
      "definition": "a female chicken",  
      "edu:audio": "https://example.com/audio/hen.mp3"  
    },  
    {  
      "term": "farm",  
      "definition": "an area of land used for growing crops or raising animals"  
    }  
  ],  
  "edu:level": "CEFR:A1",  
  "edu:targetLanguage": "en"  
}
```

### **4.4. VideoLesson**

Represents a video-based lesson, potentially including transcripts, comprehension questions, and interactive elements.

* **Type:** edu:VideoLesson  
* **Extends:** as:Video

**Properties:**

* **@id**: (Required) A unique URI for this specific video lesson.  
  * **Type:** xsd:anyURI  
  * **Description:** A globally unique identifier for the video lesson.  
* **name**: (Required) The title of the video lesson.  
  * **Type:** xsd:string  
* **url**: (Required) The URL of the video content.  
  * **Type:** xsd:anyURI  
* **edu:transcript**: (Optional) The full text transcript of the video.  
  * **Type:** xsd:string  
* **edu:comprehensionQuestions**: (Optional) An array of edu:Question objects.  
  * **Type:** xsd:Array of edu:Question  
* **edu:discussionPrompts**: (Optional) An array of text prompts for discussion or speaking practice related to the video.  
  * **Type:** xsd:Array of xsd:string  
* **edu:interactiveElements**: (Optional) An array of objects defining interactive points within the video.  
  * **Type:** xsd:Array of objects  
  * **Description:** Each object has the following properties:  
    * **timestamp**: (Required) The time in the video (in seconds or a time format like PTnHnMnS).  
      * **Type:** xsd:integer or xsd:duration  
    * **edu:element**: (Required) A reference to an as:Object (e.g., an edu:Question or edu:Flashcard object) to be presented at that timestamp.  
      * **Type:** as:Link or as:Object  
* **edu:targetLanguage**: (Optional) The primary language of the video lesson.  
  * **Type:** xsd:string  
  * **Description:** Uses BCP 47 language tags.

**Example edu:VideoLesson:**  
```JSON
{  
  "@context": [  
    "https://www.w3.org/ns/activitystreams",  
    "https://example.com/edu-ns"  
  ],  
  "@type": "edu:VideoLesson",  
  "@id": "https://example.com/video-lessons/french-greetings",  
  "name": "French Greetings for Beginners",  
  "url": "https://example.com/videos/french-greetings.mp4",  
  "edu:transcript": "Bonjour\! Comment ça va? ...",  
  "edu:interactiveElements": [  
    {  
      "timestamp": 30,  
      "edu:element": {  
        "@type": "edu:Question",  
        "edu:questionType": "multipleChoice",  
        "content": "What does 'Bonjour' mean?",  
        "edu:options": ["Good morning", "Good evening", "Good night"],  
        "edu:correctAnswer": "Good morning"  
      }  
    }  
  ],  
  "edu:targetLanguage": "fr"  
}
```

### **4.5. SelfAssessment**

Represents a collection of questions designed to assess a learner's understanding. It can contain various question types.

* **Type:** edu:SelfAssessment  
* **Extends:** as:Collection (specifically for a set of questions) or as:Question (if it's a single question acting as an assessment). For a collection of questions, extending as:Collection and having edu:questions as its items is more appropriate.

**Properties:**

* **@id**: (Required) A unique URI for this specific self-assessment.  
  * **Type:** xsd:anyURI  
  * **Description:** A globally unique identifier for the assessment.  
* **name**: (Required) The title or name of the assessment.  
  * **Type:** xsd:string  
* **edu:assessmentType**: (Optional) The type of assessment.  
  * **Type:** xsd:string  
  * **Description:** Examples: quiz, exam, practice, unitTest.  
* **edu:questions**: (Required if extending as:Collection) An array of edu:Question objects.  
  * **Type:** xsd:Array of edu:Question  
  * **Description:** Each object in the array represents an individual question.  
* **edu:expectedResponse**: (Optional) A link to the edu:AssessmentResponse object that should be submitted for this assessment.  
  * **Type:** as:Link or edu:AssessmentResponse  
  * **Description:** Indicates the type and structure of the expected response.

#### **Question (Embedded Object Type)**

This object defines the structure of an individual question within an edu:SelfAssessment or other educational content.

* **Type:** edu:Question (This is an embedded type, not a top-level ActivityPub object)  
* **Extends:** as:Question (for its core properties like content)

**Properties:**

* **edu:questionType**: (Required) Specifies the type of question.  
  * **Type:** xsd:string  
  * **Description:** Recommended values: multipleChoice, fillInTheBlank, trueFalse, shortAnswer, matching, audioResponse, pronunciation, essay.  
* **content**: (Required) The question text, image URL, or audio URL that forms the question prompt.  
  * **Type:** xsd:string, as:Link, or xsd:html  
* **edu:options**: (Required for multipleChoice) An array of possible answers.  
  * **Type:** xsd:Array of xsd:string  
* **edu:correctAnswer**: (Required for objective questions) The correct answer(s) or criteria.  
  * **Type:** xsd:string or xsd:Array of xsd:string  
  * **Description:** For fillInTheBlank, this could be the exact word. For multipleChoice, the text of the correct option. For matching, a JSON object representing pairs.  
* **edu:feedback**: (Optional) Explanatory feedback for the learner after attempting the question.  
  * **Type:** xsd:string  
* **edu:media**: (Optional) A link to accompanying media for the question (e.g., an image for a visual question, an audio clip for a listening question).  
  * **Type:** as:Link or xsd:anyURI  
* **edu:targetLanguage**: (Optional) The language of the question.  
  * **Type:** xsd:string  
  * **Description:** Uses BCP 47 language tags.

**Example edu:SelfAssessment:**  
```JSON
{  
  "@context": [  
    "https://www.w3.org/ns/activitystreams",  
    "https://example.com/edu-ns"  
  ],  
  "@type": "edu:SelfAssessment",  
  "@id": "https://example.com/assessments/unit1-grammar-quiz",  
  "name": "Unit 1 Grammar Quiz",  
  "edu:assessmentType": "quiz",  
  "edu:questions": [  
    {  
      "@type": "edu:Question",  
      "edu:questionType": "multipleChoice",  
      "content": "Which of these is a verb?",  
      "edu:options": ["table", "run", "blue"],  
      "edu:correctAnswer": "run",  
      "edu:feedback": "Verbs are action words."  
    },  
    {  
      "@type": "edu:Question",  
      "edu:questionType": "fillInTheBlank",  
      "content": "The cat sat on the \_\_\_\_.",  
      "edu:correctAnswer": "mat",  
      "edu:targetLanguage": "en"  
    }  
  ],  
  "edu:expectedResponse": {  
    "@type": "Link",  
    "href": "https://example.com/edu-ns\#AssessmentResponse"  
  }  
}
```

### **4.6. WritingPrompt**

Represents a prompt for a writing activity.

* **Type:** edu:WritingPrompt  
* **Extends:** as:Note

**Properties:**

* **@id**: (Required) A unique URI for this specific writing prompt.  
  * **Type:** xsd:anyURI  
  * **Description:** A globally unique identifier for the prompt.  
* **name**: (Required) The title or subject of the writing prompt.  
  * **Type:** xsd:string  
* **content**: (Required) The main text of the writing prompt.  
  * **Type:** xsd:string or xsd:html  
* **edu:wordCountTarget**: (Optional) The desired word count range for the response.  
  * **Type:** xsd:string  
  * **Description:** Examples: "100-200 words", "at least 500 words".  
* **edu:topics**: (Optional) An array of keywords or themes the writing should address.  
  * **Type:** xsd:Array of xsd:string  
* **edu:targetAudience**: (Optional) Specifies the intended audience for the writing.  
  * **Type:** xsd:string  
  * **Description:** Examples: formal, informal, academic, creative.  
* **edu:targetLanguage**: (Optional) The language in which the writing should be composed.  
  * **Type:** xsd:string  
  * **Description:** Uses BCP 47 language tags.  
* **edu:expectedSubmission**: (Optional) A link to the edu:WritingSubmission object that should be submitted for this prompt.  
  * **Type:** as:Link or edu:WritingSubmission  
  * **Description:** Indicates the type and structure of the expected submission.

**Example edu:WritingPrompt:**  
```JSON
{  
  "@context": [  
    "https://www.w3.org/ns/activitystreams",  
    "https://example.com/edu-ns"  
  ],  
  "@type": "edu:WritingPrompt",  
  "@id": "https://example.com/writing-prompts/future-travel",  
  "name": "Imagine Your Future Travel",  
  "content": "Write a short story about a trip you would like to take in the future. Describe the destination, what you would do there, and who you would go with.",  
  "edu:wordCountTarget": "150-250 words",  
  "edu:topics": ["travel", "future", "adventure"],  
  "edu:targetLanguage": "en",  
  "edu:expectedSubmission": {  
    "@type": "Link",  
    "href": "https://example.com/edu-ns\#WritingSubmission"  
  }  
}
```

### **4.7. Exercise**

A generic object representing a learning exercise or practice activity. This can be extended by more specific exercise types (like edu:PronunciationExercise) or used directly for general practice.

* **Type:** edu:Exercise  
* **Extends:** as:Object

**Properties:**

* **@id**: (Required) A unique URI for this specific exercise.  
  * **Type:** xsd:anyURI  
  * **Description:** A globally unique identifier for the exercise.  
* **name**: (Required) A descriptive name for the exercise.  
  * **Type:** xsd:string  
* **summary**: (Optional) A brief description of the exercise's purpose or content.  
  * **Type:** xsd:string  
* **content**: (Optional) The main content of the exercise, if it's a simple text-based prompt or instruction.  
  * **Type:** xsd:string or xsd:html  
* **edu:exerciseType**: (Optional) A more specific type or category for this exercise.  
  * **Type:** xsd:string  
  * **Description:** Examples: drill, practice, simulation, rolePlay.  
* **edu:targetLanguage**: (Optional) The primary language targeted by the exercise.  
  * **Type:** xsd:string  
  * **Description:** Uses BCP 47 language tags, e.g., en, fr, es.  
* **edu:difficulty**: (Optional) The perceived difficulty level of the exercise.  
  * **Type:** xsd:string  
  * **Description:** Examples: beginner, intermediate, advanced, CEFR:B1.  
* **edu:media**: (Optional) A link to accompanying media for the exercise (e.g., an image, audio, or video that is part of the exercise itself).  
  * **Type:** as:Link or xsd:anyURI  
* **edu:relatedTo**: (Optional) An array of as:Link objects to other related educational materials or objectives.  
  * **Type:** xsd:Array of as:Link

**Example edu:Exercise (Simple Grammar Practice):**  
```JSON
{  
  "@context": [  
    "https://www.w3.org/ns/activitystreams",  
    "https://example.com/edu-ns"  
  ],  
  "@type": "edu:Exercise",  
  "@id": "https://example.com/exercises/simple-past-tense-drill",  
  "name": "Simple Past Tense Drill",  
  "summary": "Practice conjugating regular verbs in the simple past tense.",  
  "content": "Complete the sentences with the simple past form of the verb in parentheses.",  
  "edu:exerciseType": "drill",  
  "edu:targetLanguage": "en",  
  "edu:difficulty": "beginner",  
  "edu:relatedTo": [  
    "https://example.com/objectives/master-basic-english-grammar"  
  ]  
}
```

**Update to edu:PronunciationExercise:**  
The edu:PronunciationExercise will now explicitly extend edu:Exercise.

* **Type:** edu:PronunciationExercise  
* **Extends:** edu:Exercise

**Properties:** (Inherits properties from edu:Exercise and adds its own)

* **edu:phrase**: (Required) The word or phrase to be pronounced.  
  * **Type:** xsd:string  
* **edu:referenceAudio**: (Required) A link to a reference audio recording of the correct pronunciation.  
  * **Type:** as:Link or xsd:anyURI  
* **edu:feedbackMechanism**: (Optional) Suggests how feedback might be provided for the learner's pronunciation.  
  * **Type:** xsd:string  
  * **Description:** Examples: AI\_analysis, peer\_review, self\_assessment.

**Example edu:PronunciationExercise (Updated):**  
```JSON
{  
  "@context": [  
    "https://www.w3.org/ns/activitystreams",  
    "https://example.com/edu-ns"  
  ],  
  "@type": "edu:PronunciationExercise",  
  "@id": "https://example.com/pronunciation-exercises/hello-french",  
  "name": "Pronounce 'Bonjour'",  
  "summary": "Practice the pronunciation of the common French greeting.",  
  "edu:phrase": "Bonjour",  
  "edu:referenceAudio": {  
    "@type": "Link",  
    "href": "https://example.com/audio/bonjour\_ref.mp3",  
    "mediaType": "audio/mpeg"  
  },  
  "edu:targetLanguage": "fr",  
  "edu:feedbackMechanism": "AI\_analysis",  
  "edu:difficulty": "beginner"  
}
```

### **4.8. Progress Tracking Objects**

These objects define a system for tracking learning progress using an Objectives and Key Results (OKR) paradigm.

#### **4.8.1. Objective**

Represents a high-level learning goal or objective.

* **Type:** edu:Objective  
* **Extends:** as:Object

**Properties:**

* **@id**: (Required) A unique URI for this specific objective.  
  * **Type:** xsd:anyURI  
  * **Description:** A globally unique identifier for the objective.  
* **name**: (Required) A concise statement of the objective.  
  * **Type:** xsd:string  
  * **Description:** Example: "Become proficient in French conversation."  
* **summary**: (Optional) A detailed description of the objective.  
  * **Type:** xsd:string  
* **attributedTo**: (Required) The as:Actor (e.g., a learner) to whom this objective belongs.  
  * **Type:** as:Link or as:Actor  
* **edu:keyResults**: (Required) An array of edu:KeyResult objects that define how the objective's achievement will be measured.  
  * **Type:** xsd:Array of edu:KeyResult  
* **edu:targetDate**: (Optional) The date by which the objective is intended to be achieved.  
  * **Type:** xsd:dateTime or xsd:date  
* **edu:status**: (Optional) The current status of the objective.  
  * **Type:** xsd:string  
  * **Description:** Recommended values: pending, inProgress, achieved, atRisk, abandoned.  
* **context**: (Optional) A link to the broader educational context this objective is part of (e.g., a course, a curriculum).  
  * **Type:** as:Link or as:Object

**Example edu:Objective:**  
```JSON
{  
  "@context": [  
    "https://www.w3.org/ns/activitystreams",  
    "https://example.com/edu-ns"  
  ],  
  "@type": "edu:Objective",  
  "@id": "https://example.com/objectives/french-conversation-proficiency",  
  "name": "Become proficient in French conversation",  
  "summary": "Improve spoken French to comfortably engage in daily conversations.",  
  "attributedTo": "https://example.com/users/alice",  
  "edu:keyResults": [  
    {  
      "name": "Complete 10 speaking exercises with 80% accuracy",  
      "edu:metricType": "percentage",  
      "edu:targetValue": 80,  
      "edu:currentValue": 55,  
      "edu:unit": "%",  
      "edu:relatedTo": [  
        "https://example.com/pronunciation-exercises/hello-french",  
        "https://example.com/video-lessons/french-greetings"  
      ],  
      "edu:status": "onTrack"  
    },  
    {  
      "name": "Participate in 5 French conversation group sessions",  
      "edu:metricType": "count",  
      "edu:targetValue": 5,  
      "edu:currentValue": 2,  
      "edu:unit": "sessions",  
      "edu:status": "atRisk"  
    }  
  ],  
  "edu:targetDate": "2025-12-31",  
  "edu:status": "inProgress"  
}
```

#### **4.8.2. KeyResult (Embedded Object Type)**

Represents a measurable outcome that contributes to the achievement of an edu:Objective.

* **Type:** edu:KeyResult (This is an embedded type, not a top-level ActivityPub object)  
* **Extends:** as:Object

**Properties:**

* **name**: (Required) A concise statement of the key result.  
  * **Type:** xsd:string  
  * **Description:** Example: "Complete 10 speaking exercises with 80% accuracy."  
* **edu:metricType**: (Required) The type of metric used for this key result.  
  * **Type:** xsd:string  
  * **Description:** Recommended values: percentage, count, boolean, score, duration.  
* **edu:targetValue**: (Required) The target value for the metric.  
  * **Type:** xsd:decimal or xsd:boolean  
* **edu:currentValue**: (Required) The current value of the metric.  
  * **Type:** xsd:decimal or xsd:boolean  
* **edu:unit**: (Optional) The unit of measurement for the metric.  
  * **Type:** xsd:string  
  * **Description:** Examples: %, exercises, points, hours, sessions.  
* **edu:relatedTo**: (Optional) An array of as:Link objects to specific educational content or activities that contribute to this key result.  
  * **Type:** xsd:Array of as:Link  
* **edu:status**: (Optional) The current status of the key result.  
  * **Type:** xsd:string  
  * **Description:** Recommended values: notStarted, onTrack, atRisk, achieved.  
* **updated**: (Optional) The timestamp when the edu:currentValue was last updated.  
  * **Type:** xsd:dateTime

### **4.9. Response and Submission Objects**

These objects define how learners' responses to assessments and submitted work for prompts are represented.

#### **4.9.1. AssessmentResponse**

Represents a learner's response to an edu:SelfAssessment or individual edu:Questions.

* **Type:** edu:AssessmentResponse  
* **Extends:** as:Note (as a general document of response)

**Properties:**

* **@id**: (Required) A unique URI for this specific assessment response.  
  * **Type:** xsd:anyURI  
  * **Description:** A globally unique identifier for the response.  
* **attributedTo**: (Required) The as:Actor (learner) who provided this response.  
  * **Type:** as:Link or as:Actor  
* **inReplyTo**: (Required) A link to the edu:SelfAssessment or edu:Question that this is a response to.  
  * **Type:** as:Link or as:Object  
* **edu:responses**: (Required) An array of objects, each representing a response to an individual question.  
  * **Type:** xsd:Array of objects  
  * **Description:** Each object in the array represents a question response and has the following properties:  
    * **edu:question**: (Required) A link to the edu:Question object being answered.  
      * **Type:** as:Link or edu:Question  
    * **edu:learnerAnswer**: (Required) The learner's answer to the question.  
      * **Type:** xsd:string, xsd:Array of xsd:string, as:Link (for audio/video responses)  
      * **Description:** The format depends on the edu:questionType.  
    * **edu:isCorrect**: (Optional) Boolean indicating if the learner's answer is correct (for objective questions).  
      * **Type:** xsd:boolean  
    * **edu:score**: (Optional) A numerical score for this specific question.  
      * **Type:** xsd:decimal  
    * **edu:feedback**: (Optional) Specific feedback given for this individual response.  
      * **Type:** xsd:string  
* **edu:overallScore**: (Optional) The total score for the assessment.  
  * **Type:** xsd:decimal  
* **edu:maxScore**: (Optional) The maximum possible score for the assessment.  
  * **Type:** xsd:decimal  
* **edu:completionDate**: (Optional) The date and time when the assessment was completed.  
  * **Type:** xsd:dateTime

**Example edu:AssessmentResponse:**  
```JSON
{  
  "@context": [  
    "https://www.w3.org/ns/activitystreams",  
    "https://example.com/edu-ns"  
  ],  
  "@type": "edu:AssessmentResponse",  
  "@id": "https://example.com/responses/alice-unit1-grammar-quiz-1",  
  "attributedTo": "https://example.com/users/alice",  
  "inReplyTo": "https://example.com/assessments/unit1-grammar-quiz",  
  "edu:responses": [  
    {  
      "edu:question": "https://example.com/assessments/unit1-grammar-quiz\#q1",  
      "edu:learnerAnswer": "run",  
      "edu:isCorrect": true  
    },  
    {  
      "edu:question": "https://example.com/assessments/unit1-grammar-quiz\#q2",  
      "edu:learnerAnswer": "floor",  
      "edu:isCorrect": false,  
      "edu:feedback": "The correct answer was 'mat'."  
    }  
  ],  
  "edu:overallScore": 1,  
  "edu:maxScore": 2,  
  "edu:completionDate": "2025-07-15T16:30:00Z"  
}
```

#### **4.9.2. WritingSubmission**

Represents a learner's submitted written work in response to an edu:WritingPrompt.

* **Type:** edu:WritingSubmission  
* **Extends:** as:Article or as:Note (depending on the expected length/complexity of the submission)

**Properties:**

* **@id**: (Required) A unique URI for this specific writing submission.  
  * **Type:** xsd:anyURI  
  * **Description:** A globally unique identifier for the submission.  
* **attributedTo**: (Required) The as:Actor (learner) who submitted the writing.  
  * **Type:** as:Link or as:Actor  
* **inReplyTo**: (Required) A link to the edu:WritingPrompt that this is a response to.  
  * **Type:** as:Link or edu:WritingPrompt  
* **content**: (Required) The full text of the submitted writing.  
  * **Type:** xsd:string or xsd:html  
* **edu:wordCount**: (Optional) The actual word count of the submitted writing.  
  * **Type:** xsd:integer  
* **edu:submissionDate**: (Optional) The date and time when the writing was submitted.  
  * **Type:** xsd:dateTime  
* **edu:feedback**: (Optional) General feedback or a link to a separate feedback object (e.g., a peer review).  
  * **Type:** xsd:string or as:Link  
* **edu:grade**: (Optional) A grade or evaluation for the submission.  
  * **Type:** xsd:string or xsd:decimal

**Example edu:WritingSubmission:**  
```JSON
{  
  "@context": [  
    "https://www.w3.org/ns/activitystreams",  
    "https://example.com/edu-ns"  
  ],  
  "@type": "edu:WritingSubmission",  
  "@id": "https://example.com/submissions/alice-future-travel-1",  
  "attributedTo": "https://example.com/users/alice",  
  "inReplyTo": "https://example.com/writing-prompts/future-travel",  
  "content": "In the future, I dream of traveling to Mars. I would go with my robot companion, Unit 7\. We would explore the red canyons and look for signs of ancient life...",  
  "edu:wordCount": 75,  
  "edu:submissionDate": "2025-07-15T17:00:00Z",  
  "edu:feedback": "Good imagination\! Work on developing your descriptions more."  
}
```

### **4.10. Peer Review Objects**

These objects define mechanisms for peer feedback on writing or speaking activities.

#### **4.10.1. PeerReview**

Represents a peer's feedback on a learner's submission (e.g., writing or speaking).

* **Type:** edu:PeerReview  
* **Extends:** as:Note (as a general document of feedback)

**Properties:**

* **@id**: (Required) A unique URI for this specific peer review.  
  * **Type:** xsd:anyURI  
  * **Description:** A globally unique identifier for the peer review.  
* **attributedTo**: (Required) The as:Actor (peer) providing the review.  
  * **Type:** as:Link or as:Actor  
* **inReplyTo**: (Required) A link to the edu:WritingSubmission or edu:AudioResponse (for speaking) being reviewed.  
  * **Type:** as:Link or as:Object  
* **content**: (Required) The textual feedback provided by the peer.  
  * **Type:** xsd:string or xsd:html  
* **edu:rating**: (Optional) A numerical or qualitative rating for the submission.  
  * **Type:** xsd:decimal or xsd:string  
  * **Description:** Examples: a score (e.g., 4.5/5), "Excellent," "Good," "Needs Improvement."  
* **edu:strengths**: (Optional) An array of strings highlighting positive aspects of the submission.  
  * **Type:** xsd:Array of xsd:string  
* **edu:areasForImprovement**: (Optional) An array of strings suggesting specific areas for development in the submission.  
  * **Type:** xsd:Array of xsd:string  
* **edu:feedbackType**: (Optional) Specifies the type or focus of the feedback.  
  * **Type:** xsd:string  
  * **Description:** Examples: general, grammatical, content, pronunciation, structure.  
* **edu:rubric**: (Optional) A link to an edu:Rubric object (a new type defining assessment criteria) that was used for the review.  
  * **Type:** as:Link or edu:Rubric  
* **published**: (Optional) The timestamp when the review was submitted.  
  * **Type:** xsd:dateTime

**Example edu:PeerReview:**  
```JSON
{  
  "@context": [  
    "https://www.w3.org/ns/activitystreams",  
    "https://example.com/edu-ns"  
  ],  
  "@type": "edu:PeerReview",  
  "@id": "https://example.com/peer-reviews/bob-review-alice-travel-1",  
  "attributedTo": "https://example.com/users/bob",  
  "inReplyTo": "https://example.com/submissions/alice-future-travel-1",  
  "content": "Alice, your story about Mars was very imaginative\! I particularly liked the idea of Unit 7\. You could try adding more descriptive language about the Martian landscape to make it even more vivid.",  
  "edu:rating": "Good",  
  "edu:strengths": ["imagination", "character development"],  
  "edu:areasForImprovement": ["descriptive language", "setting details"],  
  "edu:feedbackType": "content",  
  "published": "2025-07-15T17:15:00Z"  
}
```

## **5\. ActivityPub Activities for Educational Content**

Standard ActivityPub activities can be used to interact with these educational objects. When a general-purpose ActivityPub instance encounters an activity with an object of a custom edu: type, it will typically display the name or summary property of that object as a fallback.

* **Create**: An actor Creates an edu:FlashcardModel, edu:Flashcard, edu:Story, edu:VideoLesson, edu:SelfAssessment, edu:WritingPrompt, edu:PronunciationExercise, edu:Exercise, edu:Objective, edu:AssessmentResponse, edu:WritingSubmission, or edu:PeerReview.  
* **Update**: An actor Updates any of the edu: objects (e.g., updating edu:currentValue of a edu:KeyResult within an edu:Objective, or adding feedback to a submission).  
* **Delete**: An actor Deletes any of the edu: objects.  
* **Announce**: An actor Announces the availability of an edu: object (e.g., "New French vocabulary deck available\!" or "Alice just set a new learning objective\!").  
* **Add**: An actor Adds an edu:Flashcard to a as:Collection (e.g., a "deck" or "study set") or an edu:Objective to a collection of personal goals.  
* **Remove**: An actor Removes an edu:Flashcard from a as:Collection.  
* **Like**: An actor Likes an edu: object (e.g., "I liked this story\!" or "Great objective\!").  
* **Follow**: An actor Follows another actor who publishes edu: content.  
* **Accept / Reject**: Used in response to Follow activities or other interactions.  
* **Submit**: An actor Submits an edu:AssessmentResponse or edu:WritingSubmission to an edu:SelfAssessment or edu:WritingPrompt.  
  * **actor**: The learner submitting the response.  
  * **object**: The edu:AssessmentResponse or edu:WritingSubmission object.  
  * **target**: The edu:SelfAssessment or edu:WritingPrompt being responded to.

**Example Submit Activity:**  
```JSON
{  
  "@context": "https://www.w3.org/ns/activitystreams",  
  "id": "https://example.com/activities/submit-response-123",  
  "type": "Submit",  
  "actor": "https://example.com/users/alice",  
  "object": "https://example.com/responses/alice-unit1-grammar-quiz-1",  
  "target": "https://example.com/assessments/unit1-grammar-quiz",  
  "published": "2025-07-15T16:30:00Z"  
}
```

* **Offer (for review):** An actor Offers to review an edu:WritingSubmission or edu:AudioResponse.  
  * **actor**: The peer offering to review.  
  * **object**: The edu:WritingSubmission or edu:AudioResponse they are offering to review.  
  * **target**: The as:Actor (learner) whose submission is being offered for review.

**Example Offer Activity (for review):**  
```JSON
{  
  "@context": "https://www.w3.org/ns/activitystreams",  
  "id": "https://example.com/activities/offer-review-789",  
  "type": "Offer",  
  "actor": "https://example.com/users/bob",  
  "object": {  
    "@type": "Link",  
    "href": "https://example.com/submissions/alice-future-travel-1"  
  },  
  "target": "https://example.com/users/alice",  
  "published": "2025-07-15T17:20:00Z"  
}
```

* **Review Activity:** An actor Reviews an edu:WritingSubmission or edu:AudioResponse, with the edu:PeerReview object as the result.  
  * **actor**: The peer providing the review.  
  * **object**: The edu:WritingSubmission or edu:AudioResponse being reviewed.  
  * **result**: The edu:PeerReview object containing the feedback.

**Example Review Activity:**  
```JSON
{  
  "@context": "https://www.w3.org/ns/activitystreams",  
  "id": "https://example.com/activities/review-submission-456",  
  "type": "Review",  
  "actor": "https://example.com/users/bob",  
  "object": "https://example.com/submissions/alice-future-travel-1",  
  "result": "https://example.com/peer-reviews/bob-review-alice-travel-1",  
  "published": "2025-07-15T17:25:00Z"  
}
```

## **6\. Compatibility and Interoperability Considerations**

* **Graceful Degradation:** General-purpose ActivityPub implementations (e.g., Mastodon, Pixelfed, PeerTube) that do not explicitly support the edu: vocabulary will still be able to process the ActivityPub activities. They will typically display the name and summary (or content) of the edu: object as a generic "note" or "post."  
* **Canonical URLs:** All edu: objects should include an as:url property pointing to their canonical URL on the originating educational platform. This allows users on other Fediverse instances to click through to a specialized client or website for the full interactive experience.  
* **Media Attachments:** Where appropriate, use the standard Activity Streams as:attachment property for any embedded media (images, audio, video) within your edu: objects. This increases the likelihood that general-purpose platforms will display the media, even if they don't understand the specific educational context.  
* **JSON-LD Validation:** Strict adherence to JSON-LD syntax and the inclusion of the custom @context are paramount for proper parsing by all ActivityPub-compliant software.

## **7\. Future Work**

* **Standardizing edu-ns URI:** Establishing a stable, resolvable URI for the edu: namespace through community consensus or a dedicated registry.

This specification provides a foundational framework. Community feedback and real-world implementation will guide its evolution and refinement.