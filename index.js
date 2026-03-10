const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Bot is running");
});

app.listen(3000, () => {
  console.log("Web server started");
});
const { Client, GatewayIntentBits } = require("discord.js");
const { QuickDB } = require("quick.db");

const db = new QuickDB();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

client.once("ready", () => {
  console.log(`🧀 치즈봇 로그인: ${client.user.tag}`);
});

client.on("messageCreate", async message => {

if (message.author.bot) return;

const id = message.author.id;
const member = message.member;

//////////////////////////////////////////////////
// 출석
//////////////////////////////////////////////////

if (message.content === "!출석") {

let last = await db.get(`daily_${id}`);
let now = Date.now();

if (last && now - last < 86400000) {
return message.reply("🧀 오늘은 이미 출석했어요!");
}

await db.set(`daily_${id}`, now);

let cheese = await db.add(`cheese_${id}`, 10);

//////////////////////////////////////////////////
// 레벨 계산
//////////////////////////////////////////////////

let level = Math.floor(cheese / 10);

//////////////////////////////////////////////////
// 레벨 역할 지급
//////////////////////////////////////////////////

const roles = {
10: "🧀꒰Lv.10꒱",
20: "🧀꒰Lv.20꒱",
30: "🧀꒰Lv.30꒱",
40: "🧀꒰Lv.40꒱",
50: "🧀꒰Lv.50꒱",
60: "🧀꒰Lv.60꒱",
70: "🧀꒰Lv.70꒱",
80: "🧀꒰Lv.80꒱",
90: "🧀꒰Lv.90꒱",
100: "🧀꒰Lv.100꒱"
};

for (const lvl in roles) {

if (level >= lvl) {

let role = message.guild.roles.cache.find(r => r.name === roles[lvl]);

if (role && !member.roles.cache.has(role.id)) {
member.roles.add(role);
}

}

}

message.reply(`🧀 출석 완료!\n치즈 +10\n현재 치즈: ${cheese}\n⭐ 레벨: ${level}`);

}

//////////////////////////////////////////////////
// 치즈 확인
//////////////////////////////////////////////////

if (message.content === "!치즈") {

let cheese = await db.get(`cheese_${id}`) || 0;
let level = Math.floor(cheese / 10);

message.reply(`🧀 치즈: ${cheese}\n⭐ 레벨: ${level}`);

}

//////////////////////////////////////////////////
// 치즈 랭킹
//////////////////////////////////////////////////

if (message.content === "!치즈랭킹") {

let users = (await db.all()).filter(data => data.id.startsWith("cheese_"));

if (users.length === 0) {
return message.channel.send("🧀 아직 치즈 가진 사람이 없어요!");
}

let ranking = users
.sort((a,b) => b.value - a.value)
.slice(0,5);

let text = "🧀 치즈 랭킹 TOP5\n\n";

for (let i = 0; i < ranking.length; i++) {

let userId = ranking[i].id.split("_")[1];
let user = await client.users.fetch(userId);

text += `${i+1}위 - ${user.username} : ${ranking[i].value}🧀\n`;

}

message.channel.send(text);

}
if (message.content === "!치즈박스") {

  if (!users[message.author.id]) {
    users[message.author.id] = { cheese: 0, level: 0 };
  }

  let rand = Math.random();
  let reward = 0;
  let text = "";

  if (rand < 0.40) {
    reward = 0;
    text = "😢 꽝... 치즈를 얻지 못했습니다.";
  } else if (rand < 0.75) {
    reward = 5;
    text = "🙂 5🧀 치즈 획득!";
  } else if (rand < 0.95) {
    reward = 20;
    text = "😲 20🧀 치즈 획득!";
  } else {
    reward = 100;
    text = "🤯 잭팟!! 100🧀 치즈 획득!!";
  }

  users[message.author.id].cheese += reward;

  message.channel.send("🎁 치즈 박스를 열었습니다!\n" + text);

  fs.writeFileSync("./users.json", JSON.stringify(users, null, 2));
}
//////////////////////////////////////////////////
// 치즈 도박
//////////////////////////////////////////////////

if (message.content.startsWith("!도박")) {

let args = message.content.split(" ");
let bet = parseInt(args[1]);

if (!bet) {
return message.reply("사용법: !도박 숫자");
}

let cheese = await db.get(`cheese_${id}`) || 0;

if (bet > cheese) {
return message.reply("🧀 치즈가 부족해요!");
}

let result = Math.random();

if (result < 0.5) {

await db.add(`cheese_${id}`, bet);

message.reply(`🎰 도박 성공!\n${bet}🧀 획득!`);

} else {

await db.subtract(`cheese_${id}`, bet);

message.reply(`💀 도박 실패!\n${bet}🧀 잃음`);

}

}
});


client.login(process.env.TOKEN);


