from flask import Flask, request, jsonify
from flask_cors import CORS
from telescope import Telescope
import re

app = Flask(__name__)
CORS(app)  # Allows React frontend to call this API

telescope = Telescope()

movement = {'movenorth': 'Mn', 'movesouth': 'Ms', 'moveeast': 'Me', 'movewest': 'Mw', 'stopMovement': 'Q'}
alignment = {'Polar': 'AP', 'Land': 'AL', 'AltAz': 'AA'}
information = {
    'Altitude': 'GA', 'Calendar_format': 'Gc', 'Declination': 'GD', 'Current_object_declination': 'Gd',
    'Offset': 'GG', 'Site_longitude': 'Gg', 'Right_ascension': 'GR', 'Firmware': 'GVN',
    'dateView': 'GC', 'timeView': 'GL', 'Deep_sky_object': 'Gy'
}
date = {'hour': 'SL', 'date': 'SC'}
coordinates = {'RA': 'Sr', 'DEC': 'Sd', 'MOVE': 'MS'}

# Regex for validation
patternRA = r'^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$'
patternDEC = r'^[+-]\d{2}\*\d{2}:\d{2}$'

def convert_dec_to_lx200(dec):
    # If already using *, just return
    if '*' in dec:
        return dec
    # If using :, convert first : to *
    parts = dec.split(':', 1)
    if len(parts) == 2:
        return parts[0] + '*' + parts[1]
    return dec  # fallback

@app.route("/api/movement", methods=["POST"])
def api_movement():
    data = request.json
    command = movement.get(data.get("command"))
    if command:
        result = telescope.send_command(command)
        return jsonify({"status": "success", "message": result})
    return jsonify({"status": "error", "message": "Invalid command"}), 400

@app.route("/api/alignment", methods=["POST"])
def api_alignment():
    data = request.json
    command = alignment.get(data.get("command"))
    if command:
        result = telescope.send_command(command)
        return jsonify({"status": "success", "message": result})
    return jsonify({"status": "error", "message": "Invalid alignment"}), 400

@app.route("/api/information", methods=["POST"])
def api_information():
    data = request.json
    command = information.get(data.get("command"))
    if command:
        result = telescope.send_command_receive(command)
        return jsonify({"status": "success", "message": result})
    return jsonify({"status": "error", "message": "Invalid info request"}), 400

@app.route("/api/setTime", methods=["POST"])
def api_time():
    data = request.json
    cmd_type = data.get("command")
    value = data.get("value")
    if cmd_type in date:
        full_cmd = date[cmd_type] + value
        result = telescope.send_command_receive(full_cmd)
        return jsonify({"status": "success", "message": result})
    return jsonify({"status": "error", "message": "Invalid time command"}), 400

@app.route("/api/coordinates", methods=["POST"])
def api_coordinates():
    data = request.json
    ra, dec = data.get("ra"), data.get("dec")

    lx200_dec = convert_dec_to_lx200(dec)
    print(f"Received RA: {ra}, DEC: {dec}")
    print(f"Converted DEC to LX200 format: {lx200_dec}")
    
    if not ra or not dec:
        return jsonify({"status": "error", "message": "RA and DEC must be provided."}), 400

    if re.match(patternRA, ra) and re.match(patternDEC, lx200_dec):
        r = telescope.send_command_receive(coordinates['RA'] + ra)
        d = telescope.send_command_receive(coordinates['DEC'] + lx200_dec)
        m = telescope.send_command_receive(coordinates['MOVE'])

        return jsonify({"status": "success", "RA": r, "DEC": d, "MOVE": m})

    return jsonify({
        "status": "error",
        "message": f"Invalid RA/DEC format. Received RA: {ra}, DEC: {dec}"
    }), 400


@app.route("/api/currentPosition", methods=["GET"])
def api_current_position():
    try:
        ra = telescope.send_command_receive(information['Right_ascension'])
        dec = telescope.send_command_receive(information['Declination'])
        position = {
            "ra": ra.strip(),
            "dec": dec.strip()
        }
        return jsonify({"status": "success", "position": position})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=7123)
