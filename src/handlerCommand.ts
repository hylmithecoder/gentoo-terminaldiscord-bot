import { exec } from "child_process";
import * as fs from "fs";
import * as path from "path";

// Map untuk menyimpan cwd per user
const userCwd = new Map<string, string>();

function getUserCwd(userId: string): string {
    return userCwd.get(userId) || process.cwd();
}

async function handleCommand(message: any) {
    // Ignore bot messages
    if (message.author.bot) return;
    
    // Check prefix
    if (!message.content.startsWith(">>")) return;
    
    // Parse command
    const content = message.content.slice(2).trim();
    if (!content) {
        return message.reply("❌ Command kosong.\nContoh: `>> ls -la`");
    }
    
    const userId = message.author.id;
    const username = message.author.username;
    const cwd = getUserCwd(userId);
    
    console.log(`[CMD] ${username} (${userId}): ${content}`);
    
    // HANDLE CD COMMAND
    if (content.startsWith("cd")) {
        return handleCdCommand(message, userId, cwd, content);
    }
    
    // HANDLE REGULAR COMMANDS
    await handleShellCommand(message, userId, cwd, content);
}

function handleCdCommand(message: any, userId: string, cwd: string, command: string) {
    const target = command.substring(2).trim();
    let newPath: string;
    
    if (target === "" || target === "~") {
        newPath = process.cwd();
    } else if (target === "..") {
        newPath = path.resolve(cwd, "..");
    } else {
        newPath = path.resolve(cwd, target);
    }
    
    // Check if directory exists
    if (!fs.existsSync(newPath)) {
        return message.reply(`❌ Folder tidak ditemukan:\n\`${newPath}\``);
    }
    
    // Check if it's actually a directory
    if (!fs.statSync(newPath).isDirectory()) {
        return message.reply(`❌ Bukan sebuah directory:\n\`${newPath}\``);
    }
    
    userCwd.set(userId, newPath);
    return message.reply(`📁 Directory changed:\n\`${newPath}\``);
}

async function handleShellCommand(message: any, userId: string, cwd: string, command: string) {
    // Send "typing" indicator
    await message.channel.sendTyping();
    
    const startTime = Date.now();
    
    exec(command, { cwd, timeout: 7000, maxBuffer: 1024 * 500 }, (err, stdout, stderr) => {
        const execTime = Date.now() - startTime;
        
        // Prioritaskan stdout, stderr hanya jika ada dan stdout kosong
        let output = "";
        let hasOutput = false;
        
        // Cek stdout
        if (stdout && stdout.trim()) {
            output = stdout.trim();
            hasOutput = true;
        }
        // Cek stderr hanya jika stdout kosong atau ada error
        else if (stderr && stderr.trim()) {
            output = stderr.trim();
            hasOutput = true;
        }
        
        // Handle error
        if (err) {
            // Jika sudah ada stderr, skip error message
            if (!hasOutput) {
                output = `❌ Error (exit code ${err.code || 'unknown'}):\n${err.message}`;
            } else if (err.code && err.code !== 0) {
                // Tambahkan info exit code di akhir jika ada output
                output += `\n\n⚠️ Exit code: ${err.code}`;
            }
        }
        
        // Jika tidak ada output sama sekali
        if (!output) {
            output = `✅ Command executed successfully (${execTime}ms)\n⚪ No output`;
        }
        
        // Format output dengan code block
        let formattedOutput = `\`\`\`\n${output}\n\`\`\``;
        
        // Discord limit adalah 2000 karakter
        if (formattedOutput.length > 1900) {
            // Potong output dan tambahkan info
            const truncated = output.substring(0, 1800);
            formattedOutput = `\`\`\`\n${truncated}\n...\n\n\`\`\``;
        }
        
        // Tambahkan info eksekusi
        formattedOutput += `\n*Executed in ${execTime}ms | CWD: \`${cwd}\`*`;
        
        message.channel.send(formattedOutput).catch((sendErr: any) => {
            console.error("[ERROR] Failed to send message:", sendErr);
            message.reply("❌ Gagal mengirim output (mungkin terlalu panjang atau ada karakter invalid)");
        });
    });
}

export { handleCommand, getUserCwd };
