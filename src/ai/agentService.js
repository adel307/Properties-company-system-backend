/**
 * src/ai/agentService.js
 * خدمة الـ AI Agent التي تعتمد على Google Gemini لاستدعاء الأدوات مع دعم الفشل التلقائي (Fallback)
 */

import { GoogleGenAI } from '@google/genai';
import { agentTools } from './tools/definitions.js';
import { executeAgentTool } from './tools/handlers.js';

// تهيئة كائن GoogleGenAI باستخدام مفتاح API
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('تنبيه: لم يتم تعيين GEMINI_API_KEY في بيئة العمل (process.env).');
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

// قائمة بالنصوص/النماذج (Models List) مرتبة حسب الأولوية
// إذا فشل الأول يتم الانتقال التلقائي للثاني وهكذا
const AI_MODELS_LIST = [
  process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.5-pro'
];

const SYSTEM_INSTRUCTION = `You are an automated loss management engineering assistant for property management.
Your supervisory tasks include:
1. Answering user inquiries regarding the application (staff, suppliers, properties, construction products, expenses, and residential apartments).
2. Carefully utilizing available tools to retrieve or update data, or to navigate the user interface (navigate_ui).
3. Providing clear, direct, and precise answers in Arabic based on the results retrieved from the tools.
4. Retrieving the required data exclusively through the available tools.`;

/**
 * دالة مساعدة محددة لتنفيذ طلب الـ Gemini مع موديل معني
 */
async function callGeminiWithModel(modelName, contents, formattedTools) {
  const response = await ai.models.generateContent({
    model: modelName,
    contents,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: formattedTools,
    },
  });

  const candidate = response.candidates?.[0];
  const modelContent = candidate?.content;

  if (!modelContent) {
    throw new Error(`لم يتم استلام أي استجابة من النماذج: ${modelName}`);
  }

  return modelContent;
}

/**
 * معالجة رسائل المستخدم وتشغيل حلقة استدعاء الأدوات (Tool Calling Loop)
 * مع خاصية التنقل التلقائي بين قائمة النماذج (Fallback Models List)
 */
export async function processAgentMessage(history = [], userPrompt) {
  
  try {
    const formattedTools = [{ functionDeclarations: agentTools }];
    const contents = [...history];

    if (userPrompt) {
      contents.push({
        role: 'user',
        parts: [{ text: userPrompt }],
      });
    }

    let pendingNavigationAction = null;
    let maxIterations = 8; // يمكنك تحسين قيمة المحاولات لتجنب التكرار اللانهائي

    while (maxIterations > 0) {
      maxIterations--;

      let modelContent = null;
      let lastModelError = null;

      // التجربة على قائمة النماذج (Modules List) المتاحة
      for (const modelName of AI_MODELS_LIST) {
        try {
          console.log(`جاري تجربة طلب الـ AI باستخدام الموديل: ${modelName}`);
          modelContent = await callGeminiWithModel(modelName, contents, formattedTools);
          // إذا نجح الطلب نخرج من حلقة النماذج
          break; 
        } catch (err) {
          console.warn(`فشل الطلب باستخدام الموديل [${modelName}]:`, err.message || err);
          lastModelError = err;
        }
      }

      // إذا مرت المحاولات على جميع النماذج وفشلت جميعها
      if (!modelContent) {
        throw new Error(`فشلت جميع نماذج الـ AI المتاحة. الخطأ الأخير: ${lastModelError?.message}`);
      }

      contents.push(modelContent);

      const functionCalls = modelContent.parts?.filter((part) => part.functionCall) || [];

      // إذا لم يطلب الـ Model أي أدوات، نقوم بإرجاع النتيجة النهائية مباشرة
      if (functionCalls.length === 0) {
        const textResponse = modelContent.parts
          ?.map((p) => p.text)
          .filter(Boolean)
          .join('\n');

        return {
          success: true,
          message: textResponse || 'تمت العملية بنجاح.',
          history: contents,
          navigation: pendingNavigationAction,
        };
      }

      // تنفيذ الـ Tools في حالة الطلب
      const functionResponseParts = [];

      for (const callPart of functionCalls) {
        const { name: toolName, args } = callPart.functionCall;

        const toolExecutionResult = await executeAgentTool(toolName, args);

        if (toolName === 'navigate_ui' && toolExecutionResult.success) {
          pendingNavigationAction = toolExecutionResult.result;
        }

        functionResponseParts.push({
          functionResponse: {
            name: toolName,
            response: toolExecutionResult,
          },
        });
      }

      contents.push({
        role: 'user',
        parts: functionResponseParts,
      });
    }

    return {
      success: false,
      message: 'تم تجاوز الحد الأقصى لمحاولات الاستجابة التسلسلية للـ Tools.',
      history: contents,
    };
  } catch (error) {
    console.error('خطأ أثناء تشغيل agentService:', error);
    return {
      success: false,
      error: error.message || 'حدث خطأ غير متوقع أثناء معالجة طلب الـ Agent.',
    };
  }
}

export default {
  processAgentMessage,
};