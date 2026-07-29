import api from "./api"

export const updateNotificationUser = (notificationID)=>{
    return api.put(`/notification-users/${notificationID}`);
}