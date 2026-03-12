const setting = {
    title: 'FNC Admin',
    baseurl: process.env.BASE_URL,
    description: 'This is the home page'
}
class SettingController {


    static async getSetting() {
        return setting

    }

    static async updateSetting() {

    }
}

export default SettingController