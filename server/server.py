from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import logging

from indi_controller import IndiTelescopeController  # Fix import: it was 'IndiController' before, assuming typo

app = Flask(__name__)
CORS(app)

# Initialize and connect the INDI telescope controller
controller = IndiTelescopeController()
try:
    controller.connect()
except Exception as e:
    logging.error(f"Failed to connect to INDI server: {e}")
    # Optionally, handle this more gracefully or exit

@app.route("/")
def home():
    return jsonify({"message": "Telescope control server is running"}), 200

@app.route("/move/<direction>", methods=["POST"])
def move(direction):
    try:
        # Assuming a default rate; you could accept a JSON param for rate if you want
        default_rate = 1.0
        result = controller.move(direction, default_rate)
        return jsonify({"status": "success", "result": result})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route("/slew", methods=["POST"])
def slew():
    try:
        data = request.get_json()
        ra = float(data["ra"])
        dec = float(data["dec"])
        controller.slew_to(ra, dec)
        return jsonify({"status": "success", "message": "Slew command sent"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route("/abort", methods=["POST"])
def abort():
    try:
        controller.abort_slew()
        return jsonify({"status": "success", "message": "Slew aborted"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route("/sync", methods=["POST"])
def sync():
    try:
        data = request.get_json()
        ra = float(data["ra"])
        dec = float(data["dec"])
        controller.sync_to(ra, dec)
        return jsonify({"status": "success", "message": "Telescope synced"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route("/park", methods=["POST"])
def park():
    try:
        controller.park()
        return jsonify({"status": "success", "message": "Telescope parked"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route("/unpark", methods=["POST"])
def unpark():
    try:
        controller.unpark()
        return jsonify({"status": "success", "message": "Telescope unparked"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route("/position", methods=["GET"])
def position():
    try:
        pos = controller.get_current_position()
        return jsonify({"status": "success", "position": pos})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route("/info", methods=["GET"])
def info():
    try:
        info = controller.get_info()
        return jsonify({"status": "success", "info": info})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route("/align", methods=["POST"])
def align():
    try:
        # Your IndiController.align() takes no params
        result = controller.align()
        return jsonify({"status": "success", "result": result})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route("/set_time", methods=["POST"])
def set_time():
    try:
        data = request.get_json()
        utc_str = data["utc"]
        utc_datetime = datetime.strptime(utc_str, "%Y-%m-%dT%H:%M:%S")
        controller.set_time(utc_datetime)
        return jsonify({"status": "success", "message": "Time set"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=7123)
