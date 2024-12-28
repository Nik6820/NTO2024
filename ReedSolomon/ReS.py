import numpy as np

# implemeting Galos Field operations

def gf_add(x, y):
    return x ^ y

def gf_sub(x, y):
    return x ^ y

def gf_mult_noLUT(x, y, prim=0, field_charac_full=256, carryless=True):
    r = 0
    while y: 
        if y & 1: r = r ^ x if carryless else r + x
        y = y >> 1 # equivalent to y // 2
        x = x << 1 # equivalent to x*2
        if prim > 0 and x & field_charac_full: x = x ^ prim

    return r

gf_exp = [0] * 256
gf_log = [0] * 256

def init_tables(prim=0x11d):
    global gf_exp, gf_log
    gf_exp = [0] * 256 # anti-log (exponential) table
    gf_log = [0] * 256 # log table

    x = 1
    for i in range(0, 255):
        gf_exp[i] = x # compute anti-log for this value and store it in a table
        gf_log[x] = i # compute log at the same time
        x = gf_mult_noLUT(x, 2, prim)

    return [gf_log, gf_exp]

def gf_mul(x,y):
    if x==0 or y==0:
        return 0
    return gf_exp[(gf_log[x]+gf_log[y])%255]
# faster multiplication by using logarithms, i think??
# should work if the transmitter DOES have enough memory, just not outside of proceed().
# might flop though, not sure it's effective to create two 256 len arrays every time we call the function

def gf_div(x,y):
    if y==0:
        raise ZeroDivisionError() # throws an exception and aborts execution of the function.
    if x==0:
        return 0
    return gf_exp[(gf_log[x] + 255 - gf_log[y]) % 255]

def gf_pow(x, power):
    return gf_exp[(gf_log[x] * power) % 255]

def gf_inverse(x):
    return gf_exp[255 - gf_log[x]] # gf_inverse(x) == gf_div(1, x)

# now polynomials...

def gf_poly_scale(p,x):
    r = [0] * len(p)
    for i in range(0, len(p)):
        r[i] = gf_mul(p[i], x)
    return r

def gf_poly_add(p,q):
    r = [0] * max(len(p),len(q))
    for i in range(0,len(p)):
        r[i+len(r)-len(p)] = p[i]
    for i in range(0,len(q)):
        r[i+len(r)-len(q)] ^= q[i]
    return r

def gf_poly_mul(p,q):
    r = [0] * (len(p)+len(q)-1)
    for j in range(0, len(q)):
        for i in range(0, len(p)):
            r[i+j] ^= gf_mul(p[i], q[j]) # equivalent to: r[i + j] = gf_add(r[i+j], gf_mul(p[i], q[j]))
    return r

def gf_poly_eval(poly, x):
    y = poly[0]
    for i in range(1, len(poly)):
        y = gf_mul(y, x) ^ poly[i]
    return y



# RS ENCODING

def rs_generator_poly(nsym): #nsym - the number of error correction symbols, n-k usually
    g = [1]
    for i in range(0, nsym):
        g = gf_poly_mul(g, [1, gf_pow(2, i)])
    return g
# Generate an irreducible generator polynomial

def gf_poly_div(dividend, divisor):
    # !!! this function expects polynomials to follow the opposite convention at decoding:
    # the terms must go from the biggest to lowest degree (while most other functions here expect a list from lowest to biggest degree).
    # eg: 1 + 2x + 5x^2 = [5, 2, 1], NOT [1, 2, 5]

    msg_out = list(dividend) # Copy the dividend
    for i in range(0, len(dividend) - (len(divisor)-1)):
        coef = msg_out[i] # precaching
        if coef != 0: # log(0) is undefined
            for j in range(1, len(divisor)):
                if divisor[j] != 0: # log(0) is undefined
                    msg_out[i + j] ^= gf_mul(divisor[j], coef)
    separator = -(len(divisor)-1)
    return msg_out[:separator], msg_out[separator:] # return quotient, remainder.
    

