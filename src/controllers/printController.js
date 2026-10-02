import { printReportPDF } from './printerService.js';

export const handleSilentPrint = async (req, res) => {
  try {
    // 1. جلب البيانات من قاعدة البيانات أو استخدام البيانات المرسلة في الطلب
    const dataToPrint = req.body.items || [
      { id: 101, name: "مورد مواد بناء", amount: 25000, date: "2026-09-15" },
      { id: 102, name: "مصروفات نقل ومعدات", amount: 4300, date: "2026-09-20" }
    ];

    const printerName = req.body.printerName || null;

    // 2. تنفيذ الطباعة الصامتة
    const result = await printReportPDF(dataToPrint, printerName);

    return res.status(200).json({
      status: "success",
      message: "تم تنفيذ أمر الطباعة المباشرة بنجاح",
      details: result
    });
  } catch (error) {
    console.log("Print Error:", error);
    console.error("Print Error:", error);
    return res.status(500).json({
      status: "error",
      message: "فشل تنفيذ أمر الطباعة على السيرفر",
      error: error.message
    });
  }
};