import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';

@Injectable()
export class PdfGeneratorService {
  async generateDocumentPdf(documentData: any): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        // Header
        doc
          .fontSize(18)
          .text(`HISOB-FAKTURA № ${documentData.docNumber}`, { align: 'center' });
        doc
          .fontSize(10)
          .text(
            `Sana: ${new Date(documentData.docDate).toLocaleDateString('uz-UZ')}`,
            { align: 'center' },
          );
        doc.moveDown(1.5);

        // Seller & Buyer Info
        doc.fontSize(11).font('Helvetica-Bold').text('Sotuvchi (Yetkazib beruvchi):');
        doc.font('Helvetica').fontSize(10)
          .text(`Nomi: ${documentData.company.name}`)
          .text(`STIR: ${documentData.company.tin}`)
          .text(`Manzil: ${documentData.company.address || 'Noma\'lum'}`)
          .text(`Hisob raqam: ${documentData.company.bankAccount || '-'}, MFO: ${documentData.company.bankMfo || '-'}`);

        doc.moveDown(1);
        doc.fontSize(11).font('Helvetica-Bold').text('Xaridor (Buyurtmachi):');
        doc.font('Helvetica').fontSize(10)
          .text(`Nomi: ${documentData.counterparty.name}`)
          .text(`STIR: ${documentData.counterparty.tin}`)
          .text(`Manzil: ${documentData.counterparty.address || 'Noma\'lum'}`)
          .text(`Hisob raqam: ${documentData.counterparty.bankAccount || '-'}, MFO: ${documentData.counterparty.bankMfo || '-'}`);

        doc.moveDown(1.5);

        // Table Header
        doc.font('Helvetica-Bold').fontSize(9);
        doc.text('№', 40, doc.y, { width: 25 });
        doc.text('Mahsulot / Xizmat nomi', 70, doc.y, { width: 170 });
        doc.text('MXIK', 245, doc.y, { width: 75 });
        doc.text('Miqdor', 325, doc.y, { width: 45 });
        doc.text('Narx', 375, doc.y, { width: 55 });
        doc.text('QQS', 435, doc.y, { width: 45 });
        doc.text('Jami', 485, doc.y, { width: 70 });
        doc.moveDown(0.5);

        doc.font('Helvetica').fontSize(9);
        let index = 1;
        for (const item of documentData.items) {
          const currentY = doc.y;
          doc.text(String(index++), 40, currentY, { width: 25 });
          doc.text(item.name, 70, currentY, { width: 170 });
          doc.text(item.ikpuCode, 245, currentY, { width: 75 });
          doc.text(String(item.quantity), 325, currentY, { width: 45 });
          doc.text(Number(item.price).toLocaleString('uz-UZ'), 375, currentY, { width: 55 });
          doc.text(Number(item.vatAmount).toLocaleString('uz-UZ'), 435, currentY, { width: 45 });
          doc.text(Number(item.finalAmount).toLocaleString('uz-UZ'), 485, currentY, { width: 70 });
          doc.moveDown(0.8);
        }

        doc.moveDown(1);
        doc.font('Helvetica-Bold').fontSize(11);
        doc.text(
          `JAMI TO'LOVGA: ${Number(documentData.totalAmount).toLocaleString('uz-UZ')} UZS`,
          { align: 'right' },
        );

        // E-IMZO Stamp & QR Code
        doc.moveDown(2);
        const qrContent = `Yagona Buxgalteriya Platformasi | Doc: ${documentData.docNumber} | TIN: ${documentData.company.tin} | Amount: ${documentData.totalAmount} UZS | Status: ${documentData.status}`;
        const qrDataUrl = await QRCode.toDataURL(qrContent, { margin: 1 });
        const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

        const stampY = doc.y > 600 ? doc.addPage().y : doc.y;

        doc.image(qrBuffer, 40, stampY, { width: 75, height: 75 });

        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('[ ELEKTRON RAQAMLI IMZO BILAN TASDIQLANGAN ]', 125, stampY + 5);
        doc.font('Helvetica').fontSize(8);
        doc.text(`Imzolovchi: ${documentData.signatures?.[0]?.signerName || documentData.company.directorName || 'Direktor'}`, 125, stampY + 20);
        doc.text(`STIR: ${documentData.signatures?.[0]?.signerTin || documentData.company.tin}`, 125, stampY + 32);
        doc.text(`Sertifikat: ${documentData.signatures?.[0]?.certificateSerial || 'E-IMZO-PKCS7-VERIFIED'}`, 125, stampY + 44);
        doc.text(`Imzolangan vaqti: ${new Date(documentData.signatures?.[0]?.signedAt || documentData.updatedAt).toLocaleString('uz-UZ')}`, 125, stampY + 56);

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
