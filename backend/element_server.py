from flask import Flask, request, jsonify
from flask_cors import CORS  # Import CORS
import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for the entire app

# Initialize the Firebase Admin SDK
cred = credentials.Certificate('cred.json')  # Replace with your actual path
firebase_admin.initialize_app(cred)

# Create a Firestore client
db = firestore.client()

# Define a function to add a new element combination
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

# Define a function to retrieve an element combination by the elements
def get_element_combination(element1, element2):
    """Tries to retrieve a combination in any order."""
    try:
        # First check with the elements in the given order
        combination_id = f"{element1}_{element2}"
        combination_ref = db.collection('elements').document(combination_id)
        combination_doc = combination_ref.get()
        
        if combination_doc.exists:
            return combination_doc.to_dict()
        
        # If not found, check with the elements swapped
        combination_id_reversed = f"{element2}_{element1}"
        combination_ref_reversed = db.collection('elements').document(combination_id_reversed)
        combination_doc_reversed = combination_ref_reversed.get()
        
        if combination_doc_reversed.exists:
            return combination_doc_reversed.to_dict()
        
        # If neither combination exists, print a message and return None
        print(f"Combination {element1} + {element2} not found in either order.")
        return None
    
    except Exception as e:
        print(f"Error retrieving combination: {e}")
        return None

# Route to add a new combination
@app.route('/add_combination', methods=['POST'])
def add_combination():
    data = request.get_json()
    element1 = data.get('element1')
    element2 = data.get('element2')
    result = data.get('result')
    
    if not all([element1, element2, result]):
        return jsonify({"error": "Missing element1, element2, or result"}), 400
    
    add_element_combination(element1, element2, result)
    return jsonify({"message": f"Combination {element1} + {element2} = {result} added successfully."})

# Route to get an existing combination
@app.route('/get_combination', methods=['GET'])
def get_combination():
    element1 = request.args.get('element1')
    element2 = request.args.get('element2')
    
    if not all([element1, element2]):
        return jsonify({"error": "Missing element1 or element2"}), 400
    
    combination_data = get_element_combination(element1, element2)
    if combination_data:
        return jsonify(combination_data)
    else:
        return jsonify({"message": f"No combination found for {element1} + {element2}"}), 404

# Run the Flask app
if __name__ == '__main__':
    app.run(debug=True)
