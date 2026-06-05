import PDFDocument from 'pdfkit';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = path.join(__dirname, '..', '..', 'fonts');
const FONT_REGULAR = path.join(FONTS_DIR, 'NotoSans-Regular.ttf');
const FONT_BOLD = path.join(FONTS_DIR, 'NotoSans-Bold.ttf');

const LABELS = ['A', 'B', 'C', 'D'];

function shuffle(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function generateVariants(questions, count) {
  const variants = [];
  for (let i = 0; i < count; i++) {
    const code = String(i + 1).padStart(3, '0');
    const shuffledQs = shuffle(questions);
    const variantQuestions = shuffledQs.map(q => {
      const shuffledAnswers = shuffle(q.answers);
      const correctIdx = shuffledAnswers.findIndex(a => a.is_correct);
      return {
        question_id: q.question_id,
        content: q.content,
        answers: shuffledAnswers.map((a, j) => ({ ...a, label: LABELS[j] })),
        correct_label: LABELS[correctIdx],
      };
    });
    variants.push({ code, questions: variantQuestions });
  }
  return variants;
}

export const buildExamPdf = (examName, duration, questions, variantsCount) => {
  return new Promise((resolve, reject) => {
    const variants = generateVariants(questions, variantsCount);
    const chunks = [];

    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      autoFirstPage: false,
    });

    doc.registerFont('NotoSans', FONT_REGULAR);
    doc.registerFont('NotoSans-Bold', FONT_BOLD);

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageW = 595.28;
    const margin = 50;
    const contentW = pageW - margin * 2;

    for (const variant of variants) {
      doc.addPage();
      let y = margin;

      doc.font('NotoSans').fontSize(8).fillColor('#888').text('PHIẾU KIỂM TRA TOÁN LỚP 3', margin, y);
      y += 16;

      doc.font('NotoSans-Bold').fontSize(13).fillColor('#000');
      const codeText = `Mã đề: ${variant.code}`;
      const codeW = doc.widthOfString(codeText) + 16;
      const nameW = contentW - codeW - 8;
      doc.text(examName, margin, y, { width: nameW, align: 'center' });
      doc.rect(margin + nameW + 8, y - 1, codeW, 16).stroke();
      doc.font('NotoSans-Bold').fontSize(11).text(codeText, margin + nameW + 12, y + 1);
      y += 22;

      doc.font('NotoSans').fontSize(10).fillColor('#444')
        .text(`Thời gian làm bài: ${duration} phút`, margin, y, { width: contentW, align: 'center' });
      y += 16;

      doc.moveTo(margin, y).lineTo(margin + contentW, y).lineWidth(1).stroke('#000');
      y += 8;

      doc.font('NotoSans-Bold').fontSize(10).fillColor('#000').text('Họ và tên:', margin, y);
      const nameLineX = margin + doc.widthOfString('Họ và tên:') + 4;
      doc.moveTo(nameLineX, y + 12).lineTo(nameLineX + 180, y + 12).lineWidth(0.5).stroke('#888');
      doc.font('NotoSans-Bold').text('Lớp:', nameLineX + 190, y);
      const classLineX = nameLineX + 190 + doc.widthOfString('Lớp:') + 4;
      doc.moveTo(classLineX, y + 12).lineTo(classLineX + 60, y + 12).lineWidth(0.5).stroke('#888');
      y += 20;

      doc.font('NotoSans-Bold').fontSize(10).fillColor('#000').text('Ngày kiểm tra:', margin, y);
      const dateLineX = margin + doc.widthOfString('Ngày kiểm tra:') + 4;
      doc.moveTo(dateLineX, y + 12).lineTo(dateLineX + 120, y + 12).lineWidth(0.5).stroke('#888');
      doc.font('NotoSans-Bold').text('Điểm:', dateLineX + 130, y);
      const scoreLineX = dateLineX + 130 + doc.widthOfString('Điểm:') + 4;
      doc.moveTo(scoreLineX, y + 12).lineTo(scoreLineX + 60, y + 12).lineWidth(0.5).stroke('#888');
      y += 24;

      doc.moveTo(margin, y).lineTo(margin + contentW, y).lineWidth(1).stroke('#000');
      y += 10;

      const colW = contentW / 2;
      for (let qi = 0; qi < variant.questions.length; qi++) {
        const q = variant.questions[qi];

        if (y > 750) { doc.addPage(); y = margin; }

        doc.font('NotoSans-Bold').fontSize(10).fillColor('#000');
        const prefix = `Câu ${qi + 1}: `;
        const prefixW = doc.widthOfString(prefix);
        doc.text(prefix, margin, y, { continued: true });
        doc.font('NotoSans').text(q.content, { width: contentW - prefixW });
        y = doc.y + 4;

        for (let ai = 0; ai < q.answers.length; ai++) {
          if (y > 760) { doc.addPage(); y = margin; }
          const ans = q.answers[ai];
          const xOffset = margin + (ai % 2 === 0 ? 8 : colW + 8);
          doc.font('NotoSans-Bold').fontSize(10).text(`${ans.label}. `, xOffset, y, { continued: true });
          doc.font('NotoSans').text(ans.content, { width: colW - 16 });
          if (ai % 2 === 1 || ai === q.answers.length - 1) {
            y = doc.y + 2;
          }
        }
        if (q.answers.length % 2 !== 0) y = doc.y + 2;
        y += 6;
      }
    }

    doc.addPage();
    let y = margin;
    doc.font('NotoSans-Bold').fontSize(14).fillColor('#000')
      .text('BẢNG ĐÁP ÁN', margin, y, { width: contentW, align: 'center' });
    y += 20;
    doc.font('NotoSans').fontSize(10).fillColor('#888')
      .text(examName, margin, y, { width: contentW, align: 'center' });
    y += 20;

    doc.moveTo(margin, y).lineTo(margin + contentW, y).lineWidth(0.5).stroke('#ccc');
    y += 8;

    const col1W = 60;
    doc.font('NotoSans-Bold').fontSize(10).fillColor('#000')
      .text('Mã đề', margin, y, { width: col1W })
      .text('Đáp án', margin + col1W, y);
    y += 18;

    for (const variant of variants) {
      if (y > 760) { doc.addPage(); y = margin; }
      const answersStr = variant.questions.map((q, i) => `${i + 1}.${q.correct_label}`).join('   ');
      doc.font('NotoSans').fontSize(10)
        .text(variant.code, margin, y, { width: col1W })
        .text(answersStr, margin + col1W, y, { width: contentW - col1W });
      y = doc.y + 4;
      doc.moveTo(margin, y).lineTo(margin + contentW, y).lineWidth(0.3).stroke('#ddd');
      y += 4;
    }

    doc.end();
  });
};
