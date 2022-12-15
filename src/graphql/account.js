import validations from '../validations/userValidations';
import { PRIVACY_LEVEL } from '../utils/constants/account';
import { DateTimeResolver,  EmailAddressResolver, DateResolver } from "graphql-scalars";
import s3Helper from '../helpers/s3Helper';

const typeDefs = `
 scalar DateTime
 scalar Email
 scalar Date
 
  type Account {
    userId: Int!
    email: Email!
    userName: String!
    privacyLevel: Int!
    taggable: Boolean!
    mentionable: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime
    profile: Profile!
  }
  type Profile {
    userId: Int!
    firstName: String
    lastName: String
    gender: String
    dob: String
    avatarImage: String
    createdAt: DateTime!
    updatedAt: DateTime
  }
  type AuthenticationInfo {
    token: String!
    account: Account!
  }
  input SignUpInput {
    email: Email!
    userName: String!
    password: String!
  }
  input CompleteProfileInput {
    firstName: String!
    lastName: String!
    gender: Int!
    dob: Date!
    avatar_image: String!
  }
  extend type Mutation {
    signUp(info: SignUpInput!): Account! 
    login(email: String!, password: String!): AuthenticationInfo
    completeProfile(info: CompleteProfileInput!, inputFile: Upload): Account!
  }
  extend type Query {
    allAccounts: [Account]! @hasRole(role: "admin")
  }
`;

const resolvers = {
  DateTime: DateTimeResolver,
  Email: EmailAddressResolver,
  Date: DateResolver,
  Account: {
    async profile(account, __, { services }) {
      return services.account.findProfile(account.userId);
    },
  },
  Mutation: {
    async signUp(_, { info }, { services, log }) {
      log.access.info({
        message: `Mutation: signUp. Email: ${info.email}`,
      });
      await validations.emailExists(info.email, services);
      await validations.userNameExists(info.userName, services);
      return services.account.getSignUpUser({ ...info, privacyLevel: PRIVACY_LEVEL.PUBLIC });
    },
    async login(_, { email, password }, { log, services }) {
      log.access.info({
        message: `Mutation: login. Email: ${email}`,
      });
      const { token } = await services.authentication.login(email, password);
      const account = await services.account.findByEmail(email);
      return { token, account };
    },
    async completeProfile(_, { info, inputFile }, { log, services, secrets, currentAccountId }) {
      log.access.info({
        message: `Mutation: completeProfile. UserId: ${currentAccountId}`,
      });
      const { filename, mimetype, stream } = await inputFile;
      const { bucket, region } = await secrets.s3.get();
      const s3Url = await s3Helper.uploadFileToS3UsingStream(
          mimetype,
          filename.split('.').pop(),
          stream,
          {
            bucket,
            region,
            path: `photos/usersImages/${currentAccountId}`,
          },
          filename.split('.')[0],
      );
      await services.account.getCompleteProfile({
        ...info,
        userId: currentAccountId,
        avatarImage: s3Url.url,
      });
      return services.account.findByUserId(currentAccountId);
    },
  },
  Query: {
    async allAccounts(_, __, { services }) {
      return services.account.findAll();
    },
  },
};

export default { typeDefs, resolvers };
