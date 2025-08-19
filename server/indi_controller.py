from base_controller import BaseTelescopeController
import PyIndi
import time
import logging
from indi_client import IndiClient
from datetime import datetime

class IndiTelescopeController(BaseTelescopeController):
    def __init__(self, host="localhost", port=7624, device_name="Telescope Simulator"):
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

        # --- Set CONNECTION_MODE to TCP ---
        conn_mode = self.device.getSwitch("CONNECTION_MODE")
        if conn_mode:
            conn_mode[0].s = PyIndi.ISS_OFF  # Serial
            conn_mode[1].s = PyIndi.ISS_ON   # TCP
            self.client.sendNewSwitch(conn_mode)
            time.sleep(2)

        # --- Wait for DEVICE_ADDRESS to appear ---
        for _ in range(10):
            device_address_prop = self.device.getText("DEVICE_ADDRESS")
            if device_address_prop:
                break
            time.sleep(0.5)
        else:
            raise RuntimeError("DEVICE_ADDRESS not available")

        # --- Set DEVICE_ADDRESS ---
        device_address_prop[0].text = "10.0.0.1"
        self.client.sendNewText(device_address_prop)
        self.logger.info("Sent DEVICE_ADDRESS = 10.0.0.1")
        time.sleep(2)
        self.logger.info(f"DEVICE_ADDRESS now: {device_address_prop[0].text}")

        # --- Set DEVICE_PORT ---
        device_address_prop[1].text = "4030"
        self.client.sendNewText(device_address_prop)
        self.logger.info("Sent DEVICE_PORT = 4030")
        time.sleep(2)
        self.logger.info(f"DEVICE_PORT now: {device_address_prop[1].text}")

        # --- Wait for CONNECTION to become available ---
        for _ in range(10):
            connect_switch = self.device.getSwitch("CONNECTION")
            if connect_switch:
                break
            time.sleep(0.5)
        else:
            raise RuntimeError("CONNECTION switch not available")

        # --- Connect the device ---
        if not self.device.isConnected():
            connect_switch[0].s = PyIndi.ISS_ON
            connect_switch[1].s = PyIndi.ISS_OFF
            self.client.sendNewSwitch(connect_switch)
            self.logger.info("Sent connect command")
            time.sleep(2)
            self.logger.info(f"CONNECTION now: {connect_switch[0]} - {connect_switch[1]}")

        # --- Wait for telescope properties to populate ---
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
        position = {
            "ra": eq[0].value,  # RA
            "dec": eq[1].value  # DEC
        }
        return position

    def slew_to(self, ra, dec):
        self.logger.debug(f"[SLEW] Slewing to RA={ra}, DEC={dec}")

        # Step 1: Set ON_COORD_SET to SLEW
        coord_mode = self.device.getSwitch("ON_COORD_SET")
        while not(coord_mode):
            time.sleep(0.5)
            coord_mode=self.device.getSwitch("ON_COORD_SET")
        
        coord_mode[0].s=PyIndi.ISS_ON  # TRACK
        coord_mode[1].s=PyIndi.ISS_OFF   # SLEW
        coord_mode[2].s=PyIndi.ISS_OFF  # SYNC
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
            self.logger.debug(f"Slewing... RA={telescope_radec[0].value}, Dec={telescope_radec[1].value}")
            self.logger.debug(f"State: {telescope_radec.getState()}")
            time.sleep(0.5)

        print("State:", telescope_radec.getState())
        self.logger.debug("[SLEW] Slew completed")
        time.sleep(0.5)  # Give INDI a moment to register switch
        return {"status": "Slewing to coordinates", "ra": ra, "dec": dec}

    def sync_to(self, ra, dec):
        self.logger.debug(f"[SYNC] Syncing to RA={ra}, DEC={dec}")

        # Step 1: Set ON_COORD_SET to SLEW
        coord_mode = self.device.getSwitch("ON_COORD_SET")
        while not(coord_mode):
            time.sleep(0.5)
            coord_mode=self.device.getSwitch("ON_COORD_SET")
        
        coord_mode[0].s=PyIndi.ISS_OFF  # TRACK
        coord_mode[1].s=PyIndi.ISS_OFF  # SLEW
        coord_mode[2].s=PyIndi.ISS_ON    # SYNC
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
            self.logger.debug(f"Syncing... RA={telescope_radec[0].value}, Dec={telescope_radec[1].value}")
            self.logger.debug(f"State: {telescope_radec.getState()}")
            time.sleep(0.5)

        print("State:", telescope_radec.getState())
        self.logger.debug("[SYNC] Sync completed")
        time.sleep(0.5)  # Give INDI a moment to register switch

        # Set ON_COORD_SET back to SLEW
        coord_mode[0].s=PyIndi.ISS_OFF    # TRACK
        coord_mode[1].s=PyIndi.ISS_ON     # SLEW
        coord_mode[2].s=PyIndi.ISS_OFF    # SYNC
        self.client.sendNewSwitch(coord_mode)

        return {"status": "success", "ra": ra, "dec": dec}

    
    def abort_motion(self):
        sw = self.device.getSwitch("TELESCOPE_ABORT_MOTION")
        if sw is None:
            raise RuntimeError("Could not get TELESCOPE_ABORT_MOTION property")
        sw[0].s = PyIndi.ISS_ON
        self.client.sendNewSwitch(sw)

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

    def get_parking_status(self):
        sw = self.device.getSwitch("TELESCOPE_PARK")
        if sw is None:
            raise RuntimeError("Could not get TELESCOPE_PARK property")

        for elem in sw:
            if elem.name == "PARK" and elem.s == PyIndi.ISS_ON:
                return "Parked"
            elif elem.name == "UNPARK" and elem.s == PyIndi.ISS_ON:
                return "Unparked"
        return "Unknown"

    def get_park_position(self):
        prop = self.device.getNumber("TELESCOPE_PARK_POSITION")
        if prop is None:
            raise RuntimeError("TELESCOPE_PARK_POSITION not found")

        ra = None
        dec = None

        if self.device_name == "Telescope Simulator":
            # Get PARK_HA and PARK_DEC
            ha = None
            for elem in prop:
                if elem.name == "PARK_HA":
                    ha = elem.value
                elif elem.name == "PARK_DEC":
                    dec = elem.value

            if ha is not None:
                # Convert HA to RA using LST
                #lst = self.get_sidereal_time()
                #ra = (lst - ha) % 24
                ra = ha  # Placeholder for actual RA calculation
        else:
            # For real telescopes, use PARK_RA and PARK_DEC
            for elem in prop:
                if elem.name == "PARK_RA":
                    ra = elem.value
                elif elem.name == "PARK_DEC":
                    dec = elem.value

        if ra is None or dec is None:
            raise ValueError("Park position RA/DEC not available.")

        return {"ra": ra, "dec": dec}

    def set_park_position(self, ra, dec):
        prop = self.device.getNumber("TELESCOPE_PARK_POSITION")
        if prop is None:
            raise RuntimeError("TELESCOPE_PARK_POSITION not found")

        has_ra_dec = False
        has_az_alt = False

        for elem in prop:
            if elem.name == "PARK_RA":
                elem.value = ra
                has_ra_dec = True
            elif elem.name == "PARK_DEC":
                elem.value = dec
                has_ra_dec = True
            elif elem.name == "PARK_AZ":
                elem.value = ra
                has_az_alt = True
            elif elem.name == "PARK_ALT":
                elem.value = dec
                has_az_alt = True

        if not has_ra_dec and not has_az_alt:
            raise RuntimeError("No recognized park position properties found")
        
        print(f"Setting park position: RA={ra}, DEC={dec}")

        self.client.sendNewNumber(prop)

    def set_park_option(self, option):
        if option == "PARK_CURRENT":
            pos = self.get_coordinates()
            self.set_park_position(pos["ra"], pos["dec"])
        elif option == "PARK_DEFAULT":
            # Replace these values with your actual default
            self.set_park_position(0, 0)

        prop = self.device.getSwitch("TELESCOPE_PARK_OPTION")
        if prop is None:
            raise RuntimeError("TELESCOPE_PARK_OPTION not found")

        print(f"Setting park option: {option}")
        found = False
        for elem in prop:
            if elem.name == option:
                elem.value = True
                found = True
            else:
                elem.value = False

        if not found:
            raise ValueError(f"Option '{option}' not found in TELESCOPE_PARK_OPTION")

        self.client.sendNewSwitch(prop)


    def move(self, direction: str):
        """Moves telescope in a specified direction."""

        direction = direction.lower()

        if direction == "stop":
            self.abort_motion()
            print("Telescope motion stopped")
            return {"status": "Telescope motion stopped"}

        motion_map = {
            "north": "MOTION_NORTH",
            "south": "MOTION_SOUTH",
            "east": "MOTION_EAST",
            "west": "MOTION_WEST"
        }
        motion_key = motion_map.get(direction.lower())
        if not motion_key:
            raise ValueError(f"Invalid direction: {direction}")

        motion_prop = "TELESCOPE_MOTION_NS" if direction in ["north", "south"] else "TELESCOPE_MOTION_WE"
        motion = self.device.getSwitch(motion_prop)
        if motion is None:
            raise RuntimeError(f"Could not get motion switch '{motion_prop}'")

        for s in motion:
            s.setState(PyIndi.ISS_OFF)

        for s in motion:
            if s.name == motion_key:
                s.setState(PyIndi.ISS_ON)
                print(f"Telescope moving {direction}")

        self.client.sendNewSwitch(motion)
        return {"status": f"Telescope moving {direction}"}


    def get_utc_time(self):
        """Returns the current UTC time of the telescope."""
        utc_prop = self.device.getText("TIME_UTC")
        if not utc_prop:
            raise RuntimeError("TIME_UTC property not available on device")

        utc_time = None
        offset = None
        
        for item in utc_prop:
            if item.getName() == "UTC":
                utc_time = item.getText()
            elif item.getName() == "OFFSET":
                offset = item.getText()

        if not utc_time or offset is None:
            raise RuntimeError("UTC or OFFSET not found in TIME_UTC")

        date = utc_time.split("T")[0]  # Extract "YYYY-MM-DD"
        time = utc_time.split("T")[1]  # Extract "HH:MM:SS"

        self.logger.debug(f"Date: {date}, UTC Time: {utc_time}, Offset: {offset}")

        return date, time, offset

    def set_utc_time(self, date, time, offset):
        """Sets the UTC time and offset of the telescope."""
        self.logger.debug("Setting UTC time and offset")

        utc_prop = self.device.getText("TIME_UTC")
        if not utc_prop:
            raise RuntimeError("TIME_UTC property not available on device")

        # Build proper ISO datetime string
        formatted_utc = f"{date}T{time}"
        self.logger.debug(f"Formatted UTC: {formatted_utc}, Offset: {offset}")

        for item in utc_prop:
            if item.getName() == "UTC":
                item.setText(formatted_utc)
            elif item.getName() == "OFFSET":
                item.setText(str(float(offset)))

        self.logger.debug(f"Setting UTC time to {formatted_utc} with offset {offset}")

        self.client.sendNewText(utc_prop)


    def get_time(self):
        """Returns the current UTC time and offset of the telescope."""
        time_prop = self.device.getText("TIME_UTC")
        if not time_prop:
            raise RuntimeError("TIME_UTC property not available on device")

        for item in time_prop:
            print(item.getName(), item.getText())

        utc_value = None
        offset_value = None

        for item in time_prop:
            if item.getName() == "UTC":
                utc_value = item.getText()
            elif item.getName() == "OFFSET":
                offset_value = item.getText()

        if not utc_value or offset_value is None:
            raise RuntimeError("UTC or OFFSET not found in TIME_UTC")

        time = utc_value.split("T")[1]  # Extract "HH:MM:SS"
        return time, offset_value


    def set_time(self, new_time, new_offset):
        """Sets telescope time and UTC offset (if supported)."""
        time_prop = self.device.getText("TIME_UTC")
        if not time_prop:
            raise RuntimeError("TIME_UTC text property not available on device")

        utc_element = None
        offset_element = None

        for item in time_prop:
            if item.getName() == "UTC":
                utc_element = item
            elif item.getName() == "OFFSET":
                offset_element = item

        if utc_element is None or offset_element is None:
            raise RuntimeError("UTC or OFFSET element not found in TIME_UTC")

        # Set new UTC time
        current_value = utc_element.getText()
        date_part = current_value.split("T")[0]
        new_utc = f"{date_part}T{new_time.strftime('%H:%M:%S')}"

        time_prop[0].setText(new_utc)
        time_prop[1].setText(new_offset)
        self.client.sendNewText(time_prop)


    def get_date(self):
        """Returns the current date of the telescope."""
        date_prop = self.device.getText("TIME_UTC")
        if not date_prop:
            raise RuntimeError("DATE_UTC or TIME_UTC property not available on device")
        date_prop = date_prop[0].getText().split("T")
        return date_prop[0]
    
    def set_date(self, new_date):
        date_prop = self.device.getText("TIME_UTC")
        if not date_prop:
            raise RuntimeError("TIME_UTC property not available on device")
        
        current_value = date_prop[0].getText()
        time_part = current_value.split("T")[1]
        new_utc = f"{new_date.strftime('%Y-%m-%d')}T{time_part}"
        date_prop[0].setText(new_utc)
        self.client.sendNewText(date_prop)

    def get_tracking_state(self):
        """Returns True if telescope tracking is ON, otherwise False."""
        tracking_switch = self.device.getSwitch("TELESCOPE_TRACK_STATE")
        if not tracking_switch:
            raise RuntimeError("TELESCOPE_TRACK_STATE switch not available on device")

        for item in tracking_switch:
            if item.name == "TRACK_ON":
                return item.s == PyIndi.ISS_ON

        raise RuntimeError("TRACK_ON not found in TELESCOPE_TRACK_STATE")
    
    def set_tracking_state(self, state):
        """Sets the tracking state of the telescope."""
        tracking_switch = self.device.getSwitch("TELESCOPE_TRACK_STATE")
        if not tracking_switch:
            raise RuntimeError("TELESCOPE_TRACK_STATE switch not available on device")

        for item in tracking_switch:
            if item.name == "TRACK_ON":
                item.s = PyIndi.ISS_ON if state else PyIndi.ISS_OFF
            elif item.name == "TRACK_OFF":
                item.s = PyIndi.ISS_OFF if state else PyIndi.ISS_ON

        self.client.sendNewSwitch(tracking_switch)
        return {"status": "Tracking state set", "state": "on" if state else "off"}

    def get_slew_rate(self):
        slew_switch = self.device.getSwitch("TELESCOPE_SLEW_RATE")
        if not slew_switch:
            raise RuntimeError("TELESCOPE_SLEW_RATE not found")

        available_rates = [item.name for item in slew_switch]
        current_rate = next((item.name for item in slew_switch if item.s == PyIndi.ISS_ON), None)

        return {"rates": available_rates, "current": current_rate}

    def set_slew_rate(self, rate_name):
        slew_switch = self.device.getSwitch("TELESCOPE_SLEW_RATE")
        if not slew_switch:
            raise RuntimeError("TELESCOPE_SLEW_RATE not found")

        for item in slew_switch:
            item.s = PyIndi.ISS_ON if item.name == rate_name else PyIndi.ISS_OFF

        self.client.sendNewSwitch(slew_switch)

    def get_site_coords(self):
        """Returns the site coordinates of the telescope."""
        site_coords = self.device.getNumber("GEOGRAPHIC_COORD")
        if not site_coords:
            raise RuntimeError("GEOGRAPHIC_COORD not found")

        latitude = next((item.value for item in site_coords if item.name == "LAT"), None)
        longitude = next((item.value for item in site_coords if item.name == "LONG"), None)
        elevation = next((item.value for item in site_coords if item.name == "ELEV"), None)

        if latitude is None or longitude is None or elevation is None:
            raise RuntimeError("Incomplete site coordinates")

        #self.logger.info(f"Fetched site coordinates: LAT={latitude}, LONG={longitude}, ELEV={elevation}")

        return {"latitude": latitude, "longitude": longitude, "elevation": elevation}

    def set_site_coords(self, latitude, longitude, elevation):
        """Sets the site coordinates of the telescope."""

        self.logger.info(f"[INDI CONTROLLER] Setting site coordinates: LAT={latitude}, LONG={longitude}, ELEV={elevation}")
        site_coords = self.device.getNumber("GEOGRAPHIC_COORD")
        if not site_coords:
            raise RuntimeError("GEOGRAPHIC_COORD not found")

        self.logger.info(f"[INDI CONTROLLER] Available site coordinates: {[item.name for item in site_coords]}")

        for item in site_coords:
            if item.name == "LAT":
                item.value = latitude
            elif item.name == "LONG":
                item.value = longitude
            elif item.name == "ELEV":
                item.value = elevation

        self.logger.info(f"[INDI CONTROLLER] Items: {[item.name for item in site_coords]}")
        #self.logger.info(f"[INDI CONTROLLER] Setting site coordinates: LAT={latitude}, LONG={longitude}, ELEV={elevation}")

        self.client.sendNewNumber(site_coords)
        return {"status": "Site coordinates set", "latitude": latitude, "longitude": longitude, "elevation": elevation}

    def get_site_selection(self):
        """Returns current Sites switch vector as list of dicts {id:int, state:str('On'/'Off')}"""
        sites_prop = self.device.getSwitch("Sites")
        if not sites_prop:
            raise RuntimeError("Sites property not found")

        sites = []
        for item in sites_prop:
            try:
                site_id = int(item.name.split()[-1])  # expects "Site 1" etc.
                state = "On" if item.s == PyIndi.ISS_ON else "Off"
                sites.append({"id": site_id, "state": state})
            except Exception:
                # fallback if naming unexpected
                sites.append({"id": None, "state": "On" if item.s == PyIndi.ISS_ON else "Off"})
        self.logger.info(f"[INDI CONTROLLER] Sites: {sites}")
        return sites

    def set_site_selection(self, site_id):
        """Sets the given site (1-4) active, others off."""
        sites_prop = self.device.getSwitch("Sites")
        if not sites_prop:
            raise RuntimeError("Sites property not found")

        for item in sites_prop:
            try:
                idx = int(item.name.split()[-1])
                item.s = PyIndi.ISS_ON if idx == site_id else PyIndi.ISS_OFF
            except Exception:
                item.s = PyIndi.ISS_OFF

        self.client.sendNewSwitch(sites_prop)

    def get_site_name(self):
        """Returns the name of the currently active site."""
        site_name_prop = self.device.getText("Site Name")
        if not site_name_prop:
            raise RuntimeError("Site Name property not found")

        for item in site_name_prop:
            if item.name == "Name":
                return item.text

        raise RuntimeError("Site Name text element not found")

    def set_site_name(self, name):
        """Sets the name of the currently active site."""
        site_name_prop = self.device.getText("Site Name")
        if not site_name_prop:
            raise RuntimeError("Site Name property not found")

        for item in site_name_prop:
            if item.name == "Name":
                item.setText(name)
                self.client.sendNewText(site_name_prop)
                return

        raise RuntimeError("Site Name text element not found")

    def load_config(self):
        """Loads the telescope configuration and waits until done."""
        config_process_prop = self.device.getSwitch("CONFIG_PROCESS")
        if not config_process_prop:
            raise RuntimeError("Configuration process property not found")

        # Trigger load
        for item in config_process_prop:
            if item.name == "CONFIG_LOAD":
                item.s = PyIndi.ISS_ON
        self.client.sendNewSwitch(config_process_prop)

        # Wait for driver to process (timeout safety)
        start_time = time.time()
        while time.time() - start_time < 5:  # 5-second timeout
            config_process_prop = self.device.getSwitch("CONFIG_PROCESS")
            load_switch = next((i for i in config_process_prop if i.name == "CONFIG_LOAD"), None)
            if load_switch and load_switch.s == PyIndi.ISS_OFF:
                break
            time.sleep(0.1)

        # Reset explicitly (in case driver doesn't auto-reset)
        for item in config_process_prop:
            if item.name == "CONFIG_LOAD":
                item.s = PyIndi.ISS_OFF
        self.client.sendNewSwitch(config_process_prop)

        return {"status": "success"}