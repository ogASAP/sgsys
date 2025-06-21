const { EmbedBuilder } = require('discord.js');

module.exports = (client) => {
  const userMessages = new Map();

  client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;

    const now = Date.now();
    const timestamps = userMessages.get(message.author.id) || [];

    const filtered = timestamps.filter(ts => now - ts < 3000);
    filtered.push(now);
    userMessages.set(message.author.id, filtered);

    if (filtered.length > 5) {

      await message.channel.bulkDelete(filtered.length, true).catch(() => {});


      const member = message.guild.members.cache.get(message.author.id);
      if (member && member.moderatable) {
        try {
          await member.timeout(60 * 1000, 'Spam - Automatischer Timeout');
        } catch {}
      }

      const embed = new EmbedBuilder()
        .setColor('#ED4245')
        .setTitle('🚨 Spam erkannt')
        .setDescription(`<@${message.author.id}> wurde wegen Spam für 1 Minute gemuted.`)
        .setFooter({ text: 'Anti-Spam System', iconURL: client.user.displayAvatarURL() })
        .setTimestamp();

      const logChannel = client.channels.cache.get(process.env.LOG_CHANNEL_ID);
      if (logChannel) logChannel.send({ embeds: [embed] });
    }
  });
};
