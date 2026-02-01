# System Design Document: Agentic AI Orchestrator

## 1. System Overview
The Agentic AI Orchestrator is an asynchronous, event-driven system designed to decompose complex user queries into sub-tasks and execute them using specialized agents. The system prioritizes modularity, fault tolerance, and real-time user feedback.

## 2. Architecture Diagram

```mermaid
graph TD
    User[User Frontend (React)] -->|HTTP POST /submit-task| API[FastAPI Backend]
    API -->|Push Task| Buffer[Manual Batching Buffer]
    
    subgraph "Async Orchestration Loop"
        Buffer -->|Batch Release (3s)| Agents[Agent Manager]
        Agents -->|Step 1| Retriever[Retriever Agent]
        Retriever -->|Raw Data| Analyzer[Analyzer Agent]
        Analyzer -->|Insights| Writer[Writer Agent]
        Writer -->|Final Report| Result[Final Output]
    end
    
    Agents -.->|Real-time Logs (SSE)| User
    Result -.->|JSON Response| User
```

## 3. Core Components

### A. Frontend (React.js)
- **Role:** capturing user intent and visualizing the agent's "thought process."
- **Communication:**
  - `POST /submit-task`: Sends the initial directive.
  - `EventSource API`: Establishes a one-way streaming connection to receive live logs and results.
- **Visuals:** Uses a cyberpunk-themed UI with real-time terminal logging to indicate system activity.

### B. Backend Orchestrator (FastAPI)
- **Role:** Manages the lifecycle of a task from reception to completion.
- **Batching Strategy:** Implements a "Manual Batching" mechanism. Incoming requests are buffered in memory and processed in groups every 3 seconds. This reduces overhead on the inference engine and allows for future rate-limiting optimizations.

### C. The Agentic Layer (Google Gemini 2.0 Flash)
- **Design Pattern:** The system uses a **Sequential Chain** pattern where the output of one agent becomes the context for the next.
  1.  **Retriever:** Fetches raw context (simulated or real).
  2.  **Analyzer:** Extracts structured insights from the context.
  3.  **Writer:** Formats the insights into a human-readable executive summary.
- **Resilience:** Each agent call is wrapped in a **Retry Mechanism** (3 attempts) with exponential backoff to handle transient API failures (e.g., Error 429 or 503).

### D. Data Flow
1.  **Input:** User submits "Analyze the Future of AI."
2.  **Orchestration:** Task is queued. The batch processor picks it up.
3.  **Execution:** Agents process the data sequentially.
4.  **Streaming:** Intermediate logs ("Analyzer is thinking...") are pushed to the frontend via SSE.
5.  **Termination:** The final report is delivered, and the connection is closed.