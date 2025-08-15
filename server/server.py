from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
from datetime import timezone
import logging
from skyfield.api import load, wgs84, Star, Angle
from astroquery.simbad import Simbad
from astropy.time import Time
from astropy.coordinates import SkyCoord, EarthLocation
import astropy.units as u
import json
from pathlib import Path
from indi_controller import IndiTelescopeController
from astropy.utils import iers
iers.conf.auto_download = False
iers.conf.auto_max_age = None

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

from astropy.coordinates import SkyCoord, AltAz, EarthLocation
from astropy.time import Time
import astropy.units as u

def is_coordinate_visible(ra_hours, dec_degrees, latitude=32.6605, longitude=-16.9261, elevation_m=168):
    try:
        app.logger.debug("Checking coordinate visibility (Astropy method)")

        # 1. Create a SkyCoord for the target
        target = SkyCoord(ra=ra_hours * u.hourangle, dec=dec_degrees * u.deg, frame='icrs')

        # 2. Define the observer’s Earth location
        observer_location = EarthLocation(lat=latitude * u.deg, lon=longitude * u.deg, height=elevation_m * u.m)

        # 3. Get current UTC time
        now = Time.now()

        # 4. Create AltAz frame for observer at current time
        altaz_frame = AltAz(obstime=now, location=observer_location)

        # 5. Transform target coordinate to AltAz
        altaz = target.transform_to(altaz_frame)

        alt_deg = altaz.alt.degree
        az_deg = altaz.az.degree

        app.logger.debug(f"Altitude: {alt_deg:.2f}°, Azimuth: {az_deg:.2f}°")

        # 6. Check if the target is above the horizon
        return alt_deg > 0

    except Exception as e:
        app.logger.error(f"Error checking coordinate visibility: {e}", exc_info=True)
        return False

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

        #latitude = data.get("latitude", 32.6656)  # Default to La Palma
        #longitude = data.get("longitude", -16.9241)  # Default to La Palma
        #elevation = data.get("elevation", 270)  # Default to La Palma

        #if not is_coordinate_visible(ra, dec, latitude, longitude, elevation):
        #    return jsonify({"error": "Target is below the horizon."}), 400

        app.logger.debug(f"Slewing to RA={ra} hours, Dec={dec} degrees")
        controller.slew_to(ra, dec)
        return jsonify({'message': 'Slew command sent', 'status': 'success'})
    except Exception as e:
        return jsonify({'message': str(e), 'status': 'error'}), 500

@app.route("/api/sync", methods=["POST"])
def sync_telescope():
    data = request.json
    ra_str = data.get("ra")
    dec_str = data.get("dec")

    try:
        ra = hms_to_hours(ra_str)
        dec = dms_to_degrees(dec_str)

        #latitude = data.get("latitude", 32.6656)  # Default to La Palma
        #longitude = data.get("longitude", -16.9241)  # Default to La Palma
        #elevation = data.get("elevation", 270)  # Default to La Palma

        #if not is_coordinate_visible(ra, dec, latitude, longitude, elevation):
        #    return jsonify({"error": "Target is below the horizon."}), 400

        app.logger.debug(f"Syncing to RA={ra} hours, Dec={dec} degrees")
        controller.sync_to(ra, dec)
        return jsonify({'message': 'Sync command sent', 'status': 'success'})
    except Exception as e:
        return jsonify({'message': str(e), 'status': 'error'}), 500

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
        # --- CONFIG: your site & reference ---
        lat = 32.65
        lon = -16.92   # west negative
        elev = 0
        dec_park = 57.349722222
        ra_ref_str = "18:29:57.0"    # This is RA=18.4991666... in HH:MM:SS
        utc_ref_str = "2025-08-14 11:10:20"  # exact UTC when you

        loc = EarthLocation(lat=lat*u.deg, lon=lon*u.deg, height=elev*u.m)

        # Reference time & RA
        t_ref = Time(utc_ref_str, scale='utc', location=loc)
        ra_ref_hours = SkyCoord(ra_ref_str, dec_park*u.deg,
                                unit=(u.hourangle, u.deg)).ra.hour
        lst_ref = t_ref.sidereal_time('apparent').hour
        ha_ref = (lst_ref - ra_ref_hours) % 24

        # Get mount's UTC
        date, time, offset = controller.get_utc_time()
        utc_time_string = f"{date} {time}"
        t_now = Time(utc_time_string, scale='utc', location=loc)
        lst_now = t_now.sidereal_time('apparent').hour

        # RA for today
        ra_now = (lst_now - ha_ref) % 24
        coord_now = SkyCoord(ra=ra_now*u.hour, dec=dec_park*u.deg, frame='icrs')

        app.logger.info(f"Calculated park RA/DEC: "
                        f"{coord_now.ra.to_string(unit=u.hour, sep=':')}, "
                        f"{coord_now.dec.to_string(unit=u.deg, sep=':')}")

        # --- Unpark first
        controller.unpark()

        # --- Sync after unpark
        controller.sync_to(coord_now.ra.hour, coord_now.dec.degree)

        # Verify it ‘stuck’
        pos = controller.get_coordinates()
        ra_report = float(pos['ra'])
        dec_report = float(pos['dec'])
        if abs(ra_report - coord_now.ra.hour) > 0.01:
            app.logger.error(f"SYNC mismatch! Wanted {coord_now.ra.hour},{coord_now.dec.degree}, got {ra_report},{dec_report}")

        return jsonify({
            "status": "success",
            "message": "Unparked and synced to park position",
            "ra": coord_now.ra.to_string(unit=u.hour, sep=':'),
            "dec": coord_now.dec.to_string(unit=u.deg, sep=':')
        })

    except Exception as e:
        app.logger.exception("Error in unpark()")
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

