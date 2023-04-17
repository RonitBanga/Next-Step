const createItem = (desc, deadline, db) => {
    var currentdate = new Date();
    let uniqueId = 1;
    if (db && db.length != 0) {
        uniqueId = db[db.length - 1].id + 1;
    }
    const item = {
        Id: db != null ? uniqueId : null,
        Description: desc,
        Assigned_On: currentdate.getDate() +
            "/" +
            (currentdate.getMonth() + 1) +
            "/" +
            currentdate.getFullYear() +
            " @ " +
            currentdate.getHours() +
            ":" +
            currentdate.getMinutes() +
            ":" +
            currentdate.getSeconds(),
        Deadline: deadline,
        Status: false,
    };
    return item;
};

module.exports = createItem;