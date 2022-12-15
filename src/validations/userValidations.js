import errors from '../errorMessages';

exports.emailExists = async (email, services) => {
  const account = await services.account.findByEmail(email);
  if (account) {
    throw new Error(`${errors.emailExists}`);
  }
};

exports.emailExistsForSelfProfileEdit = async (email, currentAccountId, services) => {
  const available = await services.account.isEmailAvailable(email, currentAccountId);
  if (!available) {
    throw new Error(`${errors.emailExists}`);
  }
};

exports.userNameExists = async (email, services) => {
  const account = await services.account.findByUserName(email);
  if (account) {
    throw new Error(`${errors.emailExists}`);
  }
};
