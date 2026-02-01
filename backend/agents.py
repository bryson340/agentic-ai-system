import asyncio
import urllib.parse
import google.generativeai as genai
import os
from dotenv import load_dotenv # You might need to install this: pip install python-dotenv

# Load environment variables
load_dotenv()

# ==========================================
# 🔐 SECURE CONFIGURATION
# We fetch the key securely from the hidden .env file
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# Set to FALSE to use Real AI!
MOCK_MODE = False
# ==========================================

if not MOCK_MODE:
    genai.configure(api_key=GOOGLE_API_KEY)

class Agent:
    def __init__(self, name, role):
        self.name = name
        self.role = role

    # --- HELPER: Smart Simulator (Backup) ---
    def get_smart_simulation(self, input_data):
        clean_input = input_data.strip()
        try:
            if "'" in clean_input:
                topic = clean_input.split("'")[1]
            else:
                topic = clean_input.split(":")[0] if ":" in clean_input else clean_input
        except:
            topic = "Mission Report"

        if self.name == "Analyzer":
            return (
                f"Analysis of '{topic}':\n"
                f"• Trend 1: Global adoption of {topic} is accelerating (+40% YoY).\n"
                f"• Trend 2: Cost efficiency is the primary driver for corporate integration.\n"
                f"• Trend 3: Regulatory frameworks are currently being drafted in the EU/US."
            )
        elif self.name == "Writer":
            query_encoded = urllib.parse.quote(topic)
            return (
                f"📢 **EXECUTIVE SUMMARY: {topic.upper()}**\n\n"
                "### 🚀 Key Insights\n"
                f"• **Market Position:** {topic} has moved from theoretical research to practical application.\n"
                f"• **Economic Impact:** Early adopters report significant ROI through automation.\n"
                "• **Risk:** Data privacy remains the primary bottleneck for scaling.\n\n"
                "### ⚡ Strategic Actions\n"
                "1. **Pilot:** Launch a low-risk internal pilot program immediately.\n"
                "2. **Talent:** Upskill current workforce rather than hiring new specialists.\n\n"
                "### 🔗 References\n"
                f"• Google Search: https://www.google.com/search?q={query_encoded}\n"
                f"• Wikipedia: https://en.wikipedia.org/wiki/Special:Search?search={query_encoded}"
            )
        return f"Processed: {input_data}"

    async def process(self, input_data):
        print(f"🤖 [{self.name}] is processing...") 

        # --- 1. RETRIEVER (Always Manual) ---
        if self.name == "Retriever":
            await asyncio.sleep(1) 
            clean_input = input_data.strip()
            return clean_input

        # --- 2. REAL AI AGENTS (With Retry Logic) ---
        if not MOCK_MODE:
            # RETRY LOGIC: Try 3 times before failing
            for attempt in range(3):
                try:
                    model = genai.GenerativeModel('gemini-flash-latest')
                    
                    if self.name == "Analyzer":
                        prompt = (
                            f"You are a Data Analyst. Topic: {input_data}. "
                            f"Start your response EXACTLY with 'Analysis of {input_data}:'. "
                            "Then provide 3 short, punchy bullet points on key trends."
                        )
                        response = model.generate_content(prompt)
                        return response.text

                    elif self.name == "Writer":
                        # Extraction Logic
                        try:
                            if "Analysis of" in input_data:
                                temp = input_data.split("Analysis of")[1]
                                topic = temp.split(":")[0].strip()
                            else:
                                topic = input_data[:50].strip()
                        except: 
                            topic = "Mission Report"

                        query_encoded = urllib.parse.quote(topic)
                        links_section = (
                            "\n\n### 🔗 References\n"
                            f"• Google Search: https://www.google.com/search?q={query_encoded}\n"
                            f"• Wikipedia: https://en.wikipedia.org/wiki/Special:Search?search={query_encoded}"
                        )

                        prompt = (
                            f"You are a Chief of Staff. Summarize these analytics: {input_data}. "
                            "Write a VERY SHORT Executive Summary (max 100 words). "
                            "Use two headers: '### 🚀 Key Insights' and '### ⚡ Strategic Actions'. "
                            "Use bullet points. Be professional."
                        )
                        
                        response = model.generate_content(prompt)
                        return response.text + links_section
                
                except Exception as e:
                    print(f"⚠️ Attempt {attempt+1}/3 failed: {e}")
                    if attempt == 2: # If it was the last attempt
                        print("⚠️ Max retries reached. Switching to Fallback...")
                        await asyncio.sleep(1)
                        return self.get_smart_simulation(input_data)
                    await asyncio.sleep(1) # Wait before retrying

        # --- MANUAL MODE ---
        else:
            await asyncio.sleep(1)
            return self.get_smart_simulation(input_data)

# Instantiate your agents
retriever = Agent("Retriever", "Find documents")
analyzer = Agent("Analyzer", "Analyze trends")
writer = Agent("Writer", "Write report")