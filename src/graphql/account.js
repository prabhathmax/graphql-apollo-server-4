import validations from '../validations/userValidations';
import { PRIVACY_LEVEL } from '../utils/constants/account';
import { DateTimeResolver,  EmailAddressResolver } from "graphql-scalars";

const typeDefs = `
 scalar DateTime
 scalar Email
 
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
  extend type Mutation {
    signUp(info: SignUpInput!): Account! 
    login(email: String!, password: String!): AuthenticationInfo
  }
  extend type Query {
    allAccounts: [Account]! @hasRole(role: "admin")
  }
`;

const resolvers = {
  DateTime: DateTimeResolver,
  Email: EmailAddressResolver,
  Account: {
    async profile(account, __, { services }) {
      return services.account.findProfile(account.userId);
    },
  },
  Mutation: {
    async signUp(_, { info }, { services }) {
      await validations.emailExists(info.email, services);
      await validations.userNameExists(info.userName, services);
      return services.account.getSignUpUser({ ...info, privacyLevel: PRIVACY_LEVEL.PUBLIC });
    },
    async login(_, { email, password }, { services }) {
      const { token } = await services.authentication.login(email, password);
      const account = await services.account.findByEmail(email);
      return { token, account };
    },
  },
  Query: {
    async allAccounts(_, __, { services }) {
      return services.account.findAll();
    },
  },
};

export default { typeDefs, resolvers };
