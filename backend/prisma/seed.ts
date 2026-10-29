import { PrismaClient, Role, OrderType, OrderStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting RestaurantOS Database Seed...');

  // 1. Seed Staff Users
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  const kitchenPasswordHash = await bcrypt.hash('Kitchen@123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: { passwordHash: adminPasswordHash, role: Role.ADMIN },
    create: {
      email: 'admin@demo.com',
      name: 'Restaurant Admin',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
    },
  });

  const kitchen = await prisma.user.upsert({
    where: { email: 'kitchen@demo.com' },
    update: { passwordHash: kitchenPasswordHash, role: Role.KITCHEN },
    create: {
      email: 'kitchen@demo.com',
      name: 'Head Chef Kitchen',
      passwordHash: kitchenPasswordHash,
      role: Role.KITCHEN,
    },
  });

  console.log(`✅ Staff Accounts Seeded:
   - Admin:   ${admin.email} (Password: Admin@123)
   - Kitchen: ${kitchen.email} (Password: Kitchen@123)`);

  // 2. Categories
  const categoriesData = [
    { name: 'Starters & Appetizers', sortOrder: 1, description: 'Crispy, spiced kebabs, tikkas and finger foods' },
    { name: 'Biryani & Rice', sortOrder: 2, description: 'Dum-cooked fragrant basmati rice and aromatic pulao' },
    { name: 'Curries & Gravies', sortOrder: 3, description: 'Rich Mughlai gravies, slow-cooked dal and paneer curries' },
    { name: 'Breads & Accompaniments', sortOrder: 4, description: 'Fresh clay tandoor baked naans, rotis and kulchas' },
    { name: 'Desserts & Drinks', sortOrder: 5, description: 'Traditional sweets, chilled lassis and beverages' },
  ];

  const createdCategories: Record<string, string> = {};

  for (const cat of categoriesData) {
    const existing = await prisma.category.findFirst({ where: { name: cat.name } });
    if (existing) {
      createdCategories[cat.name] = existing.id;
    } else {
      const created = await prisma.category.create({ data: cat });
      createdCategories[cat.name] = created.id;
    }
  }

  // 3. Menu Items & Variants
  const menuData = [
    {
      category: 'Starters & Appetizers',
      name: 'Paneer Tikka Angara',
      description: 'Charcoal-grilled cottage cheese cubes marinated in Kashmiri chili and tandoori spices.',
      dietary: 'VEG',
      variants: [
        { label: 'Half (4 pcs)', pricePaise: 18000 },
        { label: 'Full (8 pcs)', pricePaise: 32000 },
      ],
    },
    {
      category: 'Starters & Appetizers',
      name: 'Galouti Kabab',
      description: 'Melt-in-mouth smoked vegetable patties infused with saffron and royal Awadhi spices.',
      dietary: 'VEG',
      variants: [
        { label: 'Regular (6 pcs)', pricePaise: 26000 },
      ],
    },
    {
      category: 'Starters & Appetizers',
      name: 'Murgh Malai Tikka',
      description: 'Tender chicken morsels steeped in cream, cardamom, and gentle spices, roasted to perfection.',
      dietary: 'NON_VEG',
      variants: [
        { label: 'Half (4 pcs)', pricePaise: 22000 },
        { label: 'Full (8 pcs)', pricePaise: 38000 },
      ],
    },
    {
      category: 'Starters & Appetizers',
      name: 'Crispy Corn & Waterchestnut Salt & Pepper',
      description: 'Golden fried sweet corn kernels and crunchy waterchestnuts tossed with garlic, scallions, and crushed pepper.',
      dietary: 'VEG',
      variants: [
        { label: 'Regular', pricePaise: 21000 },
      ],
    },
    {
      category: 'Biryani & Rice',
      name: 'Hyderabadi Chicken Dum Biryani',
      description: 'Layers of long-grain basmati rice and marinated chicken cooked sealed with dough on slow charcoal dum.',
      dietary: 'NON_VEG',
      variants: [
        { label: 'Half Plate', pricePaise: 24000 },
        { label: 'Full Plate', pricePaise: 39000 },
      ],
    },
    {
      category: 'Biryani & Rice',
      name: 'Lucknowi Subz Dum Biryani',
      description: 'Fragrant saffron basmati layered with garden-fresh veggies, mint leaves, brown onions, and rose water.',
      dietary: 'VEG',
      variants: [
        { label: 'Half Plate', pricePaise: 19000 },
        { label: 'Full Plate', pricePaise: 32000 },
      ],
    },
    {
      category: 'Biryani & Rice',
      name: 'Jeera Ghee Pulao',
      description: 'Steamed aged basmati tossed with roasted cumin seeds and desi cow ghee.',
      dietary: 'VEG',
      variants: [
        { label: 'Regular', pricePaise: 16000 },
      ],
    },
    {
      category: 'Curries & Gravies',
      name: 'Paneer Butter Masala',
      description: 'Succulent malai paneer simmered in an indulgent, buttery tomato-cashew gravy with dried fenugreek.',
      dietary: 'VEG',
      variants: [
        { label: 'Half', pricePaise: 21000 },
        { label: 'Full', pricePaise: 34000 },
      ],
    },
    {
      category: 'Curries & Gravies',
      name: 'Dal Makhani Bukhara',
      description: 'Black urad lentils and red kidney beans slow-cooked overnight for 16 hours with cream and butter.',
      dietary: 'VEG',
      variants: [
        { label: 'Half', pricePaise: 18000 },
        { label: 'Full', pricePaise: 29000 },
      ],
    },
    {
      category: 'Curries & Gravies',
      name: 'Butter Chicken Aslam Style',
      description: 'Tandoori chicken pieces cooked in a smoky, velvety tomato gravy finished with amul butter and cream.',
      dietary: 'NON_VEG',
      variants: [
        { label: 'Half', pricePaise: 26000 },
        { label: 'Full', pricePaise: 44000 },
      ],
    },
    {
      category: 'Breads & Accompaniments',
      name: 'Butter Garlic Naan',
      description: 'Teardrop tandoori flatbread topped with minced garlic and coriander, glazed with melted butter.',
      dietary: 'VEG',
      variants: [
        { label: 'Single Piece', pricePaise: 7500 },
      ],
    },
    {
      category: 'Breads & Accompaniments',
      name: 'Tandoori Roti',
      description: 'Whole wheat leavened bread baked crisp in the clay oven.',
      dietary: 'VEG',
      variants: [
        { label: 'Plain', pricePaise: 3500 },
        { label: 'Butter', pricePaise: 4500 },
      ],
    },
    {
      category: 'Desserts & Drinks',
      name: 'Gulab Jamun Flambé',
      description: 'Warm condensed milk dumplings soaked in cardamom sugar syrup, garnished with pistachios.',
      dietary: 'VEG',
      variants: [
        { label: '2 Pieces', pricePaise: 9500 },
      ],
    },
    {
      category: 'Desserts & Drinks',
      name: 'Kesar Pista Mango Lassi',
      description: 'Thick, creamy churned yogurt blended with Alphonso mango pulp and Kashmiri saffron threads.',
      dietary: 'VEG',
      variants: [
        { label: 'Glass (350ml)', pricePaise: 12000 },
      ],
    },
  ];

  for (const itemData of menuData) {
    const categoryId = createdCategories[itemData.category];
    if (!categoryId) continue;

    let item = await prisma.menuItem.findFirst({
      where: { name: itemData.name, categoryId },
    });

    if (!item) {
      item = await prisma.menuItem.create({
        data: {
          categoryId,
          name: itemData.name,
          description: itemData.description,
          dietary: itemData.dietary,
          isAvailable: true,
        },
      });
    }

    for (const v of itemData.variants) {
      const existingVar = await prisma.itemVariant.findFirst({
        where: { itemId: item.id, label: v.label },
      });
      if (!existingVar) {
        await prisma.itemVariant.create({
          data: {
            itemId: item.id,
            label: v.label,
            pricePaise: v.pricePaise,
            isAvailable: true,
          },
        });
      }
    }
  }

  console.log('✅ Menu Categories & Items with Half/Full variants seeded successfully.');

  // 4. Sample Demo Orders in various workflow states
  const sampleVariant = await prisma.itemVariant.findFirst({
    include: { item: true },
  });

  if (sampleVariant) {
    const existingOrdersCount = await prisma.order.count();
    if (existingOrdersCount === 0) {
      // Order 1: RECEIVED
      await prisma.order.create({
        data: {
          orderNumber: '#101',
          orderType: OrderType.DINE_IN,
          tableNumber: 4,
          customerName: 'Aarav Sharma',
          status: OrderStatus.RECEIVED,
          totalPaise: sampleVariant.pricePaise * 2,
          items: {
            create: [
              {
                itemId: sampleVariant.item.id,
                variantId: sampleVariant.id,
                nameSnapshot: sampleVariant.item.name,
                variantLabelSnapshot: sampleVariant.label,
                unitPricePaise: sampleVariant.pricePaise,
                qty: 2,
                lineTotalPaise: sampleVariant.pricePaise * 2,
              },
            ],
          },
        },
      });

      // Order 2: PREPARING
      await prisma.order.create({
        data: {
          orderNumber: '#102',
          orderType: OrderType.TAKEAWAY,
          customerName: 'Priya Verma',
          status: OrderStatus.PREPARING,
          preparingAt: new Date(),
          totalPaise: sampleVariant.pricePaise,
          items: {
            create: [
              {
                itemId: sampleVariant.item.id,
                variantId: sampleVariant.id,
                nameSnapshot: sampleVariant.item.name,
                variantLabelSnapshot: sampleVariant.label,
                unitPricePaise: sampleVariant.pricePaise,
                qty: 1,
                lineTotalPaise: sampleVariant.pricePaise,
              },
            ],
          },
        },
      });

      // Order 3: READY
      await prisma.order.create({
        data: {
          orderNumber: '#103',
          orderType: OrderType.DINE_IN,
          tableNumber: 12,
          customerName: 'Rohan Mehta',
          status: OrderStatus.READY,
          preparingAt: new Date(Date.now() - 15 * 60000),
          readyAt: new Date(),
          totalPaise: sampleVariant.pricePaise * 3,
          items: {
            create: [
              {
                itemId: sampleVariant.item.id,
                variantId: sampleVariant.id,
                nameSnapshot: sampleVariant.item.name,
                variantLabelSnapshot: sampleVariant.label,
                unitPricePaise: sampleVariant.pricePaise,
                qty: 3,
                lineTotalPaise: sampleVariant.pricePaise * 3,
              },
            ],
          },
        },
      });

      console.log('✅ Sample orders seeded in RECEIVED, PREPARING, and READY states.');
    }
  }

  console.log('🎉 Seed Completed Successfully.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
