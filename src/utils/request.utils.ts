import { Request } from 'express';

/**
 * Extracts an array value from a query parameter.
 * If the query parameter is a single value, it will be converted to an array.
 * If the query parameter doesn't exist, returns an empty array.
 *
 * @param req - The Express request object
 * @param field - The name of the query parameter field
 * @returns An array of values from the query parameter
 *
 * @example
 * // Single value: ?ids=1
 * getQueryArray(req, 'ids') // returns ['1']
 *
 * @example
 * // Multiple values: ?ids=1&ids=2&ids=3
 * getQueryArray(req, 'ids') // returns ['1', '2', '3']
 *
 * @example
 * // Missing parameter
 * getQueryArray(req, 'ids') // returns []
 */
export function getQueryArray(req: Request, field: string): any[] {
  let fieldValues: any = req.query[field];

  if (fieldValues && !Array.isArray(fieldValues)) {
    fieldValues = [fieldValues];
  } else if (!fieldValues) {
    fieldValues = [];
  }

  return fieldValues;
}

/**
 * Extracts an array of integer values from a query parameter.
 * If the query parameter is a single value, it will be converted to an array.
 * Invalid values (non-numeric) are filtered out.
 * If the query parameter doesn't exist, returns an empty array.
 *
 * @param req - The Express request object
 * @param field - The name of the query parameter field
 * @returns An array of parsed integer values from the query parameter
 *
 * @example
 * // Single value: ?ids=1
 * getQueryIntArray(req, 'ids') // returns [1]
 *
 * @example
 * // Multiple values: ?ids=1&ids=2&ids=3
 * getQueryIntArray(req, 'ids') // returns [1, 2, 3]
 *
 * @example
 * // Mixed valid and invalid: ?ids=1&ids=abc&ids=3
 * getQueryIntArray(req, 'ids') // returns [1, 3]
 *
 * @example
 * // Missing parameter
 * getQueryIntArray(req, 'ids') // returns []
 */
export function getQueryIntArray(req: Request, field: string): number[] {
  let fieldValues: any = req.query[field];

  if (!fieldValues) {
    return [];
  }

  if (!Array.isArray(fieldValues)) {
    fieldValues = [fieldValues];
  }

  return (fieldValues as string[])
    .map((value) => parseInt(value))
    .filter((value) => !isNaN(value));
}
