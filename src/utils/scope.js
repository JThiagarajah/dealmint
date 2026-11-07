// Which asset type the user chose on the first screen (House, Land, Vehicle or All)
import { createContext, useContext } from 'react';

export const SCOPE_GRADIENTS = {
  House: ['#2F8BFF', '#0058D6'],
  Land: ['#34C759', '#178A47'],
  Vehicle: ['#FF9F0A', '#F06A00'],
  All: ['#5E5CE6', '#A84FE0'],
};
export const SCOPE_TINT = { House: 'blue', Land: 'green', Vehicle: 'orange', All: 'indigo' };
export const SCOPE_ICON = { House: 'home', Land: 'map', Vehicle: 'car-sport', All: 'apps' };

export const ScopeContext = createContext({ type: 'All' });
export const useScope = () => useContext(ScopeContext);
