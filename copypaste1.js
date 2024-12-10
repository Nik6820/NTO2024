'use strict';

function minmax (a,min,max)
{
    return(Math.min(Math.max(a, min), max));
}

function anglefromgyro(highByte, lowByte) 
{
    let combined = (highByte << 8) | lowByte;

    if (combined >= 32768) {
        combined -= 65536;
    }

    let speed = combined / 16.0;

    return speed/180*Math.PI;
}
 
function setup() 
{
  var transmitter = spacecraft.devices[0].functions[0];
  var receiver = spacecraft.devices[1].functions[0];
  var wheels = spacecraft.devices[4];
  var gyros = spacecraft.devices[5];
}
 //PID and coords
let kp=-60;
let ki=3;
let ts=0.01;
let umax=0.0001;
let I=0;
let rot_speed_x;
let ang_speed_x;
let err;
let P;
let u;
// recieve
var buf = new Array();


function loop() 
{
  //start stab
  rot_speed_x = gyros.functions[0].read(2);
  ang_speed_x = anglefromgyro(rot_speed_x[0],rot_speed_x[1]);
  err=0-ang_speed_x;
  P=err*kp;
  u=P+I;
  if (u === minmax(u, -umax, umax)){
    I = I*kp + err*ki*ts;
  }
  u = minmax(u, -umax, umax);
  wheels.functions[0].motor_torque = u;
  //end stab
   
  ////////// RECIEVER ///////////
  if (buf.length < 51000)
  { 
     let packet = receiver.receive(21);
     if (packet.size === 21)
     {
        let sym = 0;
        
        for (let i = 0; i < 20; i++)
        {
           sym = sym + packet[i];
        }
        if (sym%256 === packet[20]) 
        {
          let er = packet.pop();
          buf.push(packet);  
        }
     }
  }
  ///////// TRANSMITTER //////////
     if (Math.abs(ang_speed_x) > 0.0003 || (spacecraft.flight_time>=0 && spacecraft.flight_time<9800) || (spacecraft.flight_time>10600 && spacecraft.flight_time<26720) || spacecraft.flight_time > 27520 )//данные по выводам из орбиты, если по gmat, то сдвигать на минут 9 назад
     {
        transmitter.disable();
     }
     else{
        transmitter.enable();
        let tr=buf.pop();
        transmitter.transmit(new Uint8Array(tr));
     }
}
