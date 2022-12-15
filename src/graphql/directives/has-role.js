/* eslint-disable no-param-reassign */
/* eslint-disable func-names */
/* eslint-disable  consistent-return */
import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils';
import { defaultFieldResolver, GraphQLError } from 'graphql';

function HasRoleDirectiveTransformer(schema, directiveName) {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const hasRoleDirective = getDirective(schema, fieldConfig, directiveName)?.[0];
      if (hasRoleDirective) {
        const { resolve = defaultFieldResolver } = fieldConfig;
        fieldConfig.resolve = async function (source, args, context, info) {
          const result = await resolve(source, args, context, info);
          if (!context.currentAccountId) {
            throw new GraphQLError('Not authenticated.', {
              extensions: {
                code: 'UNAUTHENTICATED',
              },
            });
          }
          const roles = await context.services.role.findForAccountId(context.currentAccountId);

          if (!roles.find((r) => r.name === hasRoleDirective.role)) {
            throw new GraphQLError('Not authorized to access this resource.', {
              extensions: {
                code: 'FORBIDDEN',
              },
            });
          }
          return result;
        };
        return fieldConfig;
      }
    },
  });
}

export default HasRoleDirectiveTransformer;
