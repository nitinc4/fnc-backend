import ApiResponse from "../../utils/api_response.js";
import mongoose from "mongoose";
import {DailyDiet} from "../../models/daily_diet/daily_diet.model.js";
import {getTodayDate} from "../../utils/date_time_utils.js";
import {User} from "../../models/auth/user.model.js";
import {Food} from "../../models/food/food.model.js";
import {UserProfile} from "../../models/profile/user_profile.model.js";
import {Meal} from "../../models/meal/meal.model.js";
import {Nutrient} from "../../models/nutrient.model.js";
import fatSecretUtil from "../../utils/fatsecret.util.js";

class DailyDietController {

    static async getDiet(req, res) {
        try {
            const {date} = req.query;
            const {user_id} = req.body;

            const diet = await DailyDietController.getDietData(user_id, date)


            return res.status(200).json(ApiResponse.success(diet ? 'Diet Found Successfully' : 'No Diet Exist', diet))
        } catch (e) {
            console.log(e)
            return res.status(500).json(ApiResponse.error(e.message || 'Internal server error'))
        }
    }

    static async create(req, res) {
        try {

            const {date} = req.query;
            const {user_id} = req.body;
            const {water, green_tea, black_coffee, breakfast, lunch, dinner} = req.body;

            const user = await User.findById(user_id);

            const targetDate = date ? new Date(date) : getTodayDate()


            if (!user) {
                return res.status(400).json(ApiResponse.error('User not found'))
            }

            const checkExisting = await DailyDiet.findOne({
                created_by: user_id,
                createdAt: {
                    $gte: targetDate,
                    $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
                }
            })

            if (checkExisting) {
                req.params.id = checkExisting._id;
                await DailyDietController.update(req, res)
                return
            }

            // SAFE DEFAULTS: If not provided during creation (e.g. from adding food), default to 0
            let safeWater = (water !== undefined && water !== null && water !== 'null') ? water : 0;
            let safeGreenTea = (green_tea !== undefined && green_tea !== null && green_tea !== 'null') ? green_tea : 0;
            let safeBlackCoffee = (black_coffee !== undefined && black_coffee !== null && black_coffee !== 'null') ? black_coffee : 0;

            let breakfastList = []
            if (breakfast) {
                //add breakfast meal plan
                for (let meal of breakfast) {
                    const foodData = await DailyDietController.resolveFoodItem(meal.food_id);
                    if (!foodData)
                        return res.status(400).send(ApiResponse.error(`Food with id ${meal.food_id} not found`))

                    if (!meal.quantity)
                        return res.status(400).send(ApiResponse.error(`meal { quantity } is required`))

                    meal.food_id = foodData
                    breakfastList.push(meal)
                }
            }

        

            let lunchList = []
            if (lunch) {
                //add lunch meal plan
                for (let meal of lunch) {
                    const foodData = await DailyDietController.resolveFoodItem(meal.food_id);
                    if (!foodData)
                        return res.status(400).send(ApiResponse.error(`Food with id ${meal.food_id} not found`))

                    if (!meal.quantity)
                        return res.status(400).send(ApiResponse.error(`meal { quantity } is required`))

                    meal.food_id = foodData
                    lunchList.push(meal)
                }
            }
           

            let dinnerList = []
            if (dinner) {
                //add dinner meal plan
                for (let meal of dinner) {
                    const foodData = await DailyDietController.resolveFoodItem(meal.food_id);
                    if (!foodData)
                        return res.status(400).send(ApiResponse.error(`Food with id ${meal.food_id} not found`))

                    if (!meal.quantity)
                        return res.status(400).send(ApiResponse.error(`meal { quantity } is required`))

                    meal.food_id = foodData
                    dinnerList.push(meal)
                }
            }


            const diet = await DailyDiet.create({
                created_by: user,
                breakfast: breakfastList,
                lunch: lunchList,
                dinner: dinnerList,
                water: safeWater,
                green_tea: safeGreenTea,
                black_coffee: safeBlackCoffee,
                createdAt: targetDate
            });

            const createdDiet = await DailyDiet.findById(diet._id)

            return res.status(200).json(ApiResponse.success('Diet created successfully', createdDiet))

        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message || 'Internal server error'))
        }
    }

    static async addWater(req, res) {
        try {
            const {date} = req.query
            const {user_id} = req.body;
            const {water} = req.body;

            const targetDate = date ? new Date(date) : getTodayDate()

            if (water === null || water === undefined || water === 'null')
                return res.status(400).json(ApiResponse.error('{water} is required'))

            if (!user_id)
                return res.status(400).json(ApiResponse.error('{user_id} is required'))

            if (!mongoose.Types.ObjectId.isValid(user_id)) {
                return res.status(400).json(ApiResponse.error('Invalid user id'))
            }

            const user = await User.findById(user_id);

            if (!user) {
                return res.status(404).json(ApiResponse.error('User not found'))
            }

            const checkExisting = await DailyDiet.findOne({
                created_by: user_id,
                createdAt: {
                    $gte: targetDate,
                    $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
                }
            })

            if (checkExisting) {
                req.params.id = checkExisting._id;
                req.body.water = water;
                await DailyDietController.update(req, res)
                return
            }

            const diet = await DailyDiet.create({
                created_by: user,
                water: water,
                green_tea: 0,
                black_coffee: 0,
                breakfast: [],
                lunch: [],
                dinner: [],
            });

            const createdDiet = await DailyDiet.findById(diet._id)

            return res.status(200).json(ApiResponse.success('Water added successfully', createdDiet))

        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message || 'Internal server error'))
        }
    }

    static async addGreenTea(req, res) {
        try {
            const {date} = req.query
            const {user_id} = req.body;
            const {green_tea} = req.body;

            const targetDate = date ? new Date(date) : getTodayDate()

            if (green_tea === null || green_tea === undefined || green_tea === 'null')
                return res.status(400).json(ApiResponse.error('{green_tea} is required'))

            if (!user_id)
                return res.status(400).json(ApiResponse.error('{user_id} is required'))

            if (!mongoose.Types.ObjectId.isValid(user_id)) {
                return res.status(400).json(ApiResponse.error('Invalid user id'))
            }

            const user = await User.findById(user_id);

            if (!user) {
                return res.status(404).json(ApiResponse.error('User not found'))
            }

            const checkExisting = await DailyDiet.findOne({
                created_by: user_id,
                createdAt: {
                    $gte: targetDate,
                    $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
                }
            })

            if (checkExisting) {
                req.params.id = checkExisting._id;
                req.body.green_tea = green_tea;
                await DailyDietController.update(req, res)
                return
            }

            const diet = await DailyDiet.create({
                created_by: user,
                water: 0,
                green_tea: green_tea,
                black_coffee: 0,
                breakfast: [],
                lunch: [],
                dinner: [],
            });

            const createdDiet = await DailyDiet.findById(diet._id)

            return res.status(200).json(ApiResponse.success('Green Tea added successfully', createdDiet))

        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message || 'Internal server error'))
        }
    }

    static async addBlackCoffee(req, res) {
        try {
            const {date} = req.query
            const {user_id} = req.body;
            const {black_coffee} = req.body;

            const targetDate = date ? new Date(date) : getTodayDate()

            if (black_coffee === null || black_coffee === undefined || black_coffee === 'null')
                return res.status(400).json(ApiResponse.error('{black_coffee} is required'))

            if (!user_id)
                return res.status(400).json(ApiResponse.error('{user_id} is required'))

            if (!mongoose.Types.ObjectId.isValid(user_id)) {
                return res.status(400).json(ApiResponse.error('Invalid user id'))
            }

            const user = await User.findById(user_id);

            if (!user) {
                return res.status(404).json(ApiResponse.error('User not found'))
            }

            const checkExisting = await DailyDiet.findOne({
                created_by: user_id,
                createdAt: {
                    $gte: targetDate,
                    $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
                }
            })

            if (checkExisting) {
                req.params.id = checkExisting._id;
                req.body.black_coffee = black_coffee;
                await DailyDietController.update(req, res)
                return
            }

            const diet = await DailyDiet.create({
                created_by: user,
                water: 0,
                green_tea: 0,
                black_coffee: black_coffee,
                breakfast: [],
                lunch: [],
                dinner: [],
            });

            const createdDiet = await DailyDiet.findById(diet._id)

            return res.status(200).json(ApiResponse.success('Black Coffee added successfully', createdDiet))

        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message || 'Internal server error'))
        }
    }

    static async update(req, res) {
        try {
            const {id} = req.params;
            const {user_id, water, green_tea, black_coffee, breakfast, lunch, dinner} = req.body;

            if (!user_id)
                return res.status(400).json(ApiResponse.error('user is invalid'))


            if (!mongoose.Types.ObjectId.isValid(user_id)) {
                return res.status(400).json(ApiResponse.error('Invalid diet id'))
            }

            const diet = await DailyDiet.findById(id)

            if (!diet) {
                return res.status(404).json(ApiResponse.error('Diet not found'))
            }


            if (water !== null && water !== undefined && water !== 'null') {

                diet.water = water
            }
            
            if (green_tea !== null && green_tea !== undefined && green_tea !== 'null') {
                diet.green_tea = green_tea
            }

            if (black_coffee !== null && black_coffee !== undefined && black_coffee !== 'null') {
                diet.black_coffee = black_coffee
            }


            if (breakfast) {
                if (Array.isArray(breakfast)) {
                    let breakfastList = []
                    //add breakfast meal plan
                    for (let meal of breakfast) {
                        const foodData = await DailyDietController.resolveFoodItem(meal.food_id);
                        if (!foodData)
                            return res.status(400).send(ApiResponse.error(`Food with id ${meal.food_id} not found`))

                        if (!meal.quantity)
                            return res.status(400).send(ApiResponse.error(`meal { quantity } is required`))

                        meal.food_id = foodData
                        breakfastList.push(meal)
                    }

                    diet.breakfast = breakfastList
                }
            }

           

            if (lunch) {
                if (Array.isArray(lunch)) {
                    //add lunch meal plan
                    let lunchList = []
                    for (let meal of lunch) {
                        const foodData = await DailyDietController.resolveFoodItem(meal.food_id);
                        if (!foodData)
                            return res.status(400).send(ApiResponse.error(`Food with id ${meal.food_id} not found`))

                        if (!meal.quantity)
                            return res.status(400).send(ApiResponse.error(`meal { quantity } is required`))

                        meal.food_id = foodData
                        lunchList.push(meal)
                    }

                    diet.lunch = lunchList
                }

            }

            

            if (dinner) {

                if (Array.isArray(dinner)) {
                    //add dinner meal plan
                    let dinnerList = []
                    for (let meal of dinner) {
                        const foodData = await DailyDietController.resolveFoodItem(meal.food_id);
                        if (!foodData)
                            return res.status(400).send(ApiResponse.error(`Food with id ${meal.food_id} not found`))

                        if (!meal.quantity)
                            return res.status(400).send(ApiResponse.error(`meal { quantity } is required`))

                        meal.food_id = foodData
                        dinnerList.push(meal)
                    }

                    diet.dinner = dinnerList
                }

            }

            await diet.save()


            const updatedDiet = await DailyDiet.findById(diet._id);

            return res.status(200).json(ApiResponse.success('Diet updated successfully', updatedDiet))

        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message || 'Internal server error'))
        }
    }

    static async delete(req, res) {
        try {
            const {id} = req.params;
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json(ApiResponse.error('Invalid diet id'))
            }

            const deleted = await DailyDiet.findByIdAndDelete(id);

            if (!deleted) {
                return res.status(404).json(ApiResponse.error('Diet not found'))
            }

            return res.status(200).json(ApiResponse.success('Diet deleted successfully', deleted))

        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message || 'Internal server error'))
        }
    }


    static async getDietData(user_id, date = null) {


        let userDiet;

        let responseObj = {};

        if (date) {
            const selectedDate = new Date(date)
            const endDate = new Date((selectedDate.getTime() + 24 * 60 * 60 * 1000))
            console.log(selectedDate, endDate);
            userDiet = await DailyDiet.findOne({
                created_by: user_id,
                createdAt: {
                    $gte: selectedDate,
                    $lt: endDate,

                },
            }).populate(
                {

                    path: 'breakfast.food_id  lunch.food_id  dinner.food_id',
                    populate: 'meals nutrients.nutrient_id'
                });
        } else {
            userDiet = await DailyDiet.findOne({
                created_by: user_id,
                createdAt: {
                    $gte: getTodayDate(),
                    $lt: new Date(getTodayDate().getTime() + 24 * 60 * 60 * 1000)
                }
            }).populate(
                {
                    path: 'breakfast.food_id  lunch.food_id  dinner.food_id',
                    populate: 'meals nutrients.nutrient_id'
                });

        }


        //get diet plan data
        const dietPlans = await UserProfile.findOne({user_id: user_id}).populate({
            path: 'diet_plans',
            populate: {
                path: 'breakfast.food_id lunch.food_id dinner.food_id',
                populate: 'meals nutrients.nutrient_id'
            }
        })

        let isDietPlanExist = false
        let dietPlanData

        let plan_water = 10
        let plan_green_tea = 4
        let plan_black_coffee = 2
        let dietPlanBreakfastCal = 0
        let dietPlanBreakfastList = []
        let dietPlanLunchCal = 0
        let dietPlanLunchList = []
        let dietPlanDinnerCal = 0
        let dietPlanDinnerList = []


        //plan nutrients
        let planProtein = 0;
        let planFat = 0;
        let planCarbs = 0;
        let planFiber = 0;

        function addPlanNutrient(food) {
            const perQuantity = food.food_id.nutrients_per_quantity

            for (let nutrient of food.food_id.nutrients) {
                const unitQuantity = nutrient.quantity / perQuantity
                console.log(nutrient)

                if (nutrient.nutrient_id.name === 'protein') {
                    planProtein += unitQuantity * food.quantity


                } else if (nutrient.nutrient_id.name === 'fat') {

                    planFat += unitQuantity * food.quantity

                } else if (nutrient.nutrient_id.name === 'carbohydrate') {
                    planCarbs += unitQuantity * food.quantity


                } else if (nutrient.nutrient_id.name === 'fiber') {
                    planFiber += unitQuantity * food.quantity
                }

            }
        }


        if (dietPlans) {
            if (dietPlans.diet_plans.length > 0) {
                isDietPlanExist = true

                for (let dietPlan of dietPlans.diet_plans) {
                    if (dietPlan.water != null) {

                        if (dietPlan.water > plan_water) {
                            plan_water = dietPlan.water
                        }
                    }
                    
                    if (dietPlan.green_tea_target != null) {
                        if (dietPlan.green_tea_target > plan_green_tea) {
                            plan_green_tea = dietPlan.green_tea_target
                        }
                    }

                    if (dietPlan.black_coffee_target != null) {
                        if (dietPlan.black_coffee_target > plan_black_coffee) {
                            plan_black_coffee = dietPlan.black_coffee_target
                        }
                    }

                    //breakfast
                    if (Array.isArray(dietPlan.breakfast)) {
                        //get timing
                        for (let food of dietPlan.breakfast) {

                            //calculate nutrients
                            addPlanNutrient(food)

                            //calculate calories
                            let foodCalPerGm = food.food_id.calories_per_quantity / food.food_id.nutrients_per_quantity
                            dietPlanBreakfastCal += food.quantity * foodCalPerGm
                            food.total_calories = Math.floor(food.quantity * foodCalPerGm)

                            const foodItem = Object.assign(food._doc, {
                                total_calories: Math.floor(food.quantity * foodCalPerGm),
                            })
                            dietPlanBreakfastList.push(foodItem)
                        }
                    }

                  

                    //lunch
                    if (Array.isArray(dietPlan.lunch)) {
                        for (let food of dietPlan.lunch) {

                            //calculate nutrients
                            addPlanNutrient(food)

                            //calculate calories
                            let foodCalPerGm = food.food_id.calories_per_quantity / food.food_id.nutrients_per_quantity
                            dietPlanLunchCal += food.quantity * foodCalPerGm
                            const foodItem = Object.assign(food._doc, {total_calories: Math.floor(food.quantity * foodCalPerGm)})
                            dietPlanLunchList.push(foodItem)
                        }
                    }

             

                    //dinner
                    if (Array.isArray(dietPlan.dinner)) {
                        for (let food of dietPlan.dinner) {

                            //calculate nutrients
                            addPlanNutrient(food)

                            //calculate calories
                            let foodCalPerGm = food.food_id.calories_per_quantity / food.food_id.nutrients_per_quantity
                            dietPlanDinnerCal += food.quantity * foodCalPerGm
                            const foodItem = Object.assign(food._doc, {total_calories: Math.floor(food.quantity * foodCalPerGm)})
                            dietPlanDinnerList.push(foodItem)
                        }
                    }

                }
            }
        }


        const totalPlanCal = Math.floor(dietPlanBreakfastCal + dietPlanLunchCal + dietPlanDinnerCal)

        const meals = await Meal.find().select('name start_time end_time')

        const breakfastMeal = meals.find(meal => meal.name === 'breakfast');
        const lunchMeal = meals.find(meal => meal.name === 'lunch');
        const dinnerMeal = meals.find(meal => meal.name === 'dinner');

        // FIXED: Use null instead of '' so Flutter's DateTime.parse safely handles missing dates
        dietPlanData = {
            breakfast: {
                total_calories: Math.floor(dietPlanBreakfastCal),
                start_time: breakfastMeal?.start_time || null,
                end_time: breakfastMeal?.end_time || null,
                foods: dietPlanBreakfastList,
            },
            
            lunch: {
                total_calories: Math.floor(dietPlanLunchCal),
                start_time: lunchMeal?.start_time || null,
                end_time: lunchMeal?.end_time || null,
                foods: dietPlanLunchList
            },
           
            dinner: {
                total_calories: Math.floor(dietPlanDinnerCal),
                start_time: dinnerMeal?.start_time || null,
                end_time: dinnerMeal?.end_time || null,
                foods: dietPlanDinnerList
            }
        }

        let dietProtein = 0;
        let dietFat = 0;
        let dietCarbs = 0;
        let dietFiber = 0;


        function addDietNutrient(food) {
            const perQuantity = food.food_id.nutrients_per_quantity

            for (let nutrient of food.food_id.nutrients) {
                const unitQuantity = nutrient.quantity / perQuantity
                if (nutrient.nutrient_id.name === 'protein') {
                    dietProtein += unitQuantity * food.quantity

                } else if (nutrient.nutrient_id.name === 'fat') {
                    dietFat += unitQuantity * food.quantity

                } else if (nutrient.nutrient_id.name === 'carbohydrate') {
                    dietCarbs += unitQuantity * food.quantity


                } else if (nutrient.nutrient_id.name === 'fiber') {
                    dietFiber += unitQuantity * food.quantity
                }

            }
        }

        responseObj.is_diet_plan_exist = isDietPlanExist
        responseObj.plan_water = plan_water
        responseObj.plan_green_tea = plan_green_tea
        responseObj.plan_black_coffee = plan_black_coffee

        responseObj.total_calories = 0
        responseObj.total_plan_calories = totalPlanCal

        let myData = {}

        if (userDiet) {

            //organise breakfast diet data
            let foodBreakFastCal = 0
            let foodBreakFastList = []
            for (let meal of userDiet.breakfast) {

                //calculate nutrients
                addDietNutrient(meal)

                //calculate calories
                let foodCalPerGm = meal.food_id.calories_per_quantity / meal.food_id.nutrients_per_quantity
                foodBreakFastCal += meal.quantity * foodCalPerGm
                const foodItem = Object.assign(meal._doc, {total_calories: Math.floor(meal.quantity * foodCalPerGm)})
                foodBreakFastList.push(foodItem)
            }
            myData.breakfast = {
                total_calories: Math.floor(foodBreakFastCal),
                foods: foodBreakFastList
            }

            

            //organise lunch diet data
            let foodLunchCal = 0
            let foodLunchList = []
            for (let meal of userDiet.lunch) {

                //calculate nutrients
                addDietNutrient(meal)

                //calculate calories
                let foodCalPerGm = meal.food_id.calories_per_quantity / meal.food_id.nutrients_per_quantity
                foodLunchCal += meal.quantity * foodCalPerGm
                const foodItem = Object.assign(meal._doc, {total_calories: Math.floor(meal.quantity * foodCalPerGm)})
                foodLunchList.push(foodItem)
            }
            myData.lunch = {
                total_calories: Math.floor(foodLunchCal),
                foods: foodLunchList
            }

            //organise dinner diet data
            let foodDinnerCal = 0
            let foodDinnerList = []
            for (let meal of userDiet.dinner) {

                //calculate nutrients
                addDietNutrient(meal)

                //calculate calories
                let foodCalPerGm = meal.food_id.calories_per_quantity / meal.food_id.nutrients_per_quantity
                foodDinnerCal += meal.quantity * foodCalPerGm
                const foodItem = Object.assign(meal._doc, {total_calories: Math.floor(meal.quantity * foodCalPerGm)})
                foodDinnerList.push(foodItem)
            }
            myData.dinner = {
                total_calories: Math.floor(foodDinnerCal),
                foods: foodDinnerList
            }

            responseObj.total_calories = Math.floor(foodBreakFastCal + foodLunchCal + foodDinnerCal)


        }



        //calculate nutrient percentage
        responseObj.protein =planProtein === 0 ? dietProtein > 0 ? 100 : 0 : Math.floor(dietProtein / planProtein * 100)
        responseObj.fat = planFat === 0 ? dietFat > 0 ? 100 : 0 : Math.floor(dietFat / planFat * 100)
        responseObj.carbs = planCarbs === 0 ? dietCarbs > 0 ? 100 : 0 : Math.floor(dietCarbs / planCarbs * 100)
        responseObj.fiber = planFiber === 0 ? dietFiber > 0 ? 100 : 0 :Math.floor(dietFiber / planFiber * 100)
        responseObj.plan_data = dietPlanData


        if (userDiet) {
            responseObj.my_water = userDiet.water || 0
            responseObj.my_green_tea = userDiet.green_tea || 0
            responseObj.my_black_coffee = userDiet.black_coffee || 0
            responseObj.my_data = myData
            //  responseObj._id = userDiet._id
            responseObj.createdAt = userDiet.createdAt
        } else {
            responseObj.my_water = 0
            responseObj.my_green_tea = 0
            responseObj.my_black_coffee = 0
            responseObj.my_data = null
            responseObj.createdAt = null

        }
        return responseObj
    }

    /**
     * Resolves a food_id (either MongoDB ObjectId or FatSecret ID) to a local Food document.
     * If it's a FatSecret ID and not in our DB, it fetches and creates it.
     */
    static async resolveFoodItem(foodId) {
        if (!foodId || foodId === '') return null;
        try {
            // 1. Check if it's a valid MongoDB ID
            if (mongoose.Types.ObjectId.isValid(foodId)) {
                return await Food.findById(foodId);
            }

            // 2. Not a MongoDB ID, check if it's a FatSecret ID (numeric string)
            if (!/^\d+$/.test(foodId)) return null;

            // 3. Check if we already have this FatSecret food cached
            let food = await Food.findOne({ externalId: foodId });
            
            // SELF-HEALING: If food exists but macro data is incomplete (usually only fiber was matched)
            if (food && food.nutrients && food.nutrients.length >= 4) {
                return food;
            }

            // 4. Provision or Re-provision details from FatSecret
            console.log(`${food ? 'Fixing up' : 'Auto-provisioning'} FatSecret food: ${foodId}`);
            const fsFood = await fatSecretUtil.getFoodDetails(foodId);
            if (!fsFood || !fsFood.servings) return food; 

            // BETTER SERVING SELECTION: Prefer a serving with a non-zero metric_serving_amount (g/ml)
            const servingsList = Array.isArray(fsFood.servings.serving) ? fsFood.servings.serving : [fsFood.servings.serving];
            const servingsData = servingsList.find(s => parseFloat(s.metric_serving_amount) > 1) || servingsList[0];
            
            console.log(`[DEBUG] Selected serving: ${servingsData.serving_description}, metric_amt: ${servingsData.metric_serving_amount}`);

            // 5. Map nutrients to local Nutrient IDs
            const allNutrients = await Nutrient.find({});
            const nutritionMapping = [
                { match: 'protein', value: parseFloat(servingsData.protein || 0) },
                { match: 'fat', value: parseFloat(servingsData.fat || 0) },
                { match: 'carb', value: parseFloat(servingsData.carbohydrate || 0) },
                { match: 'fiber', value: parseFloat(servingsData.fiber || 0) }
            ];

            const foodNutrients = [];
            for (const item of nutritionMapping) {
                let matchingNutrient = allNutrients.find(n => n.name.toLowerCase() === item.match.toLowerCase() || n.name.toLowerCase().includes(item.match));
                
                if (!matchingNutrient) {
                    matchingNutrient = await Nutrient.create({ name: item.match, type: 'macro' });
                }
                
                foodNutrients.push({
                    nutrient_id: matchingNutrient._id,
                    quantity: item.value
                });
            }

            // 6. Get all meal IDs
            const allMeals = await Meal.find({});
            const mealIds = allMeals.map(m => m._id);

            // 7. Create or Update local food entry
            const updatedFood = await Food.findOneAndUpdate(
                { externalId: foodId },
                {
                    name: fsFood.food_name,
                    description: fsFood.brand_name || 'Generic',
                    meals: mealIds,
                    nutrients_per_quantity: parseFloat(servingsData.metric_serving_amount || 100),
                    calories_per_quantity: parseFloat(servingsData.calories || 0),
                    serving: 1, 
                    nutrients: foodNutrients
                },
                { upsert: true, new: true }
            );

            return updatedFood;

        } catch (error) {
            console.error('Error in resolveFoodItem:', error);
            return null;
        }
    }
}

export default DailyDietController;