export const WAD = 10n ** 18n;

function log2(x: bigint) {
  if (x <= 0n) throw new Error('UNDEFINED');

  let r = BigInt(0xffffffffffffffffffffffffffffffffn < x) << 7n;
  r |= BigInt(0xffffffffffffffffn < x >> r) << 6n;
  r |= BigInt(0xffffffffn < x >> r) << 5n;
  r |= BigInt(0xffffn < x >> r) << 4n;
  r |= BigInt(0xffn < x >> r) << 3n;
  r |= BigInt(0xfn < x >> r) << 2n;
  r |= BigInt(0x3n < x >> r) << 1n;
  r |= BigInt(0x1n < x >> r);

  return r;
}

export function lnWad(x: bigint) {
  if (x <= 0n) throw new Error('UNDEFINED');

  const k = log2(x) - 96n;
  x <<= 159n - k;
  x >>= 159n;

  let p = x + 3273285459638523848632254066296n;
  p = ((p * x) >> 96n) + 24828157081833163892658089445524n;
  p = ((p * x) >> 96n) + 43456485725739037958740375743393n;
  p = ((p * x) >> 96n) - 11111509109440967052023855526967n;
  p = ((p * x) >> 96n) - 45023709667254063763336534515857n;
  p = ((p * x) >> 96n) - 14706773417378608786704636184526n;
  p = p * x - (795164235651350426258249787498n << 96n);

  let q = x + 5573035233440673466300451813936n;
  q = ((q * x) >> 96n) + 71694874799317883764090561454958n;
  q = ((q * x) >> 96n) + 283447036172924575727196451306956n;
  q = ((q * x) >> 96n) + 401686690394027663651624208769553n;
  q = ((q * x) >> 96n) + 204048457590392012362485061816622n;
  q = ((q * x) >> 96n) + 31853899698501571402653359427138n;
  q = ((q * x) >> 96n) + 909429971244387300277376558375n;

  let r = p / q;

  r *= 1677202110996718588342820967067443963516166n;
  r += 16597577552685614221487285958193947469193820559219878177908093499208371n * k;
  r += 600920179829731861736702779321621459595472258049074101567377883020018308n;
  r >>= 174n;

  return r;
}

export function expWad(x: bigint): bigint {
  if (x <= -42139678854452767551n) return 0n;
  if (x >= 135305999368893231589n) throw new Error('EXP_OVERFLOW');

  x = (x << 78n) / 5n ** 18n; // Convert to (-42, 136) * 2**96

  const k = ((x << 96n) / 54916777467707473351141471128n + 2n ** 95n) >> 96n;
  x -= k * 54916777467707473351141471128n;

  let y = x + 1346386616545796478920950773328n;
  y = ((y * x) >> 96n) + 57155421227552351082224309758442n;
  let p = y + x - 94201549194550492254356042504812n;
  p = ((p * y) >> 96n) + 28719021644029726153956944680412240n;
  p = p * x + (4385272521454847904659076985693276n << 96n);

  let q = x - 2855989394907223263936484059900n;
  q = ((q * x) >> 96n) + 50020603652535783019961831881945n;
  q = ((q * x) >> 96n) - 533845033583426703283633433725380n;
  q = ((q * x) >> 96n) + 3604857256930695427073651918091429n;
  q = ((q * x) >> 96n) - 14423608567350463180887372962807573n;
  q = ((q * x) >> 96n) + 26449188498355588339934803723976023n;

  const r = p / q;
  return (r * 3822833074963236453042738258902158003155416615667n) >> (195n - k);
}

export function bmax(...args: bigint[]): bigint {
  return args.reduce((p, c) => (p > c ? p : c), 0n);
}

export function bmin(...args: bigint[]): bigint {
  return args.reduce((p, c) => (p < c ? p : c), 0n);
}

export function abs(x: bigint): bigint {
  return x < 0n ? -x : x;
}

export function sqrtWad(x: bigint): bigint {
  if (x === 0n) return 0n;

  let y = x;
  let z = 181n;

  if (y >= 0x10000000000000000000000000000000000n) {
    y >>= 128n;
    z <<= 64n;
  }
  if (y >= 0x1000000000000000000n) {
    y >>= 64n;
    z <<= 32n;
  }
  if (y >= 0x10000000000n) {
    y >>= 32n;
    z <<= 16n;
  }
  if (y >= 0x1000000n) {
    y >>= 16n;
    z <<= 8n;
  }

  z = (z * (y + 65536n)) >> 18n;

  for (let i = 0; i < 7; ++i) {
    z = (z + x / z) >> 1n;
  }

  if (x / z < z) z--;

  return z;
}
