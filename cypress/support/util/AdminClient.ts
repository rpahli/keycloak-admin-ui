import KeycloakAdminClient from "@keycloak/keycloak-admin-client";
import type UserRepresentation from "@keycloak/keycloak-admin-client/lib/defs/userRepresentation";
import type ClientRepresentation from "@keycloak/keycloak-admin-client/lib/defs/clientRepresentation";
import type ClientScopeRepresentation from "@keycloak/keycloak-admin-client/lib/defs/clientScopeRepresentation";
import type RealmRepresentation from "@keycloak/keycloak-admin-client/lib/defs/realmRepresentation";
import type UserProfileConfig from "@keycloak/keycloak-admin-client/lib/defs/userProfileConfig";
import type RoleRepresentation from "@keycloak/keycloak-admin-client/lib/defs/roleRepresentation";
import { merge } from "lodash-es";

class AdminClient {
  private readonly client = new KeycloakAdminClient({
    baseUrl: Cypress.env("KEYCLOAK_SERVER"),
    realmName: "master",
  });

  private login() {
    return this.client.auth({
      username: "admin",
      password: "admin",
      grantType: "password",
      clientId: "admin-cli",
    });
  }

  async loginUser(username: string, password: string, clientId: string) {
    return this.client.auth({
      username: username,
      password: password,
      grantType: "password",
      clientId: clientId,
    });
  }

  async createRealm(realm: string, payload?: RealmRepresentation) {
    await this.login();
    await this.client.realms.create({ realm, ...payload });
  }

  async updateRealm(realm: string, payload: RealmRepresentation) {
    await this.login();
    await this.client.realms.update({ realm }, payload);
  }

  async deleteRealm(realm: string) {
    await this.login();
    await this.client.realms.del({ realm });
  }

  async createClient(client: ClientRepresentation) {
    await this.login();
    await this.client.clients.create(client);
  }

  async deleteClient(clientName: string) {
    await this.login();
    const client = (
      await this.client.clients.find({ clientId: clientName })
    )[0];
    await this.client.clients.del({ id: client.id! });
  }

  async createGroup(groupName: string) {
    await this.login();
    return await this.client.groups.create({ name: groupName });
  }

  async createSubGroups(groups: string[]) {
    await this.login();
    let parentGroup = undefined;
    const createdGroups = [];
    for (const group of groups) {
      if (!parentGroup) {
        parentGroup = await this.client.groups.create({ name: group });
      } else {
        parentGroup = await this.client.groups.setOrCreateChild(
          { id: parentGroup.id },
          { name: group }
        );
      }
      createdGroups.push(parentGroup);
    }
    return createdGroups;
  }

  async deleteGroups() {
    await this.login();
    const groups = await this.client.groups.find();
    for (const group of groups) {
      await this.client.groups.del({ id: group.id! });
    }
  }

  async createUser(user: UserRepresentation) {
    await this.login();
    return await this.client.users.create(user);
  }

  async addUserToGroup(userId: string, groupId: string) {
    await this.login();
    await this.client.users.addToGroup({ id: userId, groupId });
  }

  async createUserInGroup(username: string, groupId: string) {
    await this.login();
    const user = await this.createUser({ username, enabled: true });
    await this.client.users.addToGroup({ id: user.id!, groupId });
  }

  async deleteUser(username: string) {
    await this.login();
    const user = await this.client.users.find({ username });
    await this.client.users.del({ id: user[0].id! });
  }

  async createClientScope(scope: ClientScopeRepresentation) {
    await this.login();
    return await this.client.clientScopes.create(scope);
  }

  async deleteClientScope(clientScopeName: string) {
    await this.login();
    const clientScope = await this.client.clientScopes.findOneByName({
      name: clientScopeName,
    });
    return await this.client.clientScopes.del({ id: clientScope?.id! });
  }

  async existsClientScope(clientScopeName: string) {
    await this.login();
    return (await this.client.clientScopes.findOneByName({
      name: clientScopeName,
    })) == undefined
      ? false
      : true;
  }

  async addDefaultClientScopeInClient(
    clientScopeName: string,
    clientId: string
  ) {
    await this.login();
    const scope = await this.client.clientScopes.findOneByName({
      name: clientScopeName,
    });
    const client = await this.client.clients.find({ clientId: clientId });
    return await this.client.clients.addDefaultClientScope({
      id: client[0]?.id!,
      clientScopeId: scope?.id!,
    });
  }

  async removeDefaultClientScopeInClient(
    clientScopeName: string,
    clientId: string
  ) {
    await this.login();
    const scope = await this.client.clientScopes.findOneByName({
      name: clientScopeName,
    });
    const client = await this.client.clients.find({ clientId: clientId });
    return await this.client.clients.delDefaultClientScope({
      id: client[0]?.id!,
      clientScopeId: scope?.id!,
    });
  }

  async patchUserProfile(realm: string, payload: UserProfileConfig) {
    await this.login();

    const currentProfile = await this.client.users.getProfile({ realm });

    await this.client.users.updateProfile(
      merge(currentProfile, payload, { realm })
    );
  }

  async createRealmRole(payload: RoleRepresentation) {
    await this.login();

    return await this.client.roles.create(payload);
  }

  async deleteRealmRole(name: string) {
    await this.login();
    return await this.client.roles.delByName({ name });
  }
}

const adminClient = new AdminClient();

export default adminClient;
