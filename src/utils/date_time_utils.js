import moment from "moment";


function calculateAge_YYYY_MM_DD(dob) {
    return moment().diff(dob, 'years')
}

function getDate_YYYY_MM_DD(date) {
    return new Date(date)
}

function getTodayDate(){
    const today = new Date();
    today.setUTCHours(0,0,0,0);
    return today
}

function  getTodayByDate(date) {
    const today = new Date(date);
    today.setUTCHours(0,0,0,0);
    return today

}

function getDate_24_HH_MM(time) {
    // Get the current date
    let currentDate = new Date();

    // Parse the time string "21:30"
    let [hours, minutes, seconds] = time.split(":").map(Number);

    // Set the hours and minutes to the current date
    currentDate.setHours(hours);
    currentDate.setMinutes(minutes);
    currentDate.setSeconds(seconds);
    return currentDate
}

function getDateFromMongo(date) {
    return new Date(date);


}

export {getTodayDate,getTodayByDate,calculateAge_YYYY_MM_DD, getDate_YYYY_MM_DD, getDate_24_HH_MM, getDateFromMongo}