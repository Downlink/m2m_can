'use strict';

const m2m = require('m2m');
const can = require('m2m-can');

let temp = null, random = null;

/* can-gateway device frame id or can node id */
let device_id = '00C'; 

/* temperature can device frame id */
let temp_id = '025';

/* random can device frame id */
let random_id = '035';

// create an m2m device/server object that will serve as "can-gateway"
const device = new m2m.Device(300);

device.connect(function(err, result){
  if(err) return console.error('connect error:', err.message);

  console.log('result:', result);
  	
  /* open can0 interface, set bitrate to 500000 and txqueuelen to 1000 */
  can.open('can0', 500000, 1000, function(err, result){
    if(err) return console.error('can error', err);
    // ip link set can0 up with txqueuelen 1000 and bitrate 500000 - success

    console.log('can.open result', result);
 
    // can-temp	   
    device.setChannel('can-temp', function(err, data){
      if(err) return console.error('can-temp error:', err.message);

      // read frame data from temp_id 	
      can.read('can0', temp_id , function(err, fdata){
        if(err) return console.log('read error', err);

        console.log('can-temp frame data', fdata);
        // fdata[0] - integer value
        // fdata[1] - fractional value    
        temp = fdata[0] + '.' + fdata[1];
        data.send(temp); 
      });
    });
	
    // can-random
    device.setChannel({name:'can-random', interval: 7000}, function(err, data){
      if(err) return console.error('can-random error:', err.message);

      // read frame data from random_id 
      can.read('can0', random_id, function(err, fdata){
        if(err) return console.log('read error', err);

        console.log('can-random frame data', fdata);   
        // fdata[0] - integer value
        // fdata[1] - fractional value    
        random = fdata[0] + '.' + fdata[1];
        data.send(random);
      });
    });
	
    /*// can-test
    device.setChannel('can-test', function(err, data){
      if(err) return console.error('can-test error:', err.message);
	
      let rn = Math.floor(( Math.random() * 90) + 5);
      data.send(rn);
      console.log('can-test', rn);
    });*/
  
  });
});
