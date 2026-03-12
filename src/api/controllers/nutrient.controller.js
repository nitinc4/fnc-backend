import mongoose from "mongoose";
import ApiResponse from "../../utils/api_response.js";
import {Nutrient} from "../../models/nutrient.model.js";

class NutrientController {


    static async getNutrients(req, res) {

        const {type, name} = req.query;

        try {
            console.log(type)
            let nutrients;
            if (type !== undefined && type !== '' && type !== 'null' && name !== undefined && name !== '' && name !== 'null') {
                console.log('both exist')
                nutrients = await Nutrient.find({
                    $and: [
                        {
                            type: {
                                $regex: type,
                                $options: 'i'
                            }
                        },
                        {
                            name: {
                                $regex: name,
                                $options: 'i'
                            }
                        }
                    ]
                }).select('-__v -createdAt -updatedAt');
            } else if (type !== undefined && type !== '' && type !== 'null') {
                console.log('type exist')
                nutrients = await Nutrient.find({
                    type: {
                        $regex: type,
                        $options: 'i'
                    }

                }).select('-__v -createdAt -updatedAt');
            } else if (name !== undefined && name !== '' && name !== 'null') {
                console.log('name exist')
                nutrients = await Nutrient.find({
                    name: {
                        $regex: name,
                        $options: 'i'
                    }

                }).select('-__v -createdAt -updatedAt');
            } else {
                nutrients = await Nutrient.find().select('-__v -createdAt -updatedAt');
            }
            return res.status(200).json(ApiResponse.success('Nutrients retrieved successfully', nutrients));

        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message || 'Internal server error'));
        }

    }

    static async getNutrient(req, res) {
        const {id} = req.params;
        if (mongoose.Types.ObjectId.isValid(id) === false)
            return res.status(400).json(ApiResponse.error('Invalid nutrient id'));
        try {
            const nutrient = await Nutrient.findById(id);

            if (!nutrient)
                return res.status(404).json(ApiResponse.error('Nutrient not found'));
            return res.status(200).json(ApiResponse.success('Nutrient retrieved successfully', nutrient));
        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message || 'Internal server error'));
        }

    }

    static async createNutrient(req, res) {
        const {name, type} = req.body;
        if (!name)
            return res.status(400).json(ApiResponse.error('Name is required'))
        if (!type)
            return res.status(400).json(ApiResponse.error('Type is required'))
        if (type !== 'macro' && type !== 'micro')
            return res.status(400).json(ApiResponse.error('Type must be either macro or micro'))
        try {

            const isExistingNutrient = await Nutrient.findOne({name});

            if (isExistingNutrient)
                return res.status(400).json(ApiResponse.error('Nutrient already exists, please use a different name'));


            const createdNutrient = await Nutrient.create({name, type});

            const insertedNutrient = await Nutrient.findById(createdNutrient._id).select('-__v -createdAt -updatedAt');

            return res.status(200).json(ApiResponse.success('Nutrient created successfully', insertedNutrient));
        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message || 'Internal server error'));

        }
    }

    static async updateNutrient(req, res) {
        const {id} = req.params;
        const {name, type} = req.body;
        if (mongoose.Types.ObjectId.isValid(id) === false)
            return res.status(400).json(ApiResponse.error('Invalid nutrient id'));

        try {
            const nutrient = await Nutrient.findById(id);
            if (!nutrient)
                return res.status(404).json(ApiResponse.error('Nutrient not found'));
            if (name)
                nutrient.name = name;
            if (type)
                nutrient.type = type;

            await nutrient.save();

            const updatedNutrient = await Nutrient.findById(id).select('-__v -createdAt -updatedAt');
            return res.status(200).json(ApiResponse.success('Nutrient updated successfully', updatedNutrient));

        } catch (e) {
            res.status(500).json(ApiResponse.error(e.message || 'Internal server error'))
        }
    }

    static async deleteNutrient(req, res) {
        //TODO: Also check for other usage of this meal

        const {id} = req.params;
        if (mongoose.Types.ObjectId.isValid(id) === false)
            return res.status(400).json(ApiResponse.error('Invalid nutrient id'))
        try {
            const nutrient = await Nutrient.findById(id);
            if (!nutrient)
                return res.status(400).json(ApiResponse.error('Nutrient not found'))
            const deletedNutrient = await Nutrient.deleteOne(nutrient._id)

            if (!deletedNutrient.acknowledged)
                return res.status(400).json(ApiResponse.error('Failed to delete'))

            return res.status(200).json(ApiResponse.success('Nutrient deleted successfully', true));
        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message || 'Internal server error'))
        }
    }
}

export default NutrientController;