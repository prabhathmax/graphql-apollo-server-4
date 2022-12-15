class PermissionRepository {
  constructor(knex) {
    this.database = knex;
    this.columns = [
      'permissions.id as permissionId',
      'name',
      'display_name as displayName',
      'description',
      'created_at as createdAt',
      'updated_at as updatedAt',
    ];
  }

  async findForRole(roleId) {
    return this.database('permission_role')
      .select(this.columns)
      .where({ roleId })
      .leftOuterJoin('permissions', 'permission_role.permission_id', 'permissions.id');
  }
}

export default PermissionRepository;
