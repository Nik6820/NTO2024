// ретранслятор
'use strict';


function gf_add(x, y){
    return x^y;
}
  
function gf_sub(x, y){
    return x^y;
}

function gf_mult_noLUT(x, y, prim = 0, field_charac_full = 256, carryless = true) {
    let r = 0;
    while (y) {
      if (y & 1) {
          r = carryless ? r ^ x : r + x;
      }
      y = y >> 1; // equivalent to y // 2
      x = x << 1; // equivalent to x * 2
      if (prim > 0 && (x & field_charac_full)) {
          x = x ^ prim;
      }
    }
    return r;
}

var gf_exp = new Array(256).fill(0);
var gf_log = new Array(256).fill(0);

function init_tables(prim = 0x11d) {
    gf_exp = new Array(512).fill(0); // anti-log (exponential) table
    gf_log = new Array(256).fill(0); // log table
    
    let x = 1;
    for (let i = 0; i < 255; i++) {
      gf_exp[i] = x; // compute anti-log for this value and store it in a table
      gf_log[x] = i; // compute log at the same time
      x = gf_mult_noLUT(x, 2, prim);
    }
    
    return [gf_log, gf_exp];
}

function gf_mul(x,y){
    if (x==0 || y==0){
        return 0;
    }
    return gf_exp[(gf_log[x]+gf_log[y])%255];
}

function gf_div(x,y){
    if (x==0){
        return 0;
    }
    return gf_exp[(gf_log[x] + 255 - gf_log[y]) % 255];
}

function gf_revpow(x, power){
    return gf_exp[255 + (gf_log[x] * power) % 255]
}

function gf_pow(x, power){
    return gf_exp[(gf_log[x] * power) % 255]
}

function gf_inverse(x){
    return gf_exp[255 - gf_log[x]];
}

//now polynomials...

function gf_poly_scale(p,x){
    let r = new Array(p.length).fill(0);
    for (let i=0;i<p.length;i++){
        r[i] = gf_mul(p[i], x)
    }
    return r;
}

function gf_poly_add(p,q){
    let r = new Array(Math.max(p.length,q.length)).fill(0);
    for (let i=0; i<p.length;i++){
          r[i+r.length-p.length] = p[i];
    }
    for (let i=0; i<q.length;i++){
          r[i+r.length-q.length] = r[i+r.length-q.length]^q[i];
    }
    return r
}

function gf_poly_mul(p,q){
    let r = new Array(p.length+q.length-1).fill(0);
    for (let j=0; j<q.length;j++){
        for (let i=0; i<p.length;i++){
            r[i+j] = r[i+j]^gf_mul(p[i], q[j]);
          }
    }
    return r;
}

function gf_poly_eval(poly, x){
    let y = poly[0];
    for (let i=1; i<poly.length;i++){
        y = gf_mul(y, x) ^ poly[i];
    }
    return y
}

//encoding
function rs_generator_poly(nsym){ //nsym - the number of error correction symbols, n-k usually
    let g = [1];
    for(let i = 0;i < nsym;i++){
        g = gf_poly_mul(g, [1, gf_pow(2, i)]);
    }
    return g;
}

function gf_poly_div(dividend, divisor){
    let msg_out = [...dividend];
    for (let i = 0; i < dividend.length-divisor.length+1; i++){
        let coef = msg_out[i];
        if (coef != 0){
            for (let j = 0; j < divisor.length; j++){
                if (divisor[j] != 0){
                    msg_out[i + j] = msg_out[i + j]^gf_mul(divisor[j], coef);
                }
            }
        }
    }
    let separator=1-divisor.length;
    return msg_out.slice(separator);
}

function rs_encode_msg(msg_in, nsym) {
    let gen = rs_generator_poly(nsym);
    let msg_out = new Array(msg_in.length + gen.length - 1).fill(0);
    msg_out.splice(0, msg_in.length, ...msg_in);
    for (let i = 0; i < msg_in.length; i++) {
        let coef = msg_out[i];
        if (coef != 0) {
            for (let j = 1; j < gen.length; j++) {
                msg_out[i + j] = msg_out[i + j]^gf_mul(gen[j], coef); 
            }
        }
    }
    
    msg_out.splice(0, msg_in.length, ...msg_in);
    return msg_out;
}



//decode
function rs_calc_syndromes(msg, nsym){
    let synd = new Array(nsym).fill(0);
    for (let i = 0; i < nsym; i++){
        synd[i] = gf_poly_eval(msg, gf_pow(2,i));
    }
    return [0].concat(synd);
}

