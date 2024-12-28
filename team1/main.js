'use strict';


var wheels;
var gyros;
var nav;
var transmitter;
var receiver;
//PID and coords
let kp=-60;
let ki=3;
let ts=0.01;
let LaKyaka=[-22.1023, 294.40701-180];
let Honkong=[22.28552, 114.15769-180];
let coords;
let lambda;
let phi;
let umax=0.0001;
let I=0;
let rot_speed_x;
let ang_speed_x;
let err;
let P;
let u;
// recieve
var buf = new Array();
var trans = new Uint8Array(20);
// transmit
var sent = 0;
let time;


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
  transmitter = spacecraft.devices[0].functions[0];
  receiver = spacecraft.devices[1].functions[0];
  wheels = spacecraft.devices[4];
  gyros = spacecraft.devices[5];
}
 
function loop() 
{
  //start stab
  rot_speed_x = gyros.functions[0].read(2);
  ang_speed_x = anglefromgyro(rot_speed_x[0],rot_speed_x[1]);
  err=0-ang_speed_x;
  P=err*kp;
  u=P+I;
  if (u == minmax(u, -umax, umax)){
    I = I + err*ki*ts;
    I=I*kp;
  }
  u = minmax(u, -umax, umax);
  wheels.functions[0].motor_torque = u;
  //end stab
   
  ////////// RECIEVER ///////////
  if (buf.length < 51000)
  { 
     let packet = Array.from(receiver.receive(23));
     if (packet.size === 23)
     {
        let sym = 0;
      
        // проверка помех в данных о пакете
        if (packet[20] !== packet[21] && packet[20] !== packet[22]) 
        {
          packet[20] = packet[21];
        } 
        // конец проверки
        
        for (let i = 0; i < 20; i++) // сохраняю данные без повторов
        {
           trans[i] = packet[i];
           sym = sym + packet[i];
        }
        if (sym%256 === packet[20]) 
        {
         buf.push(trans);      
        }
     }
  }
  ///////// TRANSMITTER //////////
     if (Math.abs(ang_speed_x) < 0.0003 && (9600<=spacecraft.flight_time<=10800 || 26520<=spacecraft.flight_time<=27720))//данные по выводам из орбиты, если по gmat, то сдвигать на минут 9 назад
     {
        let tr=sent.pop();
        transmitter.transmit(new Uint8Array(tr));
     }
}
