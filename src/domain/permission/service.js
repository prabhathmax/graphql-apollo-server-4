class PermissionService {
  constructor(permissionRepository) {
    this.permissionRepository = permissionRepository;
  }

  async findForRole(roleId) {
    return this.permissionRepository.findForRole(roleId);
  }
}

export default PermissionService;
