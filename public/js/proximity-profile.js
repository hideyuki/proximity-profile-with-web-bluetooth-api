(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.proximityProfile = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],2:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

/**
 * Proximity Profile Event
 * @type {{SelectedDevice: string, ConnectedGATT: string, DiscoveredServices: string, DiscoveredCharacteristics: string, Initialized: string, Error: string}}
 */
var ProximityEvent = {
  SelectedDevice: 'selected_device',
  ConnectedGATT: 'connected_gatt',
  DiscoveredServices: 'discovered_services',
  DiscoveredCharacteristics: 'discovered_characteristics',
  Initialized: 'initialized',
  Error: 'error'
};

/**
 * Proximity Profile Class
 */

var ProximityProfile = (function (_EventEmitter) {
  _inherits(ProximityProfile, _EventEmitter);

  /**
   * Initialize member variables
   * @constructor
   */

  function ProximityProfile() {
    _classCallCheck(this, ProximityProfile);

    _get(Object.getPrototypeOf(ProximityProfile.prototype), 'constructor', this).call(this);

    // Member variables
    this._deviceName = '';
    this._deviceId = '';

    this._linkLossService = null;
    this._immediateAlertService = null;
    this._txPowerService = null;

    this._linkLossAlertLevelCharacteristic = null;
    this._immediateAlertLevelCharacteristic = null;
    this._txPowerLevelCharacteristic = null;
  }

  /**
   * Initialization
   */

  _createClass(ProximityProfile, [{
    key: 'initialize',
    value: function initialize() {
      this._scanDevice();
    }

    /**
     * Read link loss alert level
     * @returns {Promise}
     */
  }, {
    key: 'readLinkLossAlertLevel',
    value: function readLinkLossAlertLevel() {
      return this._readCharacteristic(this._linkLossAlertLevelCharacteristic);
    }

    /**
     * Write link loss alert level
     * @param level 0: "No Alert", 1: "Mild Alert", 2: "High Alert"
     * @returns {Promise}
     */
  }, {
    key: 'writeLinkLossAlertLevel',
    value: function writeLinkLossAlertLevel(level) {
      return this._writeCharacteristic(this._linkLossAlertLevelCharacteristic, level);
    }

    /**
     * Write immediate alert level
     * @param level 0: "No Alert", 1: "Mild Alert", 2: "High Alert"
     * @returns {Promise}
     */
  }, {
    key: 'writeImmediateAlertLevel',
    value: function writeImmediateAlertLevel(level) {
      return this._writeCharacteristic(this._immediateAlertLevelCharacteristic, level);
    }

    /**
     * Read Tx power level
     * @returns {Promise}
     */
  }, {
    key: 'readTxPowerLevel',
    value: function readTxPowerLevel() {
      return this._readCharacteristic(this._txPowerLevelCharacteristic);
    }

    /**
     * Scan device
     * @private
     */
  }, {
    key: '_scanDevice',
    value: function _scanDevice() {
      var _this = this;

      // Discover
      navigator.bluetooth.requestDevice({
        filters: [{
          services: ['link_loss', 'immediate_alert', 'tx_power']
        }]
      })
      // Found
      .then(function (device) {
        _this._deviceName = device.name;
        _this._deviceId = device.id;

        _this.emit(ProximityEvent.SelectedDevice, _this._deviceName, _this._deviceId);

        return device.connectGATT();
      })
      // Connected GATT
      .then(function (server) {
        _this.emit(ProximityEvent.ConnectedGATT, server);

        return Promise.all([server.getPrimaryService('link_loss'), server.getPrimaryService('immediate_alert'), server.getPrimaryService('tx_power')]);
      })
      // Discovered services
      .then(function (services) {
        //console.log('services', services);

        _this.emit(ProximityEvent.DiscoveredServices, services);

        _this._linkLossService = services[0];
        _this._immediateAlertService = services[1];
        _this._txPowerService = services[2];

        return Promise.all([
        // Link Loss Service: Alert Level(Read/Write)
        _this._linkLossService.getCharacteristic('alert_level'),
        // Immediate Alert Service: Alert Level(WriteWithoutResponse)
        _this._immediateAlertService.getCharacteristic('alert_level'),
        // Tx Power Service: Tx Power Level(Read)
        _this._txPowerService.getCharacteristic('tx_power_level')]);
      })
      // Discovered characteristics
      .then(function (characteristics) {
        //console.log('characteristics', characteristics);

        _this.emit(ProximityEvent.DiscoveredCharacteristics, characteristics);

        _this._linkLossAlertLevelCharacteristic = characteristics[0];
        _this._immediateAlertLevelCharacteristic = characteristics[1];
        _this._txPowerLevelCharacteristic = characteristics[2];

        _this.emit(ProximityEvent.Initialized);
      })
      // Error
      ['catch'](function (error) {
        _this.emit(ProximityEvent.Error, error);
      });
    }

    /**
     * Write characteristic
     * @param characteristic Selected characteristic
     * @param data Writing data
     * @returns {Promise}
     * @private
     */
  }, {
    key: '_writeCharacteristic',
    value: function _writeCharacteristic(characteristic, data) {
      if (characteristic) {
        var dataArray = new Uint8Array([data]);
        return characteristic.writeValue(dataArray);
      } else {
        return Promise.reject('No characteristics');
      }
    }

    /**
     *  Read characteristic
     * @param characteristic Selected characteristic
     * @returns {Promise}
     * @private
     */
  }, {
    key: '_readCharacteristic',
    value: function _readCharacteristic(characteristic) {
      if (characteristic) {
        return characteristic.readValue().then(function (dataArray) {
          var data = new Uint8Array(dataArray)[0];
          return Promise.resolve(data);
        });
      } else {
        return Promise.reject('No characteristics');
      }
    }
  }]);

  return ProximityProfile;
})(_events2['default']);

