import ApiResponse from "../../utils/api_response.js";
import mongoose from "mongoose";
import {HealthIssue} from "../../models/health_issue/health_issue.model.js";
import {DietPlan} from "../../models/diet_plan/diet_plan.model.js";
import {User} from "../../models/auth/user.model.js";
import {getDate_YYYY_MM_DD} from "../../utils/date_time_utils.js";
import {Food} from "../../models/food/food.model.js";

class DietPlanController {

    static async getDietPlans(req, res) {
        try {
            const dietPlans = await DietPlan.find().select('-__v').populate('health_issues').populate({
                path:'created_by',
                select:'-password -__v -createdAt -updatedAt -token'
            }).populate({
                path: 'breakfast.food_id lunch.food_id dinner.food_id',
            })
            return res.status(200).send(ApiResponse.success('Diet Plans Retrieved', dietPlans))
        } catch (e) {
            return res.status(500).send(ApiResponse.error(e.toString() || 'Internal Server Error'))
        }
    }


    static async getDietPlan(req, res) {
        try {
            const {id} = req.params
            if (!id)
                return res.status(400).send(ApiResponse.error('Diet Plan id is required'))

            if (!mongoose.Types.ObjectId.isValid(id))
                return res.status(400).send(ApiResponse.error('Invalid Diet Plan id'))

            const dietPlan = await DietPlan.findById(id).select('-__v').populate('health_issues').populate({
                path: 'breakfast.food_id lunch.food_id dinner.food_id',

            })

            if (!dietPlan)
                return res.status(400).send(ApiResponse.error(`Diet Plan with id ${id} not found`))

            return res.status(200).send(ApiResponse.success('Diet Plan Retrieved', dietPlan))

        } catch (e) {
            res.status(500).send(ApiResponse.error(e.toString() || 'Internal Server Error'))
        }
    }

    static async createDietPlan(req, res) {

        const {
            user_id, name, description, start_date, end_date, health_issues, breakfast, lunch,
            dinner, water_target, green_tea_target, black_coffee_target, variant, dietary_option
        } = req.body

        if (!user_id)
            return res.status(400).send(ApiResponse.error('User is required'))

        if (!name)
            return res.status(400).send(ApiResponse.error('{ name } is required'))

        if (!description)
            return res.status(400).send(ApiResponse.error('{ description } is required'))

        if (!start_date)
            return res.status(400).send(ApiResponse.error('{ start_date } is required'))

        if (!end_date)
            return res.status(400).send(ApiResponse.error('{ end_date } is required'))

        if (!health_issues)
            return res.status(400).send(ApiResponse.error('{ health_issues } is required'))
        if (!Array.isArray(health_issues))
            return res.status(400).send(ApiResponse.error('{ health_issues } must be an array'))

        if (breakfast)
            if (!Array.isArray(breakfast))
                return res.status(400).send(ApiResponse.error('{ breakfast } must be an array'))

        if (lunch)
            if (!Array.isArray(lunch))
                return res.status(400).send(ApiResponse.error('{ lunch } must be an array'))

        if (dinner)
            if (!Array.isArray(dinner))
                return res.status(400).send(ApiResponse.error('{ dinner } must be an array'))

        if (water_target === null || water_target === undefined)
            return res.status(400).send(ApiResponse.error('{ water_target } is required'))
            
        if (green_tea_target === null || green_tea_target === undefined)
            return res.status(400).send(ApiResponse.error('{ green_tea_target } is required'))

        if (black_coffee_target === null || black_coffee_target === undefined)
            return res.status(400).send(ApiResponse.error('{ black_coffee_target } is required'))

        if (!variant)
            return res.status(400).send(ApiResponse.error('{ variant } is required'))

        if (!dietary_option)
            return res.status(400).send(ApiResponse.error('{ dietary_option } is required'))

        if (!breakfast && !lunch && !dinner)
            return res.status(400).send(ApiResponse.error('At least one meal plan is required { breakfast, lunch, dinner }'))


        try {

            const user = await User.findById(user_id);
            if (!user)
                return res.status(400).send(ApiResponse.error(`Unauthorized User with id ${user_id}`))
            //TODO add logic to check if user is a authorised to create diet plan

            const startDate = getDate_YYYY_MM_DD(start_date);
            const endDate = getDate_YYYY_MM_DD(end_date);


            //fetching health issues
            let healthIssues = []
            for (const health_issue of health_issues) {
                if (mongoose.Types.ObjectId.isValid(health_issue) === false)
                    return res.status(400).send(ApiResponse.error(`Invalid health issue id: ${health_issue}`))

                const healthIssue = await HealthIssue.findById(health_issue)
                if (!healthIssue)
                    return res.status(400).send(ApiResponse.error(`Health Issue with id ${health_issue} not found`))


                const isExist = healthIssues.find(issue => issue._id.equals(healthIssue._id));
                if (isExist)
                    return res.status(400).send(ApiResponse.error(`Add different health issues not the same one`))

                healthIssues.push(healthIssue)

            }

            //add breakfast meal plan
            let breakfastList = []
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


            const dietPlan = await DietPlan.create(
                {
                    name,
                    description,
                    start_date: startDate,
                    end_date: endDate,
                    created_by: user,
                    health_issues: healthIssues,
                    breakfast: breakfastList,
                    lunch: lunchList,
                    dinner: dinnerList,
                    water_target: water_target,
                    green_tea_target: green_tea_target,
                    black_coffee_target: black_coffee_target,
                    variant: variant,
                    dietary_option: dietary_option
                }
            )

            const createdDietPlan = await DietPlan.findById(dietPlan._id).select('-__v').populate('health_issues').populate({
                path: 'breakfast.food_id',
            })

            return res.status(200).send(ApiResponse.success('Diet Plan Created', createdDietPlan))
        } catch (e) {
            return res.status(500).send(ApiResponse.error(e.toString() || 'Internal Server Error'))
        }
    }

