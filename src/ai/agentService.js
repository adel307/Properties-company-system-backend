import { GoogleGenAI } from '@google/genai';
import { agentTools } from './tools/definitions.js';
import { executeAgentTool } from './tools/handlers.js';
import {GeminiModels} from './AI_Models/GeminiModels.js'

// ==========================================
// 1. التهيئة والتحقق من المفاتيح
// ==========================================
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error(
    'متغير البيئة GEMINI_API_KEY مفقود. لا يمكن تهيئة خدمة الـ AI Agent.'
  );
}

const ai = new GoogleGenAI({ apiKey });

// ==========================================
// 2. قائمة النماذج (أسماء صحيحة من Google)
// ==========================================
const AI_MODELS_LIST = GeminiModels

// ==========================================
// 3. إعدادات التشغيل
// ==========================================
const MAX_TOOL_ITERATIONS = 5;      // الحد الأقصى لجولات استدعاء الأدوات
const MAX_HISTORY_MESSAGES = 24;    // الحد الأقصى لعدد عناصر السياق
const TEMPERATURE = 0.2;            // للإدارة المالية: دقة أعلى
const MAX_OUTPUT_TOKENS = 2048;

// ==========================================
// 4. التعليمات النظامية (System Instruction)
// ==========================================
const SYSTEM_INSTRUCTION = `You are an automated loss management engineering assistant for property management.
Your supervisory tasks include:
1. Answering user inquiries regarding the application (staff, suppliers, properties, construction products, expenses, and residential apartments).
2. Carefully utilizing available tools to retrieve or update data, or to navigate the user interface (navigate_ui).
3. Providing clear, direct, and precise answers in Arabic based on the results retrieved from the tools.
4. Retrieving the required data exclusively through the available tools.
5. If a tool fails, inform the user clearly and do not fabricate data.
6. Before performing destructive actions (delete_*), always confirm with the user first.
7. If you call a search tool—such as get_suppliers or get_properties—using a specific name and it returns an empty list ([]), do not immediately assume the item does not exist. Instead, call the same tool without any search parameters to retrieve all items, then match the name locally, accounting for variations in *hamza* placement and spacing.

`;

// ==========================================
// 5. أدوات مساعدة
// ==========================================

/**
 * إزالة الرسائل القديمة من السياق مع الحفاظ على سلامة تسلسل الأدوار.
 * لا نبدأ السياق أبداً برسالة functionResponse بدون functionCall سابق.
 */
function trimHistory(contents, maxMessages = MAX_HISTORY_MESSAGES) {
  if (!Array.isArray(contents) || contents.length <= maxMessages) {
    return contents;
  }

  let start = contents.length - maxMessages;

  // تجنب بدء السياق بـ functionResponse يتيم
  while (
    start < contents.length &&
    contents[start]?.parts?.some((p) => p.functionResponse)
  ) {
    start++;
  }

  // تجنب بدء السياق برسالة model (يجب أن يبدأ بـ user)
  while (start < contents.length && contents[start]?.role === 'model') {
    start++;
  }

  return contents.slice(start);
}

/**
 * استدعاء Gemini مع نموذج محدد.
 */
async function callGeminiWithModel(modelName, contents, formattedTools) {
  const response = await ai.models.generateContent({
    model: modelName,
    contents,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: formattedTools,
      temperature: TEMPERATURE,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    },
  });

  const candidate = response.candidates?.[0];
  const modelContent = candidate?.content;

  if (!modelContent) {
    throw new Error(`لم يتم استلام أي استجابة من النموذج: ${modelName}`);
  }

  return modelContent;
}

async function callWithFallback(contents, formattedTools) {
  let lastError = null;

  for (const modelName of AI_MODELS_LIST) {
    try {
      const modelContent = await callGeminiWithModel(
        modelName,
        contents,
        formattedTools
      );
      return { modelContent, usedModel: modelName };
    } catch (err) {
      lastError = err;
      console.warn(
        `[agentService] فشل الموديل [${modelName}]: ${err?.message || err}`
      );
    }
  }

  throw new Error(
    `فشلت جميع نماذج الـ AI المتاحة. الخطأ الأخير: ${
      lastError?.message || 'غير معروف'
    }`
  );
}

