class RoleService {
  constructor(roleRepository) {
    this.roleRepository = roleRepository;
  }

  async findForAccountId(accountId) {
    return this.roleRepository.findForAccountId(accountId);
  }
}

export default RoleService;
