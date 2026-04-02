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
    { name: 'Weight Loss', cause: 'Calorie surplus', risk_factor: 4, treatment: 'Calorie deficit' },
    { name: 'Gastric Reversal', cause: 'Acid/Inflammation', risk_factor: 5, treatment: 'Bland/Probiotic Diet' },
    { name: 'Derma Care', cause: 'Inflammation/Nutrients', risk_factor: 3, treatment: 'Skin-enriching foods' }
];

const VARIANTS = ['Weight Loss', 'Weight Gain', 'Maintain Weight'];
const DIETARY_OPTIONS = ['Veg', 'Non-Veg', 'Vegan'];

const IDEAL_FOODS_MAP = {
    'Diabetes': { 
        veg: ['Bitter Gourd', 'Fenugreek Seeds', 'Oats', 'Lentils'], 
        nonVeg: ['Grilled Fish', 'Chicken Breast', 'Eggs'],
        vegan: ['Tofu', 'Quinoa', 'Chia Seeds', 'Almonds']
    },
    'Pcod': { 
        veg: ['Pumpkin Seeds', 'Leafy Greens', 'Berries', 'Cinnamon'], 
        nonVeg: ['Salmon', 'Eggs', 'Lean Chicken'],
        vegan: ['Walnuts', 'Flaxseeds', 'Kale']
    },
    'Pcos': { 
        veg: ['Pumpkin Seeds', 'Leafy Greens', 'Berries', 'Cinnamon'], 
        nonVeg: ['Salmon', 'Eggs', 'Lean Chicken'],
        vegan: ['Walnuts', 'Flaxseeds', 'Kale']
    },
    'Thyroid': { 
        veg: ['Brazil Nuts', 'Greek Yogurt', 'Eggs', 'Spinach'], 
        nonVeg: ['Baked Fish', 'Sea Bass', 'Shrimp'],
        vegan: ['Seaweed', 'Chickpeas', 'Cashews']
    },
    'Blood Pressure': { 
        veg: ['Bananas', 'Beets', 'Low-fat Yogurt', 'Oats'], 
        nonVeg: ['Grilled Salmon', 'Egg Whites'],
        vegan: ['Avocados', 'Garlic', 'Pistachios']
    },
    'Cancer Care': { 
        veg: ['Broccoli', 'Turmeric', 'Green Tea', 'Blueberries'], 
        nonVeg: ['Poached Fish', 'Boiled Chicken', 'Eggs'],
        vegan: ['Tofu', 'Walnuts', 'Soy Milk']
    },
    'Bladder Stone Reversal': { 
        veg: ['Lemons', 'Watermelon', 'Basil', 'Cauliflower'], 
        nonVeg: ['White Fish', 'Egg Whites'],
        vegan: ['Cucumber', 'Red Bell Peppers']
    },
    'Kidney Stone Reversal': { 
        veg: ['Lemons', 'Watermelon', 'Basil', 'Cauliflower'], 
        nonVeg: ['White Fish', 'Egg Whites'],
        vegan: ['Cucumber', 'Red Bell Peppers']
    },
    'Gastric Reversal': { 
        veg: ['Ginger', 'Plain Yogurt', 'Bananas', 'Rice'], 
        nonVeg: ['Boiled Chicken', 'Steamed Fish'],
        vegan: ['Oatmeal', 'Coconut Water', 'Applesauce']
    },
    'Derma Care': { 
        veg: ['Sweet Potatoes', 'Almonds', 'Oranges', 'Avocado'], 
        nonVeg: ['Salmon', 'Oyster', 'Eggs'],
        vegan: ['Walnuts', 'Flaxseeds', 'Sun-dried tomatoes']
    },
    'Weight Loss': { 
        veg: ['Green Tea', 'Apple Cider Vinegar', 'Cucumber', 'Sprouts'], 
        nonVeg: ['Grilled Chicken Breast', 'Egg Whites'],
        vegan: ['Leafy Greens', 'Berries', 'Chia Seeds']
    }
};

