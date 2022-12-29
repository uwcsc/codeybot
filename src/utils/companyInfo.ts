import { isValidUrl } from './validateUrl';
import fetch from 'node-fetch';
import { CodeyUserError } from '../codeyUserError';

const CRUNCHBASE_ORGANIZATION_URL = 'crunchbase.com/organization/';
const CRUNCHBASE_ORGANIZATION_API_URL = 'https://api.crunchbase.com/api/v4/entities/organizations/';

// fields to return from the API. See https://app.swaggerhub.com/apis-docs/Crunchbase/crunchbase-enterprise_api/1.0.3#/Entity/get_entities_organizations__entity_id_ for details
// NOTE: was unable to add website and categories, seems like the api is a bit broken
const fields = ['short_description'];
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getCrunchbaseCompanyDetails = async (
  companyCrunchbaseLink: string,
): Promise<Record<string, unknown>> => {
  // check if url contains crunchbase.com/organization
  // if not, throw error
  if (
    isValidUrl(companyCrunchbaseLink) &&
    !companyCrunchbaseLink.includes(CRUNCHBASE_ORGANIZATION_URL)
  ) {
    throw new CodeyUserError(undefined, 'Invalid URL');
  }

  let companyName;
  if (companyCrunchbaseLink.includes(CRUNCHBASE_ORGANIZATION_URL)) {
    // grab everything after the last / character
    companyName = companyCrunchbaseLink.split('/').pop();
  } else {
    // assume they just supplied the id if we can't find the CRUNCHBASE_ORGANIZATION_URL
    companyName = companyCrunchbaseLink;
  }

  const full_url = `${CRUNCHBASE_ORGANIZATION_API_URL}${companyName}?user_key=${
    process.env.CRUNCHBASE_API_KEY
  }&field_ids=${fields.join(',')}`;

  const response = await fetch(
    `${CRUNCHBASE_ORGANIZATION_API_URL}${companyName}?user_key=${
      process.env.CRUNCHBASE_API_KEY
    }&field_ids=${fields.join(',')}`,
  );
  console.log(full_url);

  const data = await response.json();
  if (data.error) {
    throw new CodeyUserError(undefined, data.error);
  }

  return data;
};
