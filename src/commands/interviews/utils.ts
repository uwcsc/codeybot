import { availableDomains, getAvailableDomainsString } from '../../components/interview';

export const validateDomainArg = (value: string): boolean | string => {
  // validate if this is one of the available domains
  if (value.toLowerCase() in availableDomains) return true;
  return `you entered an invalid domain. Please enter one of ${getAvailableDomainsString()}.`;
};

export const parseDomainArg = (value: string): string => {
  // lowercase domain arg value
  return value.toLowerCase();
};