    static async updateDietPlan(req, res) {

        const {id} = req.params

        if (!id)
            return res.status(400).send(ApiResponse.error('Diet Plan id is required'))

        const {
            user_id,
            name,
            description,
            start_date,
            end_date,
            health_issues,
            breakfast,
            lunch,
            dinner,
            water_target,
            green_tea_target,
            black_coffee_target,
            variant,
            dietary_option
        } = req.body

        if (!user_id)
            return res.status(400).send(ApiResponse.error('User is required'))


        try {

            const existingPLan = await DietPlan.findById(id)
            if (!existingPLan)
                return res.status(400).send(ApiResponse.error(`Diet Plan with id ${id} not found`))

            const user = await User.findById(user_id);
            if (!user)
                return res.status(400).send(ApiResponse.error(`Unauthorized User with id ${user_id}`))

            existingPLan.created_by = user

            if (name && name!=='null')
                existingPLan.name = name

            if (description && description!=='null')
                existingPLan.description = description

            if (start_date && start_date!=='null')
                existingPLan.start_date = getDate_YYYY_MM_DD(start_date)

            if (end_date && end_date!=='null')
                existingPLan.end_date = getDate_YYYY_MM_DD(end_date)
                
            if (water_target !== undefined && water_target !== null && water_target !== 'null')
                existingPLan.water_target = water_target
                
            if (green_tea_target !== undefined && green_tea_target !== null && green_tea_target !== 'null')
                existingPLan.green_tea_target = green_tea_target

            if (black_coffee_target !== undefined && black_coffee_target !== null && black_coffee_target !== 'null')
                existingPLan.black_coffee_target = black_coffee_target

            if (variant && variant !== 'null')
                existingPLan.variant = variant

            if (dietary_option && dietary_option !== 'null')
                existingPLan.dietary_option = dietary_option

            if (health_issues) {
                if (!Array.isArray(health_issues))
                    return res.status(400).send(ApiResponse.error('{ health_issues } must be an array'))

                let healthIssues = []

                for (const health_issue of health_issues) {
                    if (mongoose.Types.ObjectId.isValid(health_issue) === false)
                        return res.status(400).send(ApiResponse.error(`Invalid health issue id: ${health_issue}`))

                    const healthIssue = await HealthIssue.findById(health_issue)

                    if (!healthIssue)
                        return res.status(400).send(ApiResponse.error(`Health Issue with id ${health_issue} not found`))

                    if (healthIssues.find(issue => issue._id.equals(healthIssue._id)))
                        return res.status(400).send(ApiResponse.error(`Add different health issues not the same one`))

                    healthIssues.push(healthIssue)

                }
                existingPLan.health_issues = healthIssues
            }

            if (breakfast) {
                if (!Array.isArray(breakfast))
                    return res.status(400).send(ApiResponse.error('{ breakfast } must be an array'))

                let breakfastList = []
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
                existingPLan.breakfast = breakfastList
            }


            if (lunch) {
                if (!Array.isArray(lunch))
                    return res.status(400).send(ApiResponse.error('{ lunch } must be an array'))

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
                existingPLan.lunch = lunchList
            }

           

            if (dinner) {
                if (!Array.isArray(dinner))
                    return res.status(400).send(ApiResponse.error('{ dinner } must be an array'))

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
                existingPLan.dinner = dinnerList
            }

            await existingPLan.save()

            const updatedDietPlan = await DietPlan.findById(id).select('-__v').populate('health_issues').populate({
                path: 'breakfast.food_id',

            })

            return res.status(200).send(ApiResponse.success('Diet Plan Updated', updatedDietPlan))

        } catch (e) {
            return res.status(500).send(ApiResponse.error(e.toString() || 'Internal Server Error'))

        }
    }

    static async deleteDietPlan(req, res) {

        const {id} = req.params
        if (!id)
            return res.status(400).send(ApiResponse.error('Diet Plan id is required'))
        try {

            if (!mongoose.Types.ObjectId.isValid(id))
                return res.status(400).send(ApiResponse.error('Invalid Diet Plan id'))

            const removedDietPlan = await DietPlan.findByIdAndDelete(id);

            if (!removedDietPlan)
                return res.status(400).send(ApiResponse.error(`Diet Plan with id ${id} not found`))

            return res.status(200).send(ApiResponse.success('Diet Plan Deleted', removedDietPlan))
        } catch (e) {
            return res.status(500).send(ApiResponse.error(e.message || 'Internal Server Error'))
        }
    }

}

export default DietPlanController