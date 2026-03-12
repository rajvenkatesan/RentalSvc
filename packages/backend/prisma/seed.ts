import "dotenv/config";
import { PrismaClient, ItemCondition, DeliveryOption } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env["DATABASE_URL"]! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clean existing data
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.rentableItem.deleteMany();
  await prisma.item.deleteMany();
  await prisma.user.deleteMany();

  // Create 3 users
  const alice = await prisma.user.create({
    data: {
      id: "00000000-0000-0000-0000-000000000001",
      email: "alice@example.com",
      displayName: "Alice Johnson",
      avatarUrl: "https://i.pravatar.cc/150?u=alice",
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: "bob@example.com",
      displayName: "Bob Martinez",
      avatarUrl: "https://i.pravatar.cc/150?u=bob",
    },
  });

  const carol = await prisma.user.create({
    data: {
      email: "carol@example.com",
      displayName: "Carol Chen",
      avatarUrl: "https://i.pravatar.cc/150?u=carol",
    },
  });

  // Seed items with RentableItem listings
  const itemsData = [
    // Tools (3)
    {
      ownerId: alice.id,
      title: "DeWalt Power Drill",
      description: "20V cordless drill with two batteries and charger. Perfect for home projects.",
      category: "Tools",
      condition: ItemCondition.like_new,
      images: ["/images/drill.jpg"],
      location: { city: "Austin", state: "TX", zip: "78701" },
      rental: { dailyRate: 15, weeklyRate: 75, securityDeposit: 50, deliveryOptions: [DeliveryOption.pickup], minRentalDays: 1 },
    },
    {
      ownerId: bob.id,
      title: "Circular Saw",
      description: "7-1/4 inch circular saw with laser guide. Cuts through wood and plywood easily.",
      category: "Tools",
      condition: ItemCondition.good,
      images: ["/images/saw.jpg"],
      location: { city: "Austin", state: "TX", zip: "78702" },
      rental: { dailyRate: 20, weeklyRate: 100, securityDeposit: 75, deliveryOptions: [DeliveryOption.pickup, DeliveryOption.shipping], shippingCost: 12, minRentalDays: 1 },
    },
    {
      ownerId: carol.id,
      title: "Pressure Washer",
      description: "3000 PSI gas pressure washer. Great for driveways, decks, and siding.",
      category: "Tools",
      condition: ItemCondition.good,
      images: ["/images/pressure-washer.jpg"],
      location: { city: "Round Rock", state: "TX", zip: "78664" },
      rental: { dailyRate: 35, weeklyRate: 175, securityDeposit: 100, deliveryOptions: [DeliveryOption.pickup], minRentalDays: 1 },
    },
    // Electronics (3)
    {
      ownerId: alice.id,
      title: "Sony A7 III Camera",
      description: "Full-frame mirrorless camera body with 28-70mm kit lens. Excellent for photography and video.",
      category: "Electronics",
      condition: ItemCondition.like_new,
      images: ["/images/camera.jpg"],
      location: { city: "Austin", state: "TX", zip: "78701" },
      rental: { dailyRate: 50, weeklyRate: 250, securityDeposit: 200, deliveryOptions: [DeliveryOption.pickup], minRentalDays: 1 },
    },
    {
      ownerId: bob.id,
      title: "DJI Mini 3 Pro Drone",
      description: "Lightweight drone with 4K camera and 34-min flight time. Includes carry case.",
      category: "Electronics",
      condition: ItemCondition.new,
      images: ["/images/drone.jpg"],
      location: { city: "Austin", state: "TX", zip: "78702" },
      rental: { dailyRate: 40, weeklyRate: 200, securityDeposit: 150, deliveryOptions: [DeliveryOption.both], shippingCost: 15, minRentalDays: 1 },
    },
    {
      ownerId: carol.id,
      title: "Portable Projector",
      description: "1080p LED projector with built-in speakers. Great for movie nights and presentations.",
      category: "Electronics",
      condition: ItemCondition.good,
      images: ["/images/projector.jpg"],
      location: { city: "Round Rock", state: "TX", zip: "78664" },
      rental: { dailyRate: 25, weeklyRate: 120, securityDeposit: 75, deliveryOptions: [DeliveryOption.both], shippingCost: 10, minRentalDays: 1 },
    },
    // Sports (3)
    {
      ownerId: alice.id,
      title: "Mountain Bike",
      description: "Trek Marlin 7 hardtail mountain bike, size large. Well-maintained with new tires.",
      category: "Sports",
      condition: ItemCondition.good,
      images: ["/images/mountain-bike.jpg"],
      location: { city: "Austin", state: "TX", zip: "78701" },
      rental: { dailyRate: 30, weeklyRate: 150, securityDeposit: 100, deliveryOptions: [DeliveryOption.pickup], minRentalDays: 1 },
    },
    {
      ownerId: bob.id,
      title: "Surfboard",
      description: "8-foot foam surfboard, perfect for beginners. Includes leash and fins.",
      category: "Sports",
      condition: ItemCondition.fair,
      images: ["/images/surfboard.jpg"],
      location: { city: "Austin", state: "TX", zip: "78702" },
      rental: { dailyRate: 20, weeklyRate: 90, securityDeposit: 50, deliveryOptions: [DeliveryOption.pickup], minRentalDays: 1, maxRentalDays: 14 },
    },
    {
      ownerId: carol.id,
      title: "Kayak (2-person)",
      description: "Inflatable tandem kayak with paddles, pump, and carry bag. Fits in a car trunk.",
      category: "Sports",
      condition: ItemCondition.like_new,
      images: ["/images/kayak.jpg"],
      location: { city: "Round Rock", state: "TX", zip: "78664" },
      rental: { dailyRate: 35, weeklyRate: 175, securityDeposit: 80, deliveryOptions: [DeliveryOption.pickup], minRentalDays: 1 },
    },
    // Outdoor (3)
    {
      ownerId: alice.id,
      title: "4-Person Camping Tent",
      description: "REI Half Dome 4-person tent. Waterproof, easy setup, includes rainfly and footprint.",
      category: "Outdoor",
      condition: ItemCondition.good,
      images: ["/images/tent.jpg"],
      location: { city: "Austin", state: "TX", zip: "78701" },
      rental: { dailyRate: 20, weeklyRate: 90, securityDeposit: 60, deliveryOptions: [DeliveryOption.both], shippingCost: 15, minRentalDays: 2 },
    },
    {
      ownerId: bob.id,
      title: "Portable Generator",
      description: "2200W inverter generator. Quiet operation, great for camping or tailgating.",
      category: "Outdoor",
      condition: ItemCondition.good,
      images: ["/images/generator.jpg"],
      location: { city: "Austin", state: "TX", zip: "78702" },
      rental: { dailyRate: 30, weeklyRate: 150, securityDeposit: 100, deliveryOptions: [DeliveryOption.pickup], minRentalDays: 1 },
    },
    {
      ownerId: carol.id,
      title: "Stand-Up Paddleboard",
      description: "11-foot inflatable SUP with paddle, pump, and backpack. Rolls up for easy transport.",
      category: "Outdoor",
      condition: ItemCondition.new,
      images: ["/images/paddleboard.jpg"],
      location: { city: "Round Rock", state: "TX", zip: "78664" },
      rental: { dailyRate: 25, weeklyRate: 120, securityDeposit: 75, deliveryOptions: [DeliveryOption.pickup], minRentalDays: 1 },
    },
    // Kitchen (3)
    {
      ownerId: alice.id,
      title: "KitchenAid Stand Mixer",
      description: "Artisan 5-quart stand mixer in Empire Red. Includes whisk, dough hook, and paddle attachments.",
      category: "Kitchen",
      condition: ItemCondition.like_new,
      images: ["/images/mixer.jpg"],
      location: { city: "Austin", state: "TX", zip: "78701" },
      rental: { dailyRate: 15, weeklyRate: 70, securityDeposit: 50, deliveryOptions: [DeliveryOption.both], shippingCost: 12, minRentalDays: 1 },
    },
    {
      ownerId: bob.id,
      title: "Espresso Machine",
      description: "Breville Barista Express with built-in grinder. Makes cafe-quality espresso at home.",
      category: "Kitchen",
      condition: ItemCondition.good,
      images: ["/images/espresso.jpg"],
      location: { city: "Austin", state: "TX", zip: "78702" },
      rental: { dailyRate: 20, weeklyRate: 100, securityDeposit: 75, deliveryOptions: [DeliveryOption.shipping], shippingCost: 18, minRentalDays: 3 },
    },
    {
      ownerId: carol.id,
      title: "Outdoor Pizza Oven",
      description: "Ooni Koda 16 gas-powered pizza oven. Heats to 950°F in 20 minutes.",
      category: "Kitchen",
      condition: ItemCondition.like_new,
      images: ["/images/pizza-oven.jpg"],
      location: { city: "Round Rock", state: "TX", zip: "78664" },
      rental: { dailyRate: 25, weeklyRate: 120, securityDeposit: 80, deliveryOptions: [DeliveryOption.pickup], minRentalDays: 1 },
    },
  ];

  for (const { rental, ...itemData } of itemsData) {
    const item = await prisma.item.create({ data: itemData });
    await prisma.rentableItem.create({
      data: {
        itemId: item.id,
        dailyRate: rental.dailyRate,
        weeklyRate: rental.weeklyRate,
        securityDeposit: rental.securityDeposit,
        minRentalDays: rental.minRentalDays,
        maxRentalDays: rental.maxRentalDays ?? null,
        deliveryOptions: rental.deliveryOptions,
        shippingCost: rental.shippingCost ?? null,
        isAvailable: true,
      },
    });
  }

  console.log("Seeded 3 users and 15 items with rentable listings.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
