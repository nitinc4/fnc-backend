import {Setting} from "../../models/setting/setting.model.js";
import ApiResponse from "../../utils/api_response.js";

class SettingController {

    static async getSetting(req, res) {
        try {
            const setting = await Setting.findOne().select("-__v");

            if(!setting){
                return res.status(400).send(ApiResponse.error('Setting not found'));
            }
            return res.status(200).send(ApiResponse.success('Setting retrieved successfully', setting));
        } catch (err) {
            return  res.status(500).send(ApiResponse.error(err.message || 'Internal server error'));
        }
    }


    static async updateSetting(req, res) {
        try {
            const {
                owner,
                profile,
                about,
                logo,
                phone,
                email,
                address,
                whatsapp,
                facebook,
                instagram,
                twitter,
                website,
                privacy,

            } = req.body;
            const setting = await Setting.findOne();
            if (!setting) {
                //create new setting
                const newSetting =  await Setting.create({
                    owner,
                    profile,
                    about,
                    logo,
                    phone,
                    email,
                    address,
                    whatsapp,
                    facebook,
                    instagram,
                    twitter,
                    website,
                    privacy,
                });

                if(!newSetting){
                    return res.status(400).send(ApiResponse.error('Failed to crate setting'));
                }

                const newlyCreatedSetting = await Setting.findOne().select("-__v");

                return res.status(200).send(ApiResponse.success('Setting created successfully', newlyCreatedSetting));
            }
            //update setting
            if(owner) setting.owner = owner;
            if(profile) setting.profile = profile;
            if(about) setting.about = about;
            if(logo) setting.logo = logo;
            if(phone) setting.phone = phone;
            if(email) setting.email = email;
            if(address) setting.address = address;
            if(whatsapp) setting.whatsapp = whatsapp;
            if(facebook) setting.facebook = facebook;
            if(instagram) setting.instagram = instagram;
            if(twitter) setting.twitter = twitter;
            if(website) setting.website = website;
            if(privacy) setting.privacy = privacy;
            await setting.save();
            const updatedSetting = await Setting.findOne().select("-__v");
            return  res.status(200).send(ApiResponse.success('Setting updated successfully', updatedSetting));
        } catch (err) {
            return  res.status(500).send(ApiResponse.error(err.message || 'Internal server error'));
        }
    }

}

export default SettingController;