def rs_encode_msg(msg_in, nsym):
    '''if (len(msg_in) + nsym) > 255: raise ValueError("Message is too long (%i when max is 255)" % (len(msg_in)+nsym))'''
    gen = rs_generator_poly(nsym)
    msg_out = [0] * (len(msg_in) + len(gen)-1)
    msg_out[:len(msg_in)] = msg_in

    # Synthetic division main loop
    for i in range(len(msg_in)):
        # !!! i's msg_out here, not msg_in. we reuse the updated value at each iteration
        coef = msg_out[i]

        if coef != 0:
            for j in range(1, len(gen)):
                msg_out[i+j] ^= gf_mul(gen[j], coef) # equivalent to msg_out[i+j] += gf_mul(gen[j], coef)

    # msg_out contains the quotient in msg_out[:len(msg_in)] and the remainder in msg_out[len(msg_in):].
    # we only need the remainder (which represents the RS code), so we can just overwrite the quotient with the input message,
    # so that we get our complete codeword composed of the message + code.
    msg_out[:len(msg_in)] = msg_in

    return msg_out



# RC DECODING

def rs_calc_syndromes(msg, nsym):
    # !!! "[0] +" : adding a 0 coefficient for the lowest degree (the constant). This effectively shifts the syndrome, and will shift every computations depending on the syndromes (such as the errors locator polynomial, errors evaluator polynomial, etc. but not the errors positions).
    synd = [0] * nsym
    for i in range(0, nsym):
        synd[i] = gf_poly_eval(msg, gf_pow(2,i))
    return [0] + synd # pad with one 0 for mathematical precision

def rs_check(msg, nsym):
    # returns true if the message + ecc has no error or false otherwise
    return ( max(rs_calc_syndromes(msg, nsym)) == 0 )

def rs_find_errata_locator(e_pos):
    e_loc = [1]
    for i in e_pos:
        e_loc = gf_poly_mul( e_loc, gf_poly_add([1], [gf_pow(2, i), 0]) )
    return e_loc

def rs_find_error_evaluator(synd, err_loc, nsym):
    '''Compute the error (or erasures if you supply sigma=erasures locator polynomial, or errata) evaluator polynomial Omega
       from the syndrome and the error/erasures/errata locator Sigma.'''
    _, remainder = gf_poly_div( gf_poly_mul(synd, err_loc), ([1] + [0]*(nsym+1)) ) 
    return remainder

def rs_correct_errata(msg_in, synd, err_pos): # err_pos is a list of the positions of the errors/erasures/errata
    '''Forney algorithm, computes the values (error magnitude) to correct the input message.'''
    coef_pos = [len(msg_in) - 1 - p for p in err_pos] # need to convert the positions to coefficients degrees for the errata locator algo to work (eg: instead of [0, 1, 2] it will become [len(msg)-1, len(msg)-2, len(msg) -3])
    err_loc = rs_find_errata_locator(coef_pos)
    err_eval = rs_find_error_evaluator(synd[::-1], err_loc, len(err_loc)-1)[::-1]

    X = [] # will store the position of the errors
    for i in range(0, len(coef_pos)):
        l = 255 - coef_pos[i]
        X.append( gf_pow(2, -l) )

    # Forney algorithm: compute the magnitudes
    E = [0] * (len(msg_in)) # will store the values that need to be corrected (substracted) to the message containing errors
    Xlength = len(X)
    for i, Xi in enumerate(X):

        Xi_inv = gf_inverse(Xi)

        err_loc_prime_tmp = []
        for j in range(0, Xlength):
            if j != i:
                err_loc_prime_tmp.append( gf_sub(1, gf_mul(Xi_inv, X[j])) )
        # compute the product, which is the denominator of the Forney algorithm (errata locator derivative)
        err_loc_prime = 1
        for coef in err_loc_prime_tmp:
            err_loc_prime = gf_mul(err_loc_prime, coef)
        # equivalent to: err_loc_prime = functools.reduce(gf_mul, err_loc_prime_tmp, 1)

        y = gf_poly_eval(err_eval[::-1], Xi_inv) 
        y = gf_mul(gf_pow(Xi, 1), y)
        
        if err_loc_prime == 0: # the divisor should not be zero.
            return 0
            # raise ReedSolomonError("Could not find error magnitude")

        # Compute the magnitude
        magnitude = gf_div(y, err_loc_prime)
        E[err_pos[i]] = magnitude

    msg_in = gf_poly_add(msg_in, E)
    return msg_in

