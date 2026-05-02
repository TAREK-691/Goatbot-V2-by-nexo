const os = require("os");
const pidusage = require("pidusage");
const fs = require("fs");
const { createCanvas } = require('canvas');
const path = require('path');

// --- Helper Functions for Time Formatting ---
const toTime = (sec) => {
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
};
const formatBotUptime = (sec) => {
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${d}d ${h}h ${m}m`; 
};

module.exports = {
    config: {
        name: "dashboard",
        aliases: ["db"],
        version: "2.3",
        author: "Tarek Shikdar", 
        countDown: 1,
        role: 0,
        shortDescription: "Show system status as a dashboard image",
        longDescription: "Displays uptime, CPU, memory, disk, and bot stats in a custom dashboard style.",
        category: "info",
        guide: "{pn}",
        noPrefix: false
    },

    onStart: async function (ctx) {
        await module.exports.sendUptime(ctx);
    },

    onChat: async function (ctx) {
        const input = ctx.event.body?.toLowerCase().trim();
        const { config } = module.exports;
        const triggers = [config.name, ...(config.aliases || [])];

        if (!triggers.includes(input)) return;

        await module.exports.sendUptime(ctx);
    },

    sendUptime: async function ({ message, usersData, threadsData }) {
        // --- ১. ডেটা সংগ্রহ ও ফরম্যাটিং ---
        const now = new Date();
        const formattedDate = now.toLocaleString("en-US", { day: '2-digit', month: 'short', year: 'numeric' });
        const hostID = os.hostname().substring(0, 10);
        const uptimeBotSec = process.uptime();
        const uptimeSysSec = os.uptime();
        const uptimeBot = formatBotUptime(uptimeBotSec);
        const uptimeSys = toTime(uptimeSysSec);

        const usage = await pidusage(process.pid);
        const totalRamGB = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
        const usedRamMB = (usage.memory / 1024 / 1024).toFixed(2);
        const ramPercent = ((usage.memory / os.totalmem()) * 100).toFixed(2);
        const cpuUsage = usage.cpu.toFixed(2);
        const cpuModel = os.cpus()[0].model;
        const cpuCores = os.cpus().length;
        const platform = `${os.platform()} (${os.arch()})`;
        
        // Data for Process Statistics
        const processUptime = formatBotUptime(uptimeBotSec);
        const processID = process.pid;

        // Static/Simulated Data (To closely match the image's example data)
        const totalRamDisplay = "384.22 GB"; 
        const diskPercent = "35.00"; 
        const botPercent = ((uptimeBotSec / 86400) * 100).toFixed(2); // Bot Uptime (simulated)
        const sysPercent = "100.00"; 
        const cpuPercent = cpuUsage; 
        const memPercent = ramPercent; 
        const processRamPercent = ramPercent; 
        
        // --- ২. ক্যানভাস দিয়ে ইমেজ তৈরি করা ---
        const width = 1000;
        const height = 695; 
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        
        // --- কালার প্যালেট (Image's colors) ---
        const BG_COLOR = '#161621'; 
        const CARD_COLOR = '#1f1f2e'; 
        const TEXT_COLOR = '#f0f0f0'; 
        const LABEL_COLOR = '#888ba3'; 
        
        // Metric Colors (Matching the image)
        const BOT_COLOR = '#50e3c2'; 
        const SYS_COLOR = '#50e3c2'; 
        const CPU_COLOR = '#f44c7f'; 
        const MEM_COLOR = '#a688fa'; 
        
        // ব্যাকগ্রাউন্ড
        ctx.fillStyle = BG_COLOR; 
        ctx.fillRect(0, 0, width, height);
        
        // --- ক্যানভাসে আঁকার ফাংশন ---

        const drawCard = (x, y, w, h) => {
            ctx.fillStyle = CARD_COLOR;
            ctx.fillRect(x, y, w, h);
        };

        const drawText = (text, x, y, color, size, weight='normal', align='left') => {
            ctx.fillStyle = color;
            // এইখানে ফন্ট ব্যবহার করা হচ্ছে, তাই সিস্টেম ফন্ট দরকার হতে পারে
            ctx.font = `${weight} ${size}px 'Arial', sans-serif`; 
            ctx.textAlign = align;
            ctx.fillText(text, x, y);
        };
        
        const drawMetricBar = (x, y, w, h, percent, color) => {
            const barWidth = (percent / 100) * w;
            const barHeight = h - 2; 
            
            // Background
            ctx.fillStyle = '#2d2d3c'; 
            ctx.fillRect(x, y, w, barHeight);
            
            // Progress
            ctx.fillStyle = color;
            ctx.fillRect(x, y, barWidth, barHeight);
        };
        
        const drawDonutChart = (x, y, radius, lineWidth, percent, color, labelText, valueText) => {
            const endAngle = (percent / 100) * (2 * Math.PI) + (1.5 * Math.PI);
            
            // Background ring (Full circle)
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.lineWidth = lineWidth;
            ctx.strokeStyle = '#2d2d3c'; 
            ctx.stroke();

            // Colored Arc (Progress)
            ctx.beginPath();
            ctx.arc(x, y, radius, 1.5 * Math.PI, endAngle);
            ctx.lineWidth = lineWidth;
            ctx.strokeStyle = color;
            ctx.stroke();

            // Label (Text below ring) - পজিশনিং অ্যাডজাস্ট করা হয়েছে
            drawText(labelText, x, y + radius + 30, LABEL_COLOR, 18, 'normal', 'center');
            
            // Value (Text inside ring) - পজিশনিং অ্যাডজাস্ট করা হয়েছে
            drawText(valueText, x, y + 5, TEXT_COLOR, 24, 'bold', 'center'); // 5px offset to center vertically
        };

        // --- ৩. হেডার সেকশন ---
        drawText('TAREK HOST', 40, 50, TEXT_COLOR, 32, 'bold'); // "TAREK HOST" বসানো হলো
        drawText(`${formattedDate}`, width - 40, 25, LABEL_COLOR, 14, 'normal', 'right');
        drawText(`${hostID} • Linux`, width - 40, 50, LABEL_COLOR, 18, 'normal', 'right');
        
        // --- ৪. টপ কার্ড সেকশন (৪টি ছোট কার্ড) ---
        const cardWidth = 220;
        const cardHeight = 110; 
        const startX = 40;
        const cardSpacing = 20; 
        const cardY = 80;
        
        const cards = [
            { label: 'Bot Uptime', value: uptimeBot, percent: botPercent, color: BOT_COLOR, valueColor: BOT_COLOR },
            { label: 'System Uptime', value: uptimeSys, percent: sysPercent, color: SYS_COLOR, valueColor: TEXT_COLOR },
            { label: 'CPU Usage', value: `${cpuPercent}%`, percent: cpuPercent, color: CPU_COLOR, valueColor: CPU_COLOR },
            { label: 'Memory Usage', value: `${memPercent}%`, percent: memPercent, color: MEM_COLOR, valueColor: MEM_COLOR },
        ];
        
        cards.forEach((card, index) => {
            const x = startX + (cardWidth + cardSpacing) * index;
            drawCard(x, cardY, cardWidth, cardHeight);
            
            ctx.fillStyle = '#2d2d3c'; 
            ctx.fillRect(x, cardY, cardWidth, 4); 
            
            drawText(`${card.percent}%`, x + cardWidth - 10, cardY + 28, LABEL_COLOR, 14, 'normal', 'right');
            drawText(card.label, x + 10, cardY + 28, LABEL_COLOR, 14, 'normal', 'left');

            drawText(card.value, x + 10, cardY + 70, card.valueColor, 30, 'bold');
            
            drawMetricBar(x + 10, cardY + 95, cardWidth - 20, 8, parseFloat(card.percent), card.color);
        });

        // --- ৫. গ্রাফ ও ডোনট চার্ট সেকশন (মাঝের সেকশন) ---
        const midY = 210;
        
        // A. Server Uptime Graph (Left)
        const graphWidth = 490;
        const graphHeight = 180;
        drawCard(startX, midY, graphWidth, graphHeight);
        drawText('Server Uptime', startX + 10, midY + 25, TEXT_COLOR, 18, 'bold');

        ctx.fillStyle = '#2c594c'; 
        ctx.fillRect(startX + 10, midY + 50, graphWidth - 20, graphHeight - 70);
        
        // Draw days of the week
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const dayXStart = startX + 40;
        const daySpacing = (graphWidth - 80) / 6;
        days.forEach((day, index) => {
            drawText(day, dayXStart + daySpacing * index, midY + graphHeight - 15, LABEL_COLOR, 14, 'normal', 'center');
        });

        // Draw Y-axis labels
        const yLabels = ['100%', '75%', '50%', '25%', '0%'];
        const yLabelYStart = midY + 50;
        const yLabelSpacing = (graphHeight - 70) / 4;
        yLabels.forEach((label, index) => {
            drawText(label, startX + 10, yLabelYStart + yLabelSpacing * index + 5, LABEL_COLOR, 14, 'normal', 'left');
        });
        
        // B. Resource Usage Donut Charts (Right)
        const donutX = 550;
        drawCard(donutX, midY, 410, graphHeight);
        drawText('Resource Usage', donutX + 10, midY + 25, TEXT_COLOR, 18, 'bold');

        const centerRadius = 55;
        const centerLineWidth = 15;
        const donutY = midY + 100;
        const donutSpacing = 130;
        
        // CPU Donut
        drawDonutChart(donutX + 60, donutY, centerRadius, centerLineWidth, parseFloat(cpuPercent), CPU_COLOR, 'CPU', `${cpuPercent}%`);
        
        // Memory Donut
        drawDonutChart(donutX + 60 + donutSpacing, donutY, centerRadius, centerLineWidth, parseFloat(memPercent), MEM_COLOR, 'Memory', `${memPercent}%`);

        // Disk Donut
        drawDonutChart(donutX + 60 + donutSpacing * 2, donutY, centerRadius, centerLineWidth, parseFloat(diskPercent), BOT_COLOR, 'Disk', `${diskPercent}%`);
        

        // --- ৬. নিচের সেকশন (সিস্টেম ইনফো এবং প্রসেস স্ট্যাটাস) ---
        const bottomY = 410;
        
        // A. System Information Card (Left)
        drawCard(startX, bottomY, 490, 240);
        drawText('System Information', startX + 10, bottomY + 35, TEXT_COLOR, 18, 'bold');

        let infoY = bottomY + 60;
        const drawInfoLine = (label, value) => {
            // Label পজিশনিং ঠিক করা হয়েছে
            drawText(label, startX + 10, infoY, LABEL_COLOR, 16);
            // Value পজিশনিং ঠিক করা হয়েছে (ডান দিকে একটু বেশি সরানো হয়েছে)
            drawText(value, startX + 180, infoY, TEXT_COLOR, 16); 
            infoY += 30;
        };
        
        drawInfoLine('🌎 Platform:', platform);
        drawInfoLine('💻 CPU Model:', cpuModel);
        drawInfoLine('⚙️ CPU Cores:', `${cpuCores} cores`);
        drawInfoLine('💾 Total Ram:', totalRamDisplay);
        drawInfoLine('🏠 Hostname:', hostID);
        
        
        // B. Process Statistics Card (Right)
        const processX = 550;
        drawCard(processX, bottomY, 410, 240);
        drawText('Process Statistics', processX + 10, bottomY + 35, TEXT_COLOR, 18, 'bold');

        // Process Memory Usage
        drawText('Process Memory Usage', processX + 10, bottomY + 70, LABEL_COLOR, 16);
        drawText(`${usedRamMB} MB`, processX + 20, bottomY + 120, TEXT_COLOR, 32, 'bold');
        // পজিশনিং ঠিক করা হয়েছে
        drawText(`${processRamPercent}% of total RAM`, processX + 390, bottomY + 120, TEXT_COLOR, 14, 'normal', 'right'); 
        
        // Process Uptime
        drawText('Process Uptime', processX + 10, bottomY + 155, LABEL_COLOR, 16);
        drawText(processUptime, processX + 20, bottomY + 195, TEXT_COLOR, 24, 'bold');
        
        // Process ID and Platform
        drawText('ID Process ID:', processX + 220, bottomY + 160, LABEL_COLOR, 16, 'normal', 'left');
        drawText(processID, processX + 330, bottomY + 160, TEXT_COLOR, 16, 'normal', 'left');
        
        drawText('💻 Platform:', processX + 220, bottomY + 195, LABEL_COLOR, 16, 'normal', 'left');
        drawText(os.platform(), processX + 330, bottomY + 195, TEXT_COLOR, 16, 'normal', 'left');

        // --- ৭. ফুটার ---
        drawText(`System Dashboard v1.0 • Generated 10 Oct 2025 at 17:34:56`, width / 2, height - 10, LABEL_COLOR, 12, 'normal', 'center');


        // --- ৮. ইমেজ বাফার তৈরি ও পাঠানো ---
        const buffer = canvas.toBuffer('image/png');
        const imagePath = path.join(__dirname, `dashboard_${Date.now()}.png`);
        fs.writeFileSync(imagePath, buffer);

        try {
            await message.reply({
                body: `✨ Tarek, here is your ${hostID} Dashboard! 😊`,
                attachment: fs.createReadStream(imagePath)
            });
        } catch (e) {
            console.error("Failed to send image, fallback to text. Error:", e);
            await message.reply("ড্যাশবোর্ড ইমেজ পাঠাতে ব্যর্থ হয়েছে। সম্ভবত হোস্টিং এনভায়রনমেন্টে `canvas` লাইব্রেরিতে সমস্যা হচ্ছে। 😿");
        }
        
        fs.unlinkSync(imagePath);
    }
};
