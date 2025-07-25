from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import logging
from skyfield.api import load
from astroquery.simbad import Simbad
from astropy.coordinates import SkyCoord
import astropy.units as u
import json
from pathlib import Path
from indi_controller import IndiTelescopeController

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.DEBUG)

# Load once at startup
LOCAL_CATALOG = json.loads(Path("catalog.json").read_text())

controller = IndiTelescopeController(host="localhost", port=7624, device_name="Telescope Simulator")

try:
    controller.connect()
except Exception as e:
    logging.error(f"Failed to connect to INDI server: {e}")

# Preload solar system ephemeris
ephemeris = load('de421.bsp')
planets = {
    'mercury': ephemeris['mercury'],
    'venus': ephemeris['venus'],
    'mars': ephemeris['mars'],
    'jupiter': ephemeris['jupiter barycenter'],
    'saturn': ephemeris['saturn barycenter'],
    'uranus': ephemeris['uranus barycenter'],
    'neptune': ephemeris['neptune barycenter'],
    'pluto': ephemeris['pluto barycenter'],
    'moon': ephemeris['moon'],
    'sun': ephemeris['sun']
}

ts = load.timescale()

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

@app.route("/api/slew", methods=["POST"])
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

@app.route("/api/resolve-object", methods=["POST"])
def resolve_object():
    try:
        data = request.get_json()
        object_name = data.get("object", "").strip()
        if not object_name:
            return jsonify({"status": "error", "message": "Object name is required"}), 400

        object_lower = object_name.lower()
        ra_deg = dec_deg = None

        # Option 1: Planet via Skyfield
        if object_lower in planets:
            t = ts.now()
            obj = planets[object_lower]
            astrometric = ephemeris['earth'].at(t).observe(obj).apparent()
            ra, dec, _ = astrometric.radec()
            ra_deg = ra.hours * 15
            dec_deg = dec.degrees

        # Option 2: Local catalog
        else:
            match = next((o for o in LOCAL_CATALOG if o["name"].lower() == object_lower), None)
            if match:
                print(f"[DEBUG] Found local match for {object_name}: {match}")
                if match.get("type") == "planet":
                    t = ts.now()
                    obj = planets[object_lower]
                    astrometric = ephemeris['earth'].at(t).observe(obj).apparent()
                    ra, dec, _ = astrometric.radec()
                    ra_deg = ra.hours * 15
                    dec_deg = dec.degrees
                else:
                    ra_deg = match["ra"]
                    dec_deg = match["dec"]

            # Option 3 (optional): Simbad online fallback
            else:
                try:
                    result = Simbad.query_object(object_name)
                    if result is None:
                        return jsonify({"status": "error", "message": f"Object '{object_name}' not found"}), 404
                    ra_str = result["RA"][0]
                    dec_str = result["DEC"][0]
                    coord = SkyCoord(f"{ra_str} {dec_str}", unit=(u.hourangle, u.deg))
                    ra_deg = coord.ra.degree
                    dec_deg = coord.dec.degree
                except Exception:
                    return jsonify({"status": "error", "message": f"Object '{object_name}' not found locally and no internet available."}), 404

        return jsonify({
            "status": "success",
            "object": object_name,
            "ra": ra_deg,
            "dec": dec_deg
        })

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

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

@app.route("/api/parking-status", methods=["GET"])
def parking_status():
    try:
        status = controller.get_parking_status()
        return jsonify({"status": "success", "parking-status": status})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route("/api/park-position", methods=["GET"])
def get_park_position():
    return jsonify(controller.get_park_position())

@app.route("/api/park-position", methods=["POST"])
def post_park_position():
    data = request.get_json()
    controller.set_park_position(float(data["ra"]), float(data["dec"]))
    return jsonify({"status": "ok"})

@app.route("/api/park-option", methods=["POST"])
def set_park_option():
    data = request.get_json()
    controller.set_park_option(data["option"])  # PARK_CURRENT or PARK_DEFAULT
    return jsonify({"status": "ok"})  

@app.route("/api/abort", methods=["POST"])
def abort():
    try:
        controller.abort_motion()
        return jsonify({"status": "success", "message": "Motion aborted"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route("/api/time", methods=["GET"])
def get_time():
    try:
        current_time, current_offset = controller.get_time()
        return jsonify({'time': current_time, 'offset': current_offset})
    except Exception as e:
        print(f"Error fetching time: {e}")
        return jsonify({'error': 'Failed to get time'}), 500

@app.route("/api/time", methods=["POST"])
def set_time():
    try:
        data = request.get_json()

        # Parse and validate time string
        time_str = data["time"]
        time_obj = datetime.strptime(time_str, "%H:%M:%S")
        # Get and validate offset
        offset = data["offset"]
        print("offset: " + offset)

        if not -14 <= float(offset) <= 14:
            raise ValueError("Offset must be between -14 and +14")

        controller.set_time(time_obj, offset)

        return jsonify({"status": "success", "message": "Time set"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route("/api/date", methods=["GET"])
def get_date():
    try:
        current_date = controller.get_date()
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


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=7123)
