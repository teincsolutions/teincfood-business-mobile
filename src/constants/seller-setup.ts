export type SellerSetupStepId =
  | "profile"
  | "hours"
  | "plan"
  | "payments"
  | "menu"
  | "cash_sale"
  | "online_ordering";

export interface SellerSetupStepDefinition {
  id: SellerSetupStepId;
  title: string;
  description: string;
  actionLabel: string;
  /** Online ordering is the only step that asks a yes/no question first. */
  optional?: boolean;
}

/**
 * The order the seller should work through. Business creation is implicit —
 * the guide only exists after a business has been created.
 */
export const SELLER_SETUP_STEPS: SellerSetupStepDefinition[] = [
  {
    id: "profile",
    title: "Review your business profile",
    description: "Check your name, address and contact details.",
    actionLabel: "Review profile",
  },
  {
    id: "hours",
    title: "Set your operating hours",
    description: "Tell customers when you are open for orders.",
    actionLabel: "Set hours",
  },
  {
    id: "plan",
    title: "Choose your plan",
    description: "Stay on Free or pick a plan with more features.",
    actionLabel: "View plans",
  },
  {
    id: "payments",
    title: "Set up payments",
    description: "Enable cash so you can take orders at the counter.",
    actionLabel: "Payment settings",
  },
  {
    id: "menu",
    title: "Add your first menu item",
    description: "Add at least one item customers can order.",
    actionLabel: "Add menu item",
  },
  {
    id: "cash_sale",
    title: "Try a cash sale",
    description: "Ring up a real cash order in the POS. You can skip this step.",
    actionLabel: "Open POS",
    optional: true,
  },
  {
    id: "online_ordering",
    title: "Go live with online ordering",
    description: "Accept orders from customers on Teinc Food.",
    actionLabel: "Go live",
    optional: true,
  },
];

export const SELLER_SETUP_STEP_IDS = SELLER_SETUP_STEPS.map((step) => step.id);

export function isSellerSetupStepId(value: string): value is SellerSetupStepId {
  return (SELLER_SETUP_STEP_IDS as string[]).includes(value);
}
