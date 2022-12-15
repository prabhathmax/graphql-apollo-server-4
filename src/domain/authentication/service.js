import { compare } from 'bcrypt';
import jwt from 'jsonwebtoken';

export default class AuthenticationService {
  constructor(accountService, jwtSecret) {
    this.accountService = accountService;
    this.jwtSecret = jwtSecret;
  }

  async login(email, password) {
    let account;
    const accountEmail = await this.accountService.findByEmail(email);
    if (accountEmail) {
      account = accountEmail;
    }
    const accountUserName = await this.accountService.findByUserName(email);
    if (accountUserName) {
      account = accountUserName;
    }
    if (!account) {
      throw new Error(`No user found for email or user name: ${email}`);
    }

    if (!(account && (await compare(password, account.password)))) {
      throw new Error('Invalid email/user name and/or password');
    }

    const secret = await this.jwtSecret.get();
    return { token: jwt.sign({ email, id: account.userId }, secret), userId: account.userId };
  }
}