window.ProximityProfile = ProximityProfile;

navigator.bluetooth.requestDevice({
  filters: [{
    services: ['link_loss', 'immediate_alert', 'tx_power']
  }]
})
// Found
.then(function (device) {
  undefined._deviceName = device.name;
  undefined._deviceId = device.id;

  undefined.emit(ProximityEvent.SelectedDevice, undefined._deviceName, undefined._deviceId);

  return device.connectGATT();
})
// Connected GATT
.then(function (server) {
  undefined.emit(ProximityEvent.ConnectedGATT, server);

  return Promise.all([server.getPrimaryService('link_loss'), server.getPrimaryService('immediate_alert'), server.getPrimaryService('tx_power')]);
})
// Discovered services
.then(function (services) {
  //console.log('services', services);

  undefined.emit(ProximityEvent.DiscoveredServices, services);

  undefined._linkLossService = services[0];
  undefined._immediateAlertService = services[1];
  undefined._txPowerService = services[2];

  return Promise.all([
  // Link Loss Service: Alert Level(Read/Write)
  undefined._linkLossService.getCharacteristic('alert_level'),
  // Immediate Alert Service: Alert Level(WriteWithoutResponse)
  undefined._immediateAlertService.getCharacteristic('alert_level'),
  // Tx Power Service: Tx Power Level(Read)
  undefined._txPowerService.getCharacteristic('tx_power_level')]);
})
// Discovered characteristics
.then(function (characteristics) {
  //console.log('characteristics', characteristics);

  undefined.emit(ProximityEvent.DiscoveredCharacteristics, characteristics);

  undefined._linkLossAlertLevelCharacteristic = characteristics[0];
  undefined._immediateAlertLevelCharacteristic = characteristics[1];
  undefined._txPowerLevelCharacteristic = characteristics[2];

  undefined.emit(ProximityEvent.Initialized);
})
// Error
['catch'](function (error) {
  undefined.emit(ProximityEvent.Error, error);
});

},{"events":1}]},{},[2])(2)
});