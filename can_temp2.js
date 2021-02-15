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

let temp = null, current_temp = null;

/* rpi temperature device id */ 
let temp_id = '025';

can.open('can0', 500000, 1000, function(err, result){
  if(err) return console.error('can open err', err);

     // turn on rpi can_temp led indicator
     led[0].on();

     // send/broadcast temperature data to can bus using a specified interval 
     setInterval(() => {
	
	temp = i2c.getTemp();

	if(current_temp !== temp){

	  console.log(current_temp, temp);

	  can.send('can0', temp_id, temp, (err) => {
	    if(err) return console.error('can send payload error', err);

	    console.log('** temp has changed, sending can data');

	    current_temp = temp;

            // blink led pin 35 to indicate temp change 
	    led[1].on();
	    led[1].off(300);
	  });
	}

	/*
        can.read('can0', temp_id, (err, frame) => {
	  if(err) return console.error('can send payload error', err);
          console.log('read frame', frame);
        });*/
       
     }, 1000);
     	
     // read all frame data from can bus
     can.readAll('can0', (err, frame) => {
       if(err) return console.error('can send payload error', err);
       console.log('read all frame data', frame);
     });

});
