'use strict';

// Utility functions
function updateBLEProgress(progress){
  $('#ble_progress').css('width', progress + "%");
}

function convertHexString(value){
  return '0x' + ('0' + value.toString(16)).slice(-2).toUpperCase();
}

function convertdBm(value){
  if(value > 127){
    value = value - 256;
  }
  return value;
}

function convertAlertLevel(value){
  switch(value){
    case 0:
      return 'No Alert';
    case 1:
      return 'Mild Alert';
    case 2:
      return 'High Alert';
    default:
      return 'Unknown';
  }
}

// Proximity Profile
var profile = new ProximityProfile();
profile
  .on('selected_device', function(deviceName, deviceId){
    $('#device-name').html(deviceName);
    $('#device-id').html(deviceId);

    updateBLEProgress(20);
  })
  .on('connected_gatt', function(){
    updateBLEProgress(40);
  })
  .on('discovered_services', function(){
    updateBLEProgress(60);
  })
  .on('discovered_characteristics', function(){
    updateBLEProgress(80);
  })
  .on('initialized', function(){
    updateBLEProgress(100);

    // Show GATT information
    $('#gatt').show();
  })
  .on('error', function(error){
    // Disable discover button
    $('#discover').prop('disabled', false);

    // Show error message
    $('#error').show();
    $('#error-body').html(error.toString());
  });

// jQuery
$(function(){
  // Check support Web Bluetooth API
  if(navigator.bluetooth){
    $('#main').show();
  }else{
    $('#doesnt-support').show();
  }

  // Click discover button
  $('#discover').click(function(){
    $('#discover').prop('disabled', true);
    profile.initialize();
  });

  // Read link loss alert level
  $('#read-link-loss-alert-level').click(function(){
    profile.readLinkLossAlertLevel()
      .then(function(alertLevel){
        $('#link-loss-alert-level').html(
          convertHexString(alertLevel) + ' (' + convertAlertLevel(alertLevel) + ')'
        );
      });
  });

  // Write link loss alert level
  $('#btn-group-link-loss-alert-level > button').click(function(e){
    var level = $(e.target).data('level');
    profile.writeLinkLossAlertLevel(level);
  });

  // Write immediate alert level
  $('#btn-group-immediate-alert-level > button').click(function(e){
    var level = $(e.target).data('level');
    profile.writeImmediateAlertLevel(level);
  });

  // Read Tx Power level
  $('#read-tx-power-level').click(function(){
    profile.readTxPowerLevel()
      .then(function(txPowerLevel){
        $('#tx-power-level').html(
          convertHexString(txPowerLevel) + ' (' + convertdBm(txPowerLevel) + 'dBm)'
        );
      });
  });
});
