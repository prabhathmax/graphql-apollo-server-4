/* eslint-disable no-param-reassign */
/* eslint-disable func-names */
/* eslint-disable  consistent-return */
import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils';
import { defaultFieldResolver, GraphQLError } from 'graphql';

function HasPermissionDirectiveTransformer(schema, directiveName) {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const hasPermissionDirective = getDirective(schema, fieldConfig, directiveName)?.[0];
      if (hasPermissionDirective) {
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
          const permissions = new Set(
            (await Promise.all(roles.map((r) => context.services.permission.findForRole(r.roleId))))
              .flat()
              .map((rr) => rr.name),
          );

          if (!permissions.has(hasPermissionDirective.permission)) {
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

export default HasPermissionDirectiveTransformer;
