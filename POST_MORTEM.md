# Project Post-Mortem

## 1. Scaling Issue Encountered: Global State Management
**The Issue:**
Initially, the "Manual Batching" logic relied on a simple Python list (`batch_buffer = []`) stored in the global scope of the application memory. While this worked for a single development server, it presented a critical scaling flaw: if we deployed this application across multiple worker nodes (e.g., using Kubernetes), the memory would not be shared. A task sent to Node A could not be batched with a task sent to Node B.

**The Resolution:**
To fix this in a production environment, we would move the state management to **Redis**. Using a Redis List as an external "Source of Truth" allows multiple server instances to push/pull tasks from the same shared queue, enabling horizontal scaling without data loss.

## 2. Design Decision Change: Polling vs. Streaming
**The Pivot:**
Our initial design proposed having the frontend "poll" the server every 1 second (`setInterval`) to check for task updates.
**Why we changed it:**
Polling creates unnecessary network chatter and server load, especially when agents are "thinking" for long periods. We switched to **Server-Sent Events (SSE)**. This allows the backend to hold a single connection open and "push" updates only when they happen. This reduced network requests by approximately 90% during idle times and provided a snappier "real-time" feel for the user.

## 3. Trade-offs: Latency vs. Throughput
**The Batching Dilemma:**
We implemented a strict "Manual Batching" window of 3 seconds.
-   **The Trade-off:** We sacrificed **Latency** (the user has to wait up to 3 seconds before processing even starts) in exchange for **Throughput** (the system can handle bursts of traffic more efficiently by processing tasks in groups).
-   **Justification:** In a real-world agentic system, API costs and rate limits (e.g., Google Gemini quotas) are the bottleneck. Batching calls allows us to optimize token usage and stay within rate limits, which is worth the small initial delay for the user.