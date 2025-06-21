const { EmbedBuilder } = require('discord.js');
const crypto = require('crypto');

module.exports = (client) => {
  const GUILD_ID = '1227633251208925275';
  const CHANNEL_ID = '1383385047176052849';

  let EMBED_COLOR = '#5a0164';

  const TEAM_ROLE_IDS = [
    '1383038807326195773', // Inhaber
    '1383039875200061596', // Projektleitung
    '1383006470324355153', // Stv. Projektleitung
    '1383005345315684484', // Management
    '1383388661614360606', // Teamleitung
    '1383388912441098310', // Head-Developer
    '1383389124353751170', // Developer
    '1383389323531208704', // Superadmin
  ];

  let cachedMessageId = null;
  let cachedHash = null;

  async function createTeamEmbed(guild) {
    await guild.members.fetch();

    const sortedRoles = TEAM_ROLE_IDS
      .map(id => guild.roles.cache.get(id))
      .filter(role => role)
      .sort((a, b) => b.position - a.position);

    const embed = new EmbedBuilder()
      .setTitle('🛡️ Teamliste')
      .setFooter({ text: 'Automatisch generiert', iconURL: client.user.displayAvatarURL() })
      .setTimestamp()
      .setColor(EMBED_COLOR);

    let combinedContent = '';

    for (let i = 0; i < sortedRoles.length; i++) {
      const role = sortedRoles[i];
      const members = role.members.map(m => `• <@${m.id}>`).join('\n') || '*Keine Mitglieder*';

      const fieldValue = `**<@&${role.id}>**\n${members}`;
      embed.addFields([
        { name: '\u200B', value: fieldValue, inline: false }
      ]);

      combinedContent += fieldValue;

      if (i !== sortedRoles.length - 1) {
        const separator = '─────────────────────────────';
        embed.addFields([{ name: '\u200B', value: separator, inline: false }]);
        combinedContent += separator;
      }
    }

    return { embed, combinedContent };
  }

  async function findTeamListMessage(channel) {
    if (cachedMessageId) {
      try {
        const message = await channel.messages.fetch(cachedMessageId);
        if (message && message.author.id === client.user.id) return message;
      } catch {
        cachedMessageId = null;
      }
    }

    const messages = await channel.messages.fetch({ limit: 10 });
    const found = messages.find(msg =>
      msg.author.id === client.user.id &&
      msg.embeds.length > 0 &&
      msg.embeds[0].title === '🛡️ Teamliste'
    );

    if (found) cachedMessageId = found.id;
    return found || null;
  }

  function hashString(str) {
    return crypto.createHash('md5').update(str).digest('hex');
  }

  async function updateTeamList(client) {
    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) return console.error('❌ Guild nicht gefunden');

    const channel = guild.channels.cache.get(CHANNEL_ID);
    if (!channel || !channel.isTextBased()) return console.error('❌ Channel nicht gefunden oder kein Textchannel');

    try {
      const { embed, combinedContent } = await createTeamEmbed(guild);
      const newHash = hashString(combinedContent);

      if (newHash === cachedHash) {
        console.log('ℹ️ Teamliste unverändert, kein Update notwendig');
        return;
      }

      const existingMessage = await findTeamListMessage(channel);

      if (existingMessage) {
        await existingMessage.edit({ embeds: [embed] });
        cachedMessageId = existingMessage.id;
        cachedHash = newHash;
        console.log('✅ Teamliste aktualisiert');
      } else {
        const sentMessage = await channel.send({ embeds: [embed] });
        cachedMessageId = sentMessage.id;
        cachedHash = newHash;
        console.log('✅ Teamliste gesendet');
      }
    } catch (err) {
      console.error('❌ Fehler beim Aktualisieren der Teamliste:', err);
    }
  }

  client.once('ready', () => {
    updateTeamList(client);
  });

  client.on('guildMemberUpdate', async (oldMember, newMember) => {
    const oldRoles = oldMember.roles.cache.map(r => r.id).sort();
    const newRoles = newMember.roles.cache.map(r => r.id).sort();

    const rolesChanged = oldRoles.length !== newRoles.length || oldRoles.some((roleId, i) => roleId !== newRoles[i]);

    if (rolesChanged && newMember.guild.id === GUILD_ID) {
      updateTeamList(client);
    }
  });
};
