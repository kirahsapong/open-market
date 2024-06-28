import { InputText } from "primereact/inputtext"
import { FormEvent, useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { did, web5 } from "../web5/web5.service";
import StoreProtocol from "../web5/store.json"; 
import { type Record } from "@web5/api";
import { Store } from "../web5/types";
import { ProgressBar } from "primereact/progressbar";

const Settings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [storeRecord, setStoreRecord] = useState<Record>();
  const [entries, setEntries] = useState<Store>({ 
    url: '',
    headline: '',
    description: '',
    provider: { 
      identifier: '', 
      name: '',
      email: ''
    } 
  });
  const toast = useRef<Toast>(null);

  useEffect(() => {
    setIsFetching(true);
    const getDetails = async() => {
      const { records } = await web5.dwn.records.query({
        message: {
          filter: {
            protocol: StoreProtocol.protocol,
            protocolPath: "store",
            schema: StoreProtocol.types.store.schema,
          }
        }
      })
      if (records && records[0]) {
        setStoreRecord(records[0])
        const resolvedData: Store = await records[0].data.json();
        setEntries(resolvedData)
      }
    }
    getDetails();
    setIsFetching(false);
  },[])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const hasError = await saveDetails(e);
    setIsLoading(false);
    if (hasError) {
      showError()
    } else {
      showSuccess()
    }
  }

  const saveDetails = async (e: FormEvent<HTMLFormElement>) => {
    let hasError = false;
    const formData = new FormData(e.target as HTMLFormElement);
    const entries = Object.fromEntries(formData.entries());

    if (storeRecord) {
      const { status } = await storeRecord.update({
        data: {
          headline: entries.headline,
          description: entries.description,
          provider: {
            identifier: did,
            name: entries.name,
            email: entries.email,
          }
        }
      })
      if (status.code >= 200 && status.code < 400 ) {
        await storeRecord.send(did)
      } else {
        hasError = true;
      }
    } else {
      hasError = true;
    }
    
    return hasError
  }

  const showError = () => {
    toast.current?.show({severity:'error', summary: 'Error', detail:'Error saving details', life: 3000});
  }

  const showSuccess = () => {
    toast.current?.show({severity:'success', summary: 'Success', detail:'Saved', life: 3000});
  }
  
  return (
    <div id="settings">
      <Toast ref={toast} />
      {isFetching && <ProgressBar />}
      <div className="header">
        <h1>Settings</h1>
        <p>Manage all settings for your store or marketplace.</p>
      </div>
      <div className="form-area">
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="name">Entity name</label>
            <InputText 
              value={entries?.provider.name ?? ''}
              onChange={(e) => setEntries(val => { 
                return { 
                  ...val, 
                  provider: {
                    ...val!.provider,
                    name: e.target.value
                  } }
                }
              )}
              name="name"
              placeholder="Store or marketplace name"
              id="name"
              aria-describedby="name-help"
              autoComplete="off"
            />
            <small id="name-help">
              The name for your store or marketplace
            </small>
          </div>
          <div className="field">
            <label htmlFor="headline">Headline</label>
            <InputText 
              value={entries?.headline ?? ''}
              onChange={(e) => setEntries(val => { 
                return { 
                  ...val, 
                  headline: e.target.value
                }
                }
              )}
              name="headline"
              placeholder="Headline for your store or marketplace"
              id="headline"
              aria-describedby="headline-help"
              autoComplete="off"
            />
            <small id="headline-help">
              Partners and customers will see this
            </small>
          </div>
          <div className="field">
            <label htmlFor="description">Description</label>
            <InputText 
              value={entries?.description ?? ''}
              onChange={(e) => setEntries(val => { 
                return { 
                  ...val, 
                  description: e.target.value
                }
                }
              )}
              name="description"
              placeholder="Short, clear description"
              id="description"
              aria-describedby="description-help"
              autoComplete="off"
            />
            <small id="description-help">
              Describe what you or your marketplace offers
            </small>
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <InputText 
              value={entries?.provider.email ?? ''}
              onChange={(e) => setEntries(val => { 
                return { 
                  ...val, 
                  provider: {
                    ...val!.provider,
                    email: e.target.value
                  }
                }
                }
              )}
              name="email"
              placeholder="satoshi@domain.com"
              id="email"
              aria-describedby="email-help"
              autoComplete="off"
              type="email"
            />
            <small id="email-help">
              How partners and customers can reach you by email
            </small>
          </div>
          <Button label="Save" loading={isLoading} />
        </form>
      </div>
    </div>
  )
}

export default Settings