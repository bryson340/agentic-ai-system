# 🤖 Agentic AI Orchestrator

![Python](https://img.shields.io/badge/Python-3.10%2B-blue)
![React](https://img.shields.io/badge/Frontend-React-61DAFB)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688)
![Status](https://img.shields.io/badge/Status-Completed-success)

## 📖 Project Overview
This is an autonomous **Agentic AI System** capable of breaking down complex user tasks into multi-step workflows. It uses an **Event-Driven Architecture** to coordinate specialized agents (Retriever, Analyzer, Writer) that collaborate asynchronously to generate professional mission reports.

**Key Features:**
- **🧠 Hybrid AI Engine:** Uses a "Smart Fallback" system that attempts to use **Google Gemini 2.0 Flash** for high-level reasoning but automatically degrades to a deterministic simulation if API quotas are exceeded.
- **⚡ Real-Time Streaming:** Implements **Server-Sent Events (SSE)** to stream agent "thoughts" and logs to the frontend in real-time.
- **🛡️ Resilience:** Includes a custom **Retry Mechanism** (3x attempts) and Circuit Breaker logic to ensure 100% uptime.
- **🚦 Manual Batching:** Custom buffering logic in the backend (`process_batch`) optimizes throughput by grouping requests.

---

## 🏗️ Architecture
The system follows a distributed micro-architecture pattern:

```mermaid
graph LR
    User -->|Task| API[FastAPI Orchestrator]
    API -->|Queue| Buffer[Batch Manager]
    Buffer -->|Async| Agents[Agent Swarm]
    Agents -->|Step 1| Retriever
    Agents -->|Step 2| Analyzer
    Agents -->|Step 3| Writer
    Writer -->|Final Report| User