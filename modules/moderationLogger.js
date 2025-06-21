const { EmbedBuilder } = require('discord.js');

module.exports = (client, { moderationLogChannelId }) => {
  if (!moderationLogChannelId) {
    throw new Error('moderationLogChannelId fehlt!');
  }

  const FOOTER_TEXT = 'Moderations-Log • Schutzgeld | System';
  const FOOTER_ICON = 'https://i.postimg.cc/fWjh0xhh/sg2.gif';

  async function sendLog(embed) {
    const channel = await client.channels.fetch(moderationLogChannelId).catch(() => null);
    if (!channel) {
      console.warn(`⚠️ Log-Channel ${moderationLogChannelId} konnte nicht gefunden werden.`);
      return;
    }

    embed.setFooter({ text: FOOTER_TEXT, iconURL: FOOTER_ICON });
    embed.setTimestamp();
    channel.send({ embeds: [embed] });
  }

  // Clear-Event
  client.on('clear', async ({ user, channel, amount }) => {
    const embed = new EmbedBuilder()
      .setTitle('**Clear-Log**')
      .setColor('#70407b')
      .addFields({
        name: '\u200b',
        value:
          `**Wer:** <@${user.id}>\n` +
          '─────────────\n' +
          `**Gelöschte Nachrichten:** ${amount}\n` +
          '─────────────\n' +
          `**Channel:** <#${channel.id}>`
      });

    sendLog(embed);
  });
};
