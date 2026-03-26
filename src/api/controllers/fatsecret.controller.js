import ApiResponse from "../../utils/api_response.js";
import fatSecretUtil from "../../utils/fatsecret.util.js";
import { Nutrient } from "../../models/nutrient.model.js";
import { Meal } from "../../models/meal/meal.model.js";

const HEALTH_CONSTRAINTS = {
    'Diabetes': {
        maxSugar: 5, // g per serving
        minFiber: 3,  // g per serving
        maxCarbs: 15, // g per serving
        keywords: ['diabetic', 'low sugar', 'high fiber', 'whole grain']
    },
    'Hypertension': {
        maxSodium: 140, // mg per serving (low sodium threshold)
        keywords: ['low sodium', 'unsalted', 'heart healthy']
    },
    'High Cholesterol': {
        maxSaturatedFat: 1.5, // g per serving
        maxCholesterol: 20,   // mg per serving
        keywords: ['low cholesterol', 'heart healthy', 'low fat']
    },
    'Obesity': {
        maxCalories: 300, 
        minProtein: 10,
        keywords: ['low calorie', 'high protein', 'weight loss']
    }
};

class FatSecretController {
    /**
     * Get food recommendations based on calorie range, health issue, and weight goals
     */
    static async getRecommendations(req, res) {
        const { min_calories, max_calories, health_issue, weight_difference, weight_goal } = req.body;

        try {
            // 1. Validate mandatory inputs
            if (min_calories === undefined || max_calories === undefined) {
                return res.status(400).json(ApiResponse.error('min_calories and max_calories are required'));
            }

            // 2. Identify constraints and initial search query
            const constraints = HEALTH_CONSTRAINTS[health_issue] || {};
            const searchQuery = constraints.keywords ? constraints.keywords[0] : 'healthy food';

            // 3. Search for initial food candidates
            let foods = await fatSecretUtil.searchFoods(searchQuery, 30);
            
            if (!foods || foods.length === 0) {
                // Fallback search if specific keywords return nothing
                foods = await fatSecretUtil.searchFoods('nutritious food', 30);
            }

            // 4. Fetch details for each candidate and filter
            const recommendations = [];
            const detailPromises = foods.map(f => fatSecretUtil.getFoodDetails(f.food_id));
            const detailedFoods = await Promise.all(detailPromises);

            for (const food of detailedFoods) {
                if (!food || !food.servings || !food.servings.serving) continue;

                // Take the first serving for analysis (standardizing to 1 serving)
                const servingsData = Array.isArray(food.servings.serving) ? food.servings.serving[0] : food.servings.serving;
                
                const calories = parseFloat(servingsData.calories);
                const sugar = parseFloat(servingsData.sugar || 0);
                const fiber = parseFloat(servingsData.fiber || 0);
                const carbs = parseFloat(servingsData.carbohydrate || 0);
                const sodium = parseFloat(servingsData.sodium || 0);
                const saturatedFat = parseFloat(servingsData.saturated_fat || 0);
                const cholesterol = parseFloat(servingsData.cholesterol || 0);
                const protein = parseFloat(servingsData.protein || 0);

                // Check calorie range
                if (calories < min_calories || calories > max_calories) continue;

                // Check health issue constraints
                let matchesHealthIssue = true;
                if (constraints.maxSugar && sugar > constraints.maxSugar) matchesHealthIssue = false;
                if (constraints.minFiber && fiber < constraints.minFiber) matchesHealthIssue = false;
                if (constraints.maxCarbs && carbs > constraints.maxCarbs) matchesHealthIssue = false;
                if (constraints.maxSodium && sodium > constraints.maxSodium) matchesHealthIssue = false;
                if (constraints.maxSaturatedFat && saturatedFat > constraints.maxSaturatedFat) matchesHealthIssue = false;
                if (constraints.maxCholesterol && cholesterol > constraints.maxCholesterol) matchesHealthIssue = false;

                if (!matchesHealthIssue) continue;

                // 5. Add to recommendations with a score for ranking
                let score = 0;
                // Weight Goal Adjustment (Sorting priority)
                if (weight_goal && weight_difference) {
                    if (weight_difference < 0) { // Lose weight
                        score += (protein * 2) + (fiber * 3) - (calories / 100);
                    } else if (weight_difference > 0) { // Gain weight
                        score += (calories / 50) + (protein * 3);
                    }
                }

                recommendations.push({
                    id: food.food_id,
                    name: food.food_name,
                    brand: food.brand_name || 'Generic',
                    type: food.food_type,
                    calories,
                    nutrients: {
                        protein,
                        carbs,
                        fiber,
                        sugar,
                        sodium,
                        saturatedFat,
                        cholesterol
                    },
                    serving_description: servingsData.serving_description,
                    score
                });
            }

            // 6. Sort by score (descending) and return top 10
            const finalResults = recommendations
                .sort((a, b) => b.score - a.score)
                .slice(0, 10);

            return res.status(200).json(ApiResponse.success('Recommendations retrieved successfully', finalResults));

        } catch (error) {
            console.error('FatSecret Controller Error:', error);
            return res.status(500).json(ApiResponse.error(error.message || 'Internal server error while fetching recommendations'));
        }
    }

