/*!
 * can.js
 * Copyright(c) 2019 Ed Alegrid  <ealegrid@gmail.com>
 * 
 * MIT Licensed
 *
 */

'use strict';

const { exec } = require('child_process');
const can = require('bindings')('can_addon');

// duplicate process Id variable
var monReadl = 0;
var monSendl = 0;


// duplicate device Id container
var monSendID = [];
var monReadID = [];

/* istanbul ignore next */
function intToHex(value) {
  let number = (+value).toString(16).toUpperCase()
  if( (number.length % 2) > 0 ) { number= "0" + number }
  return number
}

// bring can interface down
/* istanbul ignore next */
var can_if_down = exports.can_if_down = function(device, cb){
  if(!device){
    device = 'can0';
  }
  exec('ifconfig ' + device + ' down', (error, stdout, stderr) => {
    if (error) {
      if(cb){
        return cb(error, null);
      }
      console.error(`ifconfig down error: ${error}`);
      return;
    }
    if(stdout || stderr){
      console.log(`ifconfig down stdout: ${stdout}`);
      if(cb){
        return cb(stderr, null);
      }
      console.error(`ifconfig down stderr: ${stderr}`);
      return;  
    }
    //console.log('bringing '+device+' down', stdout);
    if(cb){
      process.nextTick(function (){
        cb(null, true);
      });
    }
  });
}

// bring can interface up
/* istanbul ignore next */
var can_if_up = exports.can_if_up = function(device, cb){
  if(!device){
    device = 'can0';
  }
  exec('ifconfig ' + device + ' up', (error, stdout, stderr) => {
    if (error) {
      if(cb){
        return cb(error, null);
      }
      console.error(`ifconfig up error: ${error}`);
      return;
    }
    if(stdout || stderr){
      console.log(`ifconfig up stdout: ${stdout}`);
      if(cb){
        return cb(stderr, null);
      }
      console.error(`ifconfig up stderr: ${stderr}`);
      return;  
    }
    // console.log('bringing '+device+' up', stdout);
    if(cb){
      process.nextTick(function (){
        cb(null, true);
      });
    }
  });
}

// set can interface bitrate and txqueuelen
/* istanbul ignore next */
var set_can_if = exports.set_can_if = function(device, bitrate, txqueuelen, cb){
  if(!device || !bitrate || !txqueuelen){
    device = 'can0';
    bitrate = '500000';
    txqueuelen = '500';
  }
  if(bitrate){
    bitrate = bitrate.toString();
  }
  if(txqueuelen){
    txqueuelen = txqueuelen.toString();
  }
  // exec('ip link set '+device+' txqueuelen '+txqueuelen+' type can bitrate ' + bitrate + ' restart-ms 100', (error, stdout, stderr) => {
  exec('ip link set '+device+' type can bitrate ' + bitrate + ' restart-ms 100', (error, stdout, stderr) => {
    /* istanbul ignore next */
    if (error) {
      if(cb){
        return cb(error, null);
      }
      console.error(`set_can_if() error: ${error}`);
      //console.log('Device '+device+' or resource busy');
      return;
    }
    /* istanbul ignore next */
    if(stdout || stderr){
      console.log(`set_can_if() stdout: ${stdout}`);
      if(cb){
        return cb(stderr, null);
      }
      console.error(`set_can_if() stderr: ${stderr}`);
      return;  
    }
    console.log('ip link set '+ device +' up with txqueuelen '+ txqueuelen +' and bitrate '+ bitrate +' - success');
    if(cb){
      process.nextTick(function (){
        cb(null, true);
      });
    }
  });
};

var close = exports.close = function(device, cb){
  if(!device){
    device = 'can0';
  }
  can_if_down(device);
}

// bring up interface can - ifconfig down, set bitrate and txqueuelen, ifconfig up
/* istanbul ignore next */
var open = exports.open = function(device, bitrate, txqueuelen, cb){
  if(!device || !bitrate || !txqueuelen){
    device = 'can0';
    bitrate = '500000';
    txqueuelen = '500';
  }
  
  if(bitrate){
    bitrate = bitrate.toString();
  }

  if(txqueuelen){
    txqueuelen = txqueuelen.toString();
  }

  // can interface down
  can_if_down(device, function(err, result){
    if(err) {
		console.error('can_if_down error', err);
        if(err.code == 255){
			console.error('\nTry running running your app w/ sudo\n'); 
		}
		process.exit();

    }
    if(result){
      // set can bitrate and txqueuelen
      set_can_if(device, bitrate, txqueuelen, function(err, result){
        if(err) return console.error('set_can_if error', err);
        if(result){
          // bring can interface up
          can_if_up(device, function(err, result){
            if(err) return console.error('can_if_down error', err);
            if(result){
              if(cb){
                process.nextTick(function (){
                  cb(null, true);
                });
              }
            }
          });
        }
      });
     }
  });
}

