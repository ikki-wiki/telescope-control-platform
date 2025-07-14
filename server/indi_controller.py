from base_controller import BaseTelescopeController
import PyIndi
import time
import logging
from indi_client import IndiClient

class IndiTelescopeController(BaseTelescopeController):
    def __init__(self, host="localhost", port=7624):
        self.client = IndiClient()
        self.client.setServer(host, port)
        self.device = None
        self.logger = logging.getLogger('IndiTelescopeController')

    def connect(self):
        self.logger.info(f"Connecting to INDI server at {self.client.getHost()}:{self.client.getPort()}")
        if not self.client.connectServer():
            raise ConnectionError(f"Unable to connect to INDI server at {self.client.getHost()}:{self.client.getPort()}")

        # Wait for devices to be discovered (populate self.client.devices via callbacks)
        for _ in range(10):
            if self.client.getDeviceByName("Telescope Simulator"):
                break
            time.sleep(0.5)
        else:
            raise RuntimeError("Device 'Telescope Simulator' not found")

        self.device = self.client.getDeviceByName("Telescope Simulator")
        self.client.connectDevice(self.device.getDeviceName())

        # Wait for properties to populate
        for _ in range(10):
            eq = self.device.getNumber("EQUATORIAL_EOD_COORD")
            if eq:
                break
            time.sleep(0.5)
        else:
            raise RuntimeError("Device properties did not populate in time")

    def disconnect(self):
        self.client.disconnectServer()
        self.logger.info("Disconnected from INDI server")

    def is_connected(self) -> bool:
        return self.client.isServerConnected()

    def get_coordinates(self) -> tuple[float, float]:
        eq = self.device.getNumber("EQUATORIAL_EOD_COORD")
        if eq is None:
            raise RuntimeError("Could not get EQUATORIAL_EOD_COORD property")
        # getNumber returns a PyIndi property object; map it to RA/DEC values:
        ra = eq[0].getValue()  # RA
        dec = eq[1].getValue() # DEC
        return ra, dec

    def slew_to(self, ra: float, dec: float):
        self.logger.debug(f"[SLEW] Slewing to RA={ra}, DEC={dec}")

        # Step 1: Set ON_COORD_SET to SLEW
        coord_mode = self.device.getSwitch("ON_COORD_SET")
        if coord_mode is not None:
            for s in coord_mode:
                s.setState(PyIndi.ISS_OFF)
            for s in coord_mode:
                if s.name.upper() == "SLEW":
                    s.setState(PyIndi.ISS_ON)
                    break
            self.client.sendNewSwitch(coord_mode)
            self.logger.debug("[SLEW] ON_COORD_SET set to SLEW")
        else:
            raise RuntimeError("ON_COORD_SET not found")

        time.sleep(0.5)  # Give INDI a moment to register switch

        # Step 2: Set RA and DEC
        eq = self.device.getNumber("EQUATORIAL_EOD_COORD")
        if eq is None:
            raise RuntimeError("Could not get EQUATORIAL_EOD_COORD property")

        eq[0].setValue(ra)   # RA (in hours)
        eq[1].setValue(dec)  # DEC (in degrees)

        self.client.sendNewNumber(eq)
        self.logger.info("[SLEW] Slew command sent.")


    def abort_slew(self):
        sw = self.device.getSwitch("TELESCOPE_ABORT_MOTION")
        if sw is None:
            raise RuntimeError("Could not get TELESCOPE_ABORT_MOTION property")
        for s in sw:
            s.setState(PyIndi.ISS_OFF)
        sw[0].setState(PyIndi.ISS_ON)  # Assuming "ABORT" is first switch
        self.client.sendNewSwitch(sw)

    def sync_to(self, ra, dec):
        if self.device is None:
            raise RuntimeError("No device connected")

        # Optional: Set ON_COORD_SET to SYNC
        coord_mode = self.device.getSwitch("ON_COORD_SET")
        if coord_mode is not None:
            sync_switch = next((s for s in coord_mode if s.name == "SYNC"), None)
            if sync_switch:
                for s in coord_mode:
                    s.s = PyIndi.ISS_OFF
                sync_switch.s = PyIndi.ISS_ON
                self.client.sendNewSwitch(coord_mode)

        eq_sync = self.device.getNumber("EQUATORIAL_EOD_COORD")
        if eq_sync is None:
            raise RuntimeError("EQUATORIAL_EOD_COORD not available")

        # Map names to elements
        elements = {el.name: el for el in eq_sync}

        if "RA" not in elements or "DEC" not in elements:
            raise RuntimeError("RA or DEC not found in EQUATORIAL_EOD_COORD")

        elements["RA"].value = ra
        elements["DEC"].value = dec
        self.client.sendNewNumber(eq_sync)


    def park(self):
        sw = self.device.getSwitch("TELESCOPE_PARK")
        if sw is None:
            raise RuntimeError("Could not get TELESCOPE_PARK property")
        for s in sw:
            s.setState(PyIndi.ISS_OFF)
        sw[0].setState(PyIndi.ISS_ON)  # Assuming "PARK" is first switch
        self.client.sendNewSwitch(sw)

    def unpark(self):
        sw = self.device.getSwitch("TELESCOPE_PARK")
        if sw is None:
            raise RuntimeError("Could not get TELESCOPE_PARK property")
        for s in sw:
            s.setState(PyIndi.ISS_OFF)
        sw[1].setState(PyIndi.ISS_ON)  # Assuming "UNPARK" is second switch
        self.client.sendNewSwitch(sw)

    def get_current_position(self):
        """Returns current telescope position as RA and DEC in degrees."""
        ra, dec = self.get_coordinates()
        return {"ra": ra, "dec": dec}

    def get_info(self):
        """Returns basic device information (name, connection status)."""
        return {
            "device": self.device.getDeviceName() if self.device else None,
            "connected": self.is_connected()
        }

    def move(self, direction: str, rate: float):
        """Moves telescope in a specified direction with given rate."""
        motion_map = {
            "north": "MOTION_NORTH",
            "south": "MOTION_SOUTH",
            "east": "MOTION_EAST",
            "west": "MOTION_WEST"
        }
        motion_key = motion_map.get(direction.lower())
        if not motion_key:
            raise ValueError(f"Invalid direction: {direction}")

        motion = self.device.getSwitch("TELESCOPE_MOTION_NS" if "north" in direction or "south" in direction else "TELESCOPE_MOTION_WE")
        if motion is None:
            raise RuntimeError("Could not get motion switch")

        for s in motion:
            s.setState(PyIndi.ISS_OFF)
        for s in motion:
            if s.name == motion_key:
                s.setState(PyIndi.ISS_ON)

        self.client.sendNewSwitch(motion)

    def align(self):
        """Stub for alignment procedure (not implemented)."""
        # You could trigger alignment routines or return dummy success
        return {"status": "Alignment not implemented yet"}

    def get_telescope_time(self):
        """Returns the current time of the telescope."""
        time_prop = self.device.getText("TIME_UTC")
        if not time_prop:
            raise RuntimeError("TIME_UTC property not available on device")
        return time_prop[0].getText()

    def set_time(self, time_obj):
        """Sets telescope time (if supported)."""
        time_prop = self.device.getText("TIME_UTC")
        if not time_prop:
            raise RuntimeError("TIME_UTC property not available on device")
        time_prop[0].setText(time_obj.strftime("%H:%M:%S"))
        self.client.sendNewText(time_prop)

    def get_telescope_date(self):
        """Returns the current date of the telescope."""
        date_prop = self.device.getText("DATE_UTC")
        if not date_prop:
            raise RuntimeError("DATE_UTC property not available on device")

        return date_prop[0].getText() if date_prop else None
    
    def set_date(self, date_datetime):
        """Sets telescope date (if supported)."""
        date_prop = self.device.getText("DATE_UTC")
        if not date_prop:
            raise RuntimeError("DATE_UTC property not available on device")

        date_prop[0].setText(date_datetime.strftime("%Y-%m-%d"))
        self.client.sendNewText(date_prop)
