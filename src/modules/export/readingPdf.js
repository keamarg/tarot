import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getCardById } from "@/domain/cards";
async function loadImageDataUrl(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to load image: ${url}`);
    }
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });
}
async function createSpreadPreviewDataUrl(spread, cards) {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 760;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
        throw new Error("Canvas unavailable for spread preview.");
    }
    ctx.fillStyle = "#10212b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < spread.slots.length; i += 1) {
        const slot = spread.slots[i];
        const draw = cards[i];
        const x = (slot.x / 100) * canvas.width;
        const y = (slot.y / 100) * canvas.height;
        const cardW = 130;
        const cardH = 200;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((slot.rotationDeg * Math.PI) / 180);
        ctx.fillStyle = "rgba(18, 35, 46, 0.95)";
        ctx.strokeStyle = "rgba(165, 194, 211, 0.45)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
            ctx.roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 14);
            ctx.fill();
            ctx.stroke();
        }
        else {
            ctx.rect(-cardW / 2, -cardH / 2, cardW, cardH);
            ctx.fill();
            ctx.stroke();
        }
        if (draw) {
            const card = getCardById(draw.cardId);
            const imgPath = `/cards/${card.image}`;
            try {
                const dataUrl = await loadImageDataUrl(imgPath);
                const image = await new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => resolve(img);
                    img.onerror = reject;
                    img.src = dataUrl;
                });
                if (draw.reversed) {
                    ctx.translate(0, 0);
                    ctx.rotate(Math.PI);
                }
                ctx.drawImage(image, -cardW / 2 + 6, -cardH / 2 + 6, cardW - 12, cardH - 12);
            }
            catch {
                ctx.fillStyle = "#f5c66f";
                ctx.font = "bold 22px serif";
                ctx.textAlign = "center";
                ctx.fillText(card.name, 0, -8);
            }
        }
        ctx.restore();
        ctx.fillStyle = "#ecf2f5";
        ctx.font = "20px serif";
        ctx.textAlign = "center";
        ctx.fillText(slot.label, x, y + 130);
    }
    return canvas.toDataURL("image/png");
}
function base64FromDataUrl(dataUrl) {
    const comma = dataUrl.indexOf(",");
    if (comma === -1) {
        throw new Error("Invalid data URL");
    }
    return dataUrl.slice(comma + 1);
}
export async function exportReadingPdf(params) {
    const { fileName, reading, spread, cards, sourceImageDataUrl, disclaimer } = params;
    const doc = await PDFDocument.create();
    const page = doc.addPage([842, 1191]);
    const font = await doc.embedFont(StandardFonts.TimesRoman);
    const bold = await doc.embedFont(StandardFonts.TimesRomanBold);
    page.drawText(reading.title, {
        x: 48,
        y: 1140,
        size: 22,
        font: bold,
        color: rgb(0.08, 0.13, 0.17)
    });
    page.drawText(`Spread: ${spread.name}`, {
        x: 48,
        y: 1114,
        size: 12,
        font,
        color: rgb(0.2, 0.25, 0.28)
    });
    const previewDataUrl = sourceImageDataUrl ?? (await createSpreadPreviewDataUrl(spread, cards));
    const previewBase64 = base64FromDataUrl(previewDataUrl);
    let image;
    if (previewDataUrl.includes("image/jpeg")) {
        image = await doc.embedJpg(previewBase64);
    }
    else {
        image = await doc.embedPng(previewBase64);
    }
    const imageDims = image.scale(0.34);
    page.drawImage(image, {
        x: 48,
        y: 1114 - imageDims.height - 12,
        width: imageDims.width,
        height: imageDims.height
    });
    let cursorY = 1114 - imageDims.height - 30;
    for (const entry of reading.positionReadings) {
        if (cursorY < 170) {
            break;
        }
        page.drawText(`${entry.slotLabel}: ${entry.cardName}`, {
            x: 48,
            y: cursorY,
            size: 11,
            font: bold,
            color: rgb(0.16, 0.2, 0.25)
        });
        cursorY -= 14;
        const wrapped = entry.interpretation.slice(0, 420);
        page.drawText(wrapped, {
            x: 48,
            y: cursorY,
            size: 10,
            font,
            color: rgb(0.15, 0.18, 0.2),
            maxWidth: 740,
            lineHeight: 11
        });
        cursorY -= 42;
    }
    page.drawText("Synthesis", {
        x: 48,
        y: Math.max(cursorY - 8, 120),
        size: 12,
        font: bold,
        color: rgb(0.16, 0.2, 0.25)
    });
    page.drawText(reading.synthesis.slice(0, 900), {
        x: 48,
        y: Math.max(cursorY - 42, 80),
        size: 10,
        font,
        color: rgb(0.15, 0.18, 0.2),
        maxWidth: 740,
        lineHeight: 12
    });
    if (disclaimer) {
        page.drawText(disclaimer, {
            x: 48,
            y: 34,
            size: 8,
            font,
            color: rgb(0.3, 0.3, 0.3)
        });
    }
    const bytes = await doc.save();
    const normalized = Uint8Array.from(bytes);
    const blob = new Blob([normalized], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
}
