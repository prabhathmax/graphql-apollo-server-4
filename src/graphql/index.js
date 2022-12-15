import { makeExecutableSchema } from '@graphql-tools/schema';
import merge from 'lodash.merge';
import account from './account';
import AuthenticatedDirectiveTransformer from './directives/authenticated';
import HasRoleDirectiveTransformer from './directives/has-role';
import HasPermissionDirectiveTransformer from './directives/has-permission';

const defaultTypeDefs = `  
  directive @authenticated on OBJECT | FIELD_DEFINITION
  directive @hasRole(role: String!) on OBJECT | FIELD_DEFINITION
  directive @hasPermission(permission: String!) on OBJECT | FIELD_DEFINITION

  type Query {
    _empty: String
  }
  type Mutation {
    _empty: String
  }
`;

let createSchema = makeExecutableSchema({
  typeDefs: [defaultTypeDefs, account.typeDefs],
  resolvers: merge({}, account.resolvers),
});

createSchema = AuthenticatedDirectiveTransformer(createSchema, 'authenticated');
createSchema = HasRoleDirectiveTransformer(createSchema, 'hasRole');
createSchema = HasPermissionDirectiveTransformer(createSchema, 'hasPermission');

export default createSchema;
