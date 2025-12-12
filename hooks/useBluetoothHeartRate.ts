
import { useState, useRef, useCallback, useEffect } from 'react';

export const useBluetoothHeartRate = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [bpm, setBpm] = useState<number>(0);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const deviceRef = useRef<any>(null);

  const handleCharacteristicValueChanged = (event: any) => {
    const value = event.target.value;
    if (value) {
      // First byte is flags
      const flags = value.getUint8(0);
      // Bit 0 determines if Heart Rate Value Format is uint8 or uint16
      const rate16Bits = flags & 0x1;
      let result = 0;
      if (rate16Bits) {
        result = value.getUint16(1, true); // Little Endian
      } else {
        result = value.getUint8(1);
      }
      setBpm(result);
    }
  };

  const onDisconnected = () => {
    console.log('Device disconnected');
    setIsConnected(false);
    setBpm(0);
    setDeviceName(null);
  };

  const connect = useCallback(async () => {
    setError(null);
    try {
      const nav = navigator as any;
      if (!nav.bluetooth) {
          throw new Error("Web Bluetooth not supported on this browser.");
      }

      const device = await nav.bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }]
      });

      deviceRef.current = device;
      setDeviceName(device.name || 'Unknown Device');

      device.addEventListener('gattserverdisconnected', onDisconnected);

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('heart_rate');
      const characteristic = await service.getCharacteristic('heart_rate_measurement');

      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', handleCharacteristicValueChanged);

      setIsConnected(true);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Connection failed");
      setIsConnected(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (deviceRef.current && deviceRef.current.gatt && deviceRef.current.gatt.connected) {
      deviceRef.current.gatt.disconnect();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
      return () => {
          if (deviceRef.current && deviceRef.current.gatt && deviceRef.current.gatt.connected) {
              deviceRef.current.gatt.disconnect();
          }
      };
  }, []);

  return { isConnected, bpm, deviceName, connect, disconnect, error };
};
