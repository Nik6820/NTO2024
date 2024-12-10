'use strict';

 var receiver;
 var transmitter;

 function crc16_ccitt_false(data) {
 let crc = 0xFFFF;
 for (let i = 0; i < data.length; i++) {
 crc ^= data[i] << 8;
 for (let j = 0; j < 8; j++) {
 if (crc & 0x8000) {
 crc = (crc << 1) ^ 0x1021;
 } else {
 crc <<= 1;
 }
 }
 }
 return crc & 0xFFFF;
 }

 function check_packet(data) {
 let crc = (data[data.length - 3] << 8) | data[data.length - 2];
 let calculated_crc = crc16_ccitt_false(data.slice(1, -3));
 return crc === calculated_crc;
 }

 function setup() {
 receiver = spacecraft.devices[1].functions[0];
 transmitter = spacecraft.devices[0].functions[0];
 }

 // 70 -> 310

 // 3920 -> 4170

 var received_packet = Array.from([]);
 var received = false;

 let kP = 0.1;
 let kI = 0.0003;
 let kD = 0.68;
 let last_error = null;
 let integral = 0;
 let tick = 0.01;

 function loop() {
 var gyros = spacecraft.devices[2];
 let angular_velocity = gyros.functions[0].angular_velocity;
 var pidContainer = spacecraft.devices[4].functions[0];

 let error = angular_velocity;

 let D = 0;
 if (last_error != null) {
 D = (error - last_error) / tick;
 }
 let I = error * tick;
 last_error = error;

 if (true || Math.abs(error) < 0.03) {
 integral = integral + kI * I;
 }

 var a = error * kP + D * kD + integral;

 var data = new Float32Array([a]);
 var byteView = new Uint8Array(data.buffer);
 pidContainer.transmit(byteView)


 let r = Array.from(receiver.receive(200));

 if (r.length > 0){
 received_packet.push(...r)
 }

 if (spacecraft.flight_time > 3920) {

 if (received_packet.length > 0){
 let ebp = received_packet.indexOf(0x7b);
 let esp = received_packet.indexOf(0x7d, ebp);
 let received_packet_n = received_packet.slice(ebp, esp+1);
 received_packet.splice(0,esp+1);
 // throw Error(spacecraft.flight_time +":"+received_packet)
 if (check_packet(Array.from(received_packet_n))) {
 received_packet_n[2] = 2;
 transmitter.transmit(new Uint8Array(received_packet_n));

 }
 }
 }
}
