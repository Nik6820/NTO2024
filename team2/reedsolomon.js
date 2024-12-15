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
