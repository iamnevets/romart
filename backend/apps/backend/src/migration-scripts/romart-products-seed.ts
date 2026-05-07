import { MedusaContainer } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createTaxRegionsWorkflow,
} from "@medusajs/medusa/core-flows";

/**
 * Romart Home Appliances Products Seed Script
 *
 * Romart is a home appliances store and authorized dealer of Luxell (Turkey).
 * Run this after the initial-data-seed to add home appliance products.
 * Execute with: npx medusa exec ./src/migration-scripts/romart-products-seed.ts
 */

// External image URLs from Unsplash (placeholder images for home appliances)
const IMAGES = {
  fridges: {
    french_door: [
      "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800&h=800&fit=crop",
    ],
    side_by_side: [
      "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800&h=800&fit=crop",
    ],
    chest_freezer: [
      "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800&h=800&fit=crop",
    ],
  },
  ovens: {
    mini_oven: [
      "https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=800&h=800&fit=crop",
    ],
    built_in: [
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=800&fit=crop",
    ],
    freestanding: [
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=800&h=800&fit=crop",
    ],
  },
  cookers: {
    gas: [
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=800&h=800&fit=crop",
    ],
    electric: [
      "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=800&h=800&fit=crop",
    ],
  },
  air_conditioners: {
    split: [
      "https://images.unsplash.com/photo-1631567091046-be2e7e0c8b96?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&h=800&fit=crop",
    ],
    window: [
      "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&h=800&fit=crop",
    ],
  },
  washing_machines: {
    front_load: [
      "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1610557892470-55d9e80c0eb2?w=800&h=800&fit=crop",
    ],
    top_load: [
      "https://images.unsplash.com/photo-1610557892470-55d9e80c0eb2?w=800&h=800&fit=crop",
    ],
  },
  small_appliances: {
    blender: [
      "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=800&h=800&fit=crop",
    ],
    kettle: [
      "https://images.unsplash.com/photo-1594213114663-d94db9b6b86d?w=800&h=800&fit=crop",
    ],
    toaster: [
      "https://images.unsplash.com/photo-1590515023382-6c364762c543?w=800&h=800&fit=crop",
    ],
  },
};