async function seed() {
    try {
        await mongoose.connect(mongoURI);
        console.log("Connected to MongoDB for seeding...");

        // 1. Get an Admin User to assign as creator
        let admin = await User.findOne({ role: 'admin' });
        if (!admin) admin = await User.findOne({}); // Fallback to any user
        if (!admin) {
            console.error("No users found to assign as creator.");
            process.exit(1);
        }

        // 2. Clear existing diet plans (Optional, but good for fresh start)
        // await DietPlan.deleteMany({}); 

        // 3. Ensure Macros Nutrients exist
        const nutrients = ['protein', 'fat', 'carbohydrate', 'fiber'];
        const nutrientIds = {};
        for (const n of nutrients) {
            let doc = await Nutrient.findOne({ name: n });
            if (!doc) doc = await Nutrient.create({ name: n, type: 'macro' });
            nutrientIds[n] = doc._id;
        }

        // 4. Ensure Meals exist
        const meals = [
            { name: 'Breakfast', start: '07:00', end: '09:00' },
            { name: 'Lunch', start: '13:00', end: '14:30' },
            { name: 'Dinner', start: '19:30', end: '21:00' }
        ];
        const mealIds = {};
        for (const m of meals) {
            let doc = await Meal.findOne({ name: m.name });
            if (!doc) {
                const s = new Date(); s.setHours(m.start.split(':')[0], m.start.split(':')[1]);
                const e = new Date(); e.setHours(m.end.split(':')[0], m.end.split(':')[1]);
                doc = await Meal.create({ name: m.name, start_time: s, end_time: e });
            }
            mealIds[m.name] = doc._id;
        }

        // 5. Create "Protein Shake" food
        let proteinShake = await Food.findOne({ name: 'Protein Shake' });
        if (!proteinShake) {
            proteinShake = await Food.create({
                name: 'Protein Shake',
                description: 'Fast absorbing protein source for muscle recovery.',
                nutrients_per_quantity: 100,
                calories_per_quantity: 120,
                serving: 1,
                meals: [mealIds['Breakfast']],
                nutrients: [
                    { nutrient_id: nutrientIds['protein'], quantity: 24 },
                    { nutrient_id: nutrientIds['carbohydrate'], quantity: 3 },
                    { nutrient_id: nutrientIds['fat'], quantity: 1.5 }
                ]
            });
        }

        // 6. Seed Health Issues
        const issueToId = {};
        for (const issue of HEALTH_ISSUES) {
            let doc = await HealthIssue.findOne({ name: issue.name });
            if (!doc) doc = await HealthIssue.create(issue);
            issueToId[issue.name] = doc._id;
        }

        // 7. Seed Diet Plans (99 Combinations)
        console.log("Seeding diet plans...");
        for (const issue of HEALTH_ISSUES) {
            const ideal = IDEAL_FOODS_MAP[issue.name] || IDEAL_FOODS_MAP['Weight Loss'];

            for (const variant of VARIANTS) {
                for (const option of DIETARY_OPTIONS) {
                    const planName = `${issue.name} - ${variant} (${option})`;
                    
                    // Skip if already exists
                    const existing = await DietPlan.findOne({ name: planName });
                    if (existing) continue;

                    // Foods based on dietary option
                    const mainFoodPool = option === 'Veg' ? ideal.veg : option === 'Non-Veg' ? ideal.nonVeg : ideal.vegan;
                    
                    // Resolve at least 2 foods for Lunch and Dinner
                    const resolvedFoods = [];
                    for (const fName of mainFoodPool.slice(0, 4)) {
                        let f = await Food.findOne({ name: fName });
                        if (!f) {
                            f = await Food.create({
                                name: fName,
                                nutrients_per_quantity: 100,
                                calories_per_quantity: variant === 'Weight Gain' ? 250 : 150,
                                serving: 1,
                                meals: [mealIds['Lunch'], mealIds['Dinner']],
                                nutrients: [
                                    { nutrient_id: nutrientIds['protein'], quantity: 15 },
                                    { nutrient_id: nutrientIds['carbohydrate'], quantity: 20 },
                                    { nutrient_id: nutrientIds['fat'], quantity: 5 }
                                ]
                            });
                        }
                        resolvedFoods.push(f);
                    }

                    await DietPlan.create({
                        created_by: admin._id,
                        name: planName,
                        description: `Specialized ${variant} plan for ${issue.name} suitable for ${option} preferences.`,
                        start_date: new Date(),
                        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
                        health_issues: [issueToId[issue.name]],
                        variant: variant,
                        dietary_option: option,
                        water_target: 10,
                        green_tea_target: 4,
                        black_coffee_target: 2,
                        breakfast: [{ food_id: proteinShake._id, quantity: 1 }],
                        lunch: resolvedFoods.slice(0, 2).map(f => ({ food_id: f._id, quantity: 1 })),
                        dinner: resolvedFoods.slice(2, 4).map(f => ({ food_id: f._id, quantity: 1 })),
                    });
                }
            }
            console.log(`Finished plans for ${issue.name}`);
        }

        console.log("✅ Seeding completed successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Error seeding data:", err);
        process.exit(1);
    }
}

seed();
