const { EmbedBuilder } = require('discord.js');

module.exports = (client) => {
  client.on('ready', async () => {
    const channelId = '1383008662800302140';
    try {
      const channel = await client.channels.fetch(channelId);
      if (!channel || !channel.isTextBased()) {
        console.error('❌ Channel nicht gefunden oder kein Textkanal.');
        return;
      }

      const embed = new EmbedBuilder()
        .setColor('#000000')
        .setTitle('📃 Regelwerk')
        .setDescription('Bitte halte dich an folgende Regeln sonst Schutzgeld!')
        .addFields(
          { name: '§ 1: Umgang', value: 'Ein freundlicher und respektvoller Umgang ist jederzeit Pflicht', inline: false },
          { name: '§ 2: Pingen', value: 'Das grundlose Taggen/Pingen/Markieren von Nutzern & Benutzerrängen ist untersagt!', inline: false },
          { name: '§ 3: Leaking', value: 'Das Teilen/Leaken von personenbezogenen Daten oder Dateien ist verboten!', inline: false },
          { name: '§ 4: Spam', value: 'Spamming jeglicher Form ist in sämtlichen Textchannels verboten!', inline: false },
          { name: '§ 6: Beleidigungen', value: 'Jegliche Beleidigungen und Provokation sind zu unterlassen, außer Totenbeleidigung (gern gesehen)', inline: false },
          { name: '§ 7: IP-Logger und Viren', value: 'Das Verwenden von IP-Loggern und Viren ist verboten!', inline: false },
          { name: 'Hinweis', value: 'Verstöße können zum Ausschluss führen.', inline: false }
        )
        .setImage('https://i.postimg.cc/fWjh0xhh/sg2.gif')
        .setFooter({ text: 'Automatischer Embed vom BOSS ASAP', iconURL: client.user.displayAvatarURL() })
        .setTimestamp();

      const messages = await channel.messages.fetch({ limit: 20 });
      const existing = messages.find(msg =>
        msg.author.id === client.user.id &&
        msg.embeds.length > 0 &&
        msg.embeds[0].title === embed.data.title
      );

      if (existing) {
        const current = existing.embeds[0];

        const embedChanged =
          current.description !== embed.data.description ||
          current.color !== embed.data.color ||
          JSON.stringify(current.fields) !== JSON.stringify(embed.data.fields) ||
          current.image?.url !== embed.data.image.url;

        if (embedChanged) {
          await existing.edit({ embeds: [embed] });
          console.log('✅ Regelwerk-Embed wurde aktualisiert.');
        } else {
          console.log('ℹ️ Regelwerk-Embed ist aktuell – keine Aktion nötig.');
        }
      } else {
        await channel.send({ embeds: [embed] });
        console.log('✅ Regelwerk-Embed wurde neu gesendet.');
      }

    } catch (err) {
      console.error('❌ Fehler beim Regelwerk-Embed:', err);
    }
  });
};
