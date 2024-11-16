// BluetoothTerminal class definition
class BluetoothTerminal {
  constructor(serviceUuid = 0xFFE0, rxCharacteristicUuid = 0xFFE1, txCharacteristicUuid = 0xFFE2) {
    this._serviceUuid = serviceUuid;
    this._txCharacteristicUuid = txCharacteristicUuid;
    this._rxCharacteristicUuid = rxCharacteristicUuid;
    this._device = null;
    this._txCharacteristic = null;
    this._rxCharacteristic = null;
  }

  // Connect to the BLE device
  async connect() {
    try {
      console.log('Requesting Bluetooth Device...');
      this._device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [this._serviceUuid] }]
      });

      console.log('Connecting to GATT Server...');
      const server = await this._device.gatt.connect();

      console.log('Getting Service...');
      const service = await server.getPrimaryService(this._serviceUuid);

      console.log('Getting TX Characteristic...');
      this._txCharacteristic = await service.getCharacteristic(this._txCharacteristicUuid);

      console.log('Getting RX Characteristic...');
      this._rxCharacteristic = await service.getCharacteristic(this._rxCharacteristicUuid);

      console.log('Starting Notifications for RX...');
      await this._rxCharacteristic.startNotifications();
      this._rxCharacteristic.addEventListener('characteristicvaluechanged', this._handleCharacteristicValueChanged.bind(this));

      console.log('Connected and ready to send and receive data!');
      document.getElementById('deviceInfo').innerText = `Connected to: ${this._device.name}`;
      document.getElementById('connectButton').style.display = 'none';

    } catch (error) {
      console.error('Error:', error);
    }
  }

  // Handle received data
  _handleCharacteristicValueChanged(event) {
    const value = new TextDecoder().decode(event.target.value);
    console.log('Received:', value);
    const receivedData = document.getElementById('receivedData');
    receivedData.innerText += value + '\n';
    receivedData.scrollTop = receivedData.scrollHeight; // Auto-scroll to the bottom
  }

  // Send data to the BLE device
  async send(data) {
    if (!this._txCharacteristic) {
      console.error('No connected device.');
      return;
    }
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);
    try {
      await this._txCharacteristic.writeValue(encodedData);
      console.log('Data sent:', data);
    } catch (error) {
      console.error('Failed to send data:', error);
    }
  }
}

// P5.js setup
let bluetoothTerminal;

function setup() {
  noCanvas();
  bluetoothTerminal = new BluetoothTerminal();

  // Button to connect to the BLE device
  const connectButton = document.getElementById('connectButton');
  connectButton.style.display = 'block';
  connectButton.addEventListener('click', () => {
    bluetoothTerminal.connect();
  });

  // Button to send data
  document.getElementById('sendButton').addEventListener('click', sendInputData);

  // Add keydown event listener to the input field
  const inputField = document.getElementById('dataToSend');
  inputField.addEventListener('keydown', (event) => {
    console.log('key', event.key);
    if (event.key === 'Enter') {
      sendInputData();
    }
  });
}

// Function to send data from the input field
function sendInputData() {
  const data = document.getElementById('dataToSend').value;
  if (data.trim() !== '') {
    bluetoothTerminal.send(data);
    document.getElementById('dataToSend').value = ''; // Clear the input field
  }
}
