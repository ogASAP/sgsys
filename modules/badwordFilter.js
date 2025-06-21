const badWords = ['hure', 'scheiße', 'hurensohn', 'nazi', 'fick', 'idiot']; // beliebig erweitern

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const content = message.content.toLowerCase();
    const found = badWords.find(word => content.includes(word));

    if (found) {
      await message.delete().catch(() => {});
      await message.channel.send({
        content: `⚠️ ${message.author}, deine Nachricht wurde wegen unangebrachtem Inhalt entfernt.`,
      });
      console.log(`🔴 Nachricht von ${message.author.tag} gelöscht (Wort: ${found})`);
    }
  });
};
