/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "primereact/button";
import { useGuard } from "../hooks/useGuard";
import StoreProtocol from "../web5/store.json"; 
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { FormEvent, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { did, web5 } from "../web5/web5.service";

const Landing = () => {
  const { setIsGuarded, setStoreId } = useGuard();
  const [isMarketplace, setIsMarketplace] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useRef<Toast>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const hasError = await createStore(e);
    setIsLoading(false);
    if (hasError) {
      showError()
    } else {
      hideDialog()
      setIsGuarded(false);
      navigate(isMarketplace ? '/settings' : '/products');
    }
  }

  const createStore = async (e: FormEvent<HTMLFormElement>) => {
    let hasError = false;
    const formData = new FormData(e.target as HTMLFormElement);
    const entries = Object.fromEntries(formData.entries());
    const { protocol } = await web5.dwn.protocols.configure({ 
      message: { 
        definition: StoreProtocol 
      }
    });
    if (protocol) {
      await protocol.send(did);
      const { record } = await web5.dwn.records.create({
        data: {
          provider: {
            identifier: did,
            name: entries.name
          }
        },
        message: {
          protocol: StoreProtocol.protocol,
          protocolPath: "store",
          schema: StoreProtocol.types.store.schema,
          published: true
        },
      })
      if (record) {
        await record.send(did)
        setStoreId(record.id)
      } else {
        hasError = true;
      }
    } else {
      hasError = true;
    }
    return hasError
  }

  const showError = () => {
    toast.current?.show({severity:'error', summary: 'Error', detail:'Error creating store', life: 3000});
  }

  const showDialog = (storeType: "seller" | "marketplace") => {
    setIsMarketplace(storeType == "marketplace");
    setIsVisible(true);
  }

  const hideDialog = () => {
    setIsVisible(false);
  }

  return (
    <div id="landing">
      <Toast ref={toast} />
      <h1>A marketplace economy for everyone</h1>
      <div>
        <Button label="Create a marketplace" onClick={() => showDialog('marketplace')} />
      </div>
      <div>
        <Button link label="I just want to list some products" onClick={() => showDialog('seller')} />
      </div>
      <Dialog header={isMarketplace ? "Choose a marketplace name" : "Choose a seller name"} visible={isVisible} style={{ width: '640px' }} onHide={hideDialog}>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <InputText 
              name="name"
              placeholder={isMarketplace ? "Marketplace name" : "Seller name"}
              aria-describedby="name-help"
              autoComplete="off"
            />
            <small id="name-help">
              {isMarketplace 
              ? "This is the name of your marketplace" 
              : "This is the name that will be shown with your products"
              }
            </small>
          </div>
          <div className="buttons">
            <Button label="Create &rarr;" loading={isLoading} />
          </div>
        </form>
      </Dialog>
    </div>
  )
};

export default Landing;