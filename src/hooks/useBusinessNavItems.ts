import { useMyBusinessCapabilities } from './useMyBusinessCapabilities';
import { sellerNavItems, type NavItem } from '@/constants/nav-items';

export function useFilteredNavItems(): NavItem[] {
  const { data: membership } = useMyBusinessCapabilities();
  const capabilities = membership?.capabilities ?? [];

  return sellerNavItems.filter((item) => {
    if (item.always) return true;
    if (item.separator) return true;
    if (!item.requiredCapability) return true;
    return capabilities.includes(item.requiredCapability);
  });
}
