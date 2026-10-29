import type { OrderStatus } from '@prisma/client';
import { AppError } from '../utils/errors.js';

export const VALID_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus | null> = {
  RECEIVED: 'PREPARING',
  PREPARING: 'READY',
  READY: 'SERVED',
  SERVED: null, // Terminal state
};

/**
 * Checks whether an order can transition from currentStatus to targetStatus.
 */
export function canTransition(currentStatus: OrderStatus, targetStatus: OrderStatus): boolean {
  return VALID_STATUS_TRANSITIONS[currentStatus] === targetStatus;
}

/**
 * Asserts a valid status transition or throws an AppError with 400 Bad Request.
 */
export function assertValidTransition(currentStatus: OrderStatus, targetStatus: OrderStatus): void {
  if (currentStatus === targetStatus) {
    throw new AppError(`Order is already in ${currentStatus} status`, 400);
  }

  if (currentStatus === 'SERVED') {
    throw new AppError('Order has already been served and cannot be modified', 400);
  }

  const expectedNext = VALID_STATUS_TRANSITIONS[currentStatus];
  if (expectedNext !== targetStatus) {
    throw new AppError(
      `Invalid status transition from ${currentStatus} to ${targetStatus}. Allowed next status: ${expectedNext || 'none'}`,
      400
    );
  }
}

/**
 * Returns the timestamp field that should be recorded for this transition.
 */
export function getStatusTimestampField(
  targetStatus: OrderStatus
): 'preparingAt' | 'readyAt' | 'servedAt' | null {
  switch (targetStatus) {
    case 'PREPARING':
      return 'preparingAt';
    case 'READY':
      return 'readyAt';
    case 'SERVED':
      return 'servedAt';
    default:
      return null;
  }
}
