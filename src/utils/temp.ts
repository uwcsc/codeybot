import { vars } from '../config';
import { isValidUrl } from './validateUrl';
import fetch from 'node-fetch';

const CRUNCHBASE_ORGANIZATION_URL = 'crunchbase.com/organization/';
const CRUNCHBASE_ORGANIZATION_API_URL = 'https://api.crunchbase.com/api/v4/entities/organizations/';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getCompanyInfo = async (companyCrunchbaseLink: string) => {
  // check if url contains crunchbase.com/organization
  // if not, throw error
  if (
    isValidUrl(companyCrunchbaseLink) &&
    !companyCrunchbaseLink.includes(CRUNCHBASE_ORGANIZATION_URL)
  ) {
    throw new Error('Invalid URL');
  }

  let companyName;
  // check if urlPattern matches companyCrunchbaseLink
  if (companyCrunchbaseLink.includes(CRUNCHBASE_ORGANIZATION_URL)) {
    // grab everything after the last / character
    companyName = companyCrunchbaseLink.split('/').pop();
  } else {
    // assume they just supplied the id
    companyName = companyCrunchbaseLink;
  }

  const response = await fetch(
    `${CRUNCHBASE_ORGANIZATION_API_URL}${companyName}?user_key=${vars.CRUNCHBASE_API_KEY}&field_ids=categories,short_description`,
  );
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }

  return data;
};
