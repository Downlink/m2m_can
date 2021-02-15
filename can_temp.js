/*!
 * can util apps
 * Copyright(c) 2017 Ed Alegrid
 * MIT Licensed
 *
 */

'use strict';

const can = require('m2m-can');
const r = require('array-gpio');

/* using built-in i2c library for capturing temperature data using the MCP9808 chip */
let i2c =  require('./node_modules/array-gpio/examples/i2c9808.js');

/* setup led status indicator using array-gpio */
let led = r.out(33, 35); 

/* temp variables */
let temp = null, current_temp = null;

/* rpi temperature device id */ 
let temp_id = '025';


//can.open('can0', 500000, function(err, result){
can.open('can0', {bitrate:500000, txqueuelen:500, rs:10}, function(err, result){
  if(err) return console.error('can open err', err);

  console.log('result', result);

  // turn on rpi can_temp led indicator
  led[0].on();

  // watch data changes in a cyclic mode using a setInterval
  // built-in within the watch method

  can.watch('can0', temp_id, (err, data) => { // interval = 100
  //can.watch('can0', {id:temp_id, interval:1000}, (err, data) => {
    if(err) return console.error('can watch error', err);

    data.interval = 1000; 
    data.payload = i2c.getTemp();

    // if data value has changed, send data to can bus
    if(data.change){
      console.log('send temp data ...'); 
      led[1].pulse(200); 
      can.send('can0', data.id, data.payload);
    }
    else{
      console.log('no temp data change...');
    }
  });

});



