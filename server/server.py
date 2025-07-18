from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import logging
from indi_controller import IndiTelescopeController

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.DEBUG)

controller = IndiTelescopeController(host="localhost", port=7624, device_name="LX200 Autostar")

try:
    controller.connect()
except Exception as e:
    logging.error(f"Failed to connect to INDI server: {e}")

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

@app.route("/api/time", methods=["GET"])
def get_time():
    try:
        current_time = controller.get_telescope_time()
        return jsonify({'time': current_time})
    except Exception as e:
        print(f"Error fetching time: {e}")
        return jsonify({'error': 'Failed to get time'}), 500

@app.route("/api/time", methods=["POST"])
def set_time():
    try:
        data = request.get_json()
        time_str = data["time"]
        time_obj = datetime.strptime(time_str, "%H:%M")
        controller.set_time(time_obj)
        return jsonify({"status": "success", "message": "Time set"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route("/api/date", methods=["GET"])
def get_date():
    try:
        current_date = controller.get_telescope_date()
        return jsonify({'date': current_date})
    except Exception as e:
        print(f"Error fetching date: {e}")
        return jsonify({'error': 'Failed to get date'}), 500

@app.route("/api/date", methods=["POST"])
def set_date():
    try:
        data = request.get_json()
        date_str = data["date"]
        date_datetime = datetime.strptime(date_str, "%Y-%m-%d")
        controller.set_date(date_datetime)
        return jsonify({"status": "success", "message": "Date set"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route("/api/coordinates", methods=["GET"])
def get_coordinates():
    try:
        position = controller.get_coordinates()
        return jsonify({"status": "success", "position": position})
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
