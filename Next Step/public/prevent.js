function prevent(str) {
    let newStr = str.replace(/=/g, "-");
    return newStr;
}

module.exports = prevent;