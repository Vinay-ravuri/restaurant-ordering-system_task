import { AppError } from '../utils/errors.js';

export interface VariantWithItem {
  id: string;
  pricePaise: number;
  label: string;
  isAvailable: boolean;
  item: {
    id: string;
    name: string;
    isAvailable: boolean;
  };
}

export interface OrderLineInput {
  variantId: string;
  qty: number;
}

export interface CalculatedOrderItem {
  itemId: string;
  variantId: string;
  nameSnapshot: string;
  variantLabelSnapshot: string;
  unitPricePaise: number;
  qty: number;
  lineTotalPaise: number;
}

export interface CalculatedOrder {
  totalPaise: number;
  items: CalculatedOrderItem[];
}

/**
 * Pure function: calculates the authoritative order total, validates availability,
 * rejects unknown variants, merges duplicate lines, and enforces quantity bounds.
 * ANY client-supplied price or total is completely ignored.
 */
export function calcOrderTotal(
  dbVariants: VariantWithItem[],
  lines: OrderLineInput[]
): CalculatedOrder {
  if (!lines || lines.length === 0) {
    throw new AppError('Order must contain at least one item', 400);
  }

  if (lines.length > 30) {
    throw new AppError('Order cannot exceed 30 item lines', 400);
  }

  // 1. Merge duplicate variant lines
  const mergedMap = new Map<string, number>();
  for (const line of lines) {
    if (!line.variantId) {
      throw new AppError('variantId is required for all order lines', 400);
    }
    if (!Number.isInteger(line.qty) || line.qty <= 0) {
      throw new AppError('Quantity must be a positive integer', 400, {
        qty: 'Quantity must be greater than 0',
      });
    }
    const currentQty = mergedMap.get(line.variantId) || 0;
    const newQty = currentQty + line.qty;

    if (newQty > 20) {
      throw new AppError('Maximum quantity per item variant is 20', 400, {
        qty: `Total quantity for variant cannot exceed 20 (got ${newQty})`,
      });
    }
    mergedMap.set(line.variantId, newQty);
  }

  // 2. Map database variants by ID for O(1) lookup
  const variantMap = new Map<string, VariantWithItem>();
  for (const v of dbVariants) {
    variantMap.set(v.id, v);
  }

  const calculatedItems: CalculatedOrderItem[] = [];
  let totalPaise = 0;

  // 3. Process authoritative pricing and availability
  for (const [variantId, qty] of mergedMap.entries()) {
    const variant = variantMap.get(variantId);

    // Unknown variant -> 422 Unprocessable Entity
    if (!variant) {
      throw new AppError(`Item variant ${variantId} does not exist or has been removed`, 422, {
        variantId: 'Invalid or unknown item variant',
      });
    }

    // Item or variant unavailable -> 409 Conflict
    if (!variant.item.isAvailable || !variant.isAvailable) {
      throw new AppError(`"${variant.item.name}" is currently out of stock and cannot be ordered`, 409, {
        itemId: variant.item.id,
      });
    }

    const unitPricePaise = variant.pricePaise;
    const lineTotalPaise = unitPricePaise * qty;
    totalPaise += lineTotalPaise;

    calculatedItems.push({
      itemId: variant.item.id,
      variantId: variant.id,
      nameSnapshot: variant.item.name,
      variantLabelSnapshot: variant.label,
      unitPricePaise,
      qty,
      lineTotalPaise,
    });
  }

  return {
    totalPaise,
    items: calculatedItems,
  };
}
