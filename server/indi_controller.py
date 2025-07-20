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
        self.device_name = device_name
        self.logger = logging.getLogger('IndiTelescopeController')

    def connect(self):
        self.client.watchDevice(self.device_name)

        if not self.client.connectServer():
            raise RuntimeError("Failed to connect to INDI server")

        # Wait for device to appear
        for i in range(30):
            self.device = self.client.getDevice(self.device_name)
            if self.device:
                self.logger.info(f"Device '{self.device_name}' found")
                break
            time.sleep(0.5)
        else:
            raise RuntimeError(f"Device '{self.device_name}' not found")

        print("List of devices:")
        for device in self.client.getDevices():
            print(f"   > {device.getDeviceName()}")

        # --- SET CONNECTION MODE TO TCP ---
        conn_mode = self.device.getSwitch("CONNECTION_MODE")
        if conn_mode:
            conn_mode[0].s = PyIndi.ISS_OFF  # Serial
            conn_mode[1].s = PyIndi.ISS_ON   # TCP
            self.client.sendNewSwitch(conn_mode)
            time.sleep(2)

        # Set DEVICE_ADDRESS if available
        device_address = self.device.getText("DEVICE_ADDRESS")
        if device_address:
            device_address[0].text = "10.0.0.1"
            self.client.sendNewText(device_address)
            time.sleep(2)

        # Set DEVICE_PORT if available
        device_port = self.device.getNumber("DEVICE_PORT")
        if device_port:
            device_port[0].value = 4030
            self.client.sendNewNumber(device_port)
            time.sleep(2)

        # Alternative TCP setting field
        tcp_field = self.device.getText("TCP")
        if tcp_field and len(tcp_field) >= 2:
            tcp_field[0].text = "10.0.0.1"
            tcp_field[1].text = "4030"
            self.client.sendNewText(tcp_field)
            time.sleep(2)

        # --- CONNECT DEVICE ---
        connect_switch = self.device.getSwitch("CONNECTION")
        if connect_switch and not self.device.isConnected():
            connect_switch[0].s = PyIndi.ISS_ON
            connect_switch[1].s = PyIndi.ISS_OFF
            self.client.sendNewSwitch(connect_switch)
            self.logger.info("Sent connect command")
            time.sleep(2)

        # --- WAIT FOR PROPERTIES TO LOAD ---
        for _ in range(10):
            equat1 = self.device.getNumber("EQUATORIAL_EOD_COORD")
            equat2 = self.device.getNumber("EQUATORIAL_COORD")
            if equat1 or equat2:
                self.logger.info("Telescope properties successfully loaded")
                break
            self.logger.debug(f"Available so far: {[p.getName() for p in self.device.getProperties()]}")
            time.sleep(1)
        else:
            self.logger.error("Final properties found: %s", [p.getName() for p in self.device.getProperties()])
            raise RuntimeError("Device properties did not populate in time")

    def disconnect(self):
        self.client.disconnectServer()
        self.logger.info("Disconnected from INDI server")

    def is_connected(self):
        return self.client.isServerConnected()

    def get_coordinates(self):
        eq = self.device.getNumber("EQUATORIAL_EOD_COORD")
        if eq is None:
            raise RuntimeError("Could not get EQUATORIAL_EOD_COORD property")
        ra = eq[0].value  # RA
        dec = eq[1].value # DEC
        return ra, dec

    def slew_to(self, ra, dec):
        self.logger.debug(f"[SLEW] Slewing to RA={ra}, DEC={dec}")

        # Step 1: Set ON_COORD_SET to SLEW
        coord_mode = self.device.getSwitch("ON_COORD_SET")
        while not(coord_mode):
            time.sleep(0.5)
            coord_mode=self.device.getSwitch("ON_COORD_SET")
        
        coord_mode[0].s=PyIndi.ISS_ON  # SLEW
        coord_mode[1].s=PyIndi.ISS_OFF # TRACK
        coord_mode[2].s=PyIndi.ISS_OFF # SYNC
        self.client.sendNewSwitch(coord_mode)

        # We set the desired coordinates
        telescope_radec=self.device.getNumber("EQUATORIAL_EOD_COORD")
        while not(telescope_radec):
            time.sleep(0.5)
            telescope_radec=self.device.getNumber("EQUATORIAL_EOD_COORD")
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
        return {"status": "Slewing to coordinates", "ra": ra, "dec": dec}

    def sync_to(self, ra, dec):
        self.logger.debug(f"[SYNC] Syncing to RA={ra}, DEC={dec}")

        # Step 1: Set ON_COORD_SET to SLEW
        coord_mode = self.device.getSwitch("ON_COORD_SET")
        while not(coord_mode):
            time.sleep(0.5)
            coord_mode=self.device.getSwitch("ON_COORD_SET")
        
        coord_mode[0].s=PyIndi.ISS_OFF  # SLEW
        coord_mode[1].s=PyIndi.ISS_OFF  # TRACK
        coord_mode[2].s=PyIndi.ISS_ON   # SYNC
        self.client.sendNewSwitch(coord_mode)

        # We set the desired coordinates
        telescope_radec=self.device.getNumber("EQUATORIAL_EOD_COORD")
        while not(telescope_radec):
            time.sleep(0.5)
            telescope_radec=self.device.getNumber("EQUATORIAL_EOD_COORD")
        telescope_radec[0].value=ra
        telescope_radec[1].value=dec
        self.client.sendNewNumber(telescope_radec)
        # and wait for the scope has finished moving
        while (telescope_radec.getState() == PyIndi.IPS_BUSY):
            print("Scope Moving ", telescope_radec[0].value, telescope_radec[1].value)
            print("State:", telescope_radec.getState())
            time.sleep(0.5)

        print("State:", telescope_radec.getState())
        self.logger.debug("[SYNC] ON_COORD_SET set to SYNC")
        time.sleep(0.5)  # Give INDI a moment to register switch
        return {"status": "Synced to coordinates", "ra": ra, "dec": dec}
    
    def abort_motion(self):
        sw = self.device.getSwitch("TELESCOPE_ABORT_MOTION")
        if sw is None:
            raise RuntimeError("Could not get TELESCOPE_ABORT_MOTION property")
        sw[0].s = PyIndi.ISS_ON
        self.client.sendNewSwitch(sw)
        return {"status": "Motion aborted"}

    def park(self):
        sw = self.device.getSwitch("TELESCOPE_PARK")
        if sw is None:
            raise RuntimeError("Could not get TELESCOPE_PARK property")
        sw[0].s = PyIndi.ISS_ON  # PARK
        sw[1].s = PyIndi.ISS_OFF # UNPARK
        self.client.sendNewSwitch(sw)
        return {"status": "Telescope parked"}

    def unpark(self):
        sw = self.device.getSwitch("TELESCOPE_PARK")
        if sw is None:
            raise RuntimeError("Could not get TELESCOPE_PARK property")
        sw[0].s = PyIndi.ISS_OFF # PARK
        sw[1].s = PyIndi.ISS_ON  # UNPARK
        self.client.sendNewSwitch(sw)
        return {"status": "Telescope unparked"}

    def move(self, direction: str):
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
        return {"status": f"Telescope moving {direction}"}

    def get_telescope_time(self):
        """Returns the current time of the telescope."""
        time_prop = self.device.getText("TIME_UTC")
        if not time_prop:
            raise RuntimeError("TIME_UTC property not available on device")
        #time = time_prop[0].getText().split("T")     
        #return time[1]
        time_text = time_prop[0].getText()
        time = time_text.split("T")[1]  # for get_telescope_time
        return time

    def set_time(self, new_time):
        """Sets telescope time (if supported)."""
        time_prop = self.device.getText("TIME_UTC")
        if not time_prop:
            raise RuntimeError("TIME_UTC property not available on device")
        time = time_prop.split("T")
        time[1] = new_time.strftime("%H:%M:%S")
        time_prop = time[0] + "T" + time[1]
        self.client.sendNewText(time_prop)

    def get_telescope_date(self):
        """Returns the current date of the telescope."""
        date_prop = self.device.getText("TIME_UTC")
        if not date_prop:
            raise RuntimeError("DATE_UTC or TIME_UTC property not available on device")
        date_prop = date_prop[0].getText().split("T")
        return date_prop[0]
    
    def set_date(self, new_date):
        """Sets telescope date (if supported)."""
        date_prop = self.device.getText("TIME_UTC")
        if not date_prop:
            raise RuntimeError("DATE_UTC or TIME_UTC property not available on device")
        date = date_prop.split("T")
        date[1] = new_date.isoformat()
        date_prop = date[0] + "T" + date[1]
        self.client.sendNewText(date_prop)
