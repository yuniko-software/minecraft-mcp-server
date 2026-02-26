import test from 'ava';
import { coerceCoordinates } from '../src/tools/coordinate-utils.js';

test('coerceCoordinates returns numeric values for numeric strings', (t) => {
  const result = coerceCoordinates('10' as unknown as number, '64.5' as unknown as number, '-3' as unknown as number);

  t.deepEqual(result, { x: 10, y: 64.5, z: -3 });
});

test('coerceCoordinates throws when any coordinate is not a finite number', (t) => {
  t.throws(() => coerceCoordinates(Number.NaN, 1, 2), { message: 'x, y, and z must be valid numbers' });
  t.throws(() => coerceCoordinates(1, Number.POSITIVE_INFINITY, 2), { message: 'x, y, and z must be valid numbers' });
  t.throws(() => coerceCoordinates(1, 2, Number.NEGATIVE_INFINITY), { message: 'x, y, and z must be valid numbers' });
});