/************************************

      send frame base function

 ************************************/
// send frame data to can bus 
var send_can = function(device, data, cb){
  if(!device){
    device = 'can0';
  }
  if(!data){
    if(cb){ 
      return cb(new Error('missing payload'), null);
    }
    throw new Error('missing payload');
  }
  let rv = can.sc_send(Buffer.from(device + '\0'), Buffer.from(data + '\0'));
  // console.log('send success', rv);
  /* istanbul ignore next */
  if(cb){
    process.nextTick(() => {
      if(rv){
         return cb(rv, null);
      }
      cb(null, rv); 
    });
  }
}

// send a normalized frame data (separate frame id and frame payload), one-time function call
//var sendN = exports.sendN = function(device, id, pl, cb){
var send = exports.send = function(device, id, pl, cb){
  if(typeof id !== 'string'){
    return cb('invalid id', null);	
  }
  /*if(typeof pl !== 'string'){
    return cb('invalid payload', null);	
  }*/ 

  let data = id + '#' + pl; 
  send_can(device, data, cb);
}

// send a normalized frame (separate frame id and frame payload) data continously using an integrated setInterval function
var sendNL = exports.sendNL = function(device, id, pl, cb, interval){
  if(!interval){
    interval = 10;
  }
  if(typeof id !== 'string'){
    return cb('invalid id', null);	
  }
  /*if(typeof pl !== 'string'){
    return cb('invalid payload', null);	
  }*/ 

  let data = id + '#' + pl; 

  send_can(device, data, cb);

  for (let x = 0; x < monSendID.length; x++) {
    if(monSendID[x] === id){
      return;
    }
  }

  monSendID.push(id);
   
  let process_interval = setInterval(function(){
    send_can(device, data, cb);
  }, interval); 
}

// send a classic frame data (id and payload integrated in data), one-time function call
var sendC = exports.sendC = function(device, data, cb){
  if(typeof id !== 'string'){
    return cb('invalid id', null);	
  }
  /*if(typeof pl !== 'string'){
    return cb('invalid payload', null);	
  }*/ 

  send_can(device, data, cb);
}

// send a classic frame data (id and payload integrated in data) continously to can-bus using an itegrated setInterval function
// data = id + '#' + pl
var sendCL = exports.sendCL = function(device, data, cb, interval){
  if(!interval){
    interval = 100;
  }
 
  if(monSendl === 0){
    monSendl++;
  } 
  else{
    return;
  }

  let process_interval = setInterval(function(){
    send_can(device, data, cb);
  }, interval); 
}


/************************************

      read frame base function

 ************************************/
// read frame data from can bus
var read_can = function(device, option, cb){

  let arrFrame, data = [], on = false, timeout = 100;
  let buf = null, buffer_check = null, canID = null, id_string = null, frame = null;

  arrFrame = can.sc_read(Buffer.from(device + '\0'), Buffer.from(option + '\0'), timeout);

  // copy the contents of arrFrame to buf
  buf = Buffer.from(arrFrame);

  buffer_check = Buffer.isBuffer(buf);

  if(buf[0] === 0){
    return  buf[0];
  }
 
  /* istanbul ignore next */
  if(buffer_check && buf[0] === '101'){
    if(cb){
      process.nextTick(()=>{
        return cb(new Error('frame error'));
      });
    }
    //return  buf[0];
    throw new Error(buf[0]);
  }
  /* istanbul ignore next */
  else if(buffer_check && buf[0] === '111'){
    if(cb){
      process.nextTick(()=>{
        return cb(new Error('option error'));
      });
    }
    //return  buf[0];
    throw new Error(buf[0]);
  }
  // outputs valid frame
  else if(buffer_check && buf[0] !== '101' && buffer_check && buf[0] !== '111'){
    // data frame length
    let dataLen = buf[4];
    // console.log('data length', dataLen);
    if(dataLen !== 0 && dataLen < 65){
      // frame data starts at buf[5] 
      for (let x = 0; x < dataLen; x++) {
        // w/ string conversion 
        if(buf[x + 5].toString(16)){
          data[x] = parseInt(buf[x + 5].toString(16), 10); 
        }
      }
    }  

    canID = buf[3] + buf[2] + buf[1] + buf[0]; 
    //console.log('canID', canID);

    // extended can 2.0B => 29 bit or 536870911 dec or 1FFFFFFF hex maximum
    if(canID > 65535 && canID <= 16777215){
      id_string = buf[3].toString(16).toUpperCase() + buf[2].toString(16).toUpperCase()
      + buf[1].toString(16).toUpperCase() + buf[0].toString(16).toUpperCase();
    }
    else if(canID > 4095 && canID <= 65535){
      id_string = buf[2].toString(16).toUpperCase() + buf[1].toString(16).toUpperCase() + buf[0].toString(16).toUpperCase();
    }
    // standard can 2.0A => 11 bit or 2047 dec or 7FF hex maximum
    // always outputs 3 hex chars e.g. 015, 00F, 025
    else {
      id_string = buf[1].toString(16).toUpperCase() + buf[0].toString(16).toUpperCase();
    }
    
    // provide an option for user to get frame data either as an array data or as an object
    frame = {id: id_string, len: buf[4], data: data };
    if(cb){
      process.nextTick(() => {   
        return cb(null, frame); 
      });
    }
    return  buf[0];
  }
}

