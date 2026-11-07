// Loads data every time a screen comes into view, so numbers are always fresh
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

export default function useFocusData(loader, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    try {
      setData(await loader());
      setError(null);
    } catch (e) {
      console.warn(e);
      setError(e);
    }
  }, deps);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  return [data, reload, error];
}
