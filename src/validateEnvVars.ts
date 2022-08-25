import { vars, varsTemplate } from './config';

// Returns whether environment variables are valid
export const validateEnvironmentVariables = (): void => {
  for (const key of Object.keys(varsTemplate)) {
    if (!vars[key]) {
      throw new Error(`"${key}" is not defined in vars`);
    }
  }
};
