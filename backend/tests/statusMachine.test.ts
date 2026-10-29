import { describe, it, expect } from 'vitest';
import {
  canTransition,
  assertValidTransition,
  getStatusTimestampField,
} from '../src/domain/statusMachine.js';

describe('Order Status Finite State Machine (FSM)', () => {
  it('9. permits valid step-by-step status transitions (RECEIVED -> PREPARING -> READY -> SERVED)', () => {
    // Step 1: RECEIVED -> PREPARING
    expect(canTransition('RECEIVED', 'PREPARING')).toBe(true);
    expect(() => assertValidTransition('RECEIVED', 'PREPARING')).not.toThrow();
    expect(getStatusTimestampField('PREPARING')).toBe('preparingAt');

    // Step 2: PREPARING -> READY
    expect(canTransition('PREPARING', 'READY')).toBe(true);
    expect(() => assertValidTransition('PREPARING', 'READY')).not.toThrow();
    expect(getStatusTimestampField('READY')).toBe('readyAt');

    // Step 3: READY -> SERVED
    expect(canTransition('READY', 'SERVED')).toBe(true);
    expect(() => assertValidTransition('READY', 'SERVED')).not.toThrow();
    expect(getStatusTimestampField('SERVED')).toBe('servedAt');
  });

  it('10. strictly rejects skipped status transitions', () => {
    // Cannot skip PREPARING
    expect(canTransition('RECEIVED', 'READY')).toBe(false);
    expect(() => assertValidTransition('RECEIVED', 'READY')).toThrowError(/Invalid status transition/);

    // Cannot jump straight to SERVED
    expect(canTransition('RECEIVED', 'SERVED')).toBe(false);
    expect(() => assertValidTransition('RECEIVED', 'SERVED')).toThrowError(/Invalid status transition/);

    // Cannot skip READY
    expect(canTransition('PREPARING', 'SERVED')).toBe(false);
    expect(() => assertValidTransition('PREPARING', 'SERVED')).toThrowError(/Invalid status transition/);
  });

  it('11. strictly rejects backward transitions and modifications after SERVED', () => {
    // Backward from PREPARING
    expect(canTransition('PREPARING', 'RECEIVED')).toBe(false);
    expect(() => assertValidTransition('PREPARING', 'RECEIVED')).toThrowError(/Invalid status transition/);

    // Backward from READY
    expect(canTransition('READY', 'PREPARING')).toBe(false);
    expect(() => assertValidTransition('READY', 'PREPARING')).toThrowError(/Invalid status transition/);

    // Transitions after SERVED (terminal state)
    expect(canTransition('SERVED', 'READY')).toBe(false);
    expect(() => assertValidTransition('SERVED', 'READY')).toThrowError(/already been served/);

    expect(canTransition('SERVED', 'PREPARING')).toBe(false);
    expect(() => assertValidTransition('SERVED', 'PREPARING')).toThrowError(/already been served/);
  });
});
