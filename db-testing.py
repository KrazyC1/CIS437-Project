import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

# Initialize the Firebase Admin SDK
cred = credentials.Certificate('cred.json')  # Replace with your actual path
firebase_admin.initialize_app(cred)

# Create a Firestore client
db = firestore.client()

# Define a function to add a new element combination
def add_element_combination(element1, element2, result):
    """Adds a new element combination to the 'elements' collection in Firestore.

    Args:
        element1 (str): The first element in the combination.
        element2 (str): The second element in the combination.
        result (str): The result of combining the two elements.
    """
    try:
        combination_data = {
            'element1': element1,
            'element2': element2,
            'result': result
        }
        # Create a unique ID for this combination, e.g., based on element names
        combination_id = f"{element1}_{element2}"
        db.collection('elements').document(combination_id).set(combination_data)
        print(f"Combination {element1} + {element2} = {result} added successfully.")
    except Exception as e:
        print(f"Error adding combination: {e}")

# Define a function to retrieve an element combination by the elements
def get_element_combination(element1, element2):
    """Retrieves an element combination from the 'elements' collection by elements.

    Args:
        element1 (str): The first element in the combination.
        element2 (str): The second element in the combination.

    Returns:
        dict: A dictionary containing the combination data, or None if not found.
    """
    try:
        combination_id = f"{element1}_{element2}"
        combination_ref = db.collection('elements').document(combination_id)
        combination_doc = combination_ref.get()
        if combination_doc.exists:
            return combination_doc.to_dict()
        else:
            print(f"Combination {element1} + {element2} not found.")
            return None
    except Exception as e:
        print(f"Error retrieving combination: {e}")
        return None

# Example usage:
# Add a new element combination
add_element_combination("Mud💩", "Fire🔥", "Brick🧱")

# Retrieve an element combination by elements
combination_data = get_element_combination("Mud💩", "Fire🔥")
if combination_data:
    print(f"Combination data: {combination_data}")
