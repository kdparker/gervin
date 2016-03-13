actions = [
    require('./actions/pingpong.js'),
    require('./actions/imageme.js')
];

module.exports = function(gervin, msg) {
    split_msg = msg.cleanContent.split(/\s+/);
    if (!(split_msg.length >= 2 && split_msg[0].match(/gervin/i)))
        return;
    
    for (var i = 0; i < actions.length; i++) {
        var action = actions[i];
        try {
            if (action.does_match(gervin, msg)) {
                console.log("Running action: " + action.name)
                action.run(gervin, msg)
            }
        } catch (e) {
            console.log("Error occured processing action: " + action.name)
            console.log(e)
        }
    }
}