@app.route("/api/time/utc", methods=["GET"])
def get_utc_time():
    try:
        date, time, offset = controller.get_utc_time()
        return jsonify({"status": "success", "date": date, "time": time, "offset": offset})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route("/api/time/utc", methods=["POST"])
def set_utc_time():
    data = request.get_json()
    app.logger.debug(f"POST /time/utc received: {data}")
    try:
        controller.set_utc_time(data["date"], data["time"], data["offset"])
    except Exception as error:
        app.logger.error(f"Error in set_utc_time: {error}")
        return jsonify({"status": "error", "message": str(error)}), 400
    return jsonify({"status": "success"})

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

@app.route("/api/move", methods=["POST"])
def move_telescope():
    data = request.get_json()
    direction = data.get("direction")

    if not direction:
        return jsonify({"status": "error", "message": "Direction required"}), 400

    try:
        result = controller.move(direction)
        return jsonify({"status": "success", "message": result["status"]})
    except ValueError as ve:
        return jsonify({"status": "error", "message": str(ve)}), 400
    except Exception as e:
        return jsonify({"status": "error", "message": f"Failed to move: {e}"}), 500

@app.route("/api/track-state", methods=["GET"])
def get_track_state():
    try:
        is_tracking = controller.get_tracking_state()
        return jsonify({"status": "success", "isTracking": is_tracking})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route("/api/track-state", methods=["POST"])
def set_track_state():
    data = request.get_json()
    state = data.get("state")

    if state not in [True, False]:
        return jsonify({"status": "error", "message": "Invalid state"}), 400

    try:
        controller.set_tracking_state(state)
        return jsonify({"status": "success", "message": f"Tracking turned {'on' if state == True else 'off'}"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route("/api/slew-rate", methods=["GET"])
def get_slew_rate():
    try:
        data = controller.get_slew_rate()
        return jsonify({"status": "success", **data})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route("/api/slew-rate", methods=["POST"])
def set_slew_rate():
    data = request.get_json()
    rate_name = data.get("rate")
    if not rate_name:
        return jsonify({"status": "error", "message": "Missing rate name"}), 400
    try:
        controller.set_slew_rate(rate_name)
        return jsonify({"status": "success", "message": f"Slew rate set to {rate_name}"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route("/api/site", methods=["GET"])
def get_site_info():
    try:
        site_info = controller.get_site_coords()
        return jsonify({"status": "success", "site": site_info})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route("/api/site", methods=["POST"])
def set_site_info():
    data = request.get_json()

    latitude = data.get("latitude", 0.0)
    longitude = data.get("longitude", 0.0)
    elevation = data.get("elevation", 0.0)

    app.logger.debug(f"[SERVER] Setting site coordinates: LAT={latitude}, LONG={longitude}, ELEV={elevation}")

    try:
        controller.set_site_coords(latitude, longitude, elevation)
        return jsonify({"status": "success", "message": "Site information updated"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route("/api/site/selection", methods=["GET"])
def get_site_selection():
    try:
        sites_property = controller.device.getSwitch("Sites")
        if not sites_property:
            return jsonify({"status": "error", "message": "Sites property not available"}), 400

        sites = []
        for item in sites_property:
            # Assuming items named "Site 1", "Site 2", ...
            site_id = int(item.name.split()[-1])  # last token like "1"
            sites.append({"id": site_id, "state": "On" if item.s == PyIndi.ISS_ON else "Off"})

        return jsonify({"status": "success", "sites": sites})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400


@app.route("/api/site/selection", methods=["POST"])
def set_site_selection():
    data = request.get_json()
    site_id = data.get("siteId")
    if site_id is None:
        return jsonify({"status": "error", "message": "siteId is required"}), 400

    try:
        sites_property = controller.device.getSwitch("Sites")
        if not sites_property:
            return jsonify({"status": "error", "message": "Sites property not available"}), 400

        for item in sites_property:
            # Turn ON the selected site, OFF the others
            idx = int(item.name.split()[-1])
            item.s = PyIndi.ISS_ON if idx == site_id else PyIndi.ISS_OFF

        controller.client.sendNewSwitch(sites_property)
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400


@app.route("/api/site/name", methods=["GET"])
def get_site_name():
    try:
        site_name_prop = controller.device.getText("Site Name")
        if not site_name_prop:
            return jsonify({"status": "error", "message": "Site Name property not available"}), 400

        for item in site_name_prop:
            if item.name == "Name":
                return jsonify({"status": "success", "name": item.text})
        return jsonify({"status": "error", "message": "Site Name text not found"}), 400
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400


@app.route("/api/site/name", methods=["POST"])
def set_site_name():
    data = request.get_json()
    name = data.get("name")
    if name is None:
        return jsonify({"status": "error", "message": "name is required"}), 400

    try:
        site_name_prop = controller.device.getText("Site Name")
        if not site_name_prop:
            return jsonify({"status": "error", "message": "Site Name property not available"}), 400

        for item in site_name_prop:
            if item.name == "Name":
                item.setText(name)
                controller.client.sendNewText(site_name_prop)
                return jsonify({"status": "success"})
        return jsonify({"status": "error", "message": "Site Name text not found"}), 400
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route("/api/config/load", methods=["GET"])
def load_config():
    try:
        controller.load_config()
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=7123)
