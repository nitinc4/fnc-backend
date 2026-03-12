import ApiResponse from "../../utils/api_response.js";
import mongoose from "mongoose";
import {DailyDiet} from "../../models/daily_diet/daily_diet.model.js";
import {getTodayDate} from "../../utils/date_time_utils.js";
import {User} from "../../models/auth/user.model.js";
import {Food} from "../../models/food/food.model.js";
import {UserProfile} from "../../models/profile/user_profile.model.js";
import {Meal} from "../../models/meal/meal.model.js";

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
            const {water, breakfast, morning_snacks, lunch, evening_snacks, dinner} = req.body;

            const user = await User.findById(user_id);

            const targetDate = date ? new Date(date) : getTodayDate()


            if (!user) {
                return res.status(400).json(ApiResponse.error('User not found'))
            }

            console.log(water)
            if (water === null || water === undefined || water === 'null')
                return res.status(400).json(ApiResponse.error('{water} is required'))

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


            let breakfastList = []
            if (breakfast) {
                //add breakfast meal plan
                for (let meal of breakfast) {
                    if (mongoose.Types.ObjectId.isValid(meal.food_id) === false)
                        return res.status(400).send(ApiResponse.error(`Invalid food id: ${meal.food_id}`))

                    if (!meal.quantity)
                        return res.status(400).send(ApiResponse.error(`meal { quantity } is required`))

                    const foodData = await Food.findById(meal.food_id)
                    if (!foodData)
                        return res.status(400).send(ApiResponse.error(`Food with id ${meal.food_id} not found`))

                    meal.food_id = foodData

                    breakfastList.push(meal)
                }
            }

            let morningSnacksList = []
            if (morning_snacks) {
                //add morning snacks meal plan
                for (let meal of morning_snacks) {
                    if (mongoose.Types.ObjectId.isValid(meal.food_id) === false)
                        return res.status(400).send(ApiResponse.error(`Invalid food id: ${meal.food_id}`))

                    if (!meal.quantity)
                        return res.status(400).send(ApiResponse.error(`meal { quantity } is required`))

                    const foodData = await Food.findById(meal.food_id)
                    if (!foodData)
                        return res.status(400).send(ApiResponse.error(`Food with id ${meal.food_id} not found`))

                    meal.food_id = foodData

                    morningSnacksList.push(meal)
                }
            }

            let lunchList = []
            if (lunch) {
                //add lunch meal plan
                for (let meal of lunch) {
                    if (mongoose.Types.ObjectId.isValid(meal.food_id) === false)
                        return res.status(400).send(ApiResponse.error(`Invalid food id: ${meal.food_id}`))

                    if (!meal.quantity)
                        return res.status(400).send(ApiResponse.error(`meal { quantity } is required`))

                    const foodData = await Food.findById(meal.food_id)
                    if (!foodData)
                        return res.status(400).send(ApiResponse.error(`Food with id ${meal.food_id} not found`))

                    meal.food_id = foodData

                    lunchList.push(meal)
                }
            }
            let eveningSnacksList = []

            if (evening_snacks) {
                //add evening snacks meal plan
                for (let meal of evening_snacks) {
                    if (mongoose.Types.ObjectId.isValid(meal.food_id) === false)
                        return res.status(400).send(ApiResponse.error(`Invalid food id: ${meal.food_id}`))

                    if (!meal.quantity)
                        return res.status(400).send(ApiResponse.error(`meal { quantity } is required`))

                    const foodData = await Food.findById(meal.food_id)
                    if (!foodData)
                        return res.status(400).send(ApiResponse.error(`Food with id ${meal.food_id} not found`))

                    meal.food_id = foodData

                    eveningSnacksList.push(meal)
                }
            }

            let dinnerList = []
            if (dinner) {
                //add dinner meal plan
                for (let meal of dinner) {
                    if (mongoose.Types.ObjectId.isValid(meal.food_id) === false)
                        return res.status(400).send(ApiResponse.error(`Invalid food id: ${meal.food_id}`))

                    if (!meal.quantity)
                        return res.status(400).send(ApiResponse.error(`meal { quantity } is required`))

                    const foodData = await Food.findById(meal.food_id)
                    if (!foodData)
                        return res.status(400).send(ApiResponse.error(`Food with id ${meal.food_id} not found`))

                    meal.food_id = foodData

                    dinnerList.push(meal)
                }
            }


            const diet = await DailyDiet.create({
                created_by: user,
                breakfast: breakfastList,
                morning_snacks: morningSnacksList,
                lunch: lunchList,
                evening_snacks: eveningSnacksList,
                dinner: dinnerList,
                water: water,
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
                breakfast: [],
                morning_snacks: [],
                lunch: [],
                evening_snacks: [],
                dinner: [],
            });

            const createdDiet = await DailyDiet.findById(diet._id)

            return res.status(200).json(ApiResponse.success('Water added successfully', createdDiet))

        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message || 'Internal server error'))
        }
    }

    static async update(req, res) {
        try {
            const {id} = req.params;
            const {user_id, water, breakfast, morning_snacks, lunch, evening_snacks, dinner} = req.body;

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


            if (breakfast) {
                if (Array.isArray(breakfast)) {
                    let breakfastList = []
                    //add breakfast meal plan
                    for (let meal of breakfast) {
                        if (mongoose.Types.ObjectId.isValid(meal.food_id) === false)
                            return res.status(400).send(ApiResponse.error(`Invalid food id: ${meal.food_id}`))

                        if (!meal.quantity)
                            return res.status(400).send(ApiResponse.error(`meal { quantity } is required`))

                        const foodData = await Food.findById(meal.food_id)
                        if (!foodData)
                            return res.status(400).send(ApiResponse.error(`Food with id ${meal.food_id} not found`))

                        meal.food_id = foodData

                        breakfastList.push(meal)
                    }

                    diet.breakfast = breakfastList
                }
            }

            if (morning_snacks) {
                if (Array.isArray(morning_snacks)) {
                    //add morning snacks meal plan
                    let morningSnacksList = []
                    for (let meal of morning_snacks) {
                        if (mongoose.Types.ObjectId.isValid(meal.food_id) === false)
                            return res.status(400).send(ApiResponse.error(`Invalid food id: ${meal.food_id}`))

                        if (!meal.quantity)
                            return res.status(400).send(ApiResponse.error(`meal { quantity } is required`))

                        const foodData = await Food.findById(meal.food_id)
                        if (!foodData)
                            return res.status(400).send(ApiResponse.error(`Food with id ${meal.food_id} not found`))

                        meal.food_id = foodData

                        morningSnacksList.push(meal)
                    }

                    diet.morning_snacks = morningSnacksList
                }
            }

            if (lunch) {
                if (Array.isArray(lunch)) {
                    //add lunch meal plan
                    let lunchList = []
                    for (let meal of lunch) {
                        if (mongoose.Types.ObjectId.isValid(meal.food_id) === false)
                            return res.status(400).send(ApiResponse.error(`Invalid food id: ${meal.food_id}`))

                        if (!meal.quantity)
                            return res.status(400).send(ApiResponse.error(`meal { quantity } is required`))

                        const foodData = await Food.findById(meal.food_id)
                        if (!foodData)
                            return res.status(400).send(ApiResponse.error(`Food with id ${meal.food_id} not found`))

                        meal.food_id = foodData

                        lunchList.push(meal)
                    }

                    diet.lunch = lunchList
                }

            }

            if (evening_snacks) {
                //add evening snacks meal plan
                if (Array.isArray(evening_snacks)) {


                    let eveningSnacksList = []
                    for (let meal of evening_snacks) {
                        if (mongoose.Types.ObjectId.isValid(meal.food_id) === false)
                            return res.status(400).send(ApiResponse.error(`Invalid food id: ${meal.food_id}`))

                        if (!meal.quantity)
                            return res.status(400).send(ApiResponse.error(`meal { quantity } is required`))

                        const foodData = await Food.findById(meal.food_id)
                        if (!foodData)
                            return res.status(400).send(ApiResponse.error(`Food with id ${meal.food_id} not found`))

                        meal.food_id = foodData

                        eveningSnacksList.push(meal)
                    }

                    diet.evening_snacks = eveningSnacksList
                }

            }

            if (dinner) {

                if (Array.isArray(dinner)) {
                    //add dinner meal plan
                    let dinnerList = []
                    for (let meal of dinner) {
                        if (mongoose.Types.ObjectId.isValid(meal.food_id) === false)
                            return res.status(400).send(ApiResponse.error(`Invalid food id: ${meal.food_id}`))

                        if (!meal.quantity)
                            return res.status(400).send(ApiResponse.error(`meal { quantity } is required`))

                        const foodData = await Food.findById(meal.food_id)
                        if (!foodData)
                            return res.status(400).send(ApiResponse.error(`Food with id ${meal.food_id} not found`))

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

                    path: 'breakfast.food_id morning_snacks.food_id lunch.food_id evening_snacks.food_id dinner.food_id',
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
                    path: 'breakfast.food_id morning_snacks.food_id lunch.food_id evening_snacks.food_id dinner.food_id',
                    populate: 'meals nutrients.nutrient_id'
                });

        }


        //get diet plan data
        const dietPlans = await UserProfile.findOne({user_id: user_id}).populate({
            path: 'diet_plans',
            populate: {
                path: 'breakfast.food_id morning_snacks.food_id lunch.food_id evening_snacks.food_id dinner.food_id',
                populate: 'meals nutrients.nutrient_id'
            }
        })

        let isDietPlanExist = false
        let dietPlanData

        let plan_water = 0
        let dietPlanBreakfastCal = 0
        let dietPlanBreakfastList = []
        let dietPlanMorningSnacksCal = 0
        let dietPlanMorningSnacksList = []
        let dietPlanLunchCal = 0
        let dietPlanLunchList = []
        let dietPlanEveningSnacksCal = 0
        let dietPlanEveningSnacksList = []
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

                    //morning snacks
                    if (Array.isArray(dietPlan.morning_snacks)) {
                        for (let food of dietPlan.morning_snacks) {

                            //calculate nutrients
                            addPlanNutrient(food)

                            //calculate calories
                            let foodCalPerGm = food.food_id.calories_per_quantity / food.food_id.nutrients_per_quantity
                            dietPlanMorningSnacksCal += food.quantity * foodCalPerGm
                            const foodItem = Object.assign(food._doc, {total_calories: Math.floor(food.quantity * foodCalPerGm)})
                            dietPlanMorningSnacksList.push(foodItem)
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

                    //evening snacks
                    if (Array.isArray(dietPlan.evening_snacks)) {
                        for (let food of dietPlan.evening_snacks) {

                            //calculate nutrients
                            addPlanNutrient(food)

                            //calculate calories
                            let foodCalPerGm = food.food_id.calories_per_quantity / food.food_id.nutrients_per_quantity
                            dietPlanEveningSnacksCal += food.quantity * foodCalPerGm
                            const foodItem = Object.assign(food._doc, {total_calories: Math.floor(food.quantity * foodCalPerGm)})
                            dietPlanEveningSnacksList.push(foodItem)
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


        const totalPlanCal = Math.floor(dietPlanBreakfastCal + dietPlanMorningSnacksCal + dietPlanLunchCal + dietPlanEveningSnacksCal + dietPlanDinnerCal)

        const meals = await Meal.find().select('name start_time end_time')

        const breakfastMeal = meals.find(meal => meal.name === 'breakfast');
        const morningSnacksMeal = meals.find(meal => meal.name === 'morning_snacks');
        const lunchMeal = meals.find(meal => meal.name === 'lunch');
        const eveningSnacksMeal = meals.find(meal => meal.name === 'evening_snacks');
        const dinnerMeal = meals.find(meal => meal.name === 'dinner');

        dietPlanData = {
            breakfast: {
                total_calories: Math.floor(dietPlanBreakfastCal),
                start_time: breakfastMeal.start_time,
                end_time: breakfastMeal.end_time,
                foods: dietPlanBreakfastList,
            },
            morning_snacks: {
                total_calories: Math.floor(dietPlanMorningSnacksCal),
                start_time: morningSnacksMeal.start_time,
                end_time: morningSnacksMeal.end_time,
                foods: dietPlanMorningSnacksList

            },
            lunch: {
                total_calories: Math.floor(dietPlanLunchCal),
                start_time: lunchMeal.start_time,
                end_time: lunchMeal.end_time,
                foods: dietPlanLunchList
            },
            evening_snacks: {
                total_calories: Math.floor(dietPlanEveningSnacksCal),
                start_time: eveningSnacksMeal.start_time,
                end_time: eveningSnacksMeal.end_time,
                foods: dietPlanEveningSnacksList
            },
            dinner: {
                total_calories: Math.floor(dietPlanDinnerCal),
                start_time: dinnerMeal.start_time,
                end_time: dinnerMeal.end_time,
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

            //organise morning snacks diet data
            let foodMorningSnacksCal = 0
            let foodMorningSnacksList = []
            for (let meal of userDiet.morning_snacks) {

                //calculate nutrients
                addDietNutrient(meal)

                //calculate calories
                let foodCalPerGm = meal.food_id.calories_per_quantity / meal.food_id.nutrients_per_quantity
                foodMorningSnacksCal += meal.quantity * foodCalPerGm
                const foodItem = Object.assign(meal._doc, {total_calories: Math.floor(meal.quantity * foodCalPerGm)})
                foodMorningSnacksList.push(foodItem)
            }
            myData.morning_snacks = {
                total_calories: Math.floor(foodMorningSnacksCal),
                foods: foodMorningSnacksList
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

            //organise evening snacks diet data
            let foodEveningSnacksCal = 0
            let foodEveningSnacksList = []
            for (let meal of userDiet.evening_snacks) {

                //calculate nutrients
                addDietNutrient(meal)

                //calculate calories
                let foodCalPerGm = meal.food_id.calories_per_quantity / meal.food_id.nutrients_per_quantity
                foodEveningSnacksCal += meal.quantity * foodCalPerGm
                const foodItem = Object.assign(meal._doc, {total_calories: Math.floor(meal.quantity * foodCalPerGm)})
                foodEveningSnacksList.push(foodItem)
            }
            myData.evening_snacks = {
                total_calories: Math.floor(foodEveningSnacksCal),
                foods: foodEveningSnacksList
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

            responseObj.total_calories = Math.floor(foodBreakFastCal + foodMorningSnacksCal + foodLunchCal + foodEveningSnacksCal + foodDinnerCal)


        }



        //calculate nutrient percentage
        responseObj.protein =planProtein === 0 ? dietProtein > 0 ? 100 : 0 : Math.floor(dietProtein / planProtein * 100)
        responseObj.fat = planFat === 0 ? dietFat > 0 ? 100 : 0 : Math.floor(dietFat / planFat * 100)
        responseObj.carbs = planCarbs === 0 ? dietCarbs > 0 ? 100 : 0 : Math.floor(dietCarbs / planCarbs * 100)
        responseObj.fiber = planFiber === 0 ? dietFiber > 0 ? 100 : 0 :Math.floor(dietFiber / planFiber * 100)
        responseObj.plan_data = dietPlanData


        if (userDiet) {
            responseObj.my_water = userDiet.water || 0
            responseObj.my_data = myData
            //  responseObj._id = userDiet._id
            responseObj.createdAt = userDiet.createdAt
        } else {
            responseObj.my_water = 0
            responseObj.my_data = null
            responseObj.createdAt = null

        }
        return responseObj


    }
}

export default DailyDietController;