import { describe, it, expect } from 'vitest';
import { calcOrderTotal, type VariantWithItem } from '../src/domain/calcOrderTotal.js';

describe('calcOrderTotal Domain Logic', () => {
  const mockVariants: VariantWithItem[] = [
    {
      id: 'var-biryani-half',
      label: 'Half',
      pricePaise: 18000, // ₹180
      isAvailable: true,
      item: {
        id: 'item-biryani',
        name: 'Hyderabadi Chicken Dum Biryani',
        isAvailable: true,
      },
    },
    {
      id: 'var-biryani-full',
      label: 'Full',
      pricePaise: 32000, // ₹320
      isAvailable: true,
      item: {
        id: 'item-biryani',
        name: 'Hyderabadi Chicken Dum Biryani',
        isAvailable: true,
      },
    },
    {
      id: 'var-paneer-regular',
      label: 'Regular',
      pricePaise: 24000, // ₹240
      isAvailable: true,
      item: {
        id: 'item-paneer',
        name: 'Paneer Butter Masala',
        isAvailable: true,
      },
    },
    {
      id: 'var-kabab-soldout',
      label: 'Regular',
      pricePaise: 29000, // ₹290
      isAvailable: false,
      item: {
        id: 'item-kabab',
        name: 'Galouti Kabab',
        isAvailable: false, // Out of stock
      },
    },
  ];

  it('1. correctly computes total for mixed Half and Full variants in integer paise', () => {
    const lines = [
      { variantId: 'var-biryani-half', qty: 2 }, // 2 * 18000 = 36000
      { variantId: 'var-biryani-full', qty: 1 }, // 1 * 32000 = 32000
      { variantId: 'var-paneer-regular', qty: 1 }, // 1 * 24000 = 24000
    ];

    const result = calcOrderTotal(mockVariants, lines);

    // 36000 + 32000 + 24000 = 92000 paise (₹920)
    expect(result.totalPaise).toBe(92000);
    expect(result.items).toHaveLength(3);
    expect(result.items[0].nameSnapshot).toBe('Hyderabadi Chicken Dum Biryani');
    expect(result.items[0].variantLabelSnapshot).toBe('Half');
    expect(result.items[0].lineTotalPaise).toBe(36000);
  });

  it('2. completely ignores any client-supplied prices or line totals', () => {
    const lines = [
      // Client attempts to sneak in a fake price of 10 paise instead of 18000
      { variantId: 'var-biryani-half', qty: 1, pricePaise: 10, totalPaise: 10 } as any,
    ];

    const result = calcOrderTotal(mockVariants, lines);

    // Must strictly charge 18000 paise from database snapshot
    expect(result.totalPaise).toBe(18000);
    expect(result.items[0].unitPricePaise).toBe(18000);
    expect(result.items[0].lineTotalPaise).toBe(18000);
  });

  it('3. rejects zero, negative, or excessive quantities exceeding bounds (1 to 20)', () => {
    // Zero quantity
    expect(() =>
      calcOrderTotal(mockVariants, [{ variantId: 'var-biryani-half', qty: 0 }])
    ).toThrowError(/Quantity must be a positive integer/);

    // Negative quantity
    expect(() =>
      calcOrderTotal(mockVariants, [{ variantId: 'var-biryani-half', qty: -3 }])
    ).toThrowError(/Quantity must be a positive integer/);

    // Excessive quantity (>20)
    expect(() =>
      calcOrderTotal(mockVariants, [{ variantId: 'var-biryani-half', qty: 25 }])
    ).toThrowError(/Maximum quantity per item variant is 20/);
  });

  it('4. rejects unavailable/out-of-stock items with 409 error naming the item', () => {
    expect(() =>
      calcOrderTotal(mockVariants, [{ variantId: 'var-kabab-soldout', qty: 1 }])
    ).toThrowError(/"Galouti Kabab" is currently out of stock/);
  });

  it('5. rejects unknown or nonexistent variant IDs with 422 error', () => {
    expect(() =>
      calcOrderTotal(mockVariants, [{ variantId: 'nonexistent-uuid-999', qty: 1 }])
    ).toThrowError(/does not exist or has been removed/);
  });

  it('8. merges duplicate lines for the same variant into a single line item', () => {
    const lines = [
      { variantId: 'var-biryani-half', qty: 2 },
      { variantId: 'var-biryani-half', qty: 3 },
    ];

    const result = calcOrderTotal(mockVariants, lines);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].qty).toBe(5);
    expect(result.items[0].lineTotalPaise).toBe(5 * 18000); // 90000
    expect(result.totalPaise).toBe(90000);
  });
});
