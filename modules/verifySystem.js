const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = (client) => {
  client.on('ready', async () => {
    const channelId = '1383008650989404338';
    const roleId = '1383003364115087463';

    try {
      const channel = await client.channels.fetch(channelId);
      const guild = channel.guild;

      if (!channel || !channel.isTextBased()) {
        console.error('❌ Verifizierungskanal nicht gefunden oder ungültig.');
        return;
      }

      const embed = new EmbedBuilder()
        .setColor('#000000')
        .setTitle('🔐 Verifizierung erforderlich')
        .setDescription('Um Zugriff auf den Server zu erhalten, musst du dich verifizieren.\n\nKlicke einfach auf den Button unten und du bekommst automatisch deine Rolle.')
        .setFooter({
          text: `${client.user.username} • Verifizierungssystem`,
        })
        .setImage('https://i.postimg.cc/fWjh0xhh/sg2.gif')
        .setTimestamp();

      const button = new ButtonBuilder()
        .setCustomId('verify-button')
        .setLabel('✅ Jetzt verifizieren')
        .setStyle(ButtonStyle.Success);

      const row = new ActionRowBuilder().addComponents(button);

      const messages = await channel.messages.fetch({ limit: 20 });
      const existing = messages.find(msg =>
        msg.author.id === client.user.id &&
        msg.embeds.length > 0 &&
        msg.embeds[0].title === embed.data.title &&
        msg.components.length > 0 &&
        msg.components[0].components[0]?.customId === 'verify-button'
      );

      if (existing) {
        await existing.edit({ embeds: [embed], components: [row] });
        console.log('✅ Verifizierungsnachricht wurde aktualisiert.');
      } else {
        await channel.send({ embeds: [embed], components: [row] });
        console.log('✅ Verifizierungsnachricht wurde neu gesendet.');
      }

    } catch (err) {
      console.error('❌ Fehler im Verifizierungssystem:', err);
    }

    client.on('interactionCreate', async (interaction) => {
      if (!interaction.isButton()) return;
      if (interaction.customId === 'verify-button') {
        try {
          const role = interaction.guild.roles.cache.get(roleId);
          const member = interaction.guild.members.cache.get(interaction.user.id);
          if (!role || !member) return;

          if (!member.roles.cache.has(role.id)) {
            await member.roles.add(role);
            await interaction.reply({ content: '✅ Du wurdest erfolgreich verifiziert!', ephemeral: true });
          } else {
            await interaction.reply({ content: '⚠️ Du bist bereits verifiziert.', ephemeral: true });
          }
        } catch (err) {
          console.error('❌ Fehler bei der Verifizierung:', err);
          await interaction.reply({ content: '❌ Fehler bei der Verifizierung.', ephemeral: true });
        }
      }
    });
  });
};
