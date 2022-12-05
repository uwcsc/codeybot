import _ from 'lodash';
import { openDB } from './db';

interface SQLiteCompanyInfoResponse {
  company_id: string;
  description: string;
  categories: string;
}

interface CompanyInfo {
  company_id: string;
  description: string;
  categories: string[];
}

export const getCompanyInfo = async (companyId: string): Promise<CompanyInfo[]> => {
  const db = await openDB();
  const res: SQLiteCompanyInfoResponse[] = await db.all(
    'SELECT * FROM companies WHERE id = ?',
    companyId,
  );
  const cleaned = res.map((row) => {
    return {
      ...row,
      categories: row.categories.split(','),
    };
  });
  return cleaned;
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
