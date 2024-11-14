from flask import Flask, request, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore
import os
import re
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
        "You will be given two elements/items, you will be crafting them together and outputting the combination of the two along with a single associated emoji or two if it's a complex creation. Avoid using compound names and keep the new item simple. Don't have any spaces between the end of the element name and the emoji. You cannot respond with anything except a combination. Here are some examples:"
        "User input: Stone + Fire; Output: Lava🌋 "
        "User input: Palace + President; Output: White House🏛️"
        "User input: Water + Earth; Output: Mud💩"
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

def get_existing_emoji(result_name):
    """Check if a given result name exists in the database without focusing on the emoji."""
    try:
        elements_ref = db.collection('elements')
        query = elements_ref.where('result', '>=', result_name).where('result', '<=', result_name + '\uf8ff')
        docs = query.stream()

        for doc in docs:
            stored_result = doc.to_dict().get('result')
            # Strip emojis from the stored result for comparison
            stored_result_name = re.sub(r'[^\w\s]', '', stored_result).strip()
            
            if stored_result_name == result_name:
                return stored_result  # Return the result with the existing emoji
        
        return None  # No matching result found in the database
    
    except Exception as e:
        print(f"Error searching for existing emoji: {e}")
        return None

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

def generate_element_combination(element1, element2):
    prompt = f"{element1} {element2}"
    response = example_model.generate_content(
        contents=[prompt],
        generation_config=generation_config,
        safety_settings=safety_settings,
    )
    result = response.text.strip()
    
    # Remove emojis from AI result to check if it already exists
    result_name_only = re.sub(r'[^\w\s]', '', result).strip()
    existing_result_with_emoji = get_existing_emoji(result_name_only)
    
    # If an existing result with the desired name is found, use its emoji; otherwise, use the AI result
    if existing_result_with_emoji:
        final_result = existing_result_with_emoji
        print(f"Existing result found for {result_name_only}, using stored result with emoji: {final_result}")
    else:
        final_result = result
        print(f"New combination generated: {final_result}")
    
    add_element_combination(element1, element2, final_result)
    return final_result

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
