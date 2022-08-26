import { readFileSync } from 'fs';

export const ENV: string = process.env.NODE_ENV || 'dev';
export const vars: Record<string, string> = JSON.parse(
  readFileSync(`./config/${ENV}/vars.json`, 'utf-8'),
);

export const varsTemplate: Record<string, string> = JSON.parse(
  readFileSync('./config/vars.template.json', 'utf-8'),
);
