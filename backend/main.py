import asyncio
import json
import time
import redis
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

# IMPORT YOUR AGENTS
# Ensure agents.py is in the same folder as this file!
from agents import retriever, analyzer, writer

# 1. SETUP
app = FastAPI()

# Enable CORS (Allows your React Frontend to talk to this Backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. CONNECT TO REDIS CLOUD
# I have added your specific credentials below
r = redis.Redis(
  host='redis-10149.c99.us-east-1-4.ec2.cloud.redislabs.com',
  port=10149,
  password='Ncm2pyVnsEzt7g4xrMLggHQ4p82EDMRY',
  decode_responses=True
)

# 3. GLOBAL VARIABLES FOR BATCHING
batch_buffer = []

# 4. HELPER: SAFE AGENT RUNNER
async def run_agent_safe(agent_instance, input_data):
    """
    Wrapper to run an agent with RETRY LOGIC.
    (Requirement: Failure Handling)
    """
    max_retries = 3
    for attempt in range(max_retries):
        try:
            # Call the agent instance imported from agents.py
            result = await agent_instance.process(input_data)
            return result
        except Exception as e:
            print(f"⚠️ {agent_instance.name} failed (Attempt {attempt+1}/{max_retries}). Retrying...")
            await asyncio.sleep(1) # Wait before retry
    
    return f"Error: {agent_instance.name} failed after {max_retries} retries."

# 5. THE ORCHESTRATOR (The Manager)
async def process_batch():
    """
    Runs in background. Checks the buffer and processes tasks.
    (Requirement: Manual Batching logic)
    """
    print("Orchestrator: Started and watching for tasks...")
    while True:
        if batch_buffer:
            # Take all tasks currently in the waiting room
            current_batch = batch_buffer[:]
            batch_buffer.clear()
            
            print(f"📦 Processing batch of {len(current_batch)} tasks...")
            
            # Process each task in the batch
            for task in current_batch:
                task_id = task['id']
                description = task['description']
                
                # --- STEP 1: RETRIEVER ---
                r.publish(task_id, json.dumps({"status": "log", "message": "Retriever: Searching for information..."}))
                step1_result = await run_agent_safe(retriever, description)
                
                # --- STEP 2: ANALYZER ---
                r.publish(task_id, json.dumps({"status": "log", "message": f"Analyzer: Reading data..."}))
                step2_result = await run_agent_safe(analyzer, step1_result)
                
                # --- STEP 3: WRITER ---
                r.publish(task_id, json.dumps({"status": "log", "message": "Writer: Drafting final report..."}))
                final_result = await run_agent_safe(writer, step2_result)
                
                # --- DONE ---
                r.publish(task_id, json.dumps({"status": "result", "result": final_result}))
                
        # Wait a bit to let tasks accumulate (Manual Batching)
        await asyncio.sleep(3) 

# Start the background orchestrator when app starts
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(process_batch())

# 6. API ENDPOINTS
@app.post("/submit-task")
async def submit_task(request: Request):
    data = await request.json()
    task_id = str(int(time.time())) # Simple unique ID
    
    # Add to the "Waiting Room" (Batch Buffer)
    batch_buffer.append({"id": task_id, "description": data['task_description']})
    
    return {"status": "queued", "task_id": task_id}

@app.get("/stream/{task_id}")
async def stream(task_id: str):
    """
    Streams updates to the frontend using Server-Sent Events (SSE).
    """
    def event_generator():
        pubsub = r.pubsub()
        pubsub.subscribe(task_id)
        
        # Listen to Redis for messages specifically for this task_id
        for message in pubsub.listen():
            if message['type'] == 'message':
                yield f"data: {message['data']}\n\n"
                
                data_json = json.loads(message['data'])
                if data_json.get("status") == "result":
                    break

    return StreamingResponse(event_generator(), media_type="text/event-stream")