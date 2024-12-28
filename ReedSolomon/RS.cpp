#include<iostream>

using namespace std;

int gf_add(int x,int y){
    return x^y;
}

int gf_sub(int x,int y){
    return x^y;
}

int gf_mult_noLUT(int x, int y, int prim = 0, int field_charac_full = 256, bool carryless = true) {
    int r = 0;
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


int main()
{
    cout<<gf_add(255,10);
    return 0;
}