function rs_check(msg, nsym){
    let fiction = rs_calc_syndromes(msg, nsym);
    let max=0;
    for (let i=0; i<fiction.length; i++){
        if (fiction[i]>max){
            max=fiction[i];
        }
    }
    if (max==0) {
        return 1;
    }
    else {
        return 0;
    }
}

function rs_find_errata_locator(e_pos){
    let e_loc=[1];
    for (let i=0; i<e_pos.length; i++){
        e_loc = gf_poly_mul( e_loc, gf_poly_add([1], [gf_pow(2, e_pos[i]), 0]) );
    }
    return e_loc;
}

function rs_find_error_evaluator(synd, err_loc, nsym){
    let remainder = gf_poly_div( gf_poly_mul(synd, err_loc), [1].concat(new Array(nsym+1).fill(0)) );
    return remainder;
}

function rs_correct_errata(msg_in, synd, err_pos){
    let coef_pos = new Array(err_pos.length);
    for (let i=0; i<err_pos.length; i++){
          coef_pos[i]=msg_in.length - 1 - err_pos[i];
    }
    let err_loc = rs_find_errata_locator(coef_pos);

    let err_eval = rs_find_error_evaluator(synd.reverse(), err_loc, err_loc.length - 1).reverse();
    X=[];
    for (let i=0; i < coef_pos.length; i++){
        var l=255-coef_pos[i];
        X.push(gf_revpow(2, -l));
    }
    let E = new Array(msg_in.length).fill(0); // will store the values that need to be corrected (subtracted) to the message containing errors

    let Xlength = X.length;
    err_eval.reverse()
    for (let i = 0; i < Xlength; i++) {
        var Xi = X[i];
        const Xi_inv = gf_inverse(Xi);
        var err_loc_prime_tmp = [];
    
        for (let j = 0; j < Xlength; j++) {
            if (j != i) {
                err_loc_prime_tmp.push(gf_sub(1, gf_mul(Xi_inv, X[j])));
            }
        }
        var err_loc_prime = 1;
        for (let k =0; k<err_loc_prime_tmp.length; k++) {
            const coef = err_loc_prime_tmp[k];
            err_loc_prime = gf_mul(err_loc_prime, coef);
        }
        
        let u = gf_poly_eval(err_eval, Xi_inv);
        
        u = gf_mul(gf_pow(Xi, 1), u);
        if (err_loc_prime == 0){
            return 0;
        }
        var magnitude = gf_div(u, err_loc_prime);
        E[err_pos[i]] = magnitude;
    }
    msg_in=gf_poly_add(msg_in, E);
    return msg_in;
}

function rs_find_error_locator(synd, nsym, erase_loc = null, erase_count = 0) {  
    if (erase_loc) { // if the erasure locator polynomial is supplied, we init with its value, so that we include erasures in the final locator polynomial
        err_loc = [...erase_loc];
        old_loc = [...erase_loc];
    } 
    else {
        err_loc = [1];
        old_loc = [1];
    }
    let synd_shift = synd.length - nsym;
    for (let i=0; i<nsym-erase_count; i++){
        if (erase_loc) { 
            let K = erase_count + i + synd_shift;
        } 
        else { // if erasures locator is not provided, then either there's no erasures to account or we use the Forney syndromes, so we don't need to use erase_count nor erase_loc 
            K = i + synd_shift;
        }
    
        delta = synd[K];
        for (let j = 1; j < err_loc.length; j++) {
            delta = delta ^ gf_mul(err_loc[err_loc.length - (j + 1)], synd[K - j]);
        } 
      // Shift polynomials to compute the next degree
        old_loc.push(0);
        if (delta != 0) {
            if (old_loc.length > err_loc.length) {
                let new_loc = gf_poly_scale(old_loc, delta);
                old_loc = gf_poly_scale(err_loc, gf_inverse(delta));
                err_loc = [...new_loc];
            }
            err_loc = gf_poly_add(err_loc, gf_poly_scale(old_loc, delta));
        }
    }
    
    while (err_loc.length && err_loc[0] === 0){ 
        err_loc.shift(); 
    }
    let errs = err_loc.length -1;
    if ((errs-erase_count) * 2 + erase_count > nsym){
        return [0];
    }
    return err_loc;
}

