/**
 * Formats a Mongoose ValidationError into the required plain object structure:
 * {
 *   error: "Validation failed",
 *   details: [ { field, message }, ... ]
 * }
 */
export function formatValidationError(err) {
  const details = [];

  if (err && err.errors) {
    for (const [field, errorObj] of Object.entries(err.errors)) {
      details.push({
        field: field,
        message: errorObj.message
      });
    }
  } else if (err && err.message) {
    details.push({
      field: "general",
      message: err.message
    });
  }

  return {
    error: "Validation failed",
    details: details
  };
}

export default formatValidationError;
