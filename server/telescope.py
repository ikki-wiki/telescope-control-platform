import socket
import time

class Telescope:
    def __init__(self):
        self.host = '10.0.0.1'
        self.port = 4030
        self.timeout = 2  # seconds

    def send_command(self, command):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(self.timeout)
                s.connect((self.host, self.port))
                s.sendall(f":{command}#".encode('ascii'))
                return "Command sent"
        except Exception as e:
            return f"Connection error: {e}"

    def send_command_receive(self, command):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(self.timeout)
                s.connect((self.host, self.port))
                s.sendall(f":{command}#".encode('ascii'))
                time.sleep(0.1)
                response = s.recv(1024).decode('iso-8859-1')
                return response
        except Exception as e:
            return f"Connection error: {e}"
