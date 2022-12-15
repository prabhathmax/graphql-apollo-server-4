class AccountService {
  constructor(AccountRepository) {
    this.repository = AccountRepository;
  }

  async getSignUpUser(info) {
    return this.repository.signUpUser(info);
  }

  async findAll() {
    return this.repository.all();
  }

  async findProfile(userId) {
    return this.repository.profile(userId);
  }

  async findByEmail(email) {
    return this.repository.findByEmail(email);
  }

  async findByUserName(email) {
    return this.repository.findByUserName(email);
  }
}

export default AccountService;
