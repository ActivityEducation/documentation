---
sidebar_position: 1
title: EducationPub Vocabulary Specification
---

# **EducationPub Vocabulary Specification**

## **EduPub Draft 22 July 2025**

### **Abstract**

This specification defines an extension vocabulary for Activity Streams 2.0 and ActivityPub. The "EducationPub" vocabulary is designed to represent and facilitate the sharing of educational materials and learning activities within a federated social network. It provides a schema for describing objects such as flashcards, stories, assessments, and learning objectives, enabling rich, domain-specific functionality for educational applications while ensuring interoperability with the broader Fediverse.

### **Status of This Document**

*This section describes the status of this document at the time of its publication. Other documents may supersede this document. A list of current EduPub publications can be found in the EduPub technical reports index at [https://join.edupub.social/docs/specifications/](https://join.edupub.social/docs/specifications/).*  
This document is an Unofficial Draft produced by the EduPub Community Group. It is a work in progress and is not an EduPub Standard. This document is intended to be a starting point for discussion within the community for a potential future standard. Feedback is welcome and should be directed to the editors.  
Publication as a Draft does not imply endorsement by the EduPub Membership. This is a draft document and may be updated, replaced or obsoleted by other documents at any time. It is inappropriate to cite this document as other than work in progress.

## **1\. Introduction**

The Fediverse, a decentralized network of interoperable social media platforms powered by the ActivityPub protocol \[[ACTIVITYPUB](https://www.w3.org/TR/activitypub/)\], provides a powerful foundation for social interaction. This specification extends the Activity Streams 2.0 \[[AS2-CORE](https://www.w3.org/TR/activitystreams-core/)\] vocabulary to create a new paradigm for educational content. By defining a set of specialized object and activity types, "EducationPub" allows learners, educators, and institutions to publish, discover, and interact with learning resources in a federated manner.  
This specification introduces new vocabulary terms under a dedicated edu: namespace, ensuring compatibility with existing ActivityPub implementations while enabling rich, domain-specific functionality for educational applications.

## **2\. Conformance**

As well as sections marked as non-normative, all authoring guidelines, diagrams, examples, and notes in this specification are non-normative. Everything else in this specification is normative.  
The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in BCP 14 \[[RFC2119](https://tools.ietf.org/html/rfc2119)\] \[[RFC8174](https://tools.ietf.org/html/rfc8174)\] when, and only when, they appear in all capitals, as shown here.  
An implementation conforms to this specification if it meets the following criteria:

1. **Valid JSON-LD:** All objects produced MUST be valid JSON-LD \[[JSON-LD](https://www.w3.org/TR/json-ld11/)\].  
2. **Activity Streams 2.0 Compliance:** All objects MUST conform to the Activity Streams 2.0 Core and Vocabulary specifications \[[AS2-CORE](https://www.w3.org/TR/activitystreams-core/)\] \[[AS2-VOCAB](https://www.w3.org/TR/activitystreams-vocabulary/)\].  
3. **Namespace Declaration:** Implementations consuming or producing edu: vocabulary terms MUST include the edu: namespace URI in the JSON-LD @context.  
4. **Graceful Degradation:** For interoperability, custom object types defined in this specification SHOULD be represented as a compound type, ordered from most-specific to least-specific (e.g., type: \["edu:Flashcard", "Document"\]).

## **3\. The edu Vocabulary**

### **3.1. Namespace**

This specification defines a new namespace, edu:. To avoid conflicts with the core Activity Streams vocabulary, all custom types and properties defined herein are prefixed with edu:.  
For the purpose of this specification, the URI https://edupub.social/ns/educationpub is used. Implementers are encouraged to use this stable, resolvable URI for their deployed vocabulary.

### **3.2. Object Types**

#### **3.2.1. FlashcardModel**

Represents the structural definition of a type of flashcard.

* **Type:** edu:FlashcardModel  
* **Extends:** as:Object

| Property | Range | Description |
| :---- | :---- | :---- |
| id | xsd:anyURI | (Required) A unique URI for this specific flashcard model. |
| name | xsd:string | (Required) A human-readable name for the flashcard model. |
| summary | xsd:string | (Optional) A brief description of the model's purpose. |
| edu:fields | Array | (Required) An ordered array of objects defining the model's fields. |
| edu:cardTemplates | Array | (Required) An array of objects defining the card templates generated from this model. |
| edu:stylingCSS | xsd:string | (Optional) CSS that applies to all cards generated by this model. |

#### **3.2.2. Flashcard**

Represents an individual instance of a flashcard.

* **Type:** \['edu:Flashcard', 'Document'\]  
* **Extends:** as:Document

| Property | Range | Description |
| :---- | :---- | :---- |
| id | xsd:anyURI | (Required) A unique URI for this flashcard instance. |
| name | xsd:string | (Required) A human-readable identifier for this flashcard. |
| edu:model | xsd:anyURI or as:Link | (Required) A reference to the defining edu:FlashcardModel. |
| edu:fieldsData | Object | (Required) An object containing the data for the fields. |
| edu:tags | Array of xsd:string | (Optional) Tags for categorization. |
| edu:relatedTo | Array of as:Link | (Optional) Links to related educational materials. |
| edu:targetLanguage | xsd:string | (Optional) The target language (BCP 47). |
| edu:sourceLanguage | xsd:string | (Optional) The source language (BCP 47). |

#### **3.2.3. Story**

Represents a narrative text for reading and listening comprehension.

* **Type:** \['edu:Story', 'Article'\]  
* **Extends:** as:Article

| Property | Range | Description |
| :---- | :---- | :---- |
| edu:audio | as:Link | (Optional) A link to an audio recording of the story. |
| edu:glossary | Array | (Optional) An array of glossary term objects. |
| edu:comprehensionQuestions | Array of edu:Question | (Optional) An array of comprehension questions. |
| edu:level | xsd:string | (Optional) The estimated proficiency level (e.g., "CEFR:A2"). |
| edu:targetLanguage | xsd:string | (Optional) The language of the story (BCP 47). |

#### **3.2.4. VideoLesson**

Represents a video-based lesson.

* **Type:** \['edu:VideoLesson', 'Video'\]  
* **Extends:** as:Video

| Property | Range | Description |
| :---- | :---- | :---- |
| edu:transcript | xsd:string | (Optional) The full text transcript of the video. |
| edu:comprehensionQuestions | Array of edu:Question | (Optional) An array of comprehension questions. |
| edu:discussionPrompts | Array of xsd:string | (Optional) An array of text prompts for discussion. |
| edu:interactiveElements | Array | (Optional) An array of objects defining interactive points in the video. |
| edu:targetLanguage | xsd:string | (Optional) The primary language of the video lesson (BCP 47). |

#### **3.2.5. Question (Embedded Object)**

Defines the structure of an individual question.

* **Type:** edu:Question  
* **Extends:** as:Object

| Property | Range | Description |
| :---- | :---- | :---- |
| edu:questionType | xsd:string | (Required) The type of question (e.g., multipleChoice). |
| content | xsd:string | (Required) The question prompt. |
| edu:options | Array of xsd:string | (Optional) Possible answers for multipleChoice. |
| edu:correctAnswer | xsd:string or Array | (Optional) The correct answer(s). |
| edu:feedback | xsd:string | (Optional) Explanatory feedback. |
| edu:media | as:Link | (Optional) Accompanying media. |
| edu:targetLanguage | xsd:string | (Optional) The language of the question (BCP 47). |

#### **3.2.6. SelfAssessment**

Represents a collection of questions.

* **Type:** \['edu:SelfAssessment', 'Collection'\]  
* **Extends:** as:Collection

| Property | Range | Description |
| :---- | :---- | :---- |
| edu:assessmentType | xsd:string | (Optional) The type of assessment (e.g., quiz, exam). |
| edu:questions | Array of edu:Question | (Required) An array of the questions in the assessment. |
| edu:expectedResponse | as:Link or edu:AssessmentResponse | (Optional) Indicates the expected response structure. |

#### **3.2.7. WritingPrompt**

Represents a prompt for a writing activity.

* **Type:** \['edu:WritingPrompt', 'Note'\]  
* **Extends:** as:Note

| Property | Range | Description |
| :---- | :---- | :---- |
| edu:wordCountTarget | xsd:string | (Optional) The desired word count range. |
| edu:topics | Array of xsd:string | (Optional) An array of keywords or themes. |
| edu:targetAudience | xsd:string | (Optional) The intended audience (e.g., formal, informal). |
| edu:targetLanguage | xsd:string | (Optional) The language for the writing (BCP 47). |
| edu:expectedSubmission | as:Link or edu:WritingSubmission | (Optional) Indicates the expected submission structure. |

#### **3.2.8. Exercise**

A generic object representing a learning exercise.

* **Type:** edu:Exercise  
* **Extends:** as:Object

| Property | Range | Description |
| :---- | :---- | :---- |
| edu:exerciseType | xsd:string | (Optional) A specific category (e.g., drill, pronunciation). |
| edu:phrase | xsd:string | (Optional) The phrase to be pronounced. |
| edu:referenceAudio | as:Link | (Optional) A link to a reference audio recording. |
| edu:feedbackMechanism | xsd:string | (Optional) Suggested feedback method. |

#### **3.2.9. Objective**

Represents a high-level learning goal.

* **Type:** edu:Objective  
* **Extends:** as:Object

| Property | Range | Description |
| :---- | :---- | :---- |
| attributedTo | as:Actor or as:Link | (Required) The actor to whom this objective belongs. |
| edu:keyResults | Array of edu:KeyResult | (Required) An array of KeyResult objects. |
| edu:targetDate | xsd:dateTime | (Optional) The target achievement date. |
| edu:status | xsd:string | (Optional) The objective's status (e.g., inProgress). |

#### **3.2.10. KeyResult (Embedded Object)**

Represents a measurable outcome for an edu:Objective.

* **Type:** edu:KeyResult  
* **Extends:** as:Object

| Property | Range | Description |
| :---- | :---- | :---- |
| edu:metricType | xsd:string | (Required) The type of metric (e.g., percentage, count). |
| edu:targetValue | xsd:decimal or xsd:boolean | (Required) The target value for the metric. |
| edu:currentValue | xsd:decimal or xsd:boolean | (Required) The current value of the metric. |
| edu:unit | xsd:string | (Optional) The unit of measurement (e.g., %, hours). |
| edu:relatedTo | Array of as:Link | (Optional) Links to activities that contribute to this key result. |
| edu:status | xsd:string | (Optional) The key result's status (e.g., onTrack). |

#### **3.2.11. AssessmentResponse**

Represents a learner's response to an edu:SelfAssessment.

* **Type:** \['edu:AssessmentResponse', 'Note'\]  
* **Extends:** as:Note

| Property | Range | Description |
| :---- | :---- | :---- |
| inReplyTo | edu:SelfAssessment or edu:Question or as:Link | (Required) A link to the assessment or question. |
| edu:responses | Array | (Required) An array of responses to individual questions. |
| edu:overallScore | xsd:decimal | (Optional) The total score for the assessment. |
| edu:maxScore | xsd:decimal | (Optional) The maximum possible score. |
| edu:completionDate | xsd:dateTime | (Optional) The completion timestamp. |

#### **3.2.12. WritingSubmission**

Represents a learner's submitted work.

* **Type:** \['edu:WritingSubmission', 'Article'\]  
* **Extends:** as:Article

| Property | Range | Description |
| :---- | :---- | :---- |
| inReplyTo | edu:WritingPrompt or as:Link | (Required) A link to the writing prompt. |
| edu:wordCount | xsd:integer | (Optional) The actual word count. |
| edu:submissionDate | xsd:dateTime | (Optional) The submission timestamp. |
| edu:feedback | xsd:string or as:Link | (Optional) General feedback or a link to a feedback object. |
| edu:grade | xsd:string or xsd:decimal | (Optional) A grade or evaluation for the submission. |

#### **3.2.13. Rubric**

Defines a structured set of criteria for assessment.

* **Type:** edu:Rubric  
* **Extends:** as:Object

| Property | Range | Description |
| :---- | :---- | :---- |
| id | xsd:anyURI | (Required) A unique URI for this rubric. |
| name | xsd:string | (Required) A human-readable name for the rubric. |
| summary | xsd:string | (Optional) A description of the rubric's purpose or scope. |
| edu:criteria | Array of Object | (Required) An ordered array of objects, each representing a distinct criterion for evaluation. Each object contains a name (e.g., "Clarity") and a summary describing the criterion. |
| edu:levels | Array of Object | (Required) An ordered array of objects, each representing a performance level. Each object contains a name (e.g., "Excellent", "Proficient") and an optional edu:scoreValue. |
| edu:descriptors | Array of Object | (Required) An array of objects that describe the expected performance for each criterion at each level. Each object links a criterion and a level to a summary (the descriptive text). |
| edu:scoringMethod | xsd:string | (Optional) The method for calculating a score from the rubric (e.g., points, percentage). |
| edu:alignsWith | Array of as:Link | (Optional) Links to specific learning objectives or standards that this rubric assesses. |

#### **3.2.14. PeerReview**

Represents a peer's feedback on a submission.

* **Type:** \['edu:PeerReview', 'Note'\]  
* **Extends:** as:Note

| Property | Range | Description |
| :---- | :---- | :---- |
| inReplyTo | edu:WritingSubmission or as:Link | (Required) A link to the submission being reviewed. |
| edu:rating | xsd:decimal or xsd:string | (Optional) A numerical or qualitative rating. |
| edu:strengths | Array of xsd:string | (Optional) An array of strings highlighting positive aspects. |
| edu:areasForImprovement | Array of xsd:string | (Optional) An array of strings suggesting areas for improvement. |
| edu:feedbackType | xsd:string | (Optional) The focus of the feedback (e.g., grammatical). |
| edu:rubric | edu:Rubric or as:Link | (Optional) A link to an edu:Rubric object. |

## **4\. Extended Activities**

This specification introduces the following new Activity types.

### **4.1. Submit Activity**

An activity where a learner submits a response.

* **Type:** Submit  
* **Extends:** as:Activity  
* **Properties:**  
  * object: The edu:AssessmentResponse or edu:WritingSubmission.  
  * target: The edu:SelfAssessment or edu:WritingPrompt.

### **4.2. Review Activity**

An activity where a peer reviews a submission.

* **Type:** Review  
* **Extends:** as:Activity  
* **Properties:**  
  * object: The edu:WritingSubmission being reviewed.  
  * result: The edu:PeerReview object.

## **5\. Compatibility and Interoperability**

* **Graceful Degradation:** By using compound types (e.g., \["edu:Flashcard", "Document"\]), general-purpose clients that do not understand the edu: vocabulary can fall back to processing the object as its base type (Document). They will typically display the name and content properties.  
* **Canonical URLs:** All edu: objects SHOULD include a url property pointing to their canonical representation. This allows users on other instances to click through for a full interactive experience.  
* **JSON-LD Validation:** Strict adherence to JSON-LD syntax and the inclusion of the custom @context are paramount for proper parsing.

## **6\. References**

- [[ACTIVITYPUB](https://www.w3.org/TR/activitypub/)]
: ActivityPub, W3C Recommendation, C. Tallon; et al., 23 January 2018.
- [[AS2-CORE](https://www.w3.org/TR/activitystreams-core/)]
: Activity Streams 2.0, W3C Recommendation, J. Snell; E. Prodromou, 23 May 2017.
- [[AS2-VOCAB](https://www.w3.org/TR/activitystreams-vocabulary/)]
: Activity Vocabulary, W3C Recommendation, J. Snell; E. Prodromou, 23 May 2017.
- [[JSON-LD](https://www.w3.org/TR/json-ld11/)]
: JSON-LD 1.1, W3C Recommendation, G. Kellogg; J. Snell; D. Longley, 16 July 2020.
- [[RFC2119](https://tools.ietf.org/html/rfc2119)]
: Key words for use in RFCs to Indicate Requirement Levels, S. Bradner, March 1997.
- [[RFC8174](https://tools.ietf.org/html/rfc8174)]
: Ambiguity of Uppercase vs Lowercase in RFC 2119 Key Words, B. Leiba, May 2017.
