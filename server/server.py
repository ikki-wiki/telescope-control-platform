from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import logging
from indi_controller import IndiTelescopeController

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.DEBUG)

# Initialize and connect the INDI telescope controller
controller = IndiTelescopeController(host="localhost", port=7624)

try:
    controller.connect()
except Exception as e:
    logging.error(f"Failed to connect to INDI server: {e}")
    # Optionally, handle this more gracefully or exit


def hms_to_hours(hms):
    h, m, s = map(float, hms.strip().split(':'))
    return h + m/60 + s/3600

def dms_to_degrees(dms):
    sign = -1 if dms.strip().startswith('-') else 1
    dms = dms.strip().lstrip('+-')
    d, m, s = map(float, dms.split(':'))
    return sign * (d + m/60 + s/3600)

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Telescope control server is running"}), 200

@app.route("/api/move/<direction>", methods=["POST"])
def move(direction):
    try:
        # Assuming a default rate; you could accept a JSON param for rate if you want
        default_rate = 1.0
        result = controller.move(direction, default_rate)
        return jsonify({"status": "success", "result": result})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route("/api/slew", methods=["POST"])
def slew():
    try:
        data = request.get_json()
        ra = float(data["ra"])
        dec = float(data["dec"])
        controller.slew_to(ra, dec)
        return jsonify({"status": "success", "message": "Slew command sent"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route("/api/abort", methods=["POST"])
def abort():
    try:
        controller.abort_slew()
        return jsonify({"status": "success", "message": "Slew aborted"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route("/api/sync", methods=["POST"])
def sync():
    try:
        data = request.get_json()
        ra = float(data["ra"])
        dec = float(data["dec"])
        controller.sync_to(ra, dec)
        return jsonify({"status": "success", "message": "Telescope synced"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route("/api/park", methods=["POST"])
def park():
    try:
        controller.park()
        return jsonify({"status": "success", "message": "Telescope parked"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route("/api/unpark", methods=["POST"])
def unpark():
    try:
        controller.unpark()
        return jsonify({"status": "success", "message": "Telescope unparked"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route("/api/position", methods=["GET"])
def position():
    try:
        pos = controller.get_current_position()
        return jsonify({"status": "success", "position": pos})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route("/api/info", methods=["GET"])
def info():
    try:
        info = controller.get_info()
        return jsonify({"status": "success", "info": info})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route("/api/align", methods=["POST"])
def align():
    try:
        # Your IndiController.align() takes no params
        result = controller.align()
        return jsonify({"status": "success", "result": result})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route("/api/set_time", methods=["POST"])
def set_time():
    try:
        data = request.get_json()
        utc_str = data["utc"]
        utc_datetime = datetime.strptime(utc_str, "%Y-%m-%dT%H:%M:%S")
        controller.set_time(utc_datetime)
        return jsonify({"status": "success", "message": "Time set"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route('/api/coordinates', methods=['POST'])
def slew_to_coordinates():
    data = request.json
    ra_str = data.get("ra")
    dec_str = data.get("dec")

    try:
        ra = hms_to_hours(ra_str)
        dec = dms_to_degrees(dec_str)
        print(f"[DEBUG] Slewing to RA={ra}, Dec={dec}")
        controller.slew_to(ra, dec)
        return jsonify({'message': 'Slew command sent', 'status': 'success'})
    except Exception as e:
        return jsonify({'message': str(e), 'status': 'error'})



if __name__ == "__main__":
    app.run(host="0.0.0.0", port=7123)