function buildFunctionResponse(toolName, executionResult) {
  if (executionResult?.success) {
    // نلفّ النتيجة داخل حقل result لتجنب التعارض مع كلمات محجوزة
    return {
      functionResponse: {
        name: toolName,
        response: { result: executionResult.result ?? null },
      },
    };
  }

  return {
    functionResponse: {
      name: toolName,
      response: {
        error: executionResult?.error || 'فشل تنفيذ الأداة دون تفاصيل.',
      },
    },
  };
}

function extractText(modelContent) {
  const text = modelContent?.parts
    ?.map((p) => p.text)
    .filter(Boolean)
    .join('\n')
    .trim();

  return text || 'تمت العملية بنجاح.';
}

// ==========================================
// 6. الدالة الرئيسية
// ==========================================

export async function processAgentMessage(history = [], userPrompt) {
  const formattedTools = [{ functionDeclarations: agentTools }];
  let contents = Array.isArray(history) ? [...history] : [];
  let pendingNavigationAction = null;

  try {
    // 1. التحقق من المدخل
    if (!userPrompt || typeof userPrompt !== 'string' || !userPrompt.trim()) {
      return {
        success: false,
        message: 'لم يتم تقديم نص صالح للمعالجة.',
        history: contents,
        navigation: null,
      };
    }

    // 2. اقتطاع السياق قبل الإضافة
    contents = trimHistory(contents);

    // 3. إضافة رسالة المستخدم الحالية
    contents.push({
      role: 'user',
      parts: [{ text: userPrompt.trim() }],
    });

    // 4. حلقة استدعاء الأدوات
    let iterations = 0;

    while (iterations < MAX_TOOL_ITERATIONS) {
      iterations++;

      // 4.1 استدعاء النموذج مع Fallback
      let modelContent;
      try {
        const { modelContent: mc } = await callWithFallback(
          contents,
          formattedTools
        );
        modelContent = mc;
      } catch (fallbackError) {
        // فشل جميع النماذج
        return {
          success: false,
          message: fallbackError.message,
          history: contents,
          navigation: pendingNavigationAction,
          error: fallbackError.message,
        };
      }

      // 4.2 إضافة رد النموذج إلى السياق
      contents.push(modelContent);

      // 4.3 استخراج استدعاءات الأدوات
      const functionCalls =
        modelContent.parts?.filter((part) => part.functionCall) || [];

      // 4.4 لا توجد أدوات → هذه هي الإجابة النهائية
      if (functionCalls.length === 0) {
        return {
          success: true,
          message: extractText(modelContent),
          history: contents,
          navigation: pendingNavigationAction,
        };
      }

      // 4.5 تنفيذ الأدوات المطلوبة
      const functionResponseParts = [];

      for (const callPart of functionCalls) {
        const toolName = callPart.functionCall?.name;
        const args = callPart.functionCall?.args || {};

        if (!toolName) {
          console.warn('[agentService] تم استلام functionCall بدون اسم.');
          continue;
        }

        let executionResult;
        try {
          executionResult = await executeAgentTool(toolName, args);
        } catch (toolError) {
          // حماية إضافية في حال رمي executeAgentTool استثناءً
          executionResult = {
            success: false,
            error: toolError?.message || 'خطأ غير متوقع في تنفيذ الأداة.',
          };
        }

        // تسجيل التنقل إن وُجد
        if (
          toolName === 'navigate_ui' &&
          executionResult?.success &&
          executionResult?.result
        ) {
          pendingNavigationAction =
            executionResult.result.route ||
            executionResult.result ||
            null;
        }

        functionResponseParts.push(
          buildFunctionResponse(toolName, executionResult)
        );
      }

      // 4.6 إضافة نتائج الأدوات كدور user (كما يتطلب Gemini)
      contents.push({
        role: 'user',
        parts: functionResponseParts,
      });
    }

    // 5. تجاوز الحد الأقصى للجولات
    return {
      success: false,
      message: 'تم تجاوز الحد الأقصى لمحاولات استدعاء الأدوات.',
      history: contents,
      navigation: pendingNavigationAction,
    };
  } catch (error) {
    console.error('[agentService] خطأ غير متوقع:', error);

    return {
      success: false,
      message: error?.message || 'حدث خطأ غير متوقع أثناء معالجة الطلب.',
      error: error?.message || 'unknown_error',
      history: contents,
      navigation: pendingNavigationAction,
    };
  }
}

export default {
  processAgentMessage,
};