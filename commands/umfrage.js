const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} = require('discord.js');

const EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('umfrage')
    .setDescription('Erstellt eine Umfrage mit Buttons und automatischer Auswertung.')
    .addStringOption(option =>
      option.setName('frage')
        .setDescription('Die Frage für die Umfrage')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('optionen')
        .setDescription('Antworten, getrennt mit Kommas (z.B.: Ja, Nein, Vielleicht)')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('dauer')
        .setDescription('Dauer der Umfrage in Sekunden (min. 10, max. 600)')
        .setMinValue(10)
        .setMaxValue(600)
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const frage = interaction.options.getString('frage');
    const optionen = interaction.options.getString('optionen').split(',').map(opt => opt.trim()).filter(Boolean);
    const dauer = interaction.options.getInteger('dauer');

    if (optionen.length < 2 || optionen.length > 10) {
      return interaction.reply({
        content: '❗ Bitte gib zwischen 2 und 10 Antwortmöglichkeiten ein.',
        ephemeral: true,
      });
    }

    // Buttons bauen
    const buttons = new ActionRowBuilder();
    for (let i = 0; i < optionen.length; i++) {
      buttons.addComponents(
        new ButtonBuilder()
          .setCustomId(`vote_${i}`)
          .setLabel(`${EMOJIS[i]} ${optionen[i]}`)
          .setStyle(ButtonStyle.Primary)
          .setEmoji(EMOJIS[i])
      );
    }

    const embed = new EmbedBuilder()
      .setTitle('📊 Neue Umfrage')
      .setDescription(`**${frage}**\n\nBitte stimme durch Klicken eines Buttons ab.`)
      .setColor('#5865F2')
      .setAuthor({
        name: `Umfrage gestartet von ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setThumbnail('https://cdn-icons-png.flaticon.com/512/1380/1380338.png')
      .setFooter({
        text: `⏳ Laufzeit: ${dauer} Sekunden • Schutzgeld | System`,
        iconURL: 'https://i.postimg.cc/KYQkGHWQ/standard.gif',
      })
      .setTimestamp();

    const msg = await interaction.reply({ embeds: [embed], components: [buttons], fetchReply: true });

    const votes = new Map();

    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: dauer * 1000,
    });

    collector.on('collect', async i => {
      const voteIndex = parseInt(i.customId.split('_')[1]);

      votes.set(i.user.id, voteIndex);

      await i.reply({ content: `✅ Du hast für **${optionen[voteIndex]}** gestimmt.`, ephemeral: true });
    });

    collector.on('end', async () => {
      const results = Array(optionen.length).fill(0);
      for (const vote of votes.values()) {
        results[vote]++;
      }

      const maxVotes = Math.max(...results);
      const winners = results
        .map((count, i) => ({ index: i, count }))
        .filter(r => r.count === maxVotes && maxVotes > 0);

      const totalVotes = results.reduce((a, b) => a + b, 0);
      const maxBarLength = 20;

      const ergebnisText = results.map((count, i) => {
        const barLength = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * maxBarLength);
        const bar = '▰'.repeat(barLength) + '▱'.repeat(maxBarLength - barLength);
        return `${EMOJIS[i]} **${optionen[i]}**\n${bar} ${count} Stimme${count !== 1 ? 'n' : ''}`;
      }).join('\n\n');

      const resultEmbed = new EmbedBuilder()
        .setTitle('📋 Umfrage beendet')
        .setDescription(`**${frage}**\n\n${ergebnisText}`)
        .setColor('#43b581')
        .setAuthor({
          name: `Umfrage von ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setFooter({
          text: `Auswertung • SchutzgeldSecurity`,
          iconURL: 'https://i.postimg.cc/KYQkGHWQ/standard.gif',
        })
        .setTimestamp();

      if (winners.length === 1) {
        resultEmbed.addFields({
          name: '🏆 Gewinner',
          value: `${EMOJIS[winners[0].index]} **${optionen[winners[0].index]}** mit **${winners[0].count} Stimmen**`,
        });
      } else if (winners.length > 1) {
        resultEmbed.addFields({
          name: '🤝 Gleichstand',
          value: winners.map(w => `${EMOJIS[w.index]} **${optionen[w.index]}** mit **${w.count} Stimmen**`).join(', '),
        });
      } else {
        resultEmbed.addFields({
          name: '😶 Kein Ergebnis',
          value: 'Niemand hat abgestimmt.',
        });
      }

      const disabledRow = new ActionRowBuilder().addComponents(
        buttons.components.map(btn => btn.setDisabled(true))
      );

      await msg.edit({ embeds: [resultEmbed], components: [disabledRow] });
    });
  },
};
