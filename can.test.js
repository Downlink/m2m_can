/*!
 * can.test.js
 * Author: 2019 Ed Alegrid  <ealegrid@gmail.com>
 *
 */

const assert = require('assert');
const sinon = require('sinon');

const can = require('../lib/can.js'); 
// sudo chown -R $(whoami) path_to_vue_templates_folder

before(() => {
  sinon.stub(console, 'log'); 
  sinon.stub(console, 'info'); 
  sinon.stub(console, 'warn');
  sinon.stub(console, 'error'); 
});

// bitrate -  rates up to 1 Mbit/s
// qlen - length of the transmit queue 
// rs - restart-ms

// verify using cmd below
// $ip -details link show can0
// ref link https://www.systutorials.com/docs/linux/man/8-ip-link/

describe('\nOpen default can0 interface ...', function () {
  describe('Open can0 interface using a custom bitrate w/ qlen and restart-ms default settings', function () {
    it('it should open the can interface w/o error', function (done) {
      // open w/ 500khz bitrate default settings 1000 qlen and 100 rs (restart-ms) 
      can.open('can0', 500000, function(err, result){
        if(err) return console.error('can error', err);
        if(result){
          assert.strictEqual( result, true);
          done();
        } 
      });
    });
  });
  describe('Open can0 interface w/ custom bitrate and qlen arguments', function () {
    it('it should open the can interface w/o error', function (done) {
      // open w/ 500khz bitrate & 1000 qlen values
      can.open('can0', 500000, 1000, function(err, result){
        if(err) return console.error('can error', err);
        if(result){
          assert.strictEqual( result, true);
          done();
        } 
      });
    });
  });
  describe('Open can0 interface using custom bitrate, qlen and rs (restart-ms) arguments as option', function () {
    it('it should open the can interface w/o error', function (done) {
      // open w/ 500khz bitrate, 500 qlen and rs(restart-ms) 10 custom values
      can.open('can0', {bitrate:500000, qlen:1000, rs:10}, function(err, result){
        if(err) return console.error('can error', err);
        if(result){
          assert.strictEqual( result, true);
	        done();
        } 
      });
    });
  });
});

describe('\nSend data to can bus ...', function () {
  describe('SendC (classic) data to can0 interface', function () {
    it('it should send the data w/o error', function (done) {
      setTimeout(function(){
        let pl = '0CD' + '#' + '33.21';
        let count = 0;

      	can.sendC('can0', pl, function(err, result) {
	        if(err) return console.error('can send payload error', err);
          if(count === 0){
	          console.log('result', result);
	          assert.strictEqual( err, null);
            assert.strictEqual( result, 0);
            done();count++;
          }
      	});
       
        can.read('can0', {option:'-e', cyclic:false}, function(err, frame){ 
          if(err) return console.log('read error', err.message);
          console.log('*frame', frame);
        });
      }, 10);
    });
  });
  describe('SendC (classic) data w/o arguments', function () {
    it('it should throw an "invalid can interface argument" error', function (done) {
      setTimeout(function(){
        try{
          can.send();
        }
        catch(e){
          done();
	        assert.strictEqual( e.message, 'invalid can interface argument');
        } 
      }, 20);
   });
  });
  describe('Send data w/ valid arguments', function () {
    it('it should send data w/o error', function (done) {
      setTimeout(function(){

        let id = '0AC';
        let data = '56.28';
         
	      can.send('can0', id, data, function(err, result) {
          if(err){ return console.log('err', err);}
          assert.strictEqual( err, null);
          assert.strictEqual( result, 0);
          done();  
	      });

      }, 30);

    });
  });
  describe('Send data w/o callback', function () {
    it('it should send data w/o error', function (done) {
      setTimeout(function(){

	      let id = '0FC';
        let data = Math.floor(( Math.random() * 50) + 25);
        let count = 0;
         
        // send data w/ id above
        let time_out = setInterval(() => {
	        can.send('can0', id, data);
        }, 10); 
          
	      // read only data from the above id  
        can.read('can0', {id:id}, function(err, frame){
	        if(err){ return console.log('err', err);}

          if(count === 0){
            count++;
            assert.strictEqual( err, null);
            assert.strictEqual( id, frame.id);
            assert.strictEqual( data, frame.data);

            done();
            can.stopRead(id); 
            clearInterval(time_out);
          }

        });   

      }, 40);
    });
  });
});

describe('\nRead data from can bus ...', function () {
  describe('Read all data from can bus', function () {
    it('should read the data w/o error', function (done) {
      setTimeout(function() {
        let id = '0BC';
        let data = '4444';
        let count = 0;
         
        // send data w/o callback
        let time_out = setInterval(() => {
	        can.send('can0', id, data);
        }, 10); 
          
	      // read all data from can bus  
        can.read('can0',  function(err, frame){
	        if(err){ return console.log('err', err);}
          
          if(count === 0){
            count++;
            assert.strictEqual( err, null);
   
            done();
            can.stopRead();
            clearInterval(time_out); 
          }

        }); 

      }, 50);
    });
  });
  describe('Read data w/ filter from can bus', function () {
    it('should read the data w/o error', function (done) {
      setTimeout(function() {
        let id1 = '0DC';
        let id2 = '0BD';
        let data = Math.floor(( Math.random() * 50) + 25);
        let count = 0;

        let id = null;
        let id_ctrl = true;  

        can.restartRead();
        can.restartRead('0FC');        

        // send data w/o callback
        let time_out = setInterval(() => {
          if(id_ctrl){
            id = id1;
            id_ctrl = false;
          }
          else{
	          id = id2;
            id_ctrl = true; 
          }
	        can.send('can0', id, data);
        }, 10);
        
	      // read only filered data from can bus  
        can.read('can0', {id:[id1, id2]}, function(err, frame){
	        if(err){ return console.log('err', err);}
          
          if(count === 0){
            count++;
            assert.strictEqual( err, null);

            assert.strictEqual( id, frame.id);
            assert.strictEqual( data, frame.data);

            done();
            can.stopRead([id1, id2]); 
            clearInterval(time_out);
          }

        }); 

      }, 60);
    });
  });
});

describe('\nWatch data before sending to can bus', function () {
  describe('Watch data for value changes ...', function () {
    it('it should return w/o an error', function (done) {
      setTimeout(function(){

        let id = '0FC';
        let data = Math.floor(( Math.random() * 50) + 25);  
        let count = 0;
        

        can.watch('can0', id, function(err, data) {
          if(err){ console.log('err', err);}

          data.payload = Math.floor(( Math.random() * 50) + 25);
          data.interval = 10;

          can.stopRead(['0DC', '0BD']);
          can.stopRead('0FC');
	        can.stopRead();       
   
	        if(data.change && count === 0){
            count++;
            assert.strictEqual(err, null);
            assert.strictEqual(data.id, id);

            assert.notStrictEqual(data, data.payload);
         
            done();
            can.close();
            can.close('can0');
            process.exit();
          }
	      });

      }, 70);
    });
  });
});


