import { useState, useEffect, ReactNode, createContext } from 'react';
import { Web5 } from "@web5/api";

const guardContext = { 
  isGuarded: true, 
  loading: true, 
  did: '', 
  web5: {} as Web5,
  setIsGuarded: (() => {}) as (isGuarded: boolean) => void,
}

export const GuardContext = createContext(guardContext);

export const GuardProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [isGuarded, setIsGuarded] = useState(true);
  const [did, setDid] = useState('');
  const [web5, setWeb5] = useState({} as Web5);

  useEffect(() => {
    const checkGuard = async () => {
      const { web5, did } = await checkHasProtocol();
      const { protocols } = await web5.dwn.protocols.query({
        message: {
          filter: {
            protocol: "https://github.com/kirahsapong/open-market/raw/main/backend/src/web5/store.json",
          },
        },
      });
      setIsGuarded(!protocols.length)
      setDid(did);
      setWeb5(web5);
      setLoading(false);
    };

    checkGuard();
  }, []);

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <GuardContext.Provider value={{ setIsGuarded, isGuarded, loading, did, web5 }}>
      { children }
    </GuardContext.Provider>
  );
};

const checkHasProtocol = async () => {
  return await Web5.connect();
};