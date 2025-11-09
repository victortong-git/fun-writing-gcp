## C6 Fun Writing Project Story

## 💡 Inspiration

Driving student to practice English Writing is a pain point. English writing requires students to provide different details, which can often feel like a tedious assignment rather than a creative outlet. This lack of engagement directly impacts the quality and frequency of practice. **Victor's** solution came from the good idea to transform these writing practices into a fun, gamified experience using **Generative AI** to immediately reward effort. By using the student's own words to generate unique **visual media** (images and videos), **Victor** created a powerful, personalized incentiveturning a written assignment into a creative, shareable production.

---

## 🎯 What it does

**C6 Fun Writing** is a gamified web application that converts a student's creative writing into unique, AI-generated images and videos. It manages the entire creative writing process from prompt to portfolio.

1.  **AI-Generated Prompts:** Provides unique, age-appropriate writing prompts across 20 diverse themes tailored to students aged 3-16+.
2.  **Automated Feedback & Scoring:** Submissions are instantly analyzed by the **FeedbackAgent** across **four key dimensions** (Grammar, Spelling, Relevance, Creativity), with scores from 0-25 points each for a total of 0-100.
3.  **Gamified Rewards:** Students earn 3,000 starting AI credits. Image generation costs 100 credits per image with 4 styles (Standard, Comic, Princess, Manga). Video generation costs 500 credits per video with 2 styles (Animation, Cinematic), producing 8-second 720p videos.
4.  **Digital Portfolio:** All stories, feedback, scores, images, and videos are saved to a personal portfolio for easy review and sharing.

---

## 🏗️ How Victor Built It

**Victor** built **C6 Fun Writing** entirely on the **Google Cloud Platform (GCP)** to ensure scalability, cost-efficiency, and rapid deployment.

* **Front to Back:** **Victor** utilized a modern **React/TypeScript** frontend hosted on **GCS/Cloud CDN** and a **Node.js/Express.js** backend running on **Cloud Run** for the main API endpoints.
* **AI Agents & Real-Time Processing:** The core intelligence is a suite of **5 AI Agents** (`ContentSafetyAgent`, `ImageSafetyAgent`, `PromptAgent`, `FeedbackAgent`, `VisualMediaAgent`) deployed as a **Cloud Run HTTP Service** using **Python + Google Agent Development Kit (ADK) + FastAPI**. All agents are accessible via HTTP REST endpoints for real-time, on-demand execution with direct integration into the backend API.
* **Generative AI Models:** **Victor** orchestrates multiple models: **Gemini 2.5 Flash** for text generation (prompts, feedback, visual descriptions, and image safety validation), and **Veo 3.1 Fast Preview** for video generation.
* **Data & Storage:** **Victor** uses **Cloud SQL for PostgreSQL** for secure student data (submissions, scores, credits) and a public **GCS Bucket** (`fun-writing-media-prod`) for storing the final, unique visual outputs.

---


### 🔧 Key Challenges and Solutions in Multi-Modal AI Deployment

**1. Orchestrating Multi-Modal AI Pipelines**  
The media generation workflow follows a multi-step transformation:  
**Text → Visual Prompt → Image → Video**.  
Victors Cloud Run HTTP Service had to ensure that the `VisualMediaAgent` could reliably:

- Invoke **Gemini 2.5 Flash** to generate a creative visual prompt from student input  
- Use **Gemini 2.5 Flash** and **Veo 3.1** for media generation to produce image and video assets  
- Upload results to **Google Cloud Storage (GCS)**  
- Handle API failures and retries with robust error management

This orchestration demanded resilient, fault-tolerant logic to maintain reliability across asynchronous, multi-agent calls.

**2. Real-Time Credit Management**  
Because image and video generation consume user credits, Victor implemented:

- **Atomic credit deduction** before invoking costly generation APIs  
- A **refund mechanism** for failed generations to ensure fairness  
- Real-time validation to prevent race conditions and double charges

This system preserved trust and ensured a smooth user experience.

**3. Safety and Moderation Enforcement**  
To maintain a safe and positive environment, the `SafetyAgent` served as a proactive gatekeeper by:

- Filtering **user submissions** and **AI-generated content** (prompts, feedback, visual descriptions)  
- Enforcing strict moderation against **prohibited topics**  
- Ensuring all outputs aligned with platform safety standards

This layer of protection was essential for fostering a creative, inclusive space for students.

---

## 💡 Accomplishments that Victor is Proud of

**Victor** created a web app which can help student to do more writing and having fun using their writing to generate image and video. Beyond the core feature, **Victor is** proud of:

* **Immediate, Actionable Feedback:** Deploying a working, real-time **4-dimension scoring system** (Grammar, Spelling, Relevance, Creativity) that gives students instant, meaningful guidance on their work with detailed feedback and next steps.
* **Multi-Agent Real-Time Processing:** Architecting **5 autonomous AI agents** (ContentSafetyAgent, ImageSafetyAgent, PromptAgent, FeedbackAgent, VisualMediaAgent) as a unified **Cloud Run HTTP Service** with **Python + Google ADK + FastAPI**, enabling real-time processing with direct HTTP REST endpoints.
* **Full End-to-End Visual Workflow:** Successfully integrating **Gemini 2.5 Flash** and **Veo 3.1 Fast Preview** to deliver multi-modal media generation (4 image styles + 2 video styles) to create unique, compelling, and full-circle creative rewards for students.

---

## 📚 What Victor Learned

**Victor** learned how to use **Google Agent Development Kit (ADK)** to build an efficient, multi-agent AI system. Using ADK with **Python + FastAPI**, **Victor** successfully orchestrated 5 specialized agents that work together in real-time via HTTP REST endpoints. This approach demonstrated a robust pattern for combining multiple generative models (**Gemini 2.5 Flash** and **Veo 3.1**) with external services, enabling complex multi-step workflows (text analysis, prompt generation, safety validation, feedback generation, and media creation) to be consolidated into a single, scalable HTTP service.

---

## 🚀 What's next for C6 Fun Writing - English Writing to Creative Visuals

1.  **Social Media Sharing & Community:** Implement a secure, moderated social function allowing students to easily share their best AI-generated visual media (images/videos) and stories to social platforms and within the C6 community portfolio.
2.  **Age-Group Curriculum Expansion:** Utilize the **PromptAgent** to create a deeper, standardized curriculum aligned with the six age groups, ensuring a progressive increase in writing complexity.

