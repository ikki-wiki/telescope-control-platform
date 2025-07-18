from base_controller import BaseTelescopeController
import PyIndi
import time
import logging
from indi_client import IndiClient

class IndiTelescopeController(BaseTelescopeController):
    def __init__(self, host="localhost", port=7624, device_name="LX200 Autostar"):
        self.client = IndiClient()
        self.client.setServer(host, port)
        self.device = None
        self.device_name = device_name  # <--- store the device name
        self.logger = logging.getLogger('IndiTelescopeController')

    def connect(self):
        self.logger.info(f"Connecting to INDI server at {self.client.getHost()}:{self.client.getPort()}")
        if not self.client.connectServer():
            raise ConnectionError(f"Unable to connect to INDI server at {self.client.getHost()}:{self.client.getPort()}")

        self.client.watchDevice(self.device_name)

        # Wait up to 15 seconds for device to be detected by the client
        for i in range(30):
            self.device = self.client.getDevice(self.device_name)
            if self.device:
                self.logger.info(f"Device '{self.device_name}' found")
                break
            time.sleep(0.5)
        else:
            raise RuntimeError(f"Device '{self.device_name}' not found")

        # --- SET CONNECTION MODE TO TCP ---
        conn_mode = self.device.getSwitch("CONNECTION_MODE")
        if conn_mode:
            conn_mode[0].s = PyIndi.ISS_OFF  # Serial
            conn_mode[1].s = PyIndi.ISS_ON   # TCP
            self.client.sendNewSwitch(conn_mode)
            time.sleep(1)
            self.logger.info("Switched connection mode to TCP")

        # Set DEVICE_ADDRESS if available
        device_address = self.device.getText("DEVICE_ADDRESS")
        if device_address:
            device_address[0].text = "10.0.0.1"
            self.client.sendNewText(device_address)

        # Set DEVICE_PORT if available
        device_port = self.device.getNumber("DEVICE_PORT")
        if device_port:
            device_port[0].value = 4030
            self.client.sendNewNumber(device_port)

        # Some versions might expose both IP/PORT in a 'TCP' field
        tcp_field = self.device.getText("TCP")
        if tcp_field and len(tcp_field) >= 2:
            tcp_field[0].text = "10.0.0.1"
            tcp_field[1].text = "4030"
            self.client.sendNewText(tcp_field)

        # --- CONNECT DEVICE ---
        telescope_connect = self.device.getSwitch("CONNECTION")
        for _ in range(30):
            if telescope_connect:
                break
            time.sleep(0.5)
            telescope_connect = self.device.getSwitch("CONNECTION")

        if telescope_connect and not self.device.isConnected():
            telescope_connect[0].s = PyIndi.ISS_ON   # CONNECT
            telescope_connect[1].s = PyIndi.ISS_OFF  # DISCONNECT
            self.client.sendNewSwitch(telescope_connect)
            self.logger.info("Sent telescope connect command to device")

        # --- WAIT FOR TELESCOPE PROPERTIES TO LOAD ---
        for _ in range(300):
            equat1 = self.device.getNumber("EQUATORIAL_EOD_COORD")
            equat2 = self.device.getNumber("EQUATORIAL_COORD")
            if equat1 or equat2:
                self.logger.info("Telescope properties successfully loaded")
                break
            # 👇 Add this line
            self.logger.debug(f"Available so far: {[p.getName() for p in self.device.getProperties()]}")
            time.sleep(0.5)
        else:
            # 👇 Add this for better diagnostics
            self.logger.error("Final properties found: %s", [p.getName() for p in self.device.getProperties()])
            raise RuntimeError("Device properties did not populate in time")


        # Debug: print loaded properties
        for prop in self.device.getProperties():
            print("Property:", prop.getName())



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
        ra = eq[0].value  # RA
        dec = eq[1].value # DEC
        return ra, dec

    def slew_to(self, ra: float, dec: float):
        self.logger.debug(f"[SLEW] Slewing to RA={ra}, DEC={dec}")

        # Step 1: Set ON_COORD_SET to SLEW
        coord_mode = self.device.getSwitch("ON_COORD_SET")
        while not(coord_mode):
            time.sleep(0.5)
            coord_mode=self.device.getSwitch("ON_COORD_SET")

        #if coord_mode is not None:
        #    for s in coord_mode:
        #        s.setState(PyIndi.ISS_OFF)
        #    for s in coord_mode:
        #        if s.name.upper() == "SLEW":
        #            s.setState(PyIndi.ISS_ON)
        #            break
        #    self.client.sendNewSwitch(coord_mode)
        #    indiclient.sendNewSwitch(telescope_on_coord_set)
        
        coord_mode[0].s=PyIndi.ISS_ON  # TRACK
        coord_mode[1].s=PyIndi.ISS_OFF # SLEW
        coord_mode[2].s=PyIndi.ISS_OFF # SYNC
        self.client.sendNewSwitch(coord_mode)

        # We set the desired coordinates
        telescope_radec=self.device.getNumber("EQUATORIAL_EOD_COORD")
        while not(telescope_radec):
            time.sleep(0.5)
            telescope_radec=device_telescope.getNumber("EQUATORIAL_EOD_COORD")
        telescope_radec[0].value=ra
        telescope_radec[1].value=dec
        self.client.sendNewNumber(telescope_radec)
        # and wait for the scope has finished moving
        while (telescope_radec.getState() == PyIndi.IPS_BUSY):
            print("Scope Moving ", telescope_radec[0].value, telescope_radec[1].value)
            print("State:", telescope_radec.getState())
            time.sleep(0.5)

        print("State:", telescope_radec.getState())
        self.logger.debug("[SLEW] ON_COORD_SET set to SLEW")
        time.sleep(0.5)  # Give INDI a moment to register switch

        # Step 2: Set RA and DEC
        #eq = self.device.getNumber("EQUATORIAL_EOD_COORD")
        #if eq is None:
        #    raise RuntimeError("Could not get EQUATORIAL_EOD_COORD property")

        #eq[0].setValue(ra)   # RA (in hours)
        #eq[1].setValue(dec)  # DEC (in degrees)

        #self.client.sendNewNumber(eq)
        #self.logger.info("[SLEW] Slew command sent.")


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
