import Discord from "discord.js";
import Airtable, { FieldSet } from 'airtable';
import { AirtableBase } from "airtable/lib/airtable_base";
import { Records } from "airtable/lib/records";
const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES"] });
require('dotenv').config()

client.login(process.env.BOT_TOKEN);
const prefix = "!";
const whitelist_role = "939740474669928458";
const howtochannel = "913360918279229441";



client.on("messageCreate", function (message) {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const commandBody: string = message.content.slice(prefix.length);
  const args: string[] = commandBody.split(' ');
  const command: string = args.shift()?.toLowerCase() ?? "";

  if (command === "whitelist") {
    whiteListAdd(message, args);
  } else if (command === "checkwhitelist") {
    checkWhiteList(message);
  }

});

async function checkWhiteList(message: Discord.Message<boolean>) {
  const username = message.author.username + "#" + message.author.discriminator;
  const base = new Airtable({ apiKey: process.env.AIRTABLE_KEY }).base('appRYgta1UWz57KXP');
  const result = await airtable_fetch(base, username);

  if (result === undefined || result[0] === undefined) {
    message.reply("You don't regist WhiteList Address yet.");
    return;
  }
  const wallet_address = result[0].fields["Wallet Address"] as string;
  message.reply("Your Wallet Address = " + wallet_address);
}

async function whiteListAdd(message: Discord.Message<boolean>, args: string[]) {
  const args1 = args.shift();
  if (!args1) {
    message.reply(`Failed. You need to add whitelist address.`);
    return;
  }


  if (!message.member?.roles.cache.has(whitelist_role)) {
    message.reply("Failed. you don't have whitelisted roles");
    return;
  }

  if (message.channel.id != howtochannel) {
    message.reply("Failed. you need to execute command in certain channel");
    return;
  }

  const username = message.author.username + "#" + message.author.discriminator;
  await create_or_update_airtable(username, args1, message);

}


async function airtable_fetch(base: AirtableBase, username: string): Promise<Records<FieldSet> | undefined> {
  return new Promise((resolve, reject) => {
    base('WhiteList').select({
      filterByFormula: "{Discord Name} = '" + username + "'"
    }).firstPage((err, records: Records<FieldSet> | undefined): void => {
      if (err) {
        console.error(err);
        reject(err);
      }
      resolve(records);
    });
  });
}

async function update(base: AirtableBase, record_id: string, wallet_address: string): Promise<string> {
  return new Promise((resolve, reject) => {
    base('WhiteList').update([
      {
        "id": record_id,
        "fields": {
          "Wallet Address": wallet_address,
        }
      }
    ], (err, records): void => {
      if (err) {
        console.error(err);
        reject(err);
        return;
      }
      if (records === undefined) {
        reject("no records");
        return;
      }
      resolve(records[0].id);
    });
  });

}

async function create(base: AirtableBase, username: string, wallet_address: string): Promise<string> {
  return new Promise((resolve, reject) => {
    base('WhiteList').create([
      {
        "fields": {
          "Discord Name": username,
          "Wallet Address": wallet_address,
        }
      }
    ], (err, records): void => {
      if (err) {
        console.error(err);
        reject(err);
        return;
      }
      if (records === undefined) {
        reject("no records");
        return;
      }
      resolve(records[0].id);
    });
  });

}

async function create_or_update_airtable(username: string, wallet_address: string, message: Discord.Message<boolean>) {
  const base = new Airtable({ apiKey: process.env.AIRTABLE_KEY }).base('appRYgta1UWz57KXP');
  const result = await airtable_fetch(base, username);
  if (result && result[0]) {
    await update(base, result[0].id, wallet_address);
    message.reply(`UPDATE SUCCESS.Your name is ${username}. Your WhiteList address is ${wallet_address}`);
  } else {
    await create(base, username, wallet_address);
    message.reply(`CREATE SUCCESS.Your name is ${username}. Your WhiteList address is ${wallet_address}`);
  }

}
