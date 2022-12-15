/** ROLE contains possible values for the different roles in the system. */
export const ROLE = {
  User: 1,
  Admin: 2,
  Moderator: 3,
  SuperAdmin: 4,
};
/** ACCOUNT_STATUS holds the possible status of an account in the system. */
export const ACCOUNT_STATUS = {
  Unverified: 'UNVERIFIED',
  Verified: 'VERIFIED',
  Disabled: 'DISABLED',
  Blocked: 'BLOCKED',
};

/** CREDENTIAL_TYPE holds the type of credentials stored. */
export const CREDENTIAL_TYPE = {
  Local: 'LOCAL',
  Google: 'GOOGLE',
};

/** PRIVACY_LEVEL holds the possible privacy levels of a group/account/post etc. */
export const PRIVACY_LEVEL = {
  PUBLIC: 1,
  PRIVATE: 2,
  ONLY_ME: 3,
  CUSTOM: 4,
};
