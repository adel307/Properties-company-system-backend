import PDFDocument from 'pdfkit-table';
import fs from 'fs';
import path from 'path';
import pt from 'pdf-to-printer';

/**
 * دالة لتوليد PDF على هيئة جدول وإرساله للطابعة مباشرة
 * @param {Array} data - البيانات المراد طباعتها على هيئة JSON
 * @param {String} printerName - اسم الطابعة (اختياري، إذا لم يحدد يطبع على الافتراضية)
 */
export const printReportPDF = async (data, printerName = null) => {
  return new Promise((resolve, reject) => {
    try {
      // 1. إنشاء مستند PDF جديد
      const doc = new PDFDocument({ size: 'A4', margin: 30 });
      
      // مسار موقت لحفظ الملف حتى اكتمال الطباعة
      const tempPath = path.join(process.cwd(), `temp_print_${Date.now()}.pdf`);
      const stream = fs.createWriteStream(tempPath);

      doc.pipe(stream);

      // 2. إعداد بيانات الجدول من الـ JSON
      const tableRows = data.map((item) => [
        item.id?.toString() || '',
        item.name || item.sender || 'غير محدد',
        item.amount?.toString() || '0',
        item.date ? new Date(item.date).toLocaleDateString('ar-EG') : ''
      ]);

      const tableData = {
        title: { text: "تقرير البيانات والعمليات", fontSize: 18 },
        subtitle: { text: `تاريخ الطباعة: ${new Date().toLocaleString('ar-EG')}`, fontSize: 10 },
        headers: ["الرقم", "البيان / المستلم", "المبلغ", "التاريخ"],
        rows: tableRows,
      };

      // 3. رسم الجدول داخل الـ PDF
      doc.table(tableData, {
        prepareHeader: () => doc.fontSize(11).font('Helvetica-Bold'),
        prepareRow: (row, i, isOdd) => doc.fontSize(10).font('Helvetica'),
        padding: 5,
        width: 500,
      });

      // إنهاء كتابة الـ PDF
      doc.end();

      // 4. عند اكتمال ملف الـ PDF، يتم إرساله للطباعة الصامتة
      stream.on('finish', async () => {
        try {
          const options = {};
          if (printerName) {
            options.printer = printerName; // تحديد طابعة معينة إذا تم إرسال اسمها
          }

          // إرسال الأمر للطابعة الصامتة
          await pt.print(tempPath, options);

          // حذف الملف المؤقت بعد إتمام الطباعة
          if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
          }

          resolve({ success: true, message: 'تم إرسال الملف للطابعة بنجاح' });
        } catch (printError) {
          // حذف الملف المؤقت في حالة حدوث خطأ
          if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
          reject(printError);
        }
      });

      stream.on('error', (err) => reject(err));

    } catch (err) {
      reject(err);
    }
  });
};