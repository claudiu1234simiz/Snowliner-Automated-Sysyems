const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');
require('dotenv').config();

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

const fetchTeamData = async () => {
  const res = await fetch('https://snowliner-automated-systems-team-count.up.railway.app/team-counts');
  const data = await res.json();
  return data.teams || {};
};

const createEmbed = (teams) => {
  const embed = new EmbedBuilder()
    .setColor('#0D3F53')
    .setTitle('# 🚄 Live Team Roster')
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

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const channel = await client.channels.fetch(process.env.CHANNEL_ID);

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

  await updateEmbed(); // first push
  setInterval(updateEmbed, 60000); // every 60s
});

client.login(process.env.DISCORD_TOKEN);
