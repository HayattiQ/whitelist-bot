const Discord = require("discord.js");
const config = require("./config.json");
const Airtable = require('airtable');
const client = new Discord.Client({intents: ["GUILDS", "GUILD_MESSAGES"]});

client.login(config.BOT_TOKEN);
const prefix = "!";
const whitelist_role = "939740474669928458";
const howtochannel = "913360918279229441";



client.on("messageCreate", function(message) {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const commandBody = message.content.slice(prefix.length);
  const args = commandBody.split(' ');
  const command = args.shift().toLowerCase();

  if (command === "whitelist") {
    whitelistadd(message,args);
  }

});

function whitelistadd(message, args) {
  const args1 = args.shift();
  if (!args1) {
    message.reply(`Failed. You need to add whitelist address.`);
    return;
  }

  if (!message.member.roles.cache.has(whitelist_role)) {
    message.reply("Failed. you don't have whitelisted roles");
    return;
  }

  if (message.channel.id != howtochannel) {
    message.reply("Failed. you need to execute command in certain channel");
    return;
  }

  const username = message.author.username + "#" + message.author.discriminator;
  create_or_update_airtable(username,args1);

  message.reply(`SUCCESS.Your name is ${username}. Your WhiteList address is ${args1}`);
}


async function airtable_fetch(base, username) {
  return new Promise((resolve, reject) => {
    base('WhiteList').select({
      filterByFormula: "{Discord Name} = '"+ username +"'"
    }).firstPage(function(err, record) {
    if (err) {
      console.error(err);
      reject(err);
    }
    resolve(record);
  });
});
}

async function update (base, record_id, wallet_address) {
  return new Promise((resolve, reject) => {
    base('WhiteList').update([
      {
        "id": record_id,
        "fields": {
          "Wallet Address": wallet_address,
        }
      }
    ], function(err, records) {
      if (err) {
        console.error(err);
        reject(err);
        return;
      }
      resolve(records);
    });
  });

}

async function create_or_update_airtable (username, wallet_address) {
  const base = new Airtable({apiKey: airtable_key}).base('appRYgta1UWz57KXP');
  const result = await airtable_fetch(base, username);
  if (result) {
    const update_result =  await update(base, result.first.record_id, wallet_address);
    console.log(update_result);
  }

}
