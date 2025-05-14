/**
 * Project: School E-Voting System
 * Developer: Hassan Iftikhar
 * Date: May 2025
 * Description: Backend & Frontend developed by Hassan Iftikhar.
 * Website: https://hassaniftikhar.vercel.app/
 * Github: https://github.com/hassan-iftikhar00/e-voting-pekiseniorhighschool
 * LinkedIn: https://www.linkedin.com/in/hassaniftikhar0/
 * Fiverr: https://www.fiverr.com/pasha_hassan?public_mode=true
 * Email: hassaniftikhardev@gmail.com
 * Note: Redistribution or commercial use without license is not allowed.
 */

export function dumpPermissions(user: any): void {
  if (!user) {
    console.log("No user data to dump permissions");
    console.info(
      `%c
      Project: School E-Voting System
      Developer: Hassan Iftikhar
      Date: May 2025
      Description: Backend & Frontend developed by Hassan Iftikhar.
      Website: https://hassaniftikhar.vercel.app/
      Github: https://github.com/hassan-iftikhar00/e-voting-pekiseniorhighschool
      LinkedIn: https://www.linkedin.com/in/hassaniftikhar0/
      Fiverr: https://www.fiverr.com/pasha_hassan?public_mode=true
      Email: hassaniftikhardev@gmail.com
      Note: Redistribution or commercial use without license is not allowed.
      `,
      "color: #0a0; font-size: 14px; font-family: monospace;"
    );

    return;
  }

  console.group(`Permissions dump for user: ${user.username}`);

  const role = typeof user.role === "string" ? user.role : user.role?.name;
  console.log(`Role: ${role}`);
  console.info(
    `%c
    Project: School E-Voting System
    Developer: Hassan Iftikhar
    Date: May 2025
    Description: Backend & Frontend developed by Hassan Iftikhar.
    Website: https://hassaniftikhar.vercel.app/
    Github: https://github.com/hassan-iftikhar00/e-voting-pekiseniorhighschool
    LinkedIn: https://www.linkedin.com/in/hassaniftikhar0/
    Fiverr: https://www.fiverr.com/pasha_hassan?public_mode=true
    Email: hassaniftikhardev@gmail.com
    Note: Redistribution or commercial use without license is not allowed.
    `,
    "color: #0a0; font-size: 14px; font-family: monospace;"
  );

  const permissions = user.permissions || {};
  console.log("Available permission resources:", Object.keys(permissions));

  // Check common resources
  const commonResources = [
    "dashboard",
    "dashboards",
    "position",
    "positions",
    "candidate",
    "candidates",
    "voter",
    "voters",
    "result",
    "results",
  ];

  commonResources.forEach((resource) => {
    if (permissions[resource]) {
      console.log(`${resource}:`, permissions[resource]);
    }
  });

  console.groupEnd();
}

export function validatePermissionConsistency(user: any): void {
  if (!user?.permissions) return;

  const permissions = user.permissions;
  const singularPlurals = [
    ["dashboard", "dashboards"],
    ["position", "positions"],
    ["candidate", "candidates"],
    ["voter", "voters"],
    ["result", "results"],
  ];

  singularPlurals.forEach(([singular, plural]) => {
    if (permissions[singular] && permissions[plural]) {
      console.warn(
        `Inconsistent permissions: Both ${singular} and ${plural} exist in permissions`
      );
    }
  });
}
