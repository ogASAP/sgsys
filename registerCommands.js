const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const commands = [];
const commandsPath = path.join(__dirname, 'commands');

if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
  console.error('❌ DISCORD_TOKEN oder CLIENT_ID fehlt in der .env Datei!');
  process.exit(1);
}

if (!fs.existsSync(commandsPath)) {
  console.error(`❌ Befehlsordner existiert nicht: ${commandsPath}`);
  process.exit(1);
}

const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  try {
    const command = require(path.join(commandsPath, file));
    if (!command.data || !command.data.toJSON) {
      console.warn(`⚠️ Command-Datei ${file} hat kein gültiges "data.toJSON" Objekt.`);
      continue;
    }
    commands.push(command.data.toJSON());
  } catch (error) {
    console.error(`❌ Fehler beim Laden des Commands ${file}:`, error);
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    const scope = process.env.REGISTER_SCOPE === 'guild' ? 'guild' : 'global';

    console.log(`🧹 Lösche alte ${scope === 'guild' ? 'Guild' : 'Global'}-Commands...`);

    let existingCommands = [];

    if (scope === 'guild') {
      if (!process.env.GUILD_ID) {
        console.error('❌ GUILD_ID fehlt in der .env Datei!');
        process.exit(1);
      }

      existingCommands = await rest.get(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
      );

      for (const cmd of existingCommands) {
        await rest.delete(
          Routes.applicationGuildCommand(process.env.CLIENT_ID, process.env.GUILD_ID, cmd.id)
        );
      }

      console.log('✅ Alte Guild-Commands gelöscht.');
      console.log(`🔄 Registriere ${commands.length} Guild-Commands...`);

      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands }
      );
    } else {
      existingCommands = await rest.get(
        Routes.applicationCommands(process.env.CLIENT_ID)
      );

      for (const cmd of existingCommands) {
        await rest.delete(
          Routes.applicationCommand(process.env.CLIENT_ID, cmd.id)
        );
      }

      console.log('✅ Alte Global-Commands gelöscht.');
      console.log(`🔄 Registriere ${commands.length} Global-Commands...`);

      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands }
      );
    }

    console.log('✅ Neue Commands erfolgreich registriert!');
  } catch (error) {
    console.error('❌ Fehler bei der Command-Registrierung:', error);
  }
})();
