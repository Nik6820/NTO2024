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

let gf_exp = new Array(256).fill(0);
let gf_log = new Array(256).fill(0);

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
  if (x===0 || y===0){
    return 0;
  }
  return gf_exp[(gf_log[x]+gf_log[y])%255];
}

function gf_div(x,y){
  if (x===0){
    return 0;
  }
  return gf_exp[(gf_log[x] + 255 - gf_log[y]) % 255];
}

function gf_pow(x, power){
  return gf_exp[(gf_log[x] * power) % 255];
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
        r[i+len(r)-len(p)] = p[i];
  }
  for (let i=0; i<q.length;i++){
        r[i+len(r)-len(q)] = r[i+len(r)-len(q)]^q[i];
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
  for (let i=0; i<poly.length;i++){
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
  for (let i = 0; i < dividend.length-divisor.length-1; i++){
    let coef = msg_out[i];
    if (coef !== 0){
      for (let j = 0; j < divisor.length; j++){
        if (divisor[j] !== 0){
          msg_out[i + j] = msg_out[i + j]^gf_mul(divisor[j], coef);
        }
      }
    }
  }
  let separator=1-divisor.length;
  return [msg_out.slice(0, separator), msg_out.slice(separator)];
}

function rs_encode_msg(msg_in, nsym) {
    let gen = rs_generator_poly(nsym);
    let msg_out = new Array(msg_in.length + gen.length - 1).fill(0);
    msg_out.splice(0, msg_in.length, ...msg_in);
    for (let i = 0; i < msg_in.length; i++) {
        let coef = msg_out[i];
        if (coef !== 0) {
            for (let j = 1; j < gen.length; j++) {
                msg_out[i + j] = msg_out[i + j]^gf_mul(gen[j], coef); 
            }
        }
    }

    msg_out.splice(0, msg_in.length, ...msg_in);
    return msg_out;
}
