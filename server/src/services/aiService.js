const ApiError = require('../utils/ApiError');
const { getProvider } = require('./providers');

const {
  SYSTEM_PROMPT,
  buildUserPrompt,
  parseAiOutput,
  applySafetyRules,
} = require('./aiSafety');

const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS) || 20000;

const withTimeout = (promise, ms, controller) => {
  let timer;

  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();

      reject(
        new ApiError(
          504,
          'The AI service took too long to respond. Please try again.'
        )
      );
    }, ms);
  });

  return Promise.race([promise, timeout]).finally(() => {
    clearTimeout(timer);
  });
};

const analyze = async ({
  patientContext,
  symptoms,
  currentCondition,
}) => {
  const provider = getProvider();
  const controller = new AbortController();

  const systemPrompt = SYSTEM_PROMPT;

  const userPrompt = buildUserPrompt({
    patientContext,
    symptoms,
    currentCondition,
  });

  let rawText;

  try {
    rawText = await withTimeout(
      provider.generate({
        systemPrompt,
        userPrompt,
        signal: controller.signal,
      }),
      AI_TIMEOUT_MS,
      controller
    );
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }

    console.error('AI provider error:', err.message);

    throw new ApiError(
      502,
      'The AI service is currently unavailable. Please try again later.'
    );
  }

  const parsed = parseAiOutput(rawText);

  return applySafetyRules(
    parsed,
    `${symptoms}\n${currentCondition || ''}`
  );
};

module.exports = { analyze };
