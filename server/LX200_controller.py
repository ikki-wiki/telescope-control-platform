from base_telescope import BaseTelescopeController
from telescope import Telescope
import re

ra_pattern = r'^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$'
dec_pattern = r'^[+-]\d{2}\*\d{2}:\d{2}$'

movement = {'movenorth': 'Mn', 'movesouth': 'Ms', 'moveeast': 'Me', 'movewest': 'Mw', 'stopMovement': 'Q'}
alignment = {'Polar': 'AP', 'Land': 'AL', 'AltAz': 'AA'}
information = {
            'Altitude': 'GA', 'Calendar_format': 'Gc', 'Declination': 'GD', 'Current_object_declination': 'Gd',
            'Offset': 'GG', 'Site_longitude': 'Gg', 'Right_ascension': 'GR', 'Firmware': 'GVN',
            'dateView': 'GC', 'timeView': 'GL', 'Deep_sky_object': 'Gy'
        }
date = {'hour': 'SL', 'date': 'SC'}
coordinates = {'RA': 'Sr', 'DEC': 'Sd', 'MOVE': 'MS'}


class TelescopeConnectionError(Exception):
    pass

class LX200Controller(BaseTelescopeController):
    def __init__(self):
        self.telescope = Telescope()

    def _check_response(self, response: str) -> str:
        if response.startswith("Connection error:"):
            raise TelescopeConnectionError(response)
        return response

    def move(self, direction: str) -> str:
        command = movement.get(direction)
        if not command:
            raise ValueError(f"Invalid movement direction: {direction}")
        response = self.telescope.send_command(command)
        return self._check_response(response)

    def align(self, mode: str) -> str:
        command = alignment.get(mode)
        if not command:
            raise ValueError(f"Invalid alignment mode: {mode}")
        response = self.telescope.send_command(command)
        return self._check_response(response)

    def get_info(self, info_type: str) -> str:
        command = information.get(info_type)
        if not command:
            raise ValueError(f"Invalid info request: {info_type}")
        response = self.telescope.send_command_receive(command)
        return self._check_response(response)

    def set_time(self, type_: str, value: str) -> str:
        command_prefix = date.get(type_)
        if not command_prefix:
            raise ValueError(f"Invalid time command: {type_}")
        response = self.telescope.send_command_receive(command_prefix + value)
        return self._check_response(response)

    def convert_dec(self, dec: str) -> str:
        if '*' in dec:
            return dec
        parts = dec.split(':', 1)
        return parts[0] + '*' + parts[1] if len(parts) == 2 else dec

    def slew_to(self, ra: str, dec: str) -> str:
        lx200_dec = self.convert_dec(dec)

        if not re.match(ra_pattern, ra):
            raise ValueError(f"Invalid RA format: {ra}")
        if not re.match(dec_pattern, lx200_dec):
            raise ValueError(f"Invalid DEC format: {dec}")

        resp1 = self.telescope.send_command_receive(coordinates['RA'] + ra)
        resp2 = self.telescope.send_command_receive(coordinates['DEC'] + lx200_dec)
        resp3 = self.telescope.send_command_receive(coordinates['MOVE'])

        self._check_response(resp1)
        self._check_response(resp2)
        return self._check_response(resp3)

    def get_current_position(self) -> dict:
        ra = self.telescope.send_command_receive('GR')
        dec = self.telescope.send_command_receive('GD')
        ra = self._check_response(ra).strip()
        dec = self._check_response(dec).strip()
        return {"ra": ra, "dec": dec}
