from flask import Flask, request, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore
import os
import vertexai
from vertexai.generative_models import (
    GenerationConfig,
    GenerativeModel,
    HarmBlockThreshold,
    HarmCategory,
)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # This enables CORS support

# Initialize the Firebase Admin SDK
cred = credentials.Certificate('cred.json')
firebase_admin.initialize_app(cred)

# Create a Firestore client
db = firestore.client()

# Google Cloud configuration for Vertex AI
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "backend/ai-creds.json"
PROJECT_ID = "homework4-440015"
LOCATION = os.environ.get("GOOGLE_CLOUD_REGION", "us-central1")
vertexai.init(project=PROJECT_ID, location=LOCATION)

# Initialize the generative model
MODEL_ID = "gemini-1.5-flash-002"
example_model = GenerativeModel(
    MODEL_ID,
    system_instruction=[
    """You will be given two elements/items to combine into a single creation. Follow these rules:

    The name of the new creation can consist of one or more words, with spaces allowed only between words in the name.
    Do not place a space between the last word of the name and the emoji.
    The combination must be logical and realistic based on the input elements/items. Avoid nonsensical or overly complicated names.
    Use exactly one emoji that exists to represent the new creation. No more, no less.
    The output format must strictly follow this pattern:
    [New Creation Name][Emoji]
    (There must be no spaces between the last word of the name and the emoji.)
    You are not allowed to respond with anything other than the formatted combination.

    Examples:

        Input: Stone🪨 + Fire🔥
        Output: Lava🌋
        Input: Palace🏰 + President👨‍💼
        Output: White House🏛️
        Input: Water💧 + Earth🌎
        Output: Mud💩
        Input: Metal⚙️ + Heat🔥
        Output: Molten Steel🩸
        Input: Snowflake❄️ + Wind💨
        Output: Blizzard🌨️

    Important: Adhere to these rules exactly. Respond only with the combination."""
    ],
)

# Set model parameters
generation_config = GenerationConfig(
    temperature=0.9,
    top_p=1.0,
    top_k=32,
    candidate_count=1,
    max_output_tokens=15,
)

# Set safety settings
safety_settings = {
    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_ONLY_HIGH,
}

# Handle CORS preflight requests
@app.before_request
def handle_options():
    if request.method == "OPTIONS":
        headers = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "3600",
        }
        return "", 204, headers

def add_element_combination(element1, element2, result):
    try:
        combination_data = {
            'element1': element1,
            'element2': element2,
            'result': result
        }
        combination_id = f"{element1}_{element2}"
        db.collection('elements').document(combination_id).set(combination_data)
        print(f"Combination {element1} + {element2} = {result} added successfully.")
    except Exception as e:
        print(f"Error adding combination: {e}")

def get_element_combination(element1, element2):
    try:
        combination_id = f"{element1}_{element2}"
        combination_ref = db.collection('elements').document(combination_id)
        combination_doc = combination_ref.get()
        
        if combination_doc.exists:
            return combination_doc.to_dict()
        
        combination_id_reversed = f"{element2}_{element1}"
        combination_ref_reversed = db.collection('elements').document(combination_id_reversed)
        combination_doc_reversed = combination_ref_reversed.get()
        
        if combination_doc_reversed.exists:
            return combination_doc_reversed.to_dict()
        
        print(f"Combination {element1} + {element2} not found.")
        return None
    
    except Exception as e:
        print(f"Error retrieving combination: {e}")
        return None

def clean_result(result):
    """Removes a space before the last character (if it's an emoji) from the AI-generated result."""
    if len(result) > 1 and result[-2] == " ":
        result = result[:-2] + result[-1]
    return result

def generate_element_combination(element1, element2):
    prompt = f"{element1} {element2}"
    response = example_model.generate_content(
        contents=[prompt],
        generation_config=generation_config,
        safety_settings=safety_settings,
    )
    result = response.text.strip()
    result = clean_result(result)  # Clean the result before saving or returning
    add_element_combination(element1, element2, result)
    return result

@app.route('/get_combination', methods=['GET'])
def get_combination():
    element1 = request.args.get('element1')
    element2 = request.args.get('element2')
    
    if not all([element1, element2]):
        return jsonify({"error": "Missing element1 or element2"}), 400
    
    combination_data = get_element_combination(element1, element2)
    
    if combination_data:
        response = jsonify(combination_data)
    else:
        ai_generated_result = generate_element_combination(element1, element2)
        response = jsonify({"element1": element1, "element2": element2, "result": ai_generated_result})
    
    # Set CORS header in the response
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response

if __name__ == '__main__':
    app.run(debug=True)
