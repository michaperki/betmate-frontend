import joi from 'joi';

/**
 * Validates data against a schema and returns the result
 * This version does not throw exceptions but logs errors and returns the original data
 */
export const validateSchema = <D>(schema: joi.Schema, data: D, extract = (d: D) => d as any): D => {
  if (!data) {
    console.warn('validateSchema received null/undefined data');
    return data;
  }

  try {
    const extracted = extract(data);
    const { error, value } = schema.validate(extracted, {
      abortEarly: false, // Report all errors, not just the first one
      stripUnknown: false, // Don't remove unknown fields
      convert: true, // Convert values when possible (e.g. strings to numbers)
    });

    if (error) {
      // Log error but don't throw - this helps prevent app crashes
      console.log('validation error', error.message, extracted);

      // Return the data anyway - we'll rely on defensive coding elsewhere
      return data;
    }

    // For successful validation, ensure the validated data is used
    if (typeof data === 'object' && data !== null) {
      const result = { ...data as any };
      result.data = value;
      return result as D;
    }

    return data;
  } catch (e) {
    console.error('Exception during schema validation:', e);
    return data;
  }
};
