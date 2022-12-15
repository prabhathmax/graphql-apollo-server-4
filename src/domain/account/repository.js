import bcrypt from 'bcrypt';

const profileForAccount = async (knex, userId) =>
  knex('profiles')
    .select([
      'user_id as userId',
      'first_name as firstName',
      'last_name as lastName',
      'gender',
      'dob',
      'avatar_image as avatarImage',
      'created_at as createdAt',
      'updated_at as updatedAt',
    ])
    .where({ user_id: userId })
    .first();

class AccountRepository {
  constructor(kenx) {
    this.database = kenx;
    this.accountColumns = [
      'user_id as userId',
      'email',
      'user_name as userName',
      'password',
      'privacy_level as privacyLevel',
      'taggable',
      'mentionable',
      'created_at as createdAt',
      'updated_at as updatedAt',
    ];
  }

  async signUpUser(info) {
    let user;
    const now = new Date();
    const saltRounds = 3;
    const password = await bcrypt.hash(info.password, saltRounds);
    await this.database.transaction(async (trx) => {
      const account = await this.database('accounts')
        .insert({
          email: info.email,
          user_name: info.userName,
          privacy_level: info.privacyLevel,
          password,
          created_at: now,
          updated_at: now,
        })
        .transacting(trx);
      await this.database('profiles')
        .insert({
          user_id: account[0],
          created_at: now,
          updated_at: now,
        })
        .transacting(trx);
      await trx.commit();
      user = account;
    });
    return this.findAccountById(user[0]);
  }

  async findAccountById(userId) {
    const account = await this.database('accounts')
      .select(this.accountColumns)
      .where({ user_id: userId })
      .first();
    return {
      ...account,
      profile: await profileForAccount(this.database, userId),
    };
  }

  async all() {
    return this.database('accounts').select(this.accountColumns);
  }

  async profile(userId) {
    return profileForAccount(this.database, userId);
  }

  async findByEmail(email) {
    const account = await this.database('accounts')
      .select(this.accountColumns)
      .where({ email })
      .first();

    if (account) {
      return {
        ...account,
        profile: await profileForAccount(this.database, account.userId),
      };
    }
    return null;
  }

  async findByUserName(userName) {
    const account = await this.database('accounts')
      .select(this.accountColumns)
      .where({ user_name: userName })
      .first();

    if (account) {
      return {
        ...account,
        profile: await profileForAccount(this.database, account.userId),
      };
    }

    return null;
  }
}

export default AccountRepository;
