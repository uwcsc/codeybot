import { vars } from '../config';
import { isValidUrl } from './validateUrl';
import fetch from 'node-fetch';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getCompanyInfo = async (companyCrunchbaseLink: string) => {
  // check if url contains crunchbase.com/organization
  // if not, return null
  if (
    isValidUrl(companyCrunchbaseLink) &&
    !companyCrunchbaseLink.includes('crunchbase.com/organization/')
  ) {
    throw new Error('Invalid URL');
  }

  let companyName;
  // check if urlPattern matches company_crunchbase_link
  if (companyCrunchbaseLink.includes('crunchbase.com/organization/')) {
    // grab everything after the last / character
    companyName = companyCrunchbaseLink.split('/').pop();
  } else {
    // assume they just supplied the id
    companyName = companyCrunchbaseLink;
  }

  const response = await fetch(
    `https://api.crunchbase.com/api/v4/entities/organizations/${companyName}?user_key=${vars.CRUNCHBASE_API_KEY}&field_ids=categories,short_description`,
  );
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  console.log(data);

  return data;
};
