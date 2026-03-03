import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load data files
const itemsPath = path.join(__dirname, '../src/data/items.json');
const shopsPath = path.join(__dirname, '../src/data/shops.json');

const itemsData = JSON.parse(fs.readFileSync(itemsPath, 'utf8'));
const shopsData = JSON.parse(fs.readFileSync(shopsPath, 'utf8'));

// Validation Logic
console.log('🔍 Starting Data Validation...\n');

let errorCount = 0;
let warningCount = 0;

// 1. Validate Items
console.log('📦 Validating Items...');
const validCategories = ['weapon', 'armor', 'accessory', 'resource', 'consumable', 'tool', 'key_item', 'quest'];
Object.entries(itemsData).forEach(([id, item]: [string, any]) => {
    // Check for required fields
    if (!item.name) {
        console.error(`❌ Item [${id}] missing 'name'.`);
        errorCount++;
    }
    if (!item.type) {
        console.error(`❌ Item [${id}] missing 'type'.`);
        errorCount++;
    } else if (!validCategories.includes(item.type)) {
        console.warn(`⚠️  Item [${id}] has unknown type '${item.type}'.`);
        warningCount++;
    }
    
    // Check for weight and value
    if (typeof item.weight !== 'number') {
        console.error(`❌ Item [${id}] has invalid 'weight'.`);
        errorCount++;
    }
    if (typeof item.base_value !== 'number') {
        console.error(`❌ Item [${id}] has invalid 'base_value'.`);
        errorCount++;
    }
});
console.log('✅ Items validation complete.\n');

// 2. Validate Shops
console.log('🏪 Validating Shops...');
shopsData.forEach((shop: any) => {
    // Check accepted_categories
    if (shop.accepted_categories) {
        shop.accepted_categories.forEach((cat: string) => {
            if (!validCategories.includes(cat)) {
                console.warn(`⚠️  Shop [${shop.shop_id}] accepts unknown category '${cat}'.`);
                warningCount++;
            }
        });
    }

    // Check Inventory consistency
    shop.inventory.forEach((entry: any) => {
        const item = itemsData[entry.item_id];
        if (!item) {
            console.error(`❌ Shop [${shop.shop_id}] sells unknown item '${entry.item_id}'.`);
            errorCount++;
        } else {
            // Verify if the shop accidentally sells something it "shouldn't" based on its own rules
            // This is optional but good for consistency
            if (shop.accepted_categories && !shop.accepted_categories.includes(item.type)) {
                console.warn(`⚠️  Shop [${shop.shop_id}] sells '${item.name}' (${item.type}) but doesn't accept that category for buying.`);
                warningCount++;
            }
        }
    });
});
console.log('✅ Shops validation complete.\n');

// Summary
console.log('📊 Validation Summary');
console.log(`Errors: ${errorCount}`);
console.log(`Warnings: ${warningCount}`);

if (errorCount > 0) {
    console.log('\n❌ Validation FAILED. Please fix errors.');
    process.exit(1);
} else {
    console.log('\n✨ Validation PASSED. Data integrity looks good.');
    process.exit(0);
}