function rs_find_errors(err_loc, nmess) { // nmess is len(msg_in)
    let errs = err_loc.length - 1;
    const err_pos = [];
    for (let i = 0; i < nmess; i++) {
        if (gf_poly_eval(err_loc, gf_pow(2, i)) == 0) {
            err_pos.push(nmess - 1 - i);
        }
    }
    if (err_pos.length != errs) {
        return [0];    
    }
    return err_pos;
}

//correction

function rs_forney_syndromes(synd, pos, nmess) {
    let erase_pos_reversed  = new Array(pos.length);
    for (let p=0; p<pos.length; p++){
        erase_pos_reversed[p]=nmess - 1 - pos[i];
    }
    let fsynd = synd.slice(1); 
    for (let i = 0; i < pos.length; i++) {
        let x = gf_pow(2, erase_pos_reversed[i]);
        for (let j = 0; j < fsynd.length - 1; j++) {
            fsynd[j] = gf_mul(fsynd[j], x) ^ fsynd[j + 1];
        }
    }
    return fsynd;
}

function rs_correct_msg(msg_in, nsym, erase_pos = null) {
  // if (msg_in.length > 255) {
  //     throw new Error(`Message is too long (${msg_in.length} when max is 255)`);
  // }

    let msg_out = [...msg_in];
    if (erase_pos == null) {
        erase_pos = [];
    } 
    else {
        for (let r=0; r<erase_pos.length;r++) {
            let epos = erase_pos[r];
            msg_out[e_pos] = 0;
        }
    }
    if (erase_pos.length > nsym){
        return [0];
    }
    let synd = rs_calc_syndromes(msg_out, nsym);
    //   console.log('synd1: ', synd)
    if (Math.max(...synd) == 0) {
        return msg_out.slice(0, -nsym);
    }
    
    let fsynd = rs_forney_syndromes(synd, erase_pos, msg_out.length);
    let err_loc = rs_find_error_locator(fsynd, nsym, erase_pos.length);
    let err_pos = rs_find_errors(err_loc.reverse(), msg_out.length);
    if (err_pos == null) {
        return [0];
    }
    msg_out = rs_correct_errata(msg_out, synd, erase_pos.concat(err_pos));
    synd = rs_calc_syndromes(msg_out, nsym);

    if (Math.max(...synd) > 0) {
        return [0];
    }
    
    return /*[*/msg_out.slice(0, -nsym)/*, msg_out.slice(-nsym)]*/;
}


function bitsToBytes(bits) {
    let byteArray = new Array(Math.ceil(bits.length / 8));
    for (let i = 0; i < bits.length; i++) {
        byteArray[Math.floor(i / 8)] |= bits[i] << (7 - (i % 8));
    }
    return byteArray;
}

var transmitter;
var receiver;
var buf = new Array();
var times = [[39679, 39929], [45305, 45669], [51009, 51382], [56724, 57090], [62454, 62736], [29499, 29740], [35171, 35502], [37837, 38188], [43639, 43771]]; 
let count = 0;

function setup() 
{
    transmitter = spacecraft.devices[0].functions[0];
    receiver = spacecraft.devices[1].functions[0];
}

function loop() 
{
    let time = spacecraft.flight_time;
    if ((time > 21390 && time < 22830) || (time > 43225 && time < 44450)) {
        receiver.enable()
    }
    else {
        receiver.disable()
    }
    buf = buf.concat(receiver.receive(80));
    
    let trans = false;
    for (let i = 0; i < 9; i++) {
        if (time > times[i][0] && time < times[i][1]) {
            trans = times[i][1] - times[i][0]
            break
        }
    }  
    if (trans) {
        count += 1
        if (buf.length >= 3280 && count*410/100 < trans) {
            let ind = buf.length-3200
            for (let i = 0; i<ind+1; i++) {
                if (bitsToBytes(buf.slice(i, i+80)).join() == [127, 127, 127, 127, 127, 127, 127, 127, 127, 127].join()) {
                    ind = i
                    break
                }
            }
            buf.splice(0, ind)
            if (buf.length >= 3280): {
                buf.splice(0,80);
                prim = 0x11d;
                init_tables(prim); 
                let packet = bitsToBytes(buf.splice(0,3200)); // мб сначала надо будет найти старт сообщения
                transmitter.transmit((rs_encode_msg([127, 127, 127, 127, 127], 5)).concat(rs_encode_msg(packet.splice(0, 200), 45), rs_encode_msg(packet.splice(0, 200), 45)));
            }
        }
    }
    else {
        count = 0
    }
}
