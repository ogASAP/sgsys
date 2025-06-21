const { EmbedBuilder, AuditLogEvent } = require('discord.js');

module.exports = (client, { roleLogChannelId }) => {
  if (!roleLogChannelId) throw new Error('roleLogChannelId muss definiert sein');

  client.on('guildMemberUpdate', async (oldMember, newMember) => {
    const oldRoles = oldMember.roles.cache.map(r => r.id);
    const newRoles = newMember.roles.cache.map(r => r.id);

    const addedRoles = newRoles.filter(r => !oldRoles.includes(r));
    const removedRoles = oldRoles.filter(r => !newRoles.includes(r));

    if (addedRoles.length === 0 && removedRoles.length === 0) return;

    const logChannel = newMember.guild.channels.cache.get(roleLogChannelId);
    if (!logChannel) {
      console.warn(`⚠️ Rollen-Log Channel ${roleLogChannelId} nicht gefunden in ${newMember.guild.name}`);
      return;
    }

    let auditLogs;
    try {
      auditLogs = await newMember.guild.fetchAuditLogs({
        limit: 5,
        type: AuditLogEvent.MemberRoleUpdate,
      });
    } catch (error) {
      console.error('Fehler beim Abrufen der Audit-Logs:', error);
      return;
    }

    const roleChangeLog = auditLogs.entries.find(entry =>
      entry.target.id === newMember.id &&
      (Date.now() - entry.createdTimestamp) < 5000
    );

    const executorName = roleChangeLog?.executor?.username || 'Unbekannt';
    const executorFakePing = '@' + executorName;
    const targetFakePing = '@' + newMember.user.username;

    const roleNamesAdded = addedRoles.map(rid => {
      const role = newMember.guild.roles.cache.get(rid);
      return role ? '@' + role.name : '@Unbekannte Rolle';
    });

    const roleNamesRemoved = removedRoles.map(rid => {
      const role = oldMember.guild.roles.cache.get(rid);
      return role ? '@' + role.name : '@Unbekannte Rolle';
    });

    const separator = '─────────────';

    const embed = new EmbedBuilder()
      .setTitle('Rangveränderung')
      .setColor(addedRoles.length ? 'Green' : 'Red')
      .setTimestamp()
      .setFooter({ text: 'Role Logger • by DeinBot' })
      .addFields(
        { name: 'Von:', value: executorFakePing },
        { name: separator, value: '\u200B' },
        { name: 'Wem:', value: targetFakePing }
      );

    if (addedRoles.length) {
      embed.addFields(
        { name: separator, value: '\u200B' },
        { name: 'Neue Rolle(n):', value: roleNamesAdded.join('\n') || '@Keine' }
      );
    }

    if (removedRoles.length) {
      embed.addFields(
        { name: separator, value: '\u200B' },
        { name: 'Entfernte Rolle(n):', value: roleNamesRemoved.join('\n') || '@Keine' }
      );
    }

    logChannel.send({ embeds: [embed] });
  });
};
