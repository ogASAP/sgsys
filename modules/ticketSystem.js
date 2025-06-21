const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionsBitField,
  ChannelType,
  StringSelectMenuBuilder,
} = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = (client) => {
  client.on('ready', async () => {
    console.log('🎟️ Ticket-System bereit!');

    const ticketChannelId = process.env.TICKET_CHANNEL_ID;
    if (!ticketChannelId) {
      console.warn('Kein Ticket-Channel in der .env angegeben.');
      return;
    }

    const ticketChannel = await client.channels.fetch(ticketChannelId).catch(() => null);
    if (!ticketChannel) {
      console.warn('Ticket-Channel nicht gefunden oder Zugriff verweigert.');
      return;
    }

    const fetchedMessages = await ticketChannel.messages.fetch({ limit: 20 });
    const existingTicketMsg = fetchedMessages.find(msg =>
      msg.components.some(row =>
        row.components.some(component => component.customId === 'ticket_reason')
      )
    );
    if (!existingTicketMsg) {
      const reasonSelectMenu = new StringSelectMenuBuilder()
        .setCustomId('ticket_reason')
        .setPlaceholder('Wähle einen Grund für dein Ticket')
        .addOptions([
          { label: 'Allgemein', value: 'allgemein', emoji: '▫️' },
          { label: 'SCHUTZGELD', value: 'alaoui', emoji: '▫️' },
          { label: 'Beschwerde', value: 'beschwerde', emoji: '▫️' },
        ]);
      const rowSelect = new ActionRowBuilder().addComponents(reasonSelectMenu);

      const user = await client.users.fetch('1111004945450283068');

      const now = new Date();
      const dateTimeString = now.toLocaleString('de-DE', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      });

      const embed = new EmbedBuilder()
        .setColor('#5a0164')
        .setTitle('📩 Support Ticket System')
        .setDescription(
          'Bitte wähle unten den Grund für dein Ticket aus.\n' +
          'Unser Team wird sich in Kürze bei dir melden.\n\n' +
          '**• Allgemein - Fragen oder ähnliches**\n' +
          '**• Schutzgeld - Werde ein strammer Schutzgeld eintreiber**\n' +
          '**• Beschwerde - Melde einen PIC**'
        )
        .setImage('https://i.postimg.cc/fWjh0xhh/sg2.gif')
        .setFooter({
          text: `Ticket-System | ${user.tag} | ${dateTimeString}`,
          iconURL: user.displayAvatarURL({ extension: 'png', size: 64 }),
        })
        .setTimestamp();

      await ticketChannel.send({ embeds: [embed], components: [rowSelect] });
    }
  });

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isStringSelectMenu() && !interaction.isButton()) return;

    const { customId, guild, user, channel } = interaction;
    if (!guild) return;

    async function createTicket(reason = 'Kein Grund angegeben') {
      const sanitizedUsername = user.username.toLowerCase().replace(/[^a-z0-9]/g, '');
      const ticketName = `ticket-${sanitizedUsername}-${user.discriminator}`;

      if (guild.channels.cache.some(c => c.name === ticketName)) {
        return interaction.reply({
          content: '❌ Du hast bereits ein offenes Ticket!',
          flags: 64,
        });
      }

      const category = guild.channels.cache.find(
        c => c.name.toLowerCase() === 'tickets' && c.type === ChannelType.GuildCategory
      );

      const ticketChannel = await guild.channels.create({
        name: ticketName,
        type: ChannelType.GuildText,
        parent: category ? category.id : undefined,
        permissionOverwrites: [
          {
            id: guild.roles.everyone,
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory,
            ],
          },
        ],
      });

      const closeTicketButton = new ButtonBuilder()
        .setCustomId('ticket_close')
        .setLabel('🔒 Ticket schließen')
        .setStyle(ButtonStyle.Danger);

      const closeRow = new ActionRowBuilder().addComponents(closeTicketButton);

      const ticketEmbed = new EmbedBuilder()
        .setColor('#5a0164')
        .setTitle(`🧾 Ticket erstellt – ${user.username}`)
        .setDescription(
          `👋 **Hey <@${user.id}>!**\n\n` +
          `🔎 **Grund:** \`${reason}\`\n\n` +
          `📨 Bitte beschreibe dein Anliegen so genau wie möglich, damit wir dir effizient helfen können.\n` +
          `Ein Teammitglied wird sich **bald bei dir melden**. Danke für deine Geduld! 🙏`
        )
        .setThumbnail(user.displayAvatarURL({ extension: 'png', size: 128 }))
        .setFooter({
          text: '📬 Support-Team – Wir sind für dich da',
          iconURL: client.user.displayAvatarURL({ extension: 'png', size: 64 }),
        })
        .setTimestamp();

      await ticketChannel.send({
        content: `<@${user.id}>`,
        embeds: [ticketEmbed],
        components: [closeRow],
      });

      return interaction.reply({
        content: `✅ Dein Ticket wurde erstellt: ${ticketChannel}`,
        flags: 64,
      });
    }

    if (customId === 'ticket_reason' && interaction.isStringSelectMenu()) {
      const selectedReason = interaction.values[0];

      const reasonMap = {
        allgemein: 'Allgemein',
        alaoui: 'ALAOUI',
        beschwerde: 'Beschwerde',
      };
      const reasonText = reasonMap[selectedReason] || 'Kein Grund angegeben';

      await createTicket(reasonText);
    }

if (customId === 'ticket_close') {
  if (!channel || !channel.name.startsWith('ticket-')) {
    return interaction.reply({
      content: '❌ Dies ist kein Ticket-Kanal.',
      flags: 64,
    });
  }

  await interaction.reply({
    content: '🔒 Ticket wird in 5 Sekunden geschlossen...',
    flags: 64,
  });

  setTimeout(async () => {
    try {
      await channel.delete();
    } catch (error) {
      console.error('Fehler beim Schließen des Tickets:', error);
    }
  }, 5000); // 5000 ms = 5 Sekunden
}
  });
}; 