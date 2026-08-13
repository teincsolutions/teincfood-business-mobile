export interface NavItem {
  key: string;
  label: string;
  icon: string;
  route: string;
  drawerName?: string;
  sharedPrefix?: string;
  requiredCapability?: string;
  always: boolean;
  separator?: boolean;
}

export const sellerNavItems: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', route: '/(seller)/dashboard', drawerName: 'dashboard/index', always: true },
  { key: 'pos', label: 'POS Terminal', icon: 'CreditCard', route: '/(seller)/pos', requiredCapability: 'orders_create', always: false },
  { key: 'display', label: 'Callout Display', icon: 'Monitor', route: '/(seller)/display', requiredCapability: 'orders_read', always: false },
  { key: 'kitchen', label: 'Kitchen Display', icon: 'ChefHat', route: '/(seller)/kitchen', requiredCapability: 'orders_read', always: false },
  { key: '_sep1', separator: true, always: false } as NavItem,
  { key: 'orders', label: 'Orders', icon: 'ShoppingBag', route: '/(seller)/orders', drawerName: 'orders/index', requiredCapability: 'orders_read', always: false },
  { key: 'deliveries', label: 'Deliveries', icon: 'Truck', route: '/(seller)/deliveries', drawerName: 'deliveries/index', requiredCapability: 'deliveries_assign', always: false },
  { key: 'menu', label: 'Menu', icon: 'UtensilsCrossed', route: '/(seller)/menu', drawerName: 'menu/index', requiredCapability: 'menu_manage', always: false },
  { key: 'categories', label: 'Categories', icon: 'Tags', route: '/(seller)/menu/categories', drawerName: 'menu/categories/index', requiredCapability: 'menu_manage', always: false },
  { key: 'analytics', label: 'Analytics', icon: 'BarChart3', route: '/(seller)/analytics', drawerName: 'analytics/index', requiredCapability: 'finance_read', always: false },
  { key: 'members', label: 'Members', icon: 'Users', route: '/(seller)/members', drawerName: 'members/index', requiredCapability: 'business_members_manage', always: false },
  { key: 'riders', label: 'Riders', icon: 'Bike', route: '/(seller)/riders', drawerName: 'riders/index', requiredCapability: 'riders_manage', always: false },
  { key: 'wallet', label: 'Wallet & Billing', icon: 'DollarSign', route: '/(shared)/wallet', sharedPrefix: '/(shared)/wallet', requiredCapability: 'finance_read', always: false },
  { key: '_sep2', separator: true, always: false } as NavItem,
  { key: 'messages', label: 'Messages', icon: 'MessageSquare', route: '/(communication)', sharedPrefix: '/(communication)', always: true },
  { key: 'notifications', label: 'Notifications', icon: 'Bell', route: '/(shared)/notifications', sharedPrefix: '/(shared)/notifications', always: true },
  { key: 'invitations', label: 'Invitations', icon: 'MailOpen', route: '/(shared)/invitations', sharedPrefix: '/(shared)/invitations', always: true },
  { key: 'settings', label: 'Settings', icon: 'Settings', route: '/(seller)/settings', drawerName: 'settings/index', always: true },
  { key: 'profile', label: 'Profile', icon: 'User', route: '/(seller)/profile', drawerName: 'profile', always: true },
];
