from abc import ABC, abstractmethod

class BaseTelescopeController(ABC):
    @abstractmethod
    def move(self, direction: str) -> str:
        pass

    @abstractmethod
    def set_time(self, type_: str, value: str) -> str:
        pass

    @abstractmethod
    def slew_to(self, ra: str, dec: str) -> str:
        pass