    /**
     * Search foods by expression
     */
    static async search(req, res) {
        const { name } = req.query;

        try {
            if (!name) {
                return res.status(400).json(ApiResponse.error('Search expression (name) is required'));
            }

            const foods = await fatSecretUtil.searchFoods(name, 20);
            
            // Map basic search results to standard format
            const results = (foods || []).map(food => ({
                id: food.food_id,
                name: food.food_name,
                brand: food.brand_name || 'Generic',
                type: food.food_type,
                // These will be null unless we call getFoodDetails for every item (slow)
                // The frontend hardening handles these missing fields gracefully
                calories: null,
                nutrients: null,
                serving_description: food.food_description || ''
            }));

            return res.status(200).json(ApiResponse.success('Foods retrieved successfully', results));

        } catch (error) {
            console.error('FatSecret Search Controller Error:', error);
            return res.status(500).json(ApiResponse.error(error.message || 'Internal server error while searching foods'));
        }
    }

    /**
     * Get full details for a FatSecret food
     */
    static async getFoodDetails(req, res) {
        const { id } = req.params;

        try {
            const food = await fatSecretUtil.getFoodDetails(id);
            if (!food) {
                return res.status(404).json(ApiResponse.error('Food not found on FatSecret'));
            }

            const servingsData = Array.isArray(food.servings.serving) ? food.servings.serving[0] : food.servings.serving;
            
            const calories = parseFloat(servingsData.calories);
            const protein = parseFloat(servingsData.protein || 0);
            const carbs = parseFloat(servingsData.carbohydrate || 0);
            const fat = parseFloat(servingsData.fat || 0);
            const fiber = parseFloat(servingsData.fiber || 0);
            const sugar = parseFloat(servingsData.sugar || 0);
            const sodium = parseFloat(servingsData.sodium || 0);

            const result = {
                id: food.food_id,
                name: food.food_name,
                brand: food.brand_name || 'Generic',
                type: food.food_type,
                calories,
                nutrients: {
                    protein,
                    carbage: carbs, // Frontend model might use 'carbs' but backend 'DailyDiet' often looks for specific names
                    carbs,
                    fat,
                    fiber,
                    sugar,
                    sodium
                },
                serving_description: servingsData.serving_description,
                metric_serving_amount: servingsData.metric_serving_amount,
                metric_serving_unit: servingsData.metric_serving_unit
            };

            return res.status(200).json(ApiResponse.success('Food details retrieved successfully', result));

        } catch (error) {
            console.error('FatSecret Details Controller Error:', error);
            return res.status(500).json(ApiResponse.error(error.message || 'Error fetching food details'));
        }
    }
}

export default FatSecretController;
