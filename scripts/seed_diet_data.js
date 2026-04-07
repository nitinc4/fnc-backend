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

const FOOD_NUTRITION_MAP = {
    "Bitter Gourd": { cal: 17, p: 1.0, c: 3.7, f: 0.1, fib: 2.8 },
    "Fenugreek Seeds": { cal: 323, p: 23.0, c: 58.0, f: 6.4, fib: 24.6 },
    "Oats": { cal: 389, p: 16.9, c: 66.3, f: 6.9, fib: 10.6 },
    "Oatmeal": { cal: 389, p: 16.9, c: 66.3, f: 6.9, fib: 10.6 },
    "Lentils": { cal: 116, p: 9.0, c: 20.0, f: 0.4, fib: 7.9 },
    "Dal": { cal: 116, p: 9.0, c: 20.0, f: 0.4, fib: 7.9 },
    "Dal/Lentils": { cal: 116, p: 9.0, c: 20.0, f: 0.4, fib: 7.9 },
    "Grilled Fish": { cal: 105, p: 20.0, c: 0.0, f: 2.5, fib: 0.0 },
    "Chicken Breast": { cal: 165, p: 31.0, c: 0.0, f: 3.6, fib: 0.0 },
    "Lean Chicken": { cal: 165, p: 31.0, c: 0.0, f: 3.6, fib: 0.0 },
    "Grilled Chicken Breast": { cal: 165, p: 31.0, c: 0.0, f: 3.6, fib: 0.0 },
    "Boiled Chicken": { cal: 165, p: 31.0, c: 0.0, f: 3.6, fib: 0.0 },
    "Eggs": { cal: 155, p: 12.6, c: 1.1, f: 10.6, fib: 0.0 },
    "Tofu": { cal: 145, p: 15.0, c: 4.0, f: 8.0, fib: 1.0 },
    "Quinoa": { cal: 120, p: 4.4, c: 21.3, f: 1.9, fib: 2.8 },
    "Chia Seeds": { cal: 486, p: 16.5, c: 42.1, f: 30.7, fib: 34.4 },
    "Almonds": { cal: 579, p: 21.2, c: 21.7, f: 49.9, fib: 12.5 },
    "Pumpkin Seeds": { cal: 559, p: 30.2, c: 10.7, f: 49.1, fib: 6.0 },
    "Spinach": { cal: 23, p: 2.9, c: 3.6, f: 0.4, fib: 2.2 },
    "Leafy Greens": { cal: 23, p: 2.9, c: 3.6, f: 0.4, fib: 2.2 },
    "Berries": { cal: 50, p: 0.7, c: 12.0, f: 0.3, fib: 2.4 },
    "Cinnamon": { cal: 247, p: 4.0, c: 80.6, f: 1.2, fib: 53.1 },
    "Salmon": { cal: 208, p: 20.4, c: 0.0, f: 13.4, fib: 0.0 },
    "Grilled Salmon": { cal: 208, p: 20.4, c: 0.0, f: 13.4, fib: 0.0 },
    "Walnuts": { cal: 654, p: 15.2, c: 13.7, f: 65.2, fib: 6.7 },
    "Flaxseeds": { cal: 534, p: 18.3, c: 28.9, f: 42.2, fib: 27.3 },
    "Kale": { cal: 49, p: 4.3, c: 8.8, f: 0.9, fib: 3.6 },
    "Brazil Nuts": { cal: 656, p: 14.3, c: 12.3, f: 66.4, fib: 7.5 },
    "Greek Yogurt": { cal: 97, p: 10.0, c: 3.6, f: 5.0, fib: 0.0 },
    "Baked Fish": { cal: 105, p: 20.0, c: 0.0, f: 2.5, fib: 0.0 },
    "Sea Bass": { cal: 97, p: 18.0, c: 0.0, f: 2.3, fib: 0.0 },
    "Shrimp": { cal: 99, p: 24.0, c: 0.2, f: 0.3, fib: 0.0 },
    "Seaweed": { cal: 35, p: 5.8, c: 5.1, f: 0.3, fib: 0.0 },
    "Chickpeas": { cal: 164, p: 8.9, c: 27.0, f: 2.6, fib: 7.6 },
    "Cashews": { cal: 553, p: 18.2, c: 30.2, f: 43.8, fib: 3.3 },
    "Bananas": { cal: 89, p: 1.1, c: 22.8, f: 0.3, fib: 2.6 },
    "Beets": { cal: 43, p: 1.6, c: 9.6, f: 0.2, fib: 2.8 },
    "Low-fat Yogurt": { cal: 63, p: 5.3, c: 7.0, f: 1.5, fib: 0.0 },
    "Egg Whites": { cal: 52, p: 11.0, c: 0.7, f: 0.2, fib: 0.0 },
    "Avocados": { cal: 160, p: 2.0, c: 8.5, f: 14.7, fib: 6.7 },
    "Avocado": { cal: 160, p: 2.0, c: 8.5, f: 14.7, fib: 6.7 },
    "Garlic": { cal: 149, p: 6.4, c: 33.0, f: 0.5, fib: 2.1 },
    "Pistachios": { cal: 562, p: 20.3, c: 27.5, f: 45.4, fib: 10.6 },
    "Broccoli": { cal: 34, p: 2.8, c: 6.6, f: 0.4, fib: 2.6 },
    "Turmeric": { cal: 354, p: 8.0, c: 65.0, f: 10.0, fib: 21.1 },
    "Green Tea": { cal: 1, p: 0.2, c: 0.0, f: 0.0, fib: 0.0 },
    "Blueberries": { cal: 57, p: 0.7, c: 14.5, f: 0.3, fib: 2.4 },
    "Poached Fish": { cal: 100, p: 20.0, c: 0.0, f: 2.0, fib: 0.0 },
    "Soy Milk": { cal: 33, p: 3.3, c: 1.8, f: 1.9, fib: 0.6 },
    "Lemons": { cal: 29, p: 1.1, c: 9.3, f: 0.3, fib: 2.8 },
    "Watermelon": { cal: 30, p: 0.6, c: 7.6, f: 0.2, fib: 0.4 },
    "Basil": { cal: 23, p: 3.1, c: 2.7, f: 0.6, fib: 1.6 },
    "Cauliflower": { cal: 25, p: 1.9, c: 5.0, f: 0.3, fib: 2.0 },
    "White Fish": { cal: 100, p: 20.0, c: 0.0, f: 2.0, fib: 0.0 },
    "Cucumber": { cal: 15, p: 0.7, c: 3.6, f: 0.1, fib: 0.5 },
    "Red Bell Peppers": { cal: 31, p: 1.0, c: 6.0, f: 0.3, fib: 2.1 },
    "Ginger": { cal: 80, p: 1.8, c: 17.8, f: 0.8, fib: 2.0 },
    "Plain Yogurt": { cal: 61, p: 3.5, c: 4.7, f: 3.3, fib: 0.0 },
    "Rice": { cal: 130, p: 2.7, c: 28.0, f: 0.3, fib: 0.4 },
    "Steamed Fish": { cal: 100, p: 20.0, c: 0.0, f: 2.0, fib: 0.0 },
    "Coconut Water": { cal: 19, p: 0.7, c: 3.7, f: 0.2, fib: 0.0 },
    "Applesauce": { cal: 52, p: 0.3, c: 14.0, f: 0.1, fib: 1.2 },
    "Sweet Potatoes": { cal: 86, p: 1.6, c: 20.1, f: 0.1, fib: 3.0 },
    "Oranges": { cal: 47, p: 0.9, c: 11.8, f: 0.1, fib: 2.4 },
    "Oyster": { cal: 81, p: 9.5, c: 4.9, f: 2.3, fib: 0.0 },
    "Sun-dried tomatoes": { cal: 258, p: 14.1, c: 55.8, f: 3.0, fib: 12.3 },
    "Apple Cider Vinegar": { cal: 21, p: 0.0, c: 0.9, f: 0.0, fib: 0.0 },
    "Sprouts": { cal: 30, p: 3.0, c: 6.0, f: 0.2, fib: 1.1 }
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
                            const data = FOOD_NUTRITION_MAP[fName] || { cal: 150, p: 15, c: 20, f: 5, fib: 0 };
                            f = await Food.create({
                                name: fName,
                                nutrients_per_quantity: 100,
                                calories_per_quantity: data.cal,
                                serving: 1,
                                meals: [mealIds['Lunch'], mealIds['Dinner']],
                                nutrients: [
                                    { nutrient_id: nutrientIds['protein'], quantity: data.p },
                                    { nutrient_id: nutrientIds['carbohydrate'], quantity: data.c },
                                    { nutrient_id: nutrientIds['fat'], quantity: data.f },
                                    { nutrient_id: nutrientIds['fiber'], quantity: data.fib || 0 }
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
