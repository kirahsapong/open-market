import { useState, useEffect, ReactNode, createContext } from 'react';
import { Web5 } from "@web5/api";
import { ProgressBar } from "primereact/progressbar";
import StoreProtocol from "../web5/store.json"; 


const guardContext = { 
  isGuarded: true, 
  setIsGuarded: (() => {}) as (isGuarded: boolean) => void,
  loading: true, 
  did: '', 
  web5: {} as Web5,
  storeId: '',
  setStoreId: (() => {}) as (storeId: string) => void
}

export const GuardContext = createContext(guardContext);

export const GuardProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [isGuarded, setIsGuarded] = useState(true);
  const [did, setDid] = useState('');
  const [web5, setWeb5] = useState({} as Web5);
  const [storeId, setStoreId] = useState('');

  useEffect(() => {
    const checkGuard = async () => {
      const { web5, did } = await checkHasProtocol();
      const { protocols } = await web5.dwn.protocols.query({
        message: {
          filter: {
            protocol: StoreProtocol.protocol,
          },
        },
      });
      if (protocols.length) {
        const { record } = await web5.dwn.records.read({
          message: {
            filter: {
              protocol: StoreProtocol.protocol,
              protocolPath: "store"
            },
          },
        });
        if (record) {
          setStoreId(record.id)
        }
      }
      setIsGuarded(!protocols.length)
      setDid(did);
      setWeb5(web5);
      setLoading(false);
    };

    checkGuard();
  }, []);

  if (loading) {
    return <ProgressBar mode="indeterminate"></ProgressBar>
  }

  return (
    <GuardContext.Provider value={{ isGuarded, setIsGuarded, loading, did, web5, storeId, setStoreId }}>
      { children }
    </GuardContext.Provider>
  );
};

const checkHasProtocol = async () => {
  return await Web5.connect();
};