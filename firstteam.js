'use strict';


var wheels;
var gyros;
var nav;
var transmitter;
var receiver;
let kp=0;
let ki=0;
let ts=0;

let umax=0.0001; //беда какая то, какой максимум?
let I=0;


function minmax (a,min,max){
    return(Math.min(Math.max(a, min), max));
}

function anglefromgyro(bytes){
//code from lex
  return 0;
}
 
function setup() {
  transmitter = spacecraft.devices[0].functions[0];
  receiver = spacecraft.devices[1].functions[0];
  nav = spacecraft.devices[3];
  wheels = spacecraft.devices[4];
  gyros = spacecraft.devices[5];
}
 
function loop() {
  //start stab
  let rot_speed_x = gyros.functions[0].read(2);
  let ang_speed_x = anglefromgyro(rot_speed_x);
  let err=0-ang_speed_x;
  let P=err*kp;
  let u=P+I
  if (u == minmax(u, -umax, umax)){
    I = I + err*ki*ts
  }
  u = minmax(u, -umax, umax)
  wheels.functions[0].motor_torque = u;
  //end stab
  let received_packet = receiver.receive(10);

  transmitter.transmit(received_packet);
}

