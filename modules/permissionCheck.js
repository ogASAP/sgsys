module.exports = (client) => {
  const GUILD_ID = '1227633251208925275';

  client.on('ready', async () => {
    console.log(``);

    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) {
      console.error(`❌ Guild mit ID ${GUILD_ID} nicht gefunden!`);
      return;
    }

    try {
      const me = guild.members.me;
      if (!me) {
        console.log(`⚠️ Bot ist kein Mitglied in: ${guild.name}`);
        return;
      }

      console.log(`\n🔍 Berechtigungen in Server: ${guild.name}`);

      const perms = me.permissions;

      console.log(`- Administrator: ${perms.has('Administrator')}`);
      console.log(`- Rollen verwalten: ${perms.has('ManageRoles')}`);
      console.log(`- Mitglieder verwalten: ${perms.has('ManageGuild') || perms.has('ManageRoles')}`);
      console.log(`- Nachrichten verwalten: ${perms.has('ManageMessages')}`);
      console.log(`- Nachrichten lesen: ${perms.has('ViewChannel')}`);
      console.log(`- Reaktionen verwalten: ${perms.has('AddReactions')}`);

      const botRolePosition = me.roles.highest.position;

      guild.roles.cache.forEach(role => {
        const above = botRolePosition > role.position ? '✅' : '❌';
        console.log(`  Rolle "${role.name}" (${role.id}): Bot höher? ${above}`);
      });
    } catch (err) {
      console.error(`Fehler beim Prüfen von ${guild.name}:`, err);
    }
  });

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.guild?.id !== GUILD_ID) return;

    const me = interaction.guild.members.me;
    if (!me.permissions.has('ManageRoles')) {
      return interaction.reply({ content: '⚠️ Mir fehlt die Berechtigung "Rollen verwalten".', ephemeral: true });
    }
  });
};
