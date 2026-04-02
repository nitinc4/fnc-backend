import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { DietPlan } from '../models/diet_plan/diet_plan.model.js';
import { Food } from '../models/food/food.model.js';
import { HealthIssue } from '../models/health_issue/health_issue.model.js';
import { Nutrient } from '../models/nutrient.model.js';
import fatSecretUtil from '../utils/fatsecret.util.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fnc';

/**
 * Searches FatSecret for a food item and provisions it in the local DB.
 */
async function searchAndResolveFood(dishName) {
    try {
        let food = await Food.findOne({ name: new RegExp(`^${dishName}$`, 'i') });
        if (food && food.nutrients && food.nutrients.length >= 3) {
             // Basic macro check for dessert placeholders (Puddings/Custards have high sugar, low protein)
             // If we find 15/20/5 specifically, it's definitely a placeholder we want to replace.
             const isPlaceholder = food.nutrients.some(n => 
                (n.nutrient_id?.name === 'protein' && n.quantity === 15) ||
                (n.nutrient_id?.name === 'carbohydrate' && n.quantity === 20) ||
                (n.nutrient_id?.name === 'fat' && n.quantity === 5)
            );
            if (!isPlaceholder && food.nutrients_per_quantity > 1) return food._id;
        }

        console.log(`[SEED] Searching FatSecret for: ${dishName}`);
        const searchResults = await fatSecretUtil.searchFoods(dishName);
        if (!searchResults || searchResults.length === 0) {
            console.log(`[SEED] No results for ${dishName}, skipping.`);
            return null;
        }

        // Get details for the first (best) result
        const foodId = searchResults[0].food_id;
        console.log(`[SEED] Provisioning details for ${dishName} (ID: ${foodId})`);
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
                name: dishName, // Use the user-friendly name from our list
                description: fsFood.brand_name || 'Generic Food Item',
                nutrients_per_quantity: parseFloat(servingsData.metric_serving_amount || 100),
                calories_per_quantity: parseFloat(servingsData.calories || 0),
                serving: 1, 
                nutrients: foodNutrients
            },
            { upsert: true, new: true }
        );
        return updatedFood._id;
    } catch (e) {
        console.error(`[SEED] Error resolving ${dishName}:`, e.message);
        return null;
    }
}

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        await DietPlan.deleteMany({});
        console.log('Cleared existing diet plans');

        const DIET_DATA = [
            { name: 'Cancer', data: {
                'weight loss': ['Moong dal khichdi', 'paneer bhurji', 'Grilled chicken', 'egg white omelette', 'Lentil soup', 'tofu stir fry'],
                'maintain weight': ['Dal + roti + sabzi', 'curd rice', 'Chicken stew + rice', 'fish + vegetables', 'Chickpea curry + rice', 'tofu curry'],
                'weight gain': ['Paneer paratha + curd', 'dal makhani', 'Chicken biryani', 'egg bhurji + bread', 'Peanut butter smoothie', 'coconut milk curry']
            }},
            { name: 'PCOD / PCOS', data: {
                'weight loss': ['Oats + seeds', 'paneer salad', 'Boiled eggs', 'grilled chicken salad', 'Chia pudding', 'sprouts bowl'],
                'maintain weight': ['Vegetable poha', 'curd + roti', 'dal khichdi', 'Egg curry + rice', 'chicken curry + roti', 'millet bowl'],
                'weight gain': ['Paneer dosa', 'nut smoothie', 'aloo paratha + curd', 'chicken sandwich', 'egg omelette + toast', 'peanut smoothie']
            }},
            { name: 'Bladder Stone', data: {
                'weight loss': ['Lauki sabzi + roti', 'cucumber salad', 'dal', 'Boiled chicken', 'fish stew', 'egg whites'],
                'maintain weight': ['Rice + dal + sabzi', 'curd rice', 'Chicken curry + rice', 'fish curry', 'Chickpea curry', 'vegetable stew'],
                'weight gain': ['Paneer rice', 'dal + ghee', 'potato curry', 'Chicken biryani', 'egg curry', 'Coconut curry', 'lentil bowl']
            }},
            { name: 'Kidney Stone', data: {
                'weight loss': ['Cabbage sabzi', 'dal rice', 'bottle gourd curry', 'Grilled chicken', 'fish curry', 'Lentil soup', 'vegetable stew'],
                'maintain weight': ['Roti + dal + sabzi', 'curd rice', 'Egg curry', 'chicken stew', 'Chickpea curry', 'millet bowl'],
                'weight gain': ['Paneer curry', 'rice + dal', 'Chicken curry + rice', 'fish fry', 'Coconut-based curry', 'tofu bowl']
            }},
            { name: 'Thyroid', data: {
                'weight loss': ['Paneer salad', 'dal', 'oats', 'Boiled eggs', 'grilled chicken', 'Tofu stir fry', 'lentils'],
                'maintain weight': ['Vegetable roti + sabzi', 'curd', 'Fish curry', 'egg curry', 'Millet bowl', 'lentil soup'],
                'weight gain': ['Paneer paratha', 'dal makhani', 'Chicken curry + rice', 'Peanut smoothie', 'tofu curry']
            }},
            { name: 'Diabetes', data: {
                'weight loss': ['Oats', 'dal', 'vegetable salad', 'Eggs', 'grilled chicken', 'fish', 'Sprouts', 'tofu', 'quinoa'],
                'maintain weight': ['Roti + dal', 'vegetable upma', 'Chicken curry + roti', 'Lentils', 'millet bowl'],
                'weight gain': ['Paneer roti', 'dal rice', 'Egg curry + rice', 'Chickpea curry', 'tofu']
            }},
            { name: 'BP', data: {
                'weight loss': ['Vegetable salad', 'dal', 'oats', 'Grilled chicken', 'fish', 'Lentils', 'quinoa'],
                'maintain weight': ['Roti + sabzi', 'curd', 'Chicken curry', 'Chickpea curry'],
                'weight gain': ['Paneer dishes', 'dal', 'Chicken curry', 'Avocado', 'peanut dishes']
            }},
            { name: 'Weight Loss', data: {
                'weight loss': ['Oats', 'salad', 'dal', 'Eggs', 'chicken', 'Tofu', 'sprouts'],
                'maintain weight': ['Roti + sabzi', 'Chicken curry', 'Lentils'],
                'weight gain': ['Paneer', 'paratha', 'Chicken', 'eggs', 'Peanut butter', 'tofu']
            }},
            { name: 'Gastric', data: {
                'weight loss': ['Khichdi', 'oats', 'boiled veg', 'Boiled chicken', 'egg whites', 'Rice + lentils', 'soup'],
                'maintain weight': ['Curd rice', 'dal', 'Chicken stew', 'Vegetable stew'],
                'weight gain': ['Paneer rice', 'banana shake', 'Egg curry', 'Smoothies', 'lentils']
            }},
            { name: 'Derma', data: {
                'weight loss': ['Fruits', 'salad', 'dal', 'Fish (omega-3)', 'chicken', 'Nuts', 'seeds', 'tofu'],
                'maintain weight': ['Vegetable meals', 'Fish curry', 'Lentils', 'seeds'],
                'weight gain': ['Paneer', 'nuts', 'Fish', 'eggs', 'Avocado', 'peanut butter']
            }}
        ];

        const breakfastFoodId = await searchAndResolveFood('Whey Protein Powder Chocolate'); // Best for "Protein Shake"
        
        for (const planInfo of DIET_DATA) {
            const hIssue = await HealthIssue.findOne({ name: new RegExp(planInfo.name, 'i') });
            if (!hIssue) {
                console.log(`[SEED] Health Issue ${planInfo.name} not found in DB, skipping.`);
                continue;
            }

            for (const [variant, dishes] of Object.entries(planInfo.data)) {
                console.log(`[SEED] Seeding unified plan for ${planInfo.name} - ${variant}`);
                
                const lunchFoodIds = [];
                const dinnerFoodIds = [];

                // Distribute dishes between Lunch and Dinner
                for (let i = 0; i < dishes.length; i++) {
                    const fId = await searchAndResolveFood(dishes[i]);
                    if (fId) {
                        if (i % 2 === 0) lunchFoodIds.push({ food_id: fId, quantity: 1 });
                        else dinnerFoodIds.push({ food_id: fId, quantity: 1 });
                    }
                }

                await DietPlan.create({
                    name: `${planInfo.name} - ${variant} (Unified)`,
                    health_issues: [hIssue._id],
                    variant: variant.toLowerCase(),
                    dietary_option: 'veg', // Defaulting since we now keep ALL options in one plan
                    breakfast: [{ food_id: breakfastFoodId, quantity: 1 }],
                    lunch: lunchFoodIds,
                    dinner: dinnerFoodIds,
                    water: 10,
                    green_tea_target: 4,
                    black_coffee_target: 2
                });
            }
        }

        console.log('Successfully seeded unified and high-quality Diet Plans');
        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
}

seed();
