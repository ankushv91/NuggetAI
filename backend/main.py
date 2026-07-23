import os
import json
import logging
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import httpx
try:
    from dotenv import load_dotenv
except ImportError:
    def load_dotenv(*args, **kwargs):
        pass

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("nugget_ai_backend")

# Load environment variables
from pathlib import Path
# Load .env from the workspace root (project root directory)
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)
load_dotenv()  # fallback to default location if needed

app = FastAPI(
    title="NuggetAI API",
    description="Knowledge, One Nugget at a Time backend API",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ModuleRequest(BaseModel):
    topic: str = Field(..., description="The subject topic to learn", min_length=2, max_length=100)
    difficulty: str = Field(..., description="Difficulty level: Beginner, Intermediate, or Advanced")

def generate_mock_module(topic: str, difficulty: str):
    logger.info(f"Generating mock module for topic: '{topic}' [Difficulty: {difficulty}]")
    return {
        "topic": topic,
        "difficulty": difficulty,
        "study_points": [
            {
                "id": 1,
                "title": f"Core Foundations of {topic}",
                "detail": f"Understanding the basic building blocks of {topic} is essential for mastery.\n\nAt a {difficulty} level, focus on how these elements connect to form stable systems. The core mechanics center around coordination and maintaining consistency under standard workloads."
            },
            {
                "id": 2,
                "title": f"Key Mechanics & {difficulty} Concepts",
                "detail": f"When implementing {topic}, architectural choices become critical.\n\nKey areas to analyze include latency constraints, data integrity, and error boundaries. Proper configuration helps avoid bottlenecks and guarantees smooth operation."
            },
            {
                "id": 3,
                "title": f"Best Practices & Common Pitfalls",
                "detail": f"Modern projects leverage automated validation alongside continuous testing.\n\nKeep external dependencies minimal, implement detailed system monitoring, and clearly document structural interfaces to prevent integration friction."
            }
        ],
        "quiz": [
            {
                "id": 1,
                "question": f"Which of the following is considered a core objective when first setting up {topic}?",
                "options": [
                    "Bypassing standard validation parameters",
                    "Coordinating components to maintain system stability",
                    "Maximizing raw memory allocation without limits",
                    "Hardcoding environmental variables and keys"
                ],
                "correct_index": 1,
                "explanation": f"The primary goal of {topic} is components coordination and ensuring system stability under workload."
            },
            {
                "id": 2,
                "question": f"When configuring {topic} for a {difficulty} workload, which aspects are critical?",
                "options": [
                    "Reducing overall code test coverage",
                    "Scaling parameters, checking latency, and handling error boundaries",
                    "Increasing global variables and coupling",
                    "Deprecating user-facing APIs without version control"
                ],
                "correct_index": 1,
                "explanation": f"Properly configuring {topic} at the {difficulty} level requires checking scaling parameters, monitoring latency, and establishing clear error boundaries."
            },
            {
                "id": 3,
                "question": f"What is a recommended best practice when integrating {topic} into a software stack?",
                "options": [
                    "Disabling all system logger interfaces",
                    "Documenting design choices and maintaining tests",
                    "Avoiding unit and integration validation suites",
                    "Using outdated dependency packages without updates"
                ],
                "correct_index": 1,
                "explanation": f"Best practices for {topic} integration include maintaining detailed architecture documentation and keeping tests up to date."
            }
        ]
    }

@app.get("/api/health")
def health_check():
    api_key = os.getenv("AI_API_KEY")
    is_configured = bool(api_key and api_key != "YOUR_GEMINI_API_KEY_HERE")
    return {"status": "ok", "api_key_configured": is_configured}

@app.post("/api/generate-module")
async def generate_module(request: ModuleRequest):
    # Capitalize first letter of difficulty for consistency
    difficulty = request.difficulty.capitalize()
    if difficulty not in ["Beginner", "Intermediate", "Advanced"]:
        difficulty = "Beginner"

    api_key = os.getenv("AI_API_KEY")
    if not api_key or api_key == "YOUR_GEMINI_API_KEY_HERE":
        logger.warning("AI_API_KEY is not configured or is template placeholder. Serving mock module.")
        return generate_mock_module(request.topic, difficulty)

    # Construct the instruction prompt for Gemini
    prompt = f"""You are NuggetAI's learning engine. Generate an interactive 3-point study guide and a 3-question quiz for the topic "{request.topic}" at a "{difficulty}" level.

You must return strictly valid JSON matching this schema:
{{
  "topic": "{request.topic}",
  "difficulty": "{difficulty}",
  "study_points": [
    {{ "id": 1, "title": "String (First key concept)", "detail": "String (Concise detail explaining this concept)" }},
    {{ "id": 2, "title": "String (Second key concept)", "detail": "String (Concise detail explaining this concept)" }},
    {{ "id": 3, "title": "String (Third key concept)", "detail": "String (Concise detail explaining this concept)" }}
  ],
  "quiz": [
    {{
      "id": 1,
      "question": "String (Question testing Point 1 or general topic knowledge)",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_index": 0,
      "explanation": "String (Helpful brief explanation of why this option is correct and why others are wrong)"
    }},
    {{
      "id": 2,
      "question": "String (Question testing Point 2 or general topic knowledge)",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_index": 1,
      "explanation": "String (Helpful brief explanation)"
    }},
    {{
      "id": 3,
      "question": "String (Question testing Point 3 or general topic knowledge)",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_index": 2,
      "explanation": "String (Helpful brief explanation)"
    }}
  ]
}}

Formatting Guidelines:
1. Return ONLY the JSON object. Do not include markdown codeblocks (like ```json ... ```) or any other text before/after the JSON.
2. The values of correct_index must be an integer from 0 to 3 corresponding to the correct answer in the options array.
3. Ensure there are exactly 3 study points and exactly 3 quiz questions.
4. Customize the difficulty level: if Beginner, explain concepts simply; if Advanced, use deep technical details.
"""

    # Call Gemini API
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }

    logger.info(f"Generating module for topic: '{request.topic}' [Difficulty: {difficulty}]")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload, headers=headers)
            
            if response.status_code != 200:
                logger.error(f"Gemini API returned status code {response.status_code}: {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Error from learning service (status {response.status_code}). Please try again."
                )
            
            data = response.json()
            
            # Extract content from response structure
            try:
                candidate = data["candidates"][0]
                text = candidate["content"]["parts"][0]["text"]
            except (KeyError, IndexError) as err:
                logger.error(f"Failed to parse Gemini response structure: {err}. Raw response: {data}")
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Invalid response format from learning service."
                )
            
            # Parse response text as JSON
            try:
                module_json = json.loads(text.strip())
            except json.JSONDecodeError as err:
                logger.error(f"Failed to decode response text as JSON: {err}. Response text: {text}")
                # Sometimes models output backticks despite responseMimeType
                try:
                    # Strip markdown blocks if any
                    clean_text = text.strip()
                    if clean_text.startswith("```"):
                        clean_text = clean_text.split("```")[1]
                        if clean_text.startswith("json"):
                            clean_text = clean_text[4:]
                        clean_text = clean_text.split("```")[0]
                    module_json = json.loads(clean_text.strip())
                except Exception:
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail="Failed to parse structured JSON from learning engine."
                    )
            
            # Basic validation of keys
            required_keys = ["topic", "difficulty", "study_points", "quiz"]
            if not all(k in module_json for k in required_keys):
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Learning engine response is missing required data structure keys."
                )
                
            return module_json
            
    except httpx.RequestError as err:
        logger.error(f"HTTP request error calling Gemini API: {err}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Network error communicating with learning service. Please try again."
        )
    except Exception as err:
        logger.error(f"Unexpected error: {err}")
        if isinstance(err, HTTPException):
            raise err
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected server error occurred: {str(err)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