def rs_find_error_locator(synd, nsym, erase_loc=None, erase_count=0):
    # Init the polynomials
    if erase_loc: # if the erasure locator polynomial is supplied, we init with its value, so that we include erasures in the final locator polynomial
        err_loc = list(erase_loc)
        old_loc = list(erase_loc)
    else:
        err_loc = [1]  
        old_loc = [1] 

    # Fix the syndrome shifting
    synd_shift = len(synd) - nsym

    for i in range(0, nsym-erase_count): 
        if erase_loc: # if an erasures locator polynomial was provided to init the errors locator polynomial, then we must skip the FIRST erase_count iterations (not the last iterations, this is very important!)
            K = erase_count+i+synd_shift
        else: # if erasures locator is not provided, then either there's no erasures to account or we use the Forney syndromes, so we don't need to use erase_count nor erase_loc 
            K = i+synd_shift

        delta = synd[K]
        for j in range(1, len(err_loc)):
            delta ^= gf_mul(err_loc[-(j+1)], synd[K - j]) 
        # Shift polynomials to compute the next degree
        old_loc = old_loc + [0]

        if delta != 0:
            if len(old_loc) > len(err_loc):
                new_loc = gf_poly_scale(old_loc, delta)
                old_loc = gf_poly_scale(err_loc, gf_inverse(delta))
                err_loc = new_loc
                
            err_loc = gf_poly_add(err_loc, gf_poly_scale(old_loc, delta))

    # Check if the result is correct, that there's not too many errors to correct
    while len(err_loc) and err_loc[0] == 0: del err_loc[0] # drop leading 0s, else errs will not be of the correct size
    errs = len(err_loc) - 1
    if (errs-erase_count) * 2 + erase_count > nsym:
        return [0]
        # raise ReedSolomonError("Too many errors to correct")

    return err_loc

def rs_find_errors(err_loc, nmess): # nmess is len(msg_in)
    errs = len(err_loc) - 1
    err_pos = []
    for i in range(nmess):
        if gf_poly_eval(err_loc, gf_pow(2, i)) == 0:
            err_pos.append(nmess - 1 - i)
    if len(err_pos) != errs:
        return [0]
        # raise ReedSolomonError("Too many (or few) errors found by Chien Search for the errata locator polynomial!")
    return err_pos

# ERROR CORRECTION

def rs_forney_syndromes(synd, pos, nmess):
    # Compute Forney syndromes, which computes a modified syndromes to compute only errors (erasures are trimmed out)
    erase_pos_reversed = [nmess-1-p for p in pos] # prepare the coefficient degree positions (instead of the erasures positions)

    fsynd = list(synd[1:])      # make a copy and trim the first coefficient which is always 0 by definition
    for i in range(0, len(pos)):
        x = gf_pow(2, erase_pos_reversed[i])
        for j in range(0, len(fsynd) - 1):
            fsynd[j] = gf_mul(fsynd[j], x) ^ fsynd[j + 1]

    return fsynd

def rs_correct_msg(msg_in, nsym, erase_pos=None):
    '''Reed-Solomon main decoding function'''
    if len(msg_in) > 255: # can't decode, message is too big
        raise ValueError("Message is too long (%i when max is 255)" % len(msg_in))

    msg_out = list(msg_in)     # copy of message
    if erase_pos is None:
        erase_pos = []
    else:
        for e_pos in erase_pos:
            msg_out[e_pos] = 0
    if len(erase_pos) > nsym:
        return 0, 'eras' # '''raise ReedSolomonError("Too many erasures to correct")'''
    
    synd = rs_calc_syndromes(msg_out, nsym)
    
    if max(synd) == 0:
        return msg_out[:-nsym], msg_out[-nsym:]  # no errors

    fsynd = rs_forney_syndromes(synd, erase_pos, len(msg_out))
    err_loc = rs_find_error_locator(fsynd, nsym, erase_count=len(erase_pos))
    err_pos = rs_find_errors(err_loc[::-1] , len(msg_out))
    if err_pos is None:
        return 0, 'loc'
        # raise ReedSolomonError("Could not locate error")

    msg_out = rs_correct_errata(msg_out, synd, (erase_pos + err_pos))
    print(msg_out, nsym)
    synd = rs_calc_syndromes(msg_out, nsym)
    if max(synd) > 0: 
        return 0, 'fckn error'
        # raise ReedSolomonError("Could not correct message")
    
    return msg_out[0:-nsym], msg_out[-nsym:] # also return the corrected ecc block so that the user can check()

