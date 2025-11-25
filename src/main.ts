import "dotenv/config"
import { Client, GatewayIntentBits, ChannelType, PermissionFlagsBits } from 'discord.js'
import express from "express"
import { InteractionType,  InteractionResponseType,  verifyKeyMiddleware} from "discord-interactions"
import {exec} from "child_process"
import fs from "fs"
import path from "path"
import { handleCommand } from "./handlerCommand.ts"

const dcClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const PUBLIC_KEY = process.env.PUBLIC_KEY as string;

const userCwd = new Map(); // <userID, currentDirectory>

async function mainUpdate() {
    dcClient.once('ready', async () => {
        for (const [guildId] of dcClient.guilds.cache) {
            try {
            const guild = await dcClient.guilds.fetch(guildId);
            const channels = await guild.channels.fetch();
            const me = await guild.members.fetch(dcClient.user!.id);

            const target = channels.find(
                (ch) =>
                ch?.type === ChannelType.GuildText &&
                ch.isTextBased() &&
                ch.permissionsFor(me)?.has(PermissionFlagsBits.SendMessages),
            );

            if (target && target.isTextBased()) {
                // Uncomment jika ingin kirim pesan otomatis
                // await target.send(`👋 Halo ${guild.name}, bot sudah online dengan ${slashCommands.length} commands!`);
                console.log(`✅ Bot siap di server ${guild.name}`);
            }
            } catch (err) {
                console.error(`❌ Error di server ${guildId}:`, err);
            }
        }
    })

    dcClient.on('messageCreate', handleCommand)

    dcClient.login(process.env.DISCORD_TOKEN)
}

/*function getUserCwd(userId: string) {
    if (!userCwd.has(userId)) {
        userCwd.set(userId, process.cwd()); // default: folder saat bot dijalankan
    }
    return userCwd.get(userId)!;
}
*/
/*async function handleCommand(message: any) {
    if (message.author.bot) return;
    if (!message.content.startsWith(">>")) return;

    const args = message.content.trim().split(" ");
    console.log(args)
    const command = args.shift()?.toLowerCase();

    // aktifin terminal
    //if (command === "test") {
    //    return message.reply("🟩 Terminal mode active. Use `>> sh <command>`");
    //}

    // remote shell
    //if (command === "sh") {
        const userId = message.author.id;
	console.log(`Request from name ${message.author.username} (ID: ${userId})`)
        let cwd = getUserCwd(userId);
        const shellCmd = args.join(" ");

        if (!shellCmd)
            return message.reply("❌ Command kosong.\nContoh: `>> ls -la`");

        // HANDLE CD (khusus)
        if (shellCmd.startsWith("cd")) {
            const target = shellCmd.substring(2).trim();

            let newPath;

            if (target === "" || target === "~") {
                newPath = process.cwd(); // balik ke root container
            } else if (target === "..") {
                newPath = path.resolve(cwd, "..");
            } else {
                newPath = path.resolve(cwd, target);
            }

            if (!fs.existsSync(newPath)) {
                return message.reply(`❌ Folder tidak ditemukan:\n\`${newPath}\``);
            }

            userCwd.set(userId, newPath);
            return message.reply(`📁 Directory changed:\n\`${newPath}\``);
        }

        // EKSEKUSI COMMAND BIASA
        exec(shellCmd, { cwd, timeout: 7000 }, (err, stdout, stderr) => {
            let output = "";

            if (stdout) output += `\`\`\`\`\n${stdout}\n\`\`\`\``;
            if (stderr) output += `\`\`\`\`\n${stderr}\n\`\`\`\``;
            if (err && !stderr) output += `❌ Exec error:\n\`\`\`\n${err.message}\n\`\`\`\n`;

            if (!output.trim()) output = "⛔ No output.";

            message.channel.send(output.substring(0, 1900));
        });

        return;
    //}
}
*/
async function route() {
    const app = express()
    const PORT = 30010;

    app.post(
        '/interactions',
        verifyKeyMiddleware(PUBLIC_KEY)
    )

    app.listen(PORT, () => {
        console.log(`🌐 Express server listening on port ${PORT}`);
    })
}

mainUpdate()
route();
