function Action() {
    this.name = "Unnamed Action";
}

Action.prototype.does_match = function(gervin, msg) {
    throw "Undefined does_match behavior for " + this.name;
}

Action.prototype.run = function(gervin, msg) {
    throw "Undefined run behavior for " + this.name;
}

module.exports = Action