# orbita

def proceed(data: str) -> bytes:
    gf_exp = [0] * 256   
    gf_log = [0] * 256
    prim = 0x11d
    init_tables(prim) # таблица для быстрого перемножения чиселок из РС
    k = len(data) # длина строки (технически н-ка из условий орбиты, просто эта буква уже была зарезервирована в кода Рида-Соломона)
    n = int(k*11.4/8)-3 # 11.4к - количество бит, что мы успеем передать в худшем случае (т.е. всегда успеем). делю нацело, чтобы сообщения были побайтовые (так проще)

    out = [ord(x) for x in 'UUU'] + rs_encode_msg([ord(x) for x in data], n-k) # вначало добавляю стартовое сообщение (чтоб в случае инверсии первого бита сообщения не поехала вся декодировка) 
                                                                                                  # мб поменяю на A5 5A и чекну маской, то поменьше памяти занимает
    return bytes(out)


buf = np.array([0]*80*int(input()), bool) # задайте какую-нибудь длину строк, что потом будете вводить, иначе буфер при проверке в VS проломается
def decod(inp, buf, end):
    gf_exp = [0] * 256   
    gf_log = [0] * 256
    prim = 0x11d
    init_tables(prim) # таблица для быстрого перемножения чиселок из РС

    k = int(len(buf)/80) # эх эх эх...
    n = int(k*11.4//8) - 3

    sum = 0                 # ищем конец прошлого сообщения (надо понять, с какого символа в буфер надо вписывать новое)
    st = 0
    for i in range(80*k-24):   # после каждого пакета буду вфигачивать 24 единички, т.к. это дело все в буфере, там ничего не исказится, мы в шоколаде 
        if np.sum(buf[i:i+24]) == 24:
            st = i
            break
        else:
            pass
    
    buf[st:(st+len(inp))] = inp
    buf[st+len(inp)] = False
    buf[(st+len(inp)+1):(st+len(inp)+25)] = True

    out = ''

    st_ind = -1
    for i in range(80*k-24): # (-> понять, где начало сообщения)
        if np.sum(buf[i:(i+24)] ^ np.array([0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1])) <= 3:
            st_ind = i+24
            break
        else:
            pass

    if end: # если буфер пустой, а пакет последний -- выводим пустую строку
        return ''
    elif st_ind != -1:  
        out = ''.join(buf[st_ind:(st_ind+n*8)].astype(int).astype(str).tolist()) 
        mesecc = [0]*n
        for p in range(0, n*8, 8):
            mesecc[p//8] = int(out[p:(p+8)], 2)
        corrected_message, corrected_ecc = rs_correct_msg(mesecc, n-k)
        if corrected_message == 0:
            return corrected_ecc

        buf[:(80*k - n*8 - st_ind)] = buf[st_ind+n*8:] 
        return (''.join([chr(x) for x in corrected_message]))
    else:
        buf[:24] = buf[(80*k - 24):]
        buf[24:] = False            
        return 'no message found'


binary_strings = ['{:08b}'.format(byte) for byte in proceed(input())]
arr = []
for i in ''.join(binary_strings):
    arr += [int(i)]
arr += [0]
pl = np.array(arr, bool) 
print(decod(pl, buf, 0), buf.astype(int))

binary_strings = ['{:08b}'.format(byte) for byte in proceed(input())]
arr = []
for i in ''.join(binary_strings):
    arr += [int(i)]
arr += [0]
pl = np.array(arr, bool)
print(decod(pl, buf, 0), buf.astype(int)) 

binary_strings = ['{:08b}'.format(byte) for byte in proceed(input())]
arr = []
for i in ''.join(binary_strings):
    arr += [int(i)]
arr += [0]
pl = np.array(arr, bool)
print(decod(pl, buf, 0), buf.astype(int)) 
