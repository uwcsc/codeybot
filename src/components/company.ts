import { openDB } from './db';
import { getCrunchbaseCompanyDetails } from '../utils/companyInfo';

export interface CrunchbaseCompanyProperties {
  company_id: string;
  name: string;
  description: string;
  image_id: string;
}

export const insertCompany = async (companyId: string): Promise<void> => {
  const crunchbaseCompanyResponse = await getCrunchbaseCompanyDetails(<string>companyId);
  const { name, short_description } = crunchbaseCompanyResponse;
  const companyImageId = crunchbaseCompanyResponse.identifier?.image_id;
  const crunchbaseCompanyInfo = {
    company_id: companyId,
    name,
    description: short_description,
    image_id: <string>companyImageId,
  };
  await insertCompanyDetails(crunchbaseCompanyInfo);
};

export const insertCompanyDetails = async (
  crunchbaseCompanyInfo: CrunchbaseCompanyProperties,
): Promise<void> => {
  const db = await openDB();
  const { name, image_id, description, company_id } = crunchbaseCompanyInfo;
  const insertCompanyCommand = `INSERT INTO companies (company_id, name, image_id, description) VALUES (?,?,?,?)`;
  await db.run(insertCompanyCommand, company_id, name, image_id, description);
};

export const addUserToCompany = async (
  userId: string,
  companyId: string,
  role: string,
): Promise<void> => {
  const db = await openDB();
  const insertCompanyCommand = `INSERT INTO companies_people (user_id, company_id, role) VALUES (?,?,?)`;
  await db.run(insertCompanyCommand, userId, companyId, role);
};

export const removeUserFromCompany = async (userId: string, companyId: string): Promise<void> => {
  const db = await openDB();
  const insertCompanyCommand = `DELETE FROM companies_people WHERE user_id = ? AND company_id = ?`;
  await db.run(insertCompanyCommand, userId, companyId);
};

export const getCompanyInfo = async (companyId: string): Promise<CrunchbaseCompanyProperties> => {
  const db = await openDB();
  return (await db.get(
    'SELECT * FROM companies WHERE company_id = ?',
    companyId,
  )) as CrunchbaseCompanyProperties;
};

export const getCompaniesByUserId = async (userId: string): Promise<CompanyPersonDetails[]> => {
  const db = await openDB();
  // select the companyname, role, and company_id from the companies_people table where the user_id matches the user_id passed in. Left join companies table to get the name of the company
  const query = `
    SELECT companies.name, companies_people.role, companies_people.company_id
    FROM companies_people
    LEFT JOIN companies
    ON companies_people.company_id = companies.company_id
    WHERE companies_people.user_id = ?
  `;

  return await db.all(query, userId);
};

export interface CompanyPersonDetails {
  user_id: string;
  role: string;
  company_id: string;
  name: string;
}

export const getEmployeesByCompanyId = async (
  companyId: string,
): Promise<CompanyPersonDetails[]> => {
  const db = await openDB();
  return await db.all('SELECT * FROM companies_people WHERE company_id = ?', companyId);
};
