import _ from 'lodash';
import { openDB } from './db';

interface CompanyInfo {
  company_id: string;
  description: string;
}

export const insertCompany = async (companyId: string, description: string): Promise<void> => {
  const db = await openDB();
  const insertCompanyCommand = `INSERT INTO companies (company_id, description) VALUES (?,?)`;
  await db.run(insertCompanyCommand, companyId, description);
};

export const getCompanyInfo = async (companyId: string): Promise<CompanyInfo> => {
  const db = await openDB();
  return (await db.get('SELECT * FROM companies WHERE company_id = ?', companyId)) as CompanyInfo;
};

export const getCompaniesByUserId = async (userId: string): Promise<string[]> => {
  const db = await openDB();

  const res = await db.all('SELECT company_id FROM people_companies WHERE user_id = ?', userId);
  return res.map((row) => row.company_id);
};

export const getUsersByCompanyId = async (companyId: string): Promise<string[]> => {
  const db = await openDB();

  const res = await db.all('SELECT user_id FROM people_companies WHERE company_id = ?', companyId);
  return res.map((row) => row.user_id);
};
