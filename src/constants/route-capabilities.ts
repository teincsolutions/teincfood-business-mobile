export const routeCapabilities: Record<string, string> = {
  '/(seller)/pos': 'orders_create',
  '/(seller)/display': 'orders_read',
  '/(seller)/kitchen': 'orders_read',
  '/(seller)/orders': 'orders_read',
  '/(seller)/deliveries': 'deliveries_assign',
  '/(seller)/menu': 'menu_manage',
  '/(seller)/analytics': 'finance_read',
  '/(seller)/members': 'business_members_manage',
  '/(seller)/riders': 'riders_manage',
  '/(shared)/wallet': 'finance_read',
  '/(shared)/wallet/plans': 'finance_read',
};
