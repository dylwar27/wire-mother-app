from dataclasses import dataclass
from enum import StrEnum, auto
from typing import Any, Callable, Optional


class SlideProjectorController:
    """Interface for slide projector controller

    Parameters
    ----------
    bluetooth_name : str
        The name of the bluetooth device to connect to.
    button_callback : callable, optional
        A blocking function to be called each time a button is pressed on the projector.
        The function should take a single argument, which is usually an instance of
        `SlideProjectorButtonEvent`. If an error occurs, the function will be called with
        an instance of `SlideProjectorError` as the argument, instead. If no callback is
        provided, button presses won't be monitored.

    Attributes
    ----------
    button_callback : callable or None
        The callback function, as specified in the constructor.
    ble_device : bleak.backends.device.BLEDevice or None
        The bleak bluetooth device, which holds metadata about the device. Before
        `set_up()` is called, this is None.
    ble_client : bleak.BleakClient or None
        The bleak client used to communicate with the device. Is None until `set_up()`.

    Raises
    ------
    TypeError
        If parameters do not match the expected types.
    """

    def __init__(
        self,
        bluetooth_name: str,
        button_callback: Optional[Callable[["SlideProjectorButtonEvent"], Any]] = None,
    ) -> None: ...

    async def set_up(self) -> None:
        """Set up the instance (must be called before first use)

        Raises
        ------
        DeviceNotFoundError
            If no device with the specified name is found.
        WrongDeviceError
            If the specified device is not a slide projector controller.
        BleakError
            For bluetooth errors.
        """
        ...

    async def clean_up(self) -> None:
        """Clean up the instance (must be called before exiting)"""
        ...

    async def __aenter__(self) -> "SlideProjectorController":
        """Enter the context manager

        Returns
        -------
        SlideProjectorController
            The interface instance.

        See Also
        --------
        set_up : Called to set up the instance.
        """
        ...

    async def __aexit__(self, *args) -> None:
        """Exit the context manager

        See Also
        --------
        clean_up : Called to clean up the instance.
        """
        ...

    async def ensure_connected(self) -> None:
        """Raise an error if the projector is not connected"""
        ...

    async def move_carousel(self, slides: int = 1) -> None:
        """Move the carousel by the specified number of slides

        Parameters
        ----------
        slides : int, default 1
            The number of slides to move. Negative numbers move backwards.
        """
        ...


class SlideProjectorButton(StrEnum):
    INTEGRATED_FORWARD = auto()
    INTEGRATED_REVERSE = auto()
    REMOTE_FORWARD = auto()
    REMOTE_REVERSE = auto()


@dataclass(frozen=True)
class SlideProjectorButtonEvent:
    """A button press or release event from the slide projector

    Attributes
    ----------
    button : SlideProjectorButton
        The button that was pressed or released.
    hold_ms : int or None
        If the event represents a button press, this is None. If the event represents a
        button release, this is the duration of the button press, in milliseconds.
    """

    button: SlideProjectorButton
    hold_ms: Optional[int] = None


class SlideProjectorError(Exception):
    """Base class for errors related to the slide projector controller interface"""

    pass


class DeviceNotFoundError(SlideProjectorError):
    """Error raised when the specified bluetooth device is not found"""

    pass


class WrongDeviceError(SlideProjectorError):
    """Error raised when the specified bluetooth device is not a slide projector controller"""

    pass


class NotSetUpError(SlideProjectorError):
    """Error raised if the interface is used before being set up"""

    pass


class HardwareError(SlideProjectorError):
    """Error raised if the controller hardware encounters an error"""

    pass


class DisconnectedError(SlideProjectorError):
    """Error raised if the controller is disconnected unexpectedly"""

    pass
