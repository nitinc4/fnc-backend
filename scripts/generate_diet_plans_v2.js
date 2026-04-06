import mongoose from "mongoose";
import dotenv from "dotenv";
import { HealthIssue } from "../src/models/health_issue/health_issue.model.js";
import { DietPlan } from "../src/models/diet_plan/diet_plan.model.js";
import { Food } from "../src/models/food/food.model.js";
import { Meal } from "../src/models/meal/meal.model.js";
import { Nutrient } from "../src/models/nutrient.model.js";
import { User } from "../src/models/auth/user.model.js";

dotenv.config();

const mongoURI = process.env.MONGO_URI;

const HEALTH_ISSUES = [
    { name: 'Cancer Care', cause: 'Cell mutation', risk_factor: 8, treatment: 'Nutritional support & Therapy' },
    { name: 'Pcod', cause: 'Hormonal imbalance', risk_factor: 5, treatment: 'Diet & Lifestyle' },
    { name: 'Pcos', cause: 'Hormonal imbalance', risk_factor: 5, treatment: 'Diet & Lifestyle' },
    { name: 'Bladder Stone Reversal', cause: 'Mineral buildup', risk_factor: 6, treatment: 'Hydration & Low Oxalate' },
    { name: 'Kidney Stone Reversal', cause: 'Crystal formation', risk_factor: 7, treatment: 'Hydration & Low Oxalate' },
    { name: 'Thyroid', cause: 'Iodine/Autoimmune', risk_factor: 5, treatment: 'Thyroid-friendly diet' },
    { name: 'Diabetes', cause: 'Insulin resistance', risk_factor: 7, treatment: 'Low GI Diet' },
    { name: 'Blood Pressure', cause: 'Sodium/Stress', risk_factor: 6, treatment: 'DASH Diet' },
    { name: 'Gastric Reversal', cause: 'Acid/Inflammation', risk_factor: 5, treatment: 'Bland/Probiotic Diet' },
    { name: 'Derma Care', cause: 'Inflammation/Nutrients', risk_factor: 3, treatment: 'Skin-enriching foods' },
    { name: 'General plan', cause: 'Maintenance', risk_factor: 2, treatment: 'Balanced Diet' }
];

const VARIANTS = ['Weight Loss', 'Weight Gain', 'Weight Maintenance'];

