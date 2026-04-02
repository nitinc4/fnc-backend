import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { DietPlan } from '../models/diet_plan/diet_plan.model.js';
import { Food } from '../models/food/food.model.js';
import { HealthIssue } from '../models/health_issue/health_issue.model.js';
import { Nutrient } from '../models/nutrient.model.js';
import fatSecretUtil from '../utils/fatsecret.util.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fnc';

async function resolveFoodFromFS(foodId) {
    let food = await Food.findOne({ externalId: foodId });
    if (food && food.nutrients && food.nutrients.length >= 3) {
        // Check for 15/20/5 placeholder macros
        const isPlaceholder = food.nutrients.some(n => 
            (n.nutrient_id?.name === 'protein' && n.quantity === 15) ||
            (n.nutrient_id?.name === 'carbohydrate' && n.quantity === 20) ||
            (n.nutrient_id?.name === 'fat' && n.quantity === 5)
        );
        if (!isPlaceholder && food.nutrients_per_quantity > 1) return food._id;
    }

    console.log(`[SEED] Provisioning food: ${foodId}`);
    const fsFood = await fatSecretUtil.getFoodDetails(foodId);
    if (!fsFood || !fsFood.servings) return null;

    const servingsList = Array.isArray(fsFood.servings.serving) ? fsFood.servings.serving : [fsFood.servings.serving];
    let servingsData = servingsList.find(s => parseFloat(s.metric_serving_amount) > 1) || servingsList[0];
    if (parseFloat(servingsData.metric_serving_amount) <= 1) servingsData.metric_serving_amount = 100;

    const allNutrients = await Nutrient.find({});
    const mapping = [
        { match: 'protein', value: parseFloat(servingsData.protein || 0) },
        { match: 'fat', value: parseFloat(servingsData.fat || 0) },
        { match: 'carb', value: parseFloat(servingsData.carbohydrate || 0) },
        { match: 'fiber', value: parseFloat(servingsData.fiber || 0) }
    ];

    const foodNutrients = [];
    for (const item of mapping) {
        let nObj = allNutrients.find(n => n.name.toLowerCase().includes(item.match));
        if (!nObj) nObj = await Nutrient.create({ name: item.match, type: 'macro' });
        foodNutrients.push({ nutrient_id: nObj._id, quantity: item.value });
    }

    const updatedFood = await Food.findOneAndUpdate(
        { externalId: foodId },
        {
            name: fsFood.food_name,
            description: fsFood.brand_name || 'Generic',
            nutrients_per_quantity: parseFloat(servingsData.metric_serving_amount || 100),
            calories_per_quantity: parseFloat(servingsData.calories || 0),
            serving: 1, 
            nutrients: foodNutrients
        },
        { upsert: true, new: true }
    );
    return updatedFood._id;
}

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // CLEAR OLD PLANS
        await DietPlan.deleteMany({});
        console.log('Cleared existing diet plans');

        // IDs for common foods (FatSecret)
        const FOOD_IDS = {
            PROTEIN_SHAKE: '36069', // Whey Protein
            CHICKEN_BREAST: '33689',
            SALMON: '33827',
            EGG_BOILED: '33705',
            OATS: '33881',
            QUINOA: '36014',
            TOFU: '34139',
            LENTILS: '33917',
            MIXED_VEG: '42235',
            BITTER_GOURD: '39460', // Good for Diabetes
            APPLE: '33703',
            ALMONDS: '33846'
        };

        const resolvedFoods = {};
        for (const [key, id] of Object.entries(FOOD_IDS)) {
            resolvedFoods[key] = await resolveFoodFromFS(id);
        }

        const issues = await HealthIssue.find({});
        const variants = ['weight loss', 'weight gain', 'maintain weight'];
        const preferences = ['veg', 'non-veg', 'vegan'];

        for (const issue of issues) {
            for (const variant of variants) {
                for (const preference of preferences) {
                    const name = `${issue.name} - ${variant} (${preference})`;
                    
                    // Meals logic
                    let breakfast = [{ food_id: resolvedFoods.PROTEIN_SHAKE, quantity: 1 }]; // User requirement: Protein Shake
                    let lunch = [];
                    let dinner = [];

                    // Adjust Lunch/Dinner based on preference
                    if (preference === 'veg') {
                        lunch.push({ food_id: resolvedFoods.LENTILS, quantity: 150 });
                        lunch.push({ food_id: resolvedFoods.MIXED_VEG, quantity: 100 });
                        dinner.push({ food_id: resolvedFoods.OATS, quantity: 80 });
                    } else if (preference === 'non-veg') {
                        lunch.push({ food_id: resolvedFoods.CHICKEN_BREAST, quantity: 150 });
                        lunch.push({ food_id: resolvedFoods.MIXED_VEG, quantity: 100 });
                        dinner.push({ food_id: resolvedFoods.SALMON, quantity: 120 });
                    } else { // Vegan
                        lunch.push({ food_id: resolvedFoods.TOFU, quantity: 150 });
                        lunch.push({ food_id: resolvedFoods.QUINOA, quantity: 100 });
                        dinner.push({ food_id: resolvedFoods.LENTILS, quantity: 120 });
                    }

                    // Special health-issue foods
                    if (issue.name.toLowerCase().includes('diabetes')) {
                        lunch.push({ food_id: resolvedFoods.BITTER_GOURD, quantity: 50 });
                    }

                    // Quantity Adjustments based on Variant
                    if (variant === 'weight loss') {
                        lunch.forEach(m => m.quantity *= 0.8);
                        dinner.forEach(m => m.quantity *= 0.8);
                    } else if (variant === 'weight gain') {
                        lunch.forEach(m => m.quantity *= 1.3);
                        dinner.forEach(m => m.quantity *= 1.3);
                        lunch.push({ food_id: resolvedFoods.ALMONDS, quantity: 20 });
                    }

                    await DietPlan.create({
                        name,
                        health_issues: [issue._id],
                        variant,
                        dietary_option: preference,
                        breakfast,
                        lunch,
                        dinner,
                        water: 10,
                        green_tea_target: 4,
                        black_coffee_target: 2
                    });
                }
            }
        }

        console.log('Successfully seeded Diet Plans');
        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
}

seed();
