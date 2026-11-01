import { useMyBusinessCapabilities } from './useMyBusinessCapabilities';
import { useEntitlements } from './useEntitlements';
import { sellerNavItems, type NavItem } from '@/constants/nav-items';

export function useFilteredNavItems(): NavItem[] {
  const { data: membership } = useMyBusinessCapabilities();
  const { data: features } = useEntitlements();
  const capabilities = membership?.capabilities ?? [];

  return sellerNavItems.filter((item) => {
    if (item.always) return true;
    if (item.separator) return true;
    if (
      item.requiredCapability &&
      !capabilities.includes(item.requiredCapability)
    ) {
      return false;
    }
    if (!item.requiredFeature) return true;
    if (!features) return false;
    const value = features[item.requiredFeature];
    return value === true || (typeof value === "number" && value > 0);
  });
}
