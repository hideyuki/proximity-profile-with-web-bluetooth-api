'use strict';

import EventEmitter from 'events';

/**
 * Proximity Profile Event
 * @type {{SelectedDevice: string, ConnectedGATT: string, DiscoveredServices: string, DiscoveredCharacteristics: string, Initialized: string, Error: string}}
 */
let ProximityEvent = {
  SelectedDevice:            'selected_device',
  ConnectedGATT:             'connected_gatt',
  DiscoveredServices:        'discovered_services',
  DiscoveredCharacteristics: 'discovered_characteristics',
  Initialized:               'initialized',
  Error:                     'error'
};


/**
 * Proximity Profile Class
 */
class ProximityProfile extends EventEmitter {
  /**
   * Initialize member variables
   * @constructor
   */
  constructor(){
    super();

    // Member variables
    this._deviceName = '';
    this._deviceId   = '';

    this._linkLossService       = null;
    this._immediateAlertService = null;
    this._txPowerService        = null;

    this._linkLossAlertLevelCharacteristic  = null;
    this._immediateAlertLevelCharacteristic = null;
    this._txPowerLevelCharacteristic        = null;
  }

  /**
   * Initialization
   */
  initialize(){
    this._scanDevice();
  }

  /**
   * Read link loss alert level
   * @returns {Promise}
   */
  readLinkLossAlertLevel(){
    return this._readCharacteristic(this._linkLossAlertLevelCharacteristic);
  }

  /**
   * Write link loss alert level
   * @param level 0: "No Alert", 1: "Mild Alert", 2: "High Alert"
   * @returns {Promise}
   */
  writeLinkLossAlertLevel(level){
    return this._writeCharacteristic(this._linkLossAlertLevelCharacteristic, level);
  }

  /**
   * Write immediate alert level
   * @param level 0: "No Alert", 1: "Mild Alert", 2: "High Alert"
   * @returns {Promise}
   */
  writeImmediateAlertLevel(level){
    return this._writeCharacteristic(this._immediateAlertLevelCharacteristic, level);
  }

  /**
   * Read Tx power level
   * @returns {Promise}
   */
  readTxPowerLevel(){
    return this._readCharacteristic(this._txPowerLevelCharacteristic);
  }

  /**
   * Scan device
   * @private
   */
  _scanDevice(){
    // Discover
    navigator.bluetooth.requestDevice({
      filters: [{
        services: [
          'link_loss',
          'immediate_alert',
          'tx_power'
        ]
      }]
    })
      // Found
      .then(device =>{
        this._deviceName = device.name;
        this._deviceId   = device.id;

        this.emit(ProximityEvent.SelectedDevice, this._deviceName, this._deviceId);

        return device.connectGATT();
      })
      // Connected GATT
      .then(server =>{
        this.emit(ProximityEvent.ConnectedGATT, server);

        return Promise.all([
          server.getPrimaryService('link_loss'),
          server.getPrimaryService('immediate_alert'),
          server.getPrimaryService('tx_power')
        ]);
      })
      // Discovered services
      .then(services =>{
        //console.log('services', services);

        this.emit(ProximityEvent.DiscoveredServices, services);

        this._linkLossService       = services[0];
        this._immediateAlertService = services[1];
        this._txPowerService        = services[2];

        return Promise.all([
          // Link Loss Service: Alert Level(Read/Write)
          this._linkLossService.getCharacteristic('alert_level'),
          // Immediate Alert Service: Alert Level(WriteWithoutResponse)
          this._immediateAlertService.getCharacteristic('alert_level'),
          // Tx Power Service: Tx Power Level(Read)
          this._txPowerService.getCharacteristic('tx_power_level')
        ]);
      })
      // Discovered characteristics
      .then(characteristics =>{
        //console.log('characteristics', characteristics);

        this.emit(ProximityEvent.DiscoveredCharacteristics, characteristics);

        this._linkLossAlertLevelCharacteristic  = characteristics[0];
        this._immediateAlertLevelCharacteristic = characteristics[1];
        this._txPowerLevelCharacteristic        = characteristics[2];

        this.emit(ProximityEvent.Initialized);
      })
      // Error
      .catch(error =>{
        this.emit(ProximityEvent.Error, error);
      });
  }

  /**
   * Write characteristic
   * @param characteristic Selected characteristic
   * @param data Writing data
   * @returns {Promise}
   * @private
   */
  _writeCharacteristic(characteristic, data){
    if(characteristic){
      let dataArray = new Uint8Array([data]);
      return characteristic.writeValue(dataArray);
    }
    else{
      return Promise.reject('No characteristics');
    }
  }

  /**
   *  Read characteristic
   * @param characteristic Selected characteristic
   * @returns {Promise}
   * @private
   */
  _readCharacteristic(characteristic){
    if(characteristic){
      return characteristic.readValue()
        .then(dataArray =>{
          let data = new Uint8Array(dataArray)[0];
          return Promise.resolve(data);
        });
    }
    else{
      return Promise.reject('No characteristics');
    }
  }
}

window.ProximityProfile = ProximityProfile;

navigator.bluetooth.requestDevice({
  filters: [{
    services: [
      'link_loss',
      'immediate_alert',
      'tx_power'
    ]
  }]
})
  // Found
  .then(device =>{
    this._deviceName = device.name;
    this._deviceId   = device.id;

    this.emit(ProximityEvent.SelectedDevice, this._deviceName, this._deviceId);

    return device.connectGATT();
  })
  // Connected GATT
  .then(server =>{
    this.emit(ProximityEvent.ConnectedGATT, server);

    return Promise.all([
      server.getPrimaryService('link_loss'),
      server.getPrimaryService('immediate_alert'),
      server.getPrimaryService('tx_power')
    ]);
  })
  // Discovered services
  .then(services =>{
    //console.log('services', services);

    this.emit(ProximityEvent.DiscoveredServices, services);

    this._linkLossService       = services[0];
    this._immediateAlertService = services[1];
    this._txPowerService        = services[2];

    return Promise.all([
      // Link Loss Service: Alert Level(Read/Write)
      this._linkLossService.getCharacteristic('alert_level'),
      // Immediate Alert Service: Alert Level(WriteWithoutResponse)
      this._immediateAlertService.getCharacteristic('alert_level'),
      // Tx Power Service: Tx Power Level(Read)
      this._txPowerService.getCharacteristic('tx_power_level')
    ]);
  })
  // Discovered characteristics
  .then(characteristics =>{
    //console.log('characteristics', characteristics);

    this.emit(ProximityEvent.DiscoveredCharacteristics, characteristics);

    this._linkLossAlertLevelCharacteristic  = characteristics[0];
    this._immediateAlertLevelCharacteristic = characteristics[1];
    this._txPowerLevelCharacteristic        = characteristics[2];

    this.emit(ProximityEvent.Initialized);
  })
  // Error
  .catch(error =>{
    this.emit(ProximityEvent.Error, error);
  });