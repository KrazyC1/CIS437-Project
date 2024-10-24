from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/submit-score', methods=['POST'])
def submit_score():
    # Get the JSON data from the request
    data = request.get_json()
    if 'score' in data:
        score = data['score']
        # Print the score to the console
        print(f"Received score: {score}")
        return jsonify({"message": "Score received successfully", "score": score}), 200
    else:
        return jsonify({"error": "No score provided"}), 400

if __name__ == '__main__':
    # Run the Flask server
    app.run(debug=True, host='0.0.0.0', port=5000)