export default async function romart_products_seed({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  logger.info("Starting Romart Electronics products seed...");

  // Check if Ghana region exists, create if not
  logger.info("Checking/Creating Ghana region...");
  const { data: existingRegions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "currency_code"],
  });

  let ghanaRegion: any = existingRegions.find(
    (r: { currency_code: string }) => r.currency_code === "ghs"
  );

  if (!ghanaRegion) {
    logger.info("Creating Ghana region with GHS currency...");
    const { result: regionResult } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: "Ghana",
            currency_code: "ghs",
            countries: ["gh"],
            payment_providers: ["pp_system_default"],
          },
        ],
      },
    });
    ghanaRegion = regionResult[0];

    // Create tax region for Ghana
    await createTaxRegionsWorkflow(container).run({
      input: [
        {
          country_code: "gh",
          provider_id: "tp_system",
        },
      ],
    });
    logger.info("Ghana region created.");
  } else {
    logger.info("Ghana region already exists.");
  }

  // Get default sales channel
  const { data: salesChannels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name"],
  });
  const defaultSalesChannel = salesChannels[0];

  // Get shipping profile
  const { data: shippingProfiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  });
  const shippingProfile = shippingProfiles[0];

  // Get stock location
  const { data: stockLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id"],
  });
  const stockLocation = stockLocations[0];

  // Create product categories for home appliances
  logger.info("Creating product categories...");
  const { result: categoryResult } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: [
        { name: "Refrigerators & Freezers", handle: "fridges", is_active: true },
        { name: "Ovens & Cookers", handle: "ovens-cookers", is_active: true },
        { name: "Air Conditioners", handle: "air-conditioners", is_active: true },
        { name: "Washing Machines", handle: "washing-machines", is_active: true },
        { name: "Small Appliances", handle: "small-appliances", is_active: true },
        { name: "Luxell", handle: "luxell", is_active: true }, // Featured brand
      ],
    },
  });

  const categories = {
    fridges: categoryResult.find((c) => c.handle === "fridges")!.id,
    ovensCookers: categoryResult.find((c) => c.handle === "ovens-cookers")!.id,
    airConditioners: categoryResult.find((c) => c.handle === "air-conditioners")!.id,
    washingMachines: categoryResult.find((c) => c.handle === "washing-machines")!.id,
    smallAppliances: categoryResult.find((c) => c.handle === "small-appliances")!.id,
    luxell: categoryResult.find((c) => c.handle === "luxell")!.id,
  };

  logger.info("Creating products...");

  // Home appliance products for Romart (featuring Luxell as partner brand)
  const products = [
    // ==========================================
    // LUXELL PRODUCTS (Featured Partner Brand)
    // ==========================================
    {
      title: "Luxell Electric Oven LX-3675 45L Turbo",
      handle: "luxell-electric-oven-lx3675-45l",
      description: "Premium Turkish-made electric oven with turbo fan for even cooking. Features 45L capacity, adjustable thermostat, timer with audible alarm, and inner lighting. Includes enameled trays and Cr-Ni grill. Perfect for baking, roasting, and grilling.",
      category_ids: [categories.ovensCookers, categories.luxell],
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfile.id,
      weight: 15000,
      images: IMAGES.ovens.mini_oven.map((url) => ({ url })),
      metadata: {
        isNew: true,
        brand: "Luxell",
        madeIn: "Turkey",
        specifications: [
          { label: "Capacity", value: "45 Liters" },
          { label: "Power", value: "1800W (Top 700W + Bottom 1100W)" },
          { label: "Type", value: "Electric with Turbo Fan" },
          { label: "Features", value: "Timer, Thermostat, Inner Light" },
          { label: "Accessories", value: "2 Enameled Trays, Cr-Ni Grill" },
          { label: "Color", value: "White" },
          { label: "Warranty", value: "3 Years" },
        ],
      },
      options: [{ title: "Color", values: ["White", "Black"] }],
      variants: [
        {
          title: "White",
          sku: "LUXELL-LX3675-WHT",
          options: { Color: "White" },
          manage_inventory: true,
          prices: [{ amount: 320_00, currency_code: "ghs" }],
        },
        {
          title: "Black",
          sku: "LUXELL-LX3675-BLK",
          options: { Color: "Black" },
          manage_inventory: true,
          prices: [{ amount: 320_00, currency_code: "ghs" }],
        },
      ],
      sales_channels: [{ id: defaultSalesChannel.id }],
    },
    {
      title: "Luxell Mini Oven LX-3570 32L",
      handle: "luxell-mini-oven-lx3570-32l",
      description: "Compact yet powerful mini oven from Luxell. Ideal for small kitchens, student housing, or as a secondary oven. Features top and bottom heating elements with adjustable temperature control.",
      category_ids: [categories.ovensCookers, categories.luxell],
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfile.id,
      weight: 10000,
      images: IMAGES.ovens.mini_oven.map((url) => ({ url })),
      metadata: {
        brand: "Luxell",
        madeIn: "Turkey",
        specifications: [
          { label: "Capacity", value: "32 Liters" },
          { label: "Power", value: "1500W" },
          { label: "Type", value: "Electric Mini Oven" },
          { label: "Temperature Range", value: "100-250°C" },
          { label: "Color", value: "Black" },
          { label: "Warranty", value: "3 Years" },
        ],
      },
      options: [{ title: "Color", values: ["Black"] }],
      variants: [
        {
          title: "Black",
          sku: "LUXELL-LX3570-BLK",
          options: { Color: "Black" },
          manage_inventory: true,
          prices: [{ amount: 250_00, currency_code: "ghs" }],
        },
      ],
      sales_channels: [{ id: defaultSalesChannel.id }],
    },
    {
      title: "Luxell Freestanding Cooker 60x60 Gas",
      handle: "luxell-freestanding-cooker-60x60-gas",
      description: "Full-size freestanding gas cooker with 4 burners and spacious oven. Made in Turkey with premium quality materials. Features auto-ignition and safety valve.",
      category_ids: [categories.ovensCookers, categories.luxell],
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfile.id,
      weight: 55000,
      images: IMAGES.cookers.gas.map((url) => ({ url })),
      metadata: {
        brand: "Luxell",
        madeIn: "Turkey",
        specifications: [
          { label: "Size", value: "60x60 cm" },
          { label: "Burners", value: "4 Gas Burners" },
          { label: "Oven Type", value: "Gas Oven" },
          { label: "Oven Capacity", value: "65 Liters" },
          { label: "Features", value: "Auto-Ignition, Safety Valve" },
          { label: "Color", value: "Stainless Steel" },
          { label: "Warranty", value: "3 Years" },
        ],
      },
      options: [{ title: "Color", values: ["Stainless Steel", "White"] }],
      variants: [
        {
          title: "Stainless Steel",
          sku: "LUXELL-COOK-60-SS",
          options: { Color: "Stainless Steel" },
          manage_inventory: true,
          prices: [{ amount: 680_00, currency_code: "ghs" }],
        },
        {
          title: "White",
          sku: "LUXELL-COOK-60-WHT",
          options: { Color: "White" },
          manage_inventory: true,
          prices: [{ amount: 650_00, currency_code: "ghs" }],
        },
      ],
      sales_channels: [{ id: defaultSalesChannel.id }],
    },
    {
      title: "Luxell Table Top Cooker 50x50",
      handle: "luxell-table-top-cooker-50x50",
      description: "Compact table-top gas cooker perfect for smaller spaces. 4-burner design with enamel drip tray for easy cleaning.",
      category_ids: [categories.ovensCookers, categories.luxell],
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfile.id,
      weight: 12000,
      images: IMAGES.cookers.gas.map((url) => ({ url })),
      metadata: {
        brand: "Luxell",
        madeIn: "Turkey",
        specifications: [
          { label: "Size", value: "50x50 cm" },
          { label: "Burners", value: "4 Gas Burners" },
          { label: "Type", value: "Table Top" },
          { label: "Color", value: "White" },
          { label: "Warranty", value: "2 Years" },
        ],
      },
      options: [{ title: "Color", values: ["White"] }],
      variants: [
        {
          title: "White",
          sku: "LUXELL-TT-50-WHT",
          options: { Color: "White" },
          manage_inventory: true,
          prices: [{ amount: 180_00, currency_code: "ghs" }],
        },
      ],
      sales_channels: [{ id: defaultSalesChannel.id }],
    },

    // ==========================================
    // REFRIGERATORS & FREEZERS
    // ==========================================
    {
      title: "Samsung French Door Refrigerator 680L",
      handle: "samsung-french-door-680l",
      description: "Experience spacious storage and advanced cooling technology with the Samsung French Door Refrigerator. Features a 680L capacity, twin cooling plus system, and a sleek stainless steel finish.",
      category_ids: [categories.fridges],
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfile.id,
      weight: 95000,
      images: IMAGES.fridges.french_door.map((url) => ({ url })),
      metadata: {
        isNew: true,
        specifications: [
          { label: "Capacity", value: "680 Liters" },
          { label: "Type", value: "French Door" },
          { label: "Color", value: "Stainless Steel" },
          { label: "Energy Rating", value: "A++" },
          { label: "Warranty", value: "2 Years" },
        ],
      },
      options: [{ title: "Color", values: ["Stainless Steel"] }],
      variants: [
        {
          title: "Stainless Steel",
          sku: "SAM-FRIDGE-680-SS",
          options: { Color: "Stainless Steel" },
          manage_inventory: true,
          prices: [{ amount: 1899_00, currency_code: "ghs" }],
        },
      ],
      sales_channels: [{ id: defaultSalesChannel.id }],
    },
    {
      title: "LG Side-by-Side Refrigerator 650L",
      handle: "lg-side-by-side-650l",
      description: "Modern side-by-side refrigerator with spacious compartments and advanced cooling. Features InstaView Door-in-Door and Smart Diagnosis.",
      category_ids: [categories.fridges],
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfile.id,
      weight: 90000,
      images: IMAGES.fridges.side_by_side.map((url) => ({ url })),
      metadata: {
        specifications: [
          { label: "Capacity", value: "650 Liters" },
          { label: "Type", value: "Side-by-Side" },
          { label: "Color", value: "Silver" },
          { label: "Warranty", value: "2 Years" },
        ],
      },
      options: [{ title: "Color", values: ["Silver"] }],
      variants: [
        {
          title: "Silver",
          sku: "LG-FRIDGE-650-SLV",
          options: { Color: "Silver" },
          manage_inventory: true,
          prices: [{ amount: 1650_00, currency_code: "ghs" }],
        },
      ],
      sales_channels: [{ id: defaultSalesChannel.id }],
    },
    {
      title: "Hisense Chest Freezer 300L",
      handle: "hisense-chest-freezer-300l",
      description: "Spacious chest freezer for bulk storage with energy-efficient operation. Perfect for families and small businesses.",
      category_ids: [categories.fridges],
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfile.id,
      weight: 45000,
      images: IMAGES.fridges.chest_freezer.map((url) => ({ url })),
      metadata: {
        specifications: [
          { label: "Capacity", value: "300 Liters" },
          { label: "Type", value: "Chest Freezer" },
          { label: "Color", value: "White" },
          { label: "Warranty", value: "1 Year" },
        ],
      },
      options: [{ title: "Color", values: ["White"] }],
      variants: [
        {
          title: "White",
          sku: "HIS-FREEZE-300-WHT",
          options: { Color: "White" },
          manage_inventory: true,
          prices: [{ amount: 420_00, currency_code: "ghs" }],
        },
      ],
      sales_channels: [{ id: defaultSalesChannel.id }],
    },

    // ==========================================
    // AIR CONDITIONERS
    // ==========================================
    {
      title: "Carrier Split AC 18000 BTU",
      handle: "carrier-split-ac-18000",
      description: "Stay cool and comfortable with the Carrier Split Air Conditioner. This 18000 BTU unit efficiently cools large rooms while operating quietly.",
      category_ids: [categories.airConditioners],
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfile.id,
      weight: 45000,
      images: IMAGES.air_conditioners.split.map((url) => ({ url })),
      metadata: {
        isNew: true,
        specifications: [
          { label: "Capacity", value: "18000 BTU" },
          { label: "Type", value: "Split System" },
          { label: "Energy Rating", value: "A" },
          { label: "Coverage", value: "40-50 sqm" },
          { label: "Warranty", value: "2 Years" },
        ],
      },
      options: [{ title: "Color", values: ["White"] }],
      variants: [
        {
          title: "White",
          sku: "CARRIER-AC-18K-WHT",
          options: { Color: "White" },
          manage_inventory: true,
          prices: [{ amount: 650_00, currency_code: "ghs" }],
        },
      ],
      sales_channels: [{ id: defaultSalesChannel.id }],
    },
    {
      title: "Midea Window AC 12000 BTU",
      handle: "midea-window-ac-12000",
      description: "Compact window air conditioner perfect for medium-sized rooms. Easy installation and energy-efficient cooling.",
      category_ids: [categories.airConditioners],
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfile.id,
      weight: 35000,
      images: IMAGES.air_conditioners.window.map((url) => ({ url })),
      metadata: {
        compareAtPrice: 420_00,
        specifications: [
          { label: "Capacity", value: "12000 BTU" },
          { label: "Type", value: "Window" },
          { label: "Coverage", value: "20-30 sqm" },
          { label: "Warranty", value: "1 Year" },
        ],
      },
      options: [{ title: "Color", values: ["White"] }],
      variants: [
        {
          title: "White",
          sku: "MIDEA-AC-12K-WHT",
          options: { Color: "White" },
          manage_inventory: true,
          prices: [{ amount: 350_00, currency_code: "ghs" }],
        },
      ],
      sales_channels: [{ id: defaultSalesChannel.id }],
    },

    // ==========================================
    // WASHING MACHINES
    // ==========================================
    {
      title: "Samsung Front Load Washer 9kg",
      handle: "samsung-front-load-9kg",
      description: "Achieve spotless laundry results with the Samsung Front Load Washer. The 9kg capacity handles large loads easily with AI-powered washing cycles.",
      category_ids: [categories.washingMachines],
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfile.id,
      weight: 70000,
      images: IMAGES.washing_machines.front_load.map((url) => ({ url })),
      metadata: {
        specifications: [
          { label: "Capacity", value: "9 kg" },
          { label: "Type", value: "Front Load" },
          { label: "Spin Speed", value: "1400 RPM" },
          { label: "Color", value: "White" },
          { label: "Warranty", value: "2 Years" },
        ],
      },
      options: [{ title: "Color", values: ["White"] }],
      variants: [
        {
          title: "White",
          sku: "SAM-WASH-9KG-WHT",
          options: { Color: "White" },
          manage_inventory: true,
          prices: [{ amount: 750_00, currency_code: "ghs" }],
        },
      ],
      sales_channels: [{ id: defaultSalesChannel.id }],
    },
    {
      title: "Whirlpool Top Load Washer 12kg",
      handle: "whirlpool-top-load-12kg",
      description: "Large capacity top load washer for family-sized laundry loads. Features 6th Sense technology for optimal washing performance.",
      category_ids: [categories.washingMachines],
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfile.id,
      weight: 55000,
      images: IMAGES.washing_machines.top_load.map((url) => ({ url })),
      metadata: {
        specifications: [
          { label: "Capacity", value: "12 kg" },
          { label: "Type", value: "Top Load" },
          { label: "Spin Speed", value: "700 RPM" },
          { label: "Color", value: "White" },
          { label: "Warranty", value: "2 Years" },
        ],
      },
      options: [{ title: "Color", values: ["White"] }],
      variants: [
        {
          title: "White",
          sku: "WHIRL-WASH-12KG-WHT",
          options: { Color: "White" },
          manage_inventory: true,
          prices: [{ amount: 550_00, currency_code: "ghs" }],
        },
      ],
      sales_channels: [{ id: defaultSalesChannel.id }],
    },

    // ==========================================
    // SMALL APPLIANCES
    // ==========================================
    {
      title: "Kenwood Stand Mixer 1000W",
      handle: "kenwood-stand-mixer-1000w",
      description: "Professional-grade stand mixer for serious home bakers. Powerful 1000W motor with multiple attachments for mixing, kneading, and whipping.",
      category_ids: [categories.smallAppliances],
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfile.id,
      weight: 8000,
      images: IMAGES.small_appliances.blender.map((url) => ({ url })),
      metadata: {
        isNew: true,
        specifications: [
          { label: "Power", value: "1000W" },
          { label: "Bowl Capacity", value: "5 Liters" },
          { label: "Speeds", value: "Variable + Pulse" },
          { label: "Attachments", value: "Whisk, Dough Hook, K-Beater" },
          { label: "Color", value: "Silver" },
          { label: "Warranty", value: "2 Years" },
        ],
      },
      options: [{ title: "Color", values: ["Silver"] }],
      variants: [
        {
          title: "Silver",
          sku: "KENWOOD-MIX-1K-SLV",
          options: { Color: "Silver" },
          manage_inventory: true,
          prices: [{ amount: 480_00, currency_code: "ghs" }],
        },
      ],
      sales_channels: [{ id: defaultSalesChannel.id }],
    },
    {
      title: "Philips Electric Kettle 1.7L",
      handle: "philips-electric-kettle-1-7l",
      description: "Fast-boiling electric kettle with 1.7L capacity. Features auto shut-off, boil-dry protection, and 360° cordless base.",
      category_ids: [categories.smallAppliances],
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfile.id,
      weight: 1200,
      images: IMAGES.small_appliances.kettle.map((url) => ({ url })),
      metadata: {
        specifications: [
          { label: "Capacity", value: "1.7 Liters" },
          { label: "Power", value: "2200W" },
          { label: "Features", value: "Auto Shut-off, Boil-dry Protection" },
          { label: "Base", value: "360° Cordless" },
          { label: "Color", value: "Stainless Steel" },
          { label: "Warranty", value: "1 Year" },
        ],
      },
      options: [{ title: "Color", values: ["Stainless Steel"] }],
      variants: [
        {
          title: "Stainless Steel",
          sku: "PHILIPS-KET-17-SS",
          options: { Color: "Stainless Steel" },
          manage_inventory: true,
          prices: [{ amount: 85_00, currency_code: "ghs" }],
        },
      ],
      sales_channels: [{ id: defaultSalesChannel.id }],
    },
    {
      title: "Black & Decker 2-Slice Toaster",
      handle: "black-decker-2-slice-toaster",
      description: "Classic 2-slice toaster with adjustable browning control. Extra-wide slots accommodate various bread sizes including bagels.",
      category_ids: [categories.smallAppliances],
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfile.id,
      weight: 1500,
      images: IMAGES.small_appliances.toaster.map((url) => ({ url })),
      metadata: {
        specifications: [
          { label: "Slices", value: "2" },
          { label: "Power", value: "850W" },
          { label: "Features", value: "Browning Control, Defrost, Cancel" },
          { label: "Slot Width", value: "Extra Wide" },
          { label: "Color", value: "Black" },
          { label: "Warranty", value: "1 Year" },
        ],
      },
      options: [{ title: "Color", values: ["Black"] }],
      variants: [
        {
          title: "Black",
          sku: "BD-TOAST-2S-BLK",
          options: { Color: "Black" },
          manage_inventory: true,
          prices: [{ amount: 55_00, currency_code: "ghs" }],
        },
      ],
      sales_channels: [{ id: defaultSalesChannel.id }],
    },
  ];

  await createProductsWorkflow(container).run({
    input: { products },
  });

  logger.info(`Created ${products.length} products.`);

  // Set up inventory levels
  logger.info("Setting up inventory levels...");

  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id", "sku"],
  });

  // Filter to only our newly created products (by SKU prefix patterns)
  const romartSkuPrefixes = [
    "LUXELL-",   // Luxell (partner brand)
    "SAM-",      // Samsung
    "LG-",       // LG
    "HIS-",      // Hisense
    "CARRIER-",  // Carrier
    "MIDEA-",    // Midea
    "WHIRL-",    // Whirlpool
    "KENWOOD-",  // Kenwood
    "PHILIPS-",  // Philips
    "BD-",       // Black & Decker
  ];
  const romartInventoryItems = inventoryItems.filter((item) => {
    const sku = item.sku;
    return typeof sku === "string" && romartSkuPrefixes.some((prefix) => sku.startsWith(prefix));
  });

  if (romartInventoryItems.length > 0 && stockLocation) {
    await createInventoryLevelsWorkflow(container).run({
      input: {
        inventory_levels: romartInventoryItems.map((item: { id: string }) => ({
          location_id: stockLocation.id,
          stocked_quantity: Math.floor(Math.random() * 20) + 5, // Random stock 5-25
          inventory_item_id: item.id,
        })),
      },
    });
    logger.info(`Created inventory levels for ${romartInventoryItems.length} items.`);
  }

  logger.info("Romart Electronics products seed completed!");
}
