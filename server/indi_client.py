import PyIndi
import logging

class IndiClient(PyIndi.BaseClient):
    def __init__(self):
        super(IndiClient, self).__init__()
        self.logger = logging.getLogger('IndiClient')
        self.devices = {}

    def newDevice(self, device):
        #self.logger.info(f"New device: {device.getDeviceName()}")
        self.devices[device.getDeviceName()] = device

    def removeDevice(self, device):
        self.logger.info(f"Remove device: {device.getDeviceName()}")
        self.devices.pop(device.getDeviceName(), None)

    def newProperty(self, prop):
        self.logger.info(f"New property: {prop.getName()} for device {prop.getDeviceName()}")

    def updateProperty(self, prop):
        self.logger.debug(f"Update property: {prop.getName()} for device {prop.getDeviceName()}")

    def serverConnected(self):
        self.logger.info(f"Connected to INDI server at {self.getHost()}:{self.getPort()}")

    def serverDisconnected(self, code):
        self.logger.warning(f"Disconnected from INDI server with code {code}")

    def getDeviceByName(self, name):
        return self.devices.get(name, None)
