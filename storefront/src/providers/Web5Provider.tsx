import { useState, useEffect, ReactNode, createContext } from 'react';
import { initWeb5 } from '../web5/web5.service';
import { ProgressSpinner } from 'primereact/progressspinner';
import StoreProtocol from "../web5/store.json"; 
import { Store } from "../web5/types";

interface IWeb5Context { 
  storeDetails: Store | undefined
  storeDid: string,
  storeId: string
}

const web5Context: IWeb5Context = { 
  storeDetails: undefined,
  storeDid: '',
  storeId: ''
}

export const Web5Context = createContext(web5Context);

export const Web5Provider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [storeDetails, setStoreDetails] = useState();
  const [storeId, setStoreId] = useState('');
  const storeDid = location.pathname.slice(1) ?? 'did:dht:tz4x5odfio3bjsmyai911tk8qskp5mmm1uqndpbax4r18hwp7z1o' // random fallback did

  useEffect(() => {
    setIsLoading(true);
    const getStoreDetails = async() => {
      const { web5 } = await initWeb5();
      const { records } = await web5.dwn.records.query({
        from: storeDid,
        message: {
          filter: {
            protocol: StoreProtocol.protocol,
            protocolPath: "store",
          }
        }
      })
      const storeDetails = await records?.[0].data.json();
      setStoreDetails(storeDetails);
      setStoreId(records?.[0].id ?? '');
      document.title = storeDetails.provider.name;
    }
    getStoreDetails();
    setIsLoading(false);
  }, [storeDid]);

  if (isLoading) {
    return (
      <div className="loading">
        <ProgressSpinner />
      </div>
    )
  }

  return (
    <Web5Context.Provider value={{ storeDetails, storeDid, storeId }}>
      { children }
    </Web5Context.Provider>
  );
};