const IDEAL_FOODS_MAP = {
    'Diabetes': { 
        veg: ['Bitter Gourd', 'Fenugreek Seeds', 'Oats', 'Lentils', 'Spinach', 'Broccoli'], 
        nonVeg: ['Grilled Fish', 'Chicken Breast', 'Eggs', 'Boiled Chicken'],
        vegan: ['Tofu', 'Quinoa', 'Chia Seeds', 'Almonds', 'Walnuts']
    },
    'Pcod': { 
        veg: ['Pumpkin Seeds', 'Leafy Greens', 'Berries', 'Cinnamon', 'Chia Seeds'], 
        nonVeg: ['Salmon', 'Eggs', 'Lean Chicken', 'White Fish'],
        vegan: ['Walnuts', 'Flaxseeds', 'Kale', 'Avocados']
    },
    'Pcos': { 
        veg: ['Pumpkin Seeds', 'Leafy Greens', 'Berries', 'Cinnamon', 'Chia Seeds'], 
        nonVeg: ['Salmon', 'Eggs', 'Lean Chicken', 'White Fish'],
        vegan: ['Walnuts', 'Flaxseeds', 'Kale', 'Avocados']
    },
    'Thyroid': { 
        veg: ['Brazil Nuts', 'Greek Yogurt', 'Eggs', 'Spinach', 'Pumpkin Seeds'], 
        nonVeg: ['Baked Fish', 'Sea Bass', 'Shrimp', 'Boiled Chicken'],
        vegan: ['Seaweed', 'Chickpeas', 'Cashews', 'Almonds']
    },
    'Blood Pressure': { 
        veg: ['Bananas', 'Beets', 'Low-fat Yogurt', 'Oats', 'Spinach'], 
        nonVeg: ['Grilled Salmon', 'Egg Whites', 'Chicken Breast'],
        vegan: ['Avocados', 'Garlic', 'Pistachios', 'Berries']
    },
    'Cancer Care': { 
        veg: ['Broccoli', 'Turmeric', 'Green Tea', 'Blueberries', 'Leafy Greens'], 
        nonVeg: ['Poached Fish', 'Boiled Chicken', 'Eggs', 'Salmon'],
        vegan: ['Tofu', 'Walnuts', 'Soy Milk', 'Chia Seeds']
    },
    'Bladder Stone Reversal': { 
        veg: ['Lemons', 'Watermelon', 'Basil', 'Cauliflower', 'Cucumber'], 
        nonVeg: ['White Fish', 'Egg Whites', 'Boiled Chicken'],
        vegan: ['Cucumber', 'Red Bell Peppers', 'Watermelon']
    },
    'Kidney Stone Reversal': { 
        veg: ['Lemons', 'Watermelon', 'Basil', 'Cauliflower', 'Cucumber'], 
        nonVeg: ['White Fish', 'Egg Whites', 'Boiled Chicken'],
        vegan: ['Cucumber', 'Red Bell Peppers', 'Watermelon']
    },
    'Gastric Reversal': { 
        veg: ['Ginger', 'Plain Yogurt', 'Bananas', 'Rice', 'Oatmeal'], 
        nonVeg: ['Boiled Chicken', 'Steamed Fish', 'Egg Whites'],
        vegan: ['Oatmeal', 'Coconut Water', 'Applesauce', 'Papaya']
    },
    'Derma Care': { 
        veg: ['Sweet Potatoes', 'Almonds', 'Oranges', 'Avocado', 'Berries'], 
        nonVeg: ['Salmon', 'Oyster', 'Eggs', 'Chicken Breast'],
        vegan: ['Walnuts', 'Flaxseeds', 'Sun-dried tomatoes', 'Kale']
    },
    'General plan': {
        veg: ['Rice', 'Dal', 'Paneer', 'Spinach', 'Apples', 'Bananas'],
        nonVeg: ['Chicken Breast', 'Eggs', 'Fish', 'Rice', 'Dal'],
        vegan: ['Lentils', 'Oats', 'Tofu', 'Berries', 'Avocados']
    }
};

async function seed() {
    try {
        await mongoose.connect(mongoURI);
        console.log("🚀 Connected to MongoDB for Generating Unified (3-in-1) Diet Plans...");

        // 1. Get an Admin User
        let admin = await User.findOne({ role: 'admin' });
        if (!admin) admin = await User.findOne({});
        if (!admin) {
            console.error("❌ No users found.");
            process.exit(1);
        }

        // 2. Nutrients
        const nutrientMap = {};
        const nutrients = await Nutrient.find({});
        nutrients.forEach(n => nutrientMap[n.name.toLowerCase()] = n._id);

        // 3. Meals
        const mealMap = {};
        const meals = await Meal.find({});
        meals.forEach(m => mealMap[m.name] = m._id);

        // 4. Ensure Protein Shake exists
        let proteinShake = await Food.findOne({ name: 'Protein Shake' });
        if (!proteinShake) {
            proteinShake = await Food.create({
                name: 'Protein Shake',
                description: 'Fast absorbing protein source.',
                nutrients_per_quantity: 100,
                calories_per_quantity: 120,
                serving: 1,
                meals: [mealMap['Breakfast']],
                nutrients: [
                    { nutrient_id: nutrientMap['protein'], quantity: 24 },
                    { nutrient_id: nutrientMap['carbohydrate'] || nutrientMap['carbohydrates'], quantity: 3 },
                    { nutrient_id: nutrientMap['fat'], quantity: 1.5 }
                ]
            });
        }

        // 5. Seed Health Issues
        const issueToId = {};
        for (const issue of HEALTH_ISSUES) {
            let doc = await HealthIssue.findOne({ name: issue.name });
            if (!doc) doc = await HealthIssue.create(issue);
            issueToId[issue.name] = doc._id;
        }

        // 6. Generate Unified Plans
        let totalCreated = 0;
        for (const issue of HEALTH_ISSUES) {
            const ideal = IDEAL_FOODS_MAP[issue.name] || IDEAL_FOODS_MAP['General plan'];

            for (const variant of VARIANTS) {
                const planName = `${issue.name} - ${variant}`;
                
                // Resolver Function
                const resolveFoods = async (names) => {
                    const resolved = [];
                    for (const name of names) {
                        let f = await Food.findOne({ name });
                        if (!f) {
                            f = await Food.create({
                                name,
                                nutrients_per_quantity: 100,
                                calories_per_quantity: 150,
                                serving: 1,
                                meals: [mealMap['Lunch'], mealMap['Dinner']],
                                nutrients: [
                                    { nutrient_id: nutrientMap['protein'], quantity: 10 },
                                    { nutrient_id: nutrientMap['carbohydrate'] || nutrientMap['carbohydrates'] || nutrientMap['carbs'], quantity: 20 },
                                    { nutrient_id: nutrientMap['fat'], quantity: 5 }
                                ]
                            });
                        }
                        resolved.push(f);
                    }
                    return resolved;
                };

                const vegFoods = await resolveFoods(ideal.veg);
                const nonVegFoods = await resolveFoods([...ideal.veg, ...ideal.nonVeg]);
                const veganFoods = await resolveFoods(ideal.vegan);

                let scale = 1.0;
                if (variant === 'Weight Loss') scale = 0.75;
                if (variant === 'Weight Gain') scale = 1.5;

                const planData = {
                    created_by: admin._id,
                    name: planName,
                    description: `Unified ${variant} plan for ${issue.name} with Veg, Non-Veg, and Vegan options.`,
                    start_date: new Date(),
                    end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                    health_issues: [issueToId[issue.name]],
                    variant: variant,
                    dietary_option: 'all',
                    breakfast: {
                        veg: [{ food_id: proteinShake._id, quantity: scale }],
                        non_veg: [{ food_id: proteinShake._id, quantity: scale }],
                        vegan: [{ food_id: proteinShake._id, quantity: scale }]
                    },
                    lunch: {
                        veg: vegFoods.slice(0, 3).map(f => ({ food_id: f._id, quantity: scale })),
                        non_veg: nonVegFoods.slice(0, 3).map(f => ({ food_id: f._id, quantity: scale })),
                        vegan: veganFoods.slice(0, 3).map(f => ({ food_id: f._id, quantity: scale }))
                    },
                    dinner: {
                        veg: vegFoods.slice(2, 5).map(f => ({ food_id: f._id, quantity: scale })),
                        non_veg: nonVegFoods.slice(2, 5).map(f => ({ food_id: f._id, quantity: scale })),
                        vegan: veganFoods.slice(2, 5).map(f => ({ food_id: f._id, quantity: scale }))
                    },
                    water: variant === 'Weight Gain' ? 12 : 10,
                    green_tea_target: 3,
                    black_coffee_target: 2,
                    isActive: true
                };

                await DietPlan.findOneAndUpdate(
                    { name: planName },
                    planData,
                    { upsert: true, new: true }
                );
                totalCreated++;
            }
            console.log(`✅ Unified plan created for: ${issue.name}`);
        }

        console.log(`\n🎉 Success! Seeding completed. ${totalCreated} Unified Plans Generated.`);
        process.exit(0);
    } catch (err) {
        console.error("❌ Seeding Error:", err);
        process.exit(1);
    }
}

seed();
