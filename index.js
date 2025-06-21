require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.commands = new Collection();

const loadModule = (name, fn, options = {}) => {
  try {
    fn(client, options);
    console.log(`✅ Modul geladen: ${name}`);
  } catch (error) {
    console.error(`❌ Fehler beim Laden von Modul "${name}":`, error);
  }
};

const loadCommands = (commandsPath) => {
  if (!fs.existsSync(commandsPath)) {
    console.warn(`⚠️ Befehlsordner nicht gefunden: ${commandsPath}`);
    return [];
  }

  const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
  const commands = [];

  for (const file of commandFiles) {
    try {
      const command = require(path.join(commandsPath, file));
      if (!command.data?.name || !command.execute) {
        console.warn(`⚠️ Command in ${file} fehlt "data.name" oder "execute"`);
        continue;
      }
      client.commands.set(command.data.name, command);
      commands.push(command.data.toJSON());
      console.log(`✅ Command geladen: ${command.data.name}`);
    } catch (error) {
      console.error(`❌ Fehler beim Laden des Commands ${file}:`, error);
    }
  }
  return commands;
};

client.once('ready', () => {
  console.log(`🤖 Bot ist online als ${client.user.tag}`);

  loadCommands(path.join(__dirname, 'commands'));

  loadModule('Rollen-Logger', require('./modules/rolesLogger'), {
    guildId: process.env.GUILD_ID,
    roleLogChannelId: process.env.ROLE_LOG_CHANNEL_ID,
  });

  loadModule('Moderations-Logger', require('./modules/moderationLogger'), {
    guildId: process.env.GUILD_ID,
    moderationLogChannelId: process.env.MODERATION_LOG_CHANNEL_ID,
  });
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    return interaction.reply({ content: 'Unbekannter Command', ephemeral: true });
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error('❌ Fehler beim Ausführen des Commands:', error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'Es gab einen Fehler beim Ausführen des Commands.', ephemeral: true });
    } else {
      await interaction.reply({ content: 'Es gab einen Fehler beim Ausführen des Commands.', ephemeral: true });
    }
  }
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Promise Rejection:', error);
});
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

// Bot starten
(async () => {
  if (!process.env.DISCORD_TOKEN) {
    console.error('❌ DISCORD_TOKEN fehlt in der .env Datei!');
    process.exit(1);
  }
  if (!process.env.CLIENT_ID) {
    console.error('❌ CLIENT_ID fehlt in der .env Datei!');
    process.exit(1);
  }

  try {
    await client.login(process.env.DISCORD_TOKEN);
  } catch (err) {
    console.error('❌ Login fehlgeschlagen:', err);
    process.exit(1);
  }

  loadModule('RechteAbfrage', require('./modules/permissionCheck'));
  loadModule('Verifizierung', require('./modules/verifySystem'));
  loadModule('Ticket-System', require('./modules/ticketSystem'));
  loadModule('Anti-Spam', require('./modules/antiSpam'));
  loadModule('Embed-Nachricht', require('./modules/regelwerk'));
  loadModule('Badwords', require('./modules/badwordFilter'));
  loadModule('Teamlist', require('./modules/teamList'));
})();
