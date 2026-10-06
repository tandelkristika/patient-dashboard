const GENERIC = 'Something went wrong. Please try again.';

// Fixed messages for statuses where we don't want to show server text
const STATUS_MESSAGES = {
  401: 'Your session has expired. Please log in again.',
  403: 'You do not have permission to do that.',
  404: 'We could not find what you were looking for.',
  413: 'The data you sent is too large.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'Something went wrong on our side. Please try again later.',
  502: 'A required service is unavailable. Please try again later.',
  503: 'The service is temporarily unavailable. Please try again later.',
  504: 'The request took too long. Please try again.',
};

// Statuses where the backend's own message is safe and useful
const SHOW_SERVER_MESSAGE = [400, 409, 502, 504];

const isNonEmptyString = (value) =>
  typeof value === 'string' && value.trim().length > 0;

/**
 * Turns any error into:
 * {
 *   message,
 *   status,
 *   type,
 *   fieldErrors
 * }
 *
 * type:
 *   network | timeout | unauthorized | validation | server | unknown
 *
 * fieldErrors:
 *   {
 *     email: 'Invalid email',
 *     age: 'Age must be a whole number from 0 to 130'
 *   }
 */
export const parseError = (error) => {
  // Case 1: the server replied
  if (error && error.response) {
    const { status, data } = error.response;

    const serverMessage =
      data && isNonEmptyString(data.message)
        ? data.message.trim()
        : null;

    const fieldErrors = {};

    if (data && Array.isArray(data.errors)) {
      data.errors.forEach((item) => {
        if (
          item &&
          isNonEmptyString(item.field) &&
          isNonEmptyString(item.message) &&
          !fieldErrors[item.field]
        ) {
          fieldErrors[item.field] = item.message;
        }
      });
    }

    let type = 'unknown';

    if (status === 401) {
      type = 'unauthorized';
    } else if (status === 400 || status === 409) {
      type = 'validation';
    } else if (status >= 500) {
      type = 'server';
    }

    let message;

    if (SHOW_SERVER_MESSAGE.includes(status) && serverMessage) {
      message = serverMessage;
    } else {
      message =
        STATUS_MESSAGES[status] ||
        (status >= 500 ? STATUS_MESSAGES[500] : GENERIC);
    }

    return {
      message,
      status,
      type,
      fieldErrors,
    };
  }

  // Case 2: timeout
  if (
    error &&
    (error.code === 'ECONNABORTED' ||
      error.code === 'ETIMEDOUT')
  ) {
    return {
      message:
        'The request took too long. Please check your connection and try again.',
      status: null,
      type: 'timeout',
      fieldErrors: {},
    };
  }

  // Case 3: request sent, no reply
  if (error && error.request) {
    return {
      message:
        'Cannot reach the server. Check your internet connection and try again.',
      status: null,
      type: 'network',
      fieldErrors: {},
    };
  }

  // Case 4: unknown/code error
  return {
    message: GENERIC,
    status: null,
    type: 'unknown',
    fieldErrors: {},
  };
};

export const getErrorMessage = (error) =>
  parseError(error).message;
