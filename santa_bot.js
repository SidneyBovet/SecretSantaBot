var fs = require('fs');
var dbPath = "./db/test.txt"

var telegram = require('telegram-bot-api');
var api = new telegram({
	token: '156224623:AAET0GwY9amY_88tTIYguY5f156vfqQzT8I',
	updates: {
		enabled: true,
		get_interval: 1000
	}
});

function sendMessage(chatID, message)
{
    api.sendMessage({
	chat_id: chatID,
	text: message
    }, function(err, data)
    {
        if(err)
            console.log(err);
        //console.log(data);
    });
}

function broadcast(message)
{
    var input = fs.createReadStream(dbPath);
    mapLines(input, function(line){
        var rx = /^(\d+)\s\w+/g;
        var match = rx.exec(line);
        if (match != null)
            sendMessage(match[1], message);
    }, function(){});
}

// TODO: decrypt db file
console.log("File decrypted and ready to use.");
//broadcast("Le robot est en ligne!");

api.on('message', function(message)
{
    /* Check if message contains text, if not, then send apologies and stop process. */
    if(!message.text)
    {
        console.log("Not a text message, apologizing and exiting...");
        sendMessage(message.chat.id, "Je ne sais malheureusement traiter que des messages texte.");
        return;
    }
    
    console.log("Incoming message: " + message.text);
    
    var command = getCommand(message.text);
    if(command)
    {
        console.log("Command: " + command[1]);
        switch(command[1])
        {
            case "r":
                var name = getParameter(message.text);
                if(name)
                    insertNameInDB(message.chat.id, name[1]);
                
                break;
            case "e":
                // TODO: db encryption
                sendMessage(message.chat.id, "NOT closing server.");
                broadcast("Le robot est maintenant hors lige, plus d'interaction possible.");
                // TODO: server shutdown
                //process.exit();
                break;
            
            case "s":
                //TODO: simulate giftee assignement and send to sidney
                break;
            
            case "p":
                // TODO: send secret giftee to all chat IDs
                // TODO: rules for the giftees asignment
                break;
            
            case "b":
                var msg = getParameter(message.text);
                if(msg)
                    broadcast("Message bcast");
                break;
            
            case "help":
                sendMessage(message.chat.id, "Utilisez '/r Prenom' (sans accents!) pour vous ajouter a la liste.");
                break;
            
            default:
                sendMessage(message.chat.id, "Oups, je ne connais pas cette commande.");
        }
    }
    else
    {
        sendMessage(message.chat.id, "Pardon mais je ne comprends pas ce message.");
    }
    
	// It'd be good to check received message type here
	// And react accordingly
	// We consider that only text messages can be received here
});

/*
    Looks whether the chatID or the name is in the DB and sends a message if either is found.
*/
function insertNameInDB(chatID, newName)
{
    var input = fs.createReadStream(dbPath);
    mapLines(input, function(line){
        var rx = /^(\d+)\s(\w+)/g;
        var match = rx.exec(line);
        if (match[1] == chatID)
        {
            sendMessage(chatID, "Je te connais deja en tant que " + match[2] + ", contacte Sidney pour plus d'informations.");
            return true;
        }
        else if (match[2] == newName)
        {
            //name already taken
            sendMessage(chatID, "Quelqu'un a deja pris le nom " + newName + ", contacte Sidney pour plus d'informations");
            return true;
        }
        else
        {
            return false;
        }
            
    }, function(){
        fs.appendFile(dbPath, chatID + " " + newName + "\n", function(err) {
            if(err) {
                console.log(err);
            } else {
                console.log("The file was saved!");
            }
        });
        sendMessage(chatID, "Tu es maintenant dans la liste en tant que " + newName);
    });
}

/*
    Performs 'processLine' for each line and aggregates its return boolean.
    When at the end of the file, if no problem was found then run 'noProblem'.
*/
function mapLines(input, processLine, noProblem) {
    var remaining = '';
    var problem = false;

    input.on('data', function(data) {
        remaining += data;
        var index = remaining.indexOf('\n');
        while (index > -1) {
            var line = remaining.substring(0, index);
            remaining = remaining.substring(index + 1);
            problem = problem || processLine(line);
            index = remaining.indexOf('\n');
        }
    });

    input.on('end', function() {
        if (remaining.length > 0) {
            console.log("remaining...");
            problem = problem || processLine(remaining);
        }
        if(!problem)
            noProblem();
    });
        
    input.on('error', function() {
        console.log("An error occured with the DB");
    });
}

function getCommand(message)
{
    var rx = /^\/(\w+)/g;
    return rx.exec(message);
};

function getParameter(command)
{
    var rx = /^\/\w+\s(\w+)/g;
    return rx.exec(command);
};