// read frame data from a specific can id, one-time function call
// w/ option as argument
var readSO = exports.readSO = function(device, option , id, cb){
  if(typeof id !== 'string'){
    return cb('invalid id', null);
  } 
  if(!cb){
    throw new Error('callback is required');
  }
  if(!device){
    device = 'can0';
  }
  if(!option){
    option = '-e';
  }

  read_can(device, option, function(err, frame){
    if(err){return cb(err, null);}
    if(frame.id === id){ 
      cb(null, frame.data); // frame.data[0] + '.' + frame.data[1];
    }
  });
}

// read frame data from a specific can id continously using an integrated setInterval function
// w/ option as argument
var readSOL = exports.readSOL = function(device, option , id, cb, interval){
  if(!interval){
    interval = 10;
  }
  if(typeof id !== 'string'){
    return cb('invalid id', null);
  } 
  if(!cb){
    throw new Error('callback is required');
  }
  if(!device){
    device = 'can0';
  }
  if(!option){
    option = '-e';
  }

  for (let x = 0; x < monReadID.length; x++) {
    if(monReadID[x] === id){
      return;
    }
  }

  monReadID.push(id);
      
  let process_interval = setInterval(function(){
    read_can(device, option, id, function(err, frame){
      if(err){return cb(err, null);}
      if(frame.id === id){ 
        cb(null, frame.data);
      }
    });
  }, interval);
}

// read frame data from a specific can id continously using an integrated setInterval function
// w/ option set to '-e' everytime
//var readSL = exports.readSL = function(device, id, cb, interval){
var read = exports.read = function(device, id, cb, interval){
  let option = '-e';

  if(!interval){
    interval = 10;
  }
  if(typeof id !== 'string'){
    return cb('invalid id', null);
  } 
  if(!cb){
    throw new Error('callback is required');
  }
  if(!device){
    device = 'can0';
  }
  if(!option){
    option = '-e';
  }

  for (let x = 0; x < monReadID.length; x++) {
    if(monReadID[x] === id){
      return;
    }
  }

  monReadID.push(id);
      
  let process_interval = setInterval(function(){
    read_can(device, option, function(err, frame){
      if(err){return cb(err, null);}
      if(frame.id === id){ 
        cb(null, frame.data);
      }
    });
  }, interval);
}

// read all available frame data from can bus, one-time function call 
// w/ option as argument
var readAO = exports.readAO = function(device, option, cb){
  if(!cb){
    throw new Error('callback is required');
  }
  if(!device){
    device = 'can0';
  }
  if(!option){
    option = '-e';
  }
  
  read_can(device, option, cb);
}

// read all available frame data from can bus continously using an integrated setInterval function 
// w/ option as argument
var readAOL = exports.readAOL = function(device, option, cb, interval){
  if(!interval){
    interval = 10;
  }

  if(monReadl === 0){
    monReadl++;
  } 
  else{
    return;
  }

  let process_interval = setInterval(() => {
    readAO(device, option, cb);
  }, interval); 
}


// read all available frame data from can bus continously using an integrated setInterval function 
// w/ option set to '-e' everytime
//var readAL = exports.readAL = function(device, cb, interval){
var readAll = exports.readAll = function(device, cb, interval){
  let option = '-e';

  if(!interval){
    interval = 10;
  }

  if(monReadl === 0){
    monReadl++;
  } 
  else{
    return;
  }

  let process_interval = setInterval(() => {
    readAO(device, option, cb);
  }, interval); 
}
