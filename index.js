const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');
require('dotenv').config();

// 🔒 Check env vars
if (!process.env.DISCORD_TOKEN || !process.env.CHANNEL_ID) {
  console.error("❌ Missing DISCORD_TOKEN or CHANNEL_ID in .env");
  process.exit(1);
}

console.log("▶️ Starting Snowliner Bot");
console.log("CHANNEL_ID:", process.env.CHANNEL_ID);

// 🧱 Crash logging
process.on('unhandledRejection', (reason) => {
  console.error('[Unhandled Rejection]', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err);
});

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const RANK_ORDER = [
  "Mr. Wilhelm",
  "Head Administrator",
  "Moderator",
  "Developement Engineer",
  "Hospitality Department",
  "Security Forces",
  "Brakemen Department",
  "Sector Worker",
  "1st Class Passanger",
  "2nd Class Passanger",
  "3rd Class Passanger",
  "Tail Class Passangers"
];

const RANK_ICONS = {
  "Mr. Wilhelm": "👑",
  "Head Administrator": "🧠",
  "Moderator": "🔧",
  "Security Forces": "🛡️",
  "Brakemen Department": "🚨",
  "Developement Engineer": "🛠️",
  "Hospitality Department": "🍽️",
  "Sector Worker": "🔩",
  "1st Class Passanger": "💎",
  "2nd Class Passanger": "👜",
  "3rd Class Passanger": "🎒",
  "Tail Class Passangers": "🥀"
};

let messageId = null;

// 🔁 Fetch team data from backend
const fetchTeamData = async () => {
  try {
    const res = await fetch('https://snowliner-automated-systems-team-count.up.railway.app/team-counts');
    const data = await res.json();
    return data.teams || {};
  } catch (err) {
    console.error("⚠️ Failed to fetch team data:", err);
    return {};
  }
};

// 🧱 Create embed layout
const createEmbed = (teams) => {
  const embed = new EmbedBuilder()
    .setColor('#0D3F53')
    .setTitle('🚄 **Live Team Roster**')
    .setFooter({ text: `Last updated: ${new Date().toLocaleTimeString()}` });

  const totalPlayers = Object.values(teams).reduce((sum, members) => sum + members.length, 0);

  embed.addFields({
    name: '👥 Total Players Online',
    value: totalPlayers.toString(),
    inline: false
  });

  RANK_ORDER.forEach(rank => {
    const members = teams[rank] || [];
    const icon = RANK_ICONS[rank] || '•';
    const value = members.length > 0
      ? members.map(name => `\`${name}\``).join(', ')
      : 'None online';

    embed.addFields({
      name: `${icon} ${rank} (${members.length})`,
      value,
      inline: false
    });
  });

  return embed;
};

// 🚀 On bot ready
client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  let channel;
  try {
    channel = await client.channels.fetch(process.env.CHANNEL_ID);
  } catch (err) {
    console.error('❌ Failed to fetch channel. Make sure the bot has access.', err);
    process.exit(1);
  }

  const updateEmbed = async () => {
    const teams = await fetchTeamData();
    const embed = createEmbed(teams);

    try {
      if (!messageId) {
        const msg = await channel.send({ embeds: [embed] });
        messageId = msg.id;
      } else {
        const msg = await channel.messages.fetch(messageId);
        await msg.edit({ embeds: [embed] });
      }
    } catch (err) {
      console.error('❌ Embed update failed:', err);
    }
  };

  await updateEmbed();             // initial run
  setInterval(updateEmbed, 30000); // every 30s
});

// 🔐 Login the bot
client.login(process.env.DISCORD_TOKEN);
