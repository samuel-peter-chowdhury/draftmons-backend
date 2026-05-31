import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isOdd', async: false })
export class IsOddConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return typeof value === 'number' && Number.isInteger(value) && value % 2 !== 0;
  }

  defaultMessage(): string {
    return 'numberOfGames must be a positive odd number (Best-of-X format)';
  }
}

export function IsOdd(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: {
        message: 'numberOfGames must be a positive odd number (Best-of-X format)',
        ...validationOptions,
      },
      constraints: [],
      validator: IsOddConstraint,
    });
  };
}
