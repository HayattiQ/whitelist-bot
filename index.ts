import Discord from "discord.js";
import Airtable, { FieldSet } from 'airtable';
import { AirtableBase } from "airtable/lib/airtable_base";
import { Records } from "airtable/lib/records";
const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES"] });
require('dotenv').config()

client.login(process.env.BOT_TOKEN);
const prefix = "!";

enum LIST_TYPE {
  WHIETLIST, // 0
  KGF // 1
}


client.on("messageCreate", function (message) {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const commandBody: string = message.content.slice(prefix.length);
  const args: string[] = commandBody.split(' ');
  const command: string = args.shift()?.toLowerCase() ?? "";

  if (command === "whitelist") {
    whiteListAdd(message, args, LIST_TYPE.WHIETLIST);
  } else if (command === "checkwhitelist") {
    checkWhiteList(message, LIST_TYPE.WHIETLIST);
  } else if (command === "checkkgf") {
    checkWhiteList(message, LIST_TYPE.KGF);
  } else if (command === "kgf") {
    whiteListAdd(message, args, LIST_TYPE.KGF);
  }

});

async function checkWhiteList(message: Discord.Message<boolean>, type: LIST_TYPE) {
  const username = message.author.username + "#" + message.author.discriminator;
  const base = new Airtable({ apiKey: process.env.AIRTABLE_KEY }).base('appRYgta1UWz57KXP');
  let airtable_tablename, channel;

  if (type == LIST_TYPE.WHIETLIST) {
    airtable_tablename = process.env.WHITELIST_AIRTABLE_TABLE!;
    channel = process.env.WHITELIST_CHANNEL;
  } else if (type == LIST_TYPE.KGF) {
    airtable_tablename = process.env.KGF_AIRTABLE_TABLE!;
    channel = process.env.KGF_CHANNEL;
  } else {
    throw new Error();
  }

  if (message.channel.id != channel) {
    return;
  }

  const result = await airtable_fetch(base, username, airtable_tablename);


  if (result === undefined || result[0] === undefined) {
    message.reply("You don't regist WhiteList Address yet.");
    return;
  }
  const wallet_address = result[0].fields["Wallet Address"] as string;
  message.reply("Your Wallet Address = " + wallet_address);
}

async function whiteListAdd(message: Discord.Message<boolean>, args: string[], type: LIST_TYPE) {
  const args1 = args.shift();

  let channel, role;

  if (type == LIST_TYPE.WHIETLIST) {
    channel = process.env.WHITELIST_CHANNEL;
    role = process.env.WHITELIST_ROLE!;
  } else if (type == LIST_TYPE.KGF) {
    channel = process.env.KGF_CHANNEL;
    role = process.env.KGF_ROLE!;
  } else {
    throw new Error();
  }

  if (message.channel.id != channel) {
    return;
  }

  if (!args1) {
    message.reply(`Failed. You need to add whitelist address.`);
    return;
  }


  if (!message.member?.roles.cache.has(role)) {
    message.reply("Failed. you don't have whitelisted roles");
    return;
  }


  const username = message.author.username + "#" + message.author.discriminator;
  if (type == LIST_TYPE.WHIETLIST) {
    await create_or_update_whitelist(username, args1, message);
  } else if (type === LIST_TYPE.KGF) {
    await create_or_update_kgf(username, args1, message);
  } else {
    throw new Error();
  }

}


async function airtable_fetch(base: AirtableBase, username: string, airtable_table_name: string): Promise<Records<FieldSet> | undefined> {
  return new Promise((resolve, reject) => {
    base(airtable_table_name).select({
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

async function update(base: AirtableBase, record_id: string, wallet_address: string, airtable_table_name: string): Promise<string> {
  return new Promise((resolve, reject) => {
    base(airtable_table_name).update([
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

async function create(base: AirtableBase, username: string, wallet_address: string, airtable_table_name: string): Promise<string> {
  return new Promise((resolve, reject) => {
    base(airtable_table_name).create([
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

async function create_or_update_whitelist(username: string, wallet_address: string, message: Discord.Message<boolean>) {
  const base = new Airtable({ apiKey: process.env.AIRTABLE_KEY }).base('appRYgta1UWz57KXP');
  const result = await airtable_fetch(base, username, process.env.WHITELIST_AIRTABLE_TABLE!);
  if (result && result[0]) {
    await update(base, result[0].id, wallet_address, process.env.WHITELIST_AIRTABLE_TABLE!);
    message.reply(`UPDATE SUCCESS.Your name is ${username}. Your WhiteList address is ${wallet_address}`);
  } else {
    await create(base, username, wallet_address, process.env.WHITELIST_AIRTABLE_TABLE!);
    message.reply(`CREATE SUCCESS.Your name is ${username}. Your WhiteList address is ${wallet_address}`);
  }

}

async function create_or_update_kgf(username: string, wallet_address: string, message: Discord.Message<boolean>) {
  const base = new Airtable({ apiKey: process.env.AIRTABLE_KEY }).base('appRYgta1UWz57KXP');
  const result = await airtable_fetch(base, username, process.env.KGF_AIRTABLE_TABLE!);
  if (result && result[0]) {
    await update(base, result[0].id, wallet_address, process.env.KGF_AIRTABLE_TABLE!);
    message.reply(`UPDATE SUCCESS(KGF).Your name is ${username}. Your WhiteList address is ${wallet_address}`);
  } else {
    await create(base, username, wallet_address, process.env.KGF_AIRTABLE_TABLE!);
    message.reply(`CREATE SUCCESS(KGF).Your name is ${username}. Your WhiteList address is ${wallet_address}`);
  }

}