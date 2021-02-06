/*!
 * can util apps
 * Copyright(c) 2017 Ed Alegrid
 * MIT Licensed
 *
 */

'use strict';

const can = require('m2m-can');
const r = require('array-gpio');

/* setup can bus device led status indicator using array-gpio*/
let led1 = r.out(33); // can device status
let led2 = r.out(35); // data change status

let random = null, current_random = null;

let device_id = '035';

// Initialize can bus by setting the bitrate and txquelen value
can.open('can0', 500000, 1000, function(err, result){
  if(err) return console.log('can open error', err.message);

    led1.off();
	led2.off();
 
	// send/broadcast random data to can bus at a specified interval 
    setInterval(() => {
	
        let random_fraction = Math.floor(( Math.random() * 50) + 25);
		random = Math.floor(( Math.random() * 90) + 10) + '.' + random_fraction;
		
		if(!random){
		  current_random = random; 
		}
	
		// send only if random data has changed
		if(random !== current_random){

          // random value should not exceed 99.99 

		  console.log('current_random', random);

          can.send('can0', device_id, random, (err) => {
			if(err) return console.error('can send error', err);

			console.log('** random data has changed, sending can data');

			current_random = random;

		    // blink led pin 35 to indicate a random data change 
			led2.on();
			led2.off(300);
		  });
		}

    }, 2000);

});


