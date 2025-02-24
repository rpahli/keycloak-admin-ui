import type { LocationDescriptorObject } from "history";
import { lazy } from "react";
import { generatePath } from "react-router-dom";
import type { RouteDef } from "../../route-config";

export type UserProfileTab = "attributes" | "attributes-group" | "json-editor";

export type UserProfileParams = {
  realm: string;
  tab: UserProfileTab;
};

export const UserProfileRoute: RouteDef = {
  path: "/:realm/realm-settings/user-profile/:tab",
  component: lazy(() => import("../RealmSettingsSection")),
  breadcrumb: (t) => t("realm-settings:userProfile"),
  access: "view-realm",
};

export const toUserProfile = (
  params: UserProfileParams
): LocationDescriptorObject => ({
  pathname: generatePath(UserProfileRoute.path, params),
});
