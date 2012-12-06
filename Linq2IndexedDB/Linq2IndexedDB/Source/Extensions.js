/***********************************************
 * Adding contains functionality to the array. *
 ***********************************************/
Array.prototype.contains = function (obj) {
    return this.indexOf(obj) > -1;
};
