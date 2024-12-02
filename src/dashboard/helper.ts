import DashboardDb from "./db";
import { TargetGroup, UserGender } from "./types/enums";

export default class DashboardHelper extends DashboardDb {
  /**
   * Determines the target group based on the user's gender.
   *
   * @param gender - The gender of the user (UserGender enum).
   * @returns The target group (TargetGroup enum).
   */
  protected getTargetGroup = (gender: UserGender): TargetGroup => {
    switch (gender) {
      case UserGender.Male:
        return TargetGroup.MaleOnly;
      case UserGender.Female:
        return TargetGroup.FemaleOnly;
      default:
        return TargetGroup.All;
    }
  };
}
