import { useState, useEffect, ReactNode, createContext } from 'react';
import { ProgressBar } from "primereact/progressbar";
import StoreProtocol from "../web5/store.json"; 
import { checkHasProtocol } from '../web5/web5.service';


const guardContext = { 
  loading: true, 
  isGuarded: true, 
  setIsGuarded: (() => {}) as (isGuarded: boolean) => void,
  storeId: '',
  setStoreId: (() => {}) as (storeId: string) => void
}

export const GuardContext = createContext(guardContext);

export const GuardProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [isGuarded, setIsGuarded] = useState(true);
  const [storeId, setStoreId] = useState('');

  useEffect(() => {
    const checkGuard = async () => {
      const { web5 } = await checkHasProtocol();
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
      setLoading(false);
    };

    checkGuard();
  }, []);

  if (loading) {
    return <ProgressBar mode="indeterminate"></ProgressBar>
  }

  return (
    <GuardContext.Provider value={{ loading, isGuarded, setIsGuarded, storeId, setStoreId }}>
      { children }
    </GuardContext.Provider>
  );